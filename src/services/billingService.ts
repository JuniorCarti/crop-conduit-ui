import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type BillingActor = {
  uid: string;
  name: string;
};
export type OrgBillingRole = "org_admin" | "org_staff" | null;

export type PlanId = "trial" | "coop_trial" | "free" | "coop_basic" | "coop_premium" | "enterprise";
export type SeatType = "none" | "paid" | "sponsored";
export type PlanTemplateId = "free" | "coop_basic" | "coop_premium" | "enterprise_default";

export type SubscriptionCurrent = {
  planId: PlanId;
  status: "trialing" | "active" | "past_due" | "canceled" | "paused";
  startAt?: any;
  trialEndsAt?: any;
  renewAt?: any;
  cancelAt?: any;
  billingCycle: "monthly" | "annual";
  currency: "KES";
  exchangeRateUSD: number;
  seatPricing: { perSeat: number; sponsoredPerSeat: number };
  featureFlags: Record<string, boolean>;
  seats: { paidTotal: number; sponsoredTotal: number };
  limits: { maxMembers: number | null; maxMarketsTracked: number | null };
  templateAppliedFrom?: PlanTemplateId;
  overrides?: {
    featureFlags?: Record<string, boolean>;
    seatPricing?: { perSeat: number; sponsoredPerSeat: number };
  };
  updatedAt?: any;
};

export type BillingPlanTemplate = {
  planId: PlanTemplateId;
  name: string;
  description: string;
  currency: "KES";
  exchangeRateUSD: number;
  billingCycles: Array<"monthly" | "annual">;
  seatPricing: {
    monthly: { perSeat: number; sponsoredPerSeat: number };
    annual: { perSeat: number; sponsoredPerSeat: number; discountPercent: number };
  };
  defaultSeats: { paidTotal: number; sponsoredTotal: number };
  featureFlags: Record<string, boolean>;
  limits: { maxMembers: number | null; maxMarketsTracked: number | null };
  isPublic: boolean;
  rank: number;
};

export type SeatUsage = {
  paidUsed: number;
  sponsoredUsed: number;
  paidTotal: number;
  sponsoredTotal: number;
  paidRemaining: number;
  sponsoredRemaining: number;
  activeMembers: number;
  premiumEnabledMembers: number;
};

const defaultFeatureFlagsByPlan: Record<PlanId, Record<string, boolean>> = {
  trial: {
    marketOracle: true,
    climateInsights: true,
    harvestPlanner: true,
    groupPrices: true,
    marketplaceVerifiedTag: true,
    training: true,
    certificates: true,
    targetsRewards: true,
    csvOnboarding: true,
  },
  coop_trial: {
    marketOracle: true,
    climateInsights: true,
    harvestPlanner: true,
    groupPrices: true,
    marketplaceVerifiedTag: true,
    training: true,
    certificates: true,
    targetsRewards: true,
    csvOnboarding: true,
  },
  free: {
    marketOracle: false,
    climateInsights: false,
    harvestPlanner: false,
    groupPrices: false,
    marketplaceVerifiedTag: false,
    training: false,
    certificates: false,
    targetsRewards: false,
    csvOnboarding: false,
  },
  coop_basic: {
    marketOracle: true,
    climateInsights: true,
    harvestPlanner: true,
    groupPrices: true,
    marketplaceVerifiedTag: true,
    training: true,
    certificates: false,
    targetsRewards: false,
    csvOnboarding: false,
  },
  coop_premium: {
    marketOracle: true,
    climateInsights: true,
    harvestPlanner: true,
    groupPrices: true,
    marketplaceVerifiedTag: true,
    training: true,
    certificates: true,
    targetsRewards: true,
    csvOnboarding: true,
  },
  enterprise: {
    marketOracle: true,
    climateInsights: true,
    harvestPlanner: true,
    groupPrices: true,
    marketplaceVerifiedTag: true,
    training: true,
    certificates: true,
    targetsRewards: true,
    csvOnboarding: true,
  },
};

const defaultPricingByPlan: Record<PlanId, { perSeat: number; sponsoredPerSeat: number }> = {
  trial: { perSeat: 300, sponsoredPerSeat: 250 },
  coop_trial: { perSeat: 150, sponsoredPerSeat: 100 },
  free: { perSeat: 0, sponsoredPerSeat: 0 },
  coop_basic: { perSeat: 300, sponsoredPerSeat: 200 },
  coop_premium: { perSeat: 500, sponsoredPerSeat: 350 },
  enterprise: { perSeat: 500, sponsoredPerSeat: 350 },
};

const subRef = (orgId: string) => doc(db, "orgs", orgId, "subscription", "current");
const billingSettingsRef = (orgId: string) => doc(db, "orgs", orgId, "billing", "settings");
const memberRef = (orgId: string, memberId: string) => doc(db, "orgs", orgId, "members", memberId);
const membersCol = (orgId: string) => collection(db, "orgs", orgId, "members");
const seatLedgerCol = (orgId: string) => collection(db, "orgs", orgId, "billing", "seatLedger");
const invoicesCol = (orgId: string) => collection(db, "orgs", orgId, "billing", "invoices");
const paymentsCol = (orgId: string) => collection(db, "orgs", orgId, "billing", "payments");
const templatesCol = collection(db, "billingPlanTemplates");

const mapPlanIdToTemplate = (planId: PlanId): PlanTemplateId =>
  planId === "enterprise"
    ? "enterprise_default"
    : planId === "trial" || planId === "coop_trial"
      ? "coop_premium"
      : planId;

const mapTemplateToPlanId = (templateId: PlanTemplateId): PlanId =>
  templateId === "enterprise_default" ? "enterprise" : templateId;

const DEFAULT_TEMPLATES: Record<PlanTemplateId, BillingPlanTemplate> = {
  free: {
    planId: "free",
    name: "Free",
    description: "Starter cooperative plan",
    currency: "KES",
    exchangeRateUSD: 150,
    billingCycles: ["monthly", "annual"],
    seatPricing: {
      monthly: { perSeat: 0, sponsoredPerSeat: 0 },
      annual: { perSeat: 0, sponsoredPerSeat: 0, discountPercent: 0 },
    },
    defaultSeats: { paidTotal: 0, sponsoredTotal: 0 },
    featureFlags: {
      marketOracle: false,
      climateInsights: true,
      harvestPlanner: false,
      groupPrices: true,
      marketplaceVerifiedTag: true,
      training: false,
      certificates: false,
      targetsRewards: false,
      csvOnboarding: false,
    },
    limits: { maxMembers: 50, maxMarketsTracked: null },
    isPublic: true,
    rank: 1,
  },
  coop_basic: {
    planId: "coop_basic",
    name: "Coop Basic",
    description: "Entry premium plan for cooperatives",
    currency: "KES",
    exchangeRateUSD: 150,
    billingCycles: ["monthly", "annual"],
    seatPricing: {
      monthly: { perSeat: 300, sponsoredPerSeat: 200 },
      annual: { perSeat: 300 * 12 * 0.85, sponsoredPerSeat: 200 * 12 * 0.85, discountPercent: 15 },
    },
    defaultSeats: { paidTotal: 20, sponsoredTotal: 5 },
    featureFlags: {
      marketOracle: true,
      climateInsights: true,
      harvestPlanner: true,
      groupPrices: true,
      marketplaceVerifiedTag: true,
      training: true,
      certificates: false,
      targetsRewards: false,
      csvOnboarding: false,
    },
    limits: { maxMembers: null, maxMarketsTracked: null },
    isPublic: true,
    rank: 2,
  },
  coop_premium: {
    planId: "coop_premium",
    name: "Coop Premium",
    description: "Full cooperative feature set",
    currency: "KES",
    exchangeRateUSD: 150,
    billingCycles: ["monthly", "annual"],
    seatPricing: {
      monthly: { perSeat: 500, sponsoredPerSeat: 350 },
      annual: { perSeat: 500 * 12 * 0.8, sponsoredPerSeat: 350 * 12 * 0.8, discountPercent: 20 },
    },
    defaultSeats: { paidTotal: 50, sponsoredTotal: 20 },
    featureFlags: {
      marketOracle: true,
      climateInsights: true,
      harvestPlanner: true,
      groupPrices: true,
      marketplaceVerifiedTag: true,
      training: true,
      certificates: true,
      targetsRewards: true,
      csvOnboarding: true,
    },
    limits: { maxMembers: null, maxMarketsTracked: null },
    isPublic: true,
    rank: 3,
  },
  enterprise_default: {
    planId: "enterprise_default",
    name: "Enterprise",
    description: "High-capacity cooperative and enterprise plan",
    currency: "KES",
    exchangeRateUSD: 150,
    billingCycles: ["monthly", "annual"],
    seatPricing: {
      monthly: { perSeat: 800, sponsoredPerSeat: 600 },
      annual: { perSeat: 800 * 12 * 0.75, sponsoredPerSeat: 600 * 12 * 0.75, discountPercent: 25 },
    },
    defaultSeats: { paidTotal: 200, sponsoredTotal: 100 },
    featureFlags: {
      marketOracle: true,
      climateInsights: true,
      harvestPlanner: true,
      groupPrices: true,
      marketplaceVerifiedTag: true,
      training: true,
      certificates: true,
      targetsRewards: true,
      csvOnboarding: true,
    },
    limits: { maxMembers: null, maxMarketsTracked: null },
    isPublic: true,
    rank: 4,
  },
};

export async function writeLedgerEvent(
  orgId: string,
  event: {
    type:
      | "PAID_SEAT_PURCHASED"
      | "SPONSORED_SEAT_ADDED"
      | "SEAT_ASSIGNED"
      | "SEAT_UNASSIGNED"
      | "SPONSORED_ASSIGNED"
      | "SPONSORED_UNASSIGNED"
      | "PLAN_CHANGED"
      | "RENEWED"
      | "CANCELED"
      | "INVOICE_CREATED"
      | "PAYMENT_MARKED_PAID";
    actor: BillingActor;
    memberId?: string | null;
    memberUid?: string | null;
    note?: string | null;
    delta?: { paid: number; sponsored: number };
    snapshotAfter?: { paidTotal: number; sponsoredTotal: number; paidUsed: number; sponsoredUsed: number };
  }
) {
  await addDoc(seatLedgerCol(orgId), {
    type: event.type,
    memberId: event.memberId ?? null,
    memberUid: event.memberUid ?? null,
    actorUid: event.actor.uid,
    actorName: event.actor.name,
    createdAt: serverTimestamp(),
    note: event.note ?? null,
    delta: event.delta ?? { paid: 0, sponsored: 0 },
    snapshotAfter: event.snapshotAfter ?? null,
  });
}

export async function getOrgSubscription(orgId: string): Promise<SubscriptionCurrent> {
  try {
    const snap = await getDoc(subRef(orgId));
    if (snap.exists()) {
      return snap.data() as SubscriptionCurrent;
    }
  } catch {
    // Fallback to embedded org subscription if direct sub doc is rule-blocked.
    const orgSnap = await getDoc(doc(db, "orgs", orgId));
    if (orgSnap.exists()) {
      const orgData = orgSnap.data() as any;
      const embedded = orgData?.subscription;
      if (embedded && typeof embedded === "object") {
        return embedded as SubscriptionCurrent;
      }
    }
  }
  throw new Error("Subscription not configured");
}

export async function getOrgRole(orgId: string, uid: string): Promise<OrgBillingRole> {
  try {
    const membershipSnap = await getDoc(doc(db, "orgs", orgId, "members", uid));
    if (membershipSnap.exists()) {
      const membership = membershipSnap.data() as any;
      const membershipRole = membership?.role;
      if (membershipRole === "org_admin" || membershipRole === "admin") {
        return "org_admin";
      }
      if (membershipRole === "org_staff" || membershipRole === "staff") {
        return "org_staff";
      }
    }
  } catch {
    // Continue to users fallback.
  }

  try {
    const userSnap = await getDoc(doc(db, "users", uid));
    if (!userSnap.exists()) return null;
    const user = userSnap.data() as any;
    if (user?.orgId !== orgId) return null;
    if (user?.role === "org_admin" || user?.role === "org_staff") return user.role;
  } catch {
    return null;
  }
  return null;
}

export async function seedBillingPlanTemplates() {
  const existing = await getDocs(templatesCol);
  if (existing.size >= 4) return;
  const writes = Object.values(DEFAULT_TEMPLATES).map((template) =>
    setDoc(
      doc(db, "billingPlanTemplates", template.planId),
      {
        ...template,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    )
  );
  await Promise.all(writes);
}

export async function loadPlanTemplates(): Promise<BillingPlanTemplate[]> {
  await seedBillingPlanTemplates();
  const snap = await getDocs(query(templatesCol, where("isPublic", "==", true)));
  return snap.docs
    .map((docSnap) => docSnap.data() as BillingPlanTemplate)
    .sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));
}

const applySubscriptionTemplateValues = (
  template: BillingPlanTemplate,
  billingCycle: "monthly" | "annual",
  options?: {
    seats?: { paidTotal: number; sponsoredTotal: number };
    keepOverrides?: boolean;
    existing?: SubscriptionCurrent | null;
  }
): Partial<SubscriptionCurrent> => {
  const pricing = billingCycle === "annual" ? template.seatPricing.annual : template.seatPricing.monthly;
  const existing = options?.existing ?? null;
  const prevOverrides = existing?.overrides;
  const featureFlags = options?.keepOverrides
    ? { ...template.featureFlags, ...(prevOverrides?.featureFlags ?? {}) }
    : template.featureFlags;
  const seatPricing = options?.keepOverrides && prevOverrides?.seatPricing
    ? prevOverrides.seatPricing
    : { perSeat: pricing.perSeat, sponsoredPerSeat: pricing.sponsoredPerSeat };

  return {
    planId: mapTemplateToPlanId(template.planId),
    billingCycle,
    currency: template.currency,
    exchangeRateUSD: template.exchangeRateUSD,
    seatPricing,
    seats: options?.seats ?? template.defaultSeats,
    featureFlags,
    limits: template.limits,
    templateAppliedFrom: template.planId,
    overrides: options?.keepOverrides ? prevOverrides ?? {} : {},
    updatedAt: serverTimestamp(),
  };
};

export async function ensureOrgSubscription(orgId: string, actor?: BillingActor) {
  await seedBillingPlanTemplates();
  const effectiveActor = actor ?? { uid: "system", name: "System" };

  return runTransaction(db, async (tx) => {
    const [currentSnap, settingsSnap] = await Promise.all([tx.get(subRef(orgId)), tx.get(billingSettingsRef(orgId))]);

    const trialEndsAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
    let created = false;
    let expired = false;
    let nextSubscription: SubscriptionCurrent;

    if (!currentSnap.exists()) {
      created = true;
      nextSubscription = {
        planId: "coop_trial",
        status: "trialing",
        startAt: serverTimestamp(),
        trialEndsAt,
        renewAt: trialEndsAt,
        cancelAt: null,
        billingCycle: "monthly",
        currency: "KES",
        exchangeRateUSD: 150,
        seatPricing: defaultPricingByPlan.coop_trial,
        featureFlags: defaultFeatureFlagsByPlan.coop_trial,
        seats: { paidTotal: 10, sponsoredTotal: 5 },
        limits: { maxMembers: 50, maxMarketsTracked: 3 },
        templateAppliedFrom: "free",
        updatedAt: serverTimestamp(),
      };
      tx.set(subRef(orgId), nextSubscription, { merge: true });
      tx.set(doc(seatLedgerCol(orgId)), {
        type: "PLAN_CHANGED",
        memberId: null,
        memberUid: null,
        actorUid: effectiveActor.uid,
        actorName: effectiveActor.name,
        createdAt: serverTimestamp(),
        note: "Auto-provisioned 60-day trial plan",
        delta: { paid: 0, sponsored: 0 },
        snapshotAfter: null,
      });
    } else {
      const current = currentSnap.data() as SubscriptionCurrent;
      const trialEndDate = current.trialEndsAt?.toDate?.() ?? (current.trialEndsAt ? new Date(current.trialEndsAt) : null);
      const isExpiredTrial = (current.planId === "trial" || current.planId === "coop_trial")
        && current.status !== "paused"
        && trialEndDate instanceof Date
        && !Number.isNaN(trialEndDate.getTime())
        && trialEndDate.getTime() <= Date.now();

      if (isExpiredTrial) {
        expired = true;
        const disabledFlags = Object.fromEntries(
          Object.keys(current.featureFlags ?? defaultFeatureFlagsByPlan.coop_trial).map((key) => [key, false])
        );
        nextSubscription = {
          ...current,
          status: "paused",
          featureFlags: disabledFlags,
          updatedAt: serverTimestamp(),
        };
        tx.set(subRef(orgId), {
          status: "paused",
          featureFlags: disabledFlags,
          updatedAt: serverTimestamp(),
        }, { merge: true });
        tx.set(doc(seatLedgerCol(orgId)), {
          type: "PLAN_CHANGED",
          memberId: null,
          memberUid: null,
          actorUid: effectiveActor.uid,
          actorName: effectiveActor.name,
          createdAt: serverTimestamp(),
          note: "Trial expired; subscription paused",
          delta: { paid: 0, sponsored: 0 },
          snapshotAfter: null,
        });
      } else {
        nextSubscription = current;
      }
    }

    if (!settingsSnap.exists()) {
      tx.set(
        billingSettingsRef(orgId),
        {
          staffCanManageBilling: true,
          autoUnassignOnSuspension: false,
          autoUnassignSeatsOnSuspension: false,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }

    return { subscription: nextSubscription, created, expired };
  });
}

export async function bootstrapOrgBilling(
  orgId: string,
  actor: { uid: string; name: string }
): Promise<{ createdSettings: boolean; createdSubscription: boolean }> {
  return runTransaction(db, async (tx) => {
    const orgDocRef = doc(db, "orgs", orgId);
    const settingsDocRef = billingSettingsRef(orgId);
    const subscriptionDocRef = subRef(orgId);

    const [orgSnap, settingsSnap, subscriptionSnap] = await Promise.all([
      tx.get(orgDocRef),
      tx.get(settingsDocRef),
      tx.get(subscriptionDocRef),
    ]);

    const orgType = String((orgSnap.data() as any)?.orgType ?? (orgSnap.data() as any)?.type ?? "").toLowerCase();
    const planId: PlanId = orgType === "cooperative" ? "coop_trial" : "trial";
    const trialEndsAtMs = Date.now() + 60 * 24 * 60 * 60 * 1000;
    const trialEndsAt = new Date(trialEndsAtMs);

    let createdSettings = false;
    let createdSubscription = false;

    if (!settingsSnap.exists()) {
      tx.set(
        settingsDocRef,
        {
          staffCanManageBilling: false,
          autoUnassignOnSuspension: false,
          autoUnassignSeatsOnSuspension: false,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      createdSettings = true;
    }

    if (!subscriptionSnap.exists()) {
      tx.set(
        subscriptionDocRef,
        {
          planId,
          status: "active",
          billingCycle: "monthly",
          currency: "KES",
          startAt: serverTimestamp(),
          trialEndsAtMs,
          trialEndsAt,
          renewAt: trialEndsAt,
          cancelAt: null,
          seats: { paidTotal: 0, sponsoredTotal: 0 },
          seatPricing: { perSeat: 0, sponsoredPerSeat: 0 },
          featureFlags: {},
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      tx.set(doc(seatLedgerCol(orgId)), {
        type: "PLAN_CHANGED",
        memberId: null,
        memberUid: null,
        actorUid: actor.uid,
        actorName: actor.name,
        createdAt: serverTimestamp(),
        note: "Bootstrap created trial subscription",
        delta: { paid: 0, sponsored: 0 },
        snapshotAfter: null,
      });
      createdSubscription = true;
    }

    return { createdSettings, createdSubscription };
  });
}

export async function getBillingSettings(orgId: string) {
  const snap = await getDoc(billingSettingsRef(orgId));
  if (snap.exists()) return snap.data() as any;
  return {
    staffCanManageBilling: true,
    autoUnassignOnSuspension: false,
    autoUnassignSeatsOnSuspension: false,
  };
}

export async function updateFeatureFlags(orgId: string, flags: Record<string, boolean>) {
  await setDoc(
    subRef(orgId),
    {
      featureFlags: flags,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function updatePlan(orgId: string, nextPlan: PlanId, actor: BillingActor) {
  const pricing = defaultPricingByPlan[nextPlan];
  const features = defaultFeatureFlagsByPlan[nextPlan];
  await setDoc(
    subRef(orgId),
    {
      planId: nextPlan,
      seatPricing: pricing,
      featureFlags: features,
      status: "active",
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
  await writeLedgerEvent(orgId, {
    type: "PLAN_CHANGED",
    actor,
    note: `Plan switched to ${nextPlan}`,
  });
}

export async function computeSeatUsage(orgId: string): Promise<SeatUsage> {
  const [sub, membersSnap] = await Promise.all([getOrgSubscription(orgId), getDocs(membersCol(orgId))]);

  let paidUsed = 0;
  let sponsoredUsed = 0;
  let activeMembers = 0;
  let premiumEnabledMembers = 0;

  membersSnap.forEach((memberDoc) => {
    const member = memberDoc.data() as any;
    const status = member.status ?? member.verificationStatus;
    const seatType = (member.seatType ?? member.seatStatus ?? member.premiumSeatType ?? "none") as SeatType;
    if (status === "active") {
      activeMembers += 1;
      if (seatType === "paid") paidUsed += 1;
      if (seatType === "sponsored") sponsoredUsed += 1;
      if (seatType !== "none") premiumEnabledMembers += 1;
    }
  });

  const paidTotal = Number(sub.seats?.paidTotal ?? 0);
  const sponsoredTotal = Number(sub.seats?.sponsoredTotal ?? 0);

  return {
    paidUsed,
    sponsoredUsed,
    paidTotal,
    sponsoredTotal,
    paidRemaining: Math.max(0, paidTotal - paidUsed),
    sponsoredRemaining: Math.max(0, sponsoredTotal - sponsoredUsed),
    activeMembers,
    premiumEnabledMembers,
  };
}

const entitlementFrom = (seatType: SeatType, active: boolean, featureFlags: Record<string, boolean>) => {
  const premiumActive = active && seatType !== "none";
  return {
    premiumActive,
    features: Object.fromEntries(
      Object.entries(featureFlags).map(([key, value]) => [key, premiumActive ? Boolean(value) : false])
    ),
  };
};

export async function assignSeat(
  orgId: string,
  memberId: string,
  seatType: Exclude<SeatType, "none">,
  actor: BillingActor
) {
  await runTransaction(db, async (tx) => {
    const [subSnap, memberSnap] = await Promise.all([tx.get(subRef(orgId)), tx.get(memberRef(orgId, memberId))]);
    if (!memberSnap.exists()) throw new Error("Member not found.");

    const sub = (subSnap.exists() ? subSnap.data() : null) as SubscriptionCurrent | null;
    const member = memberSnap.data() as any;
    const status = member.status ?? member.verificationStatus;
    if (status !== "active") throw new Error("Only active members can receive premium seats.");

    const seats = sub?.seats ?? { paidTotal: 0, sponsoredTotal: 0 };
    const pricingFlags = sub?.featureFlags ?? defaultFeatureFlagsByPlan.free;

    const membersSnapshot = await tx.get(membersCol(orgId));
    let paidUsed = 0;
    let sponsoredUsed = 0;
    membersSnapshot.forEach((docSnap) => {
      const row = docSnap.data() as any;
      const rowStatus = row.status ?? row.verificationStatus;
      if (rowStatus !== "active") return;
      const rowSeat = (row.seatType ?? row.seatStatus ?? row.premiumSeatType ?? "none") as SeatType;
      if (rowSeat === "paid") paidUsed += 1;
      if (rowSeat === "sponsored") sponsoredUsed += 1;
    });

    const currentSeat = (member.seatType ?? member.seatStatus ?? member.premiumSeatType ?? "none") as SeatType;
    if (currentSeat === seatType) return;

    if (currentSeat === "paid") paidUsed = Math.max(0, paidUsed - 1);
    if (currentSeat === "sponsored") sponsoredUsed = Math.max(0, sponsoredUsed - 1);

    if (seatType === "paid") {
      if (paidUsed >= Number(seats.paidTotal ?? 0)) throw new Error("No paid seats remaining.");
      paidUsed += 1;
    }
    if (seatType === "sponsored") {
      if (sponsoredUsed >= Number(seats.sponsoredTotal ?? 0)) throw new Error("No sponsored seats remaining.");
      sponsoredUsed += 1;
    }

    tx.set(
      memberRef(orgId, memberId),
      {
        seatType,
        seatStatus: seatType,
        premiumSeatType: seatType,
        seatAssignedAt: serverTimestamp(),
        seatAssignedBy: actor.uid,
        seatAssignedByName: actor.name,
        entitlement: entitlementFrom(seatType, true, pricingFlags),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    tx.set(
      subRef(orgId),
      {
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    const ledgerType = seatType === "paid" ? "SEAT_ASSIGNED" : "SPONSORED_ASSIGNED";
    tx.set(doc(seatLedgerCol(orgId)), {
      type: ledgerType,
      memberId,
      memberUid: member.userUid ?? member.linkedUserUid ?? null,
      actorUid: actor.uid,
      actorName: actor.name,
      createdAt: serverTimestamp(),
      note: null,
      delta: { paid: 0, sponsored: 0 },
      snapshotAfter: {
        paidTotal: Number(seats.paidTotal ?? 0),
        sponsoredTotal: Number(seats.sponsoredTotal ?? 0),
        paidUsed,
        sponsoredUsed,
      },
    });
  });
}

export async function unassignSeat(orgId: string, memberId: string, actor: BillingActor) {
  await runTransaction(db, async (tx) => {
    const [subSnap, memberSnap] = await Promise.all([tx.get(subRef(orgId)), tx.get(memberRef(orgId, memberId))]);
    if (!memberSnap.exists()) throw new Error("Member not found.");

    const sub = (subSnap.exists() ? subSnap.data() : null) as SubscriptionCurrent | null;
    const seats = sub?.seats ?? { paidTotal: 0, sponsoredTotal: 0 };

    const member = memberSnap.data() as any;
    const currentSeat = (member.seatType ?? member.seatStatus ?? member.premiumSeatType ?? "none") as SeatType;
    if (currentSeat === "none") return;

    const isActive = (member.status ?? member.verificationStatus) === "active";
    tx.set(
      memberRef(orgId, memberId),
      {
        seatType: "none",
        seatStatus: "none",
        premiumSeatType: "none",
        seatAssignedAt: null,
        seatAssignedBy: null,
        seatAssignedByName: null,
        entitlement: entitlementFrom("none", isActive, sub?.featureFlags ?? defaultFeatureFlagsByPlan.free),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    const membersSnapshot = await tx.get(membersCol(orgId));
    let paidUsed = 0;
    let sponsoredUsed = 0;
    membersSnapshot.forEach((docSnap) => {
      if (docSnap.id === memberId) return;
      const row = docSnap.data() as any;
      const rowStatus = row.status ?? row.verificationStatus;
      if (rowStatus !== "active") return;
      const rowSeat = (row.seatType ?? row.seatStatus ?? row.premiumSeatType ?? "none") as SeatType;
      if (rowSeat === "paid") paidUsed += 1;
      if (rowSeat === "sponsored") sponsoredUsed += 1;
    });

    tx.set(doc(seatLedgerCol(orgId)), {
      type: currentSeat === "paid" ? "SEAT_UNASSIGNED" : "SPONSORED_UNASSIGNED",
      memberId,
      memberUid: member.userUid ?? member.linkedUserUid ?? null,
      actorUid: actor.uid,
      actorName: actor.name,
      createdAt: serverTimestamp(),
      note: null,
      delta: { paid: 0, sponsored: 0 },
      snapshotAfter: {
        paidTotal: Number(seats.paidTotal ?? 0),
        sponsoredTotal: Number(seats.sponsoredTotal ?? 0),
        paidUsed,
        sponsoredUsed,
      },
    });
  });
}

async function createInvoiceAndPendingPayment(params: {
  orgId: string;
  qty: number;
  actor: BillingActor;
  paymentMethod: "mpesa" | "bank_transfer";
  seatType: "paid" | "sponsored";
  purpose?: "seat_purchase" | "plan_change";
  planTemplateId?: PlanTemplateId;
  billingCycle?: "monthly" | "annual";
  selectedSeats?: { paidTotal: number; sponsoredTotal: number };
  keepOverrides?: boolean;
}) {
  const sub = await getOrgSubscription(params.orgId);
  const unitPrice = params.seatType === "paid" ? Number(sub.seatPricing.perSeat ?? 0) : Number(sub.seatPricing.sponsoredPerSeat ?? 0);
  const amount = unitPrice * params.qty;

  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const invoiceRef = doc(invoicesCol(params.orgId));
  const paymentRef = doc(paymentsCol(params.orgId));

  await setDoc(invoiceRef, {
    periodStart,
    periodEnd,
    status: "unpaid",
    amount,
    currency: "KES",
    items: [
      {
        label: params.seatType === "paid" ? "Paid premium seats" : "Sponsored premium seats",
        qty: params.qty,
        unitPrice,
        total: amount,
      },
    ],
    paymentMethod: params.paymentMethod,
    paidAt: null,
    reference: null,
    purpose: params.purpose ?? "seat_purchase",
    seatType: params.seatType,
    qty: params.qty,
    planTemplateId: params.planTemplateId ?? null,
    billingCycle: params.billingCycle ?? null,
    selectedSeats: params.selectedSeats ?? null,
    keepOverrides: params.keepOverrides ?? true,
    createdAt: serverTimestamp(),
  });

  await setDoc(paymentRef, {
    amount,
    currency: "KES",
    method: params.paymentMethod,
    reference: null,
    status: "pending",
    invoiceId: invoiceRef.id,
    purpose: params.purpose ?? "seat_purchase",
    seatType: params.seatType,
    qty: params.qty,
    planTemplateId: params.planTemplateId ?? null,
    billingCycle: params.billingCycle ?? null,
    selectedSeats: params.selectedSeats ?? null,
    keepOverrides: params.keepOverrides ?? true,
    createdAt: serverTimestamp(),
    confirmedAt: null,
  });

  await writeLedgerEvent(params.orgId, {
    type: "INVOICE_CREATED",
    actor: params.actor,
    note: `${params.seatType} seats x${params.qty} via ${params.paymentMethod}`,
    delta: { paid: 0, sponsored: 0 },
  });

  return {
    invoiceId: invoiceRef.id,
    paymentId: paymentRef.id,
    amount,
  };
}

export async function addPaidSeats(orgId: string, qty: number, actor: BillingActor, paymentMethod: "mpesa" | "bank_transfer") {
  return createInvoiceAndPendingPayment({ orgId, qty, actor, paymentMethod, seatType: "paid" });
}

export async function addSponsoredSeats(orgId: string, qty: number, actor: BillingActor, paymentMethod: "mpesa" | "bank_transfer") {
  return createInvoiceAndPendingPayment({ orgId, qty, actor, paymentMethod, seatType: "sponsored" });
}

export async function applyPlanTemplate(params: {
  orgId: string;
  planId: PlanTemplateId;
  billingCycle: "monthly" | "annual";
  actor: BillingActor;
  paymentMethod: "mpesa" | "bank_transfer";
  seats?: { paidTotal: number; sponsoredTotal: number };
  resetToTemplateDefaults?: boolean;
}) {
  await seedBillingPlanTemplates();
  const templateSnap = await getDoc(doc(db, "billingPlanTemplates", params.planId));
  if (!templateSnap.exists()) throw new Error("Plan template not found.");
  const template = templateSnap.data() as BillingPlanTemplate;

  const selectedSeats = params.seats ?? template.defaultSeats;
  if (params.planId === "free") {
    const existing = await getOrgSubscription(params.orgId);
    const payload = applySubscriptionTemplateValues(template, params.billingCycle, {
      seats: selectedSeats,
      keepOverrides: !params.resetToTemplateDefaults,
      existing,
    });
    await setDoc(
      subRef(params.orgId),
      {
        ...payload,
        status: "active",
        startAt: serverTimestamp(),
        renewAt: null,
        cancelAt: null,
      },
      { merge: true }
    );
    await writeLedgerEvent(params.orgId, {
      type: "PLAN_CHANGED",
      actor: params.actor,
      note: `Plan switched to ${template.planId} (${params.billingCycle})`,
      delta: { paid: 0, sponsored: 0 },
    });
    return { requiresPayment: false as const, invoiceId: null, paymentId: null, amount: 0 };
  }

  const pricing = params.billingCycle === "annual" ? template.seatPricing.annual : template.seatPricing.monthly;
  const amount = selectedSeats.paidTotal * pricing.perSeat + selectedSeats.sponsoredTotal * pricing.sponsoredPerSeat;

  const invoice = await createInvoiceAndPendingPayment({
    orgId: params.orgId,
    qty: 1,
    actor: params.actor,
    paymentMethod: params.paymentMethod,
    seatType: "paid",
    purpose: "plan_change",
    planTemplateId: template.planId,
    billingCycle: params.billingCycle,
    selectedSeats,
    keepOverrides: !params.resetToTemplateDefaults,
  });

  await setDoc(
    subRef(params.orgId),
    {
      status: "past_due",
      planId: mapTemplateToPlanId(template.planId),
      templateAppliedFrom: template.planId,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await setDoc(
    doc(db, "orgs", params.orgId, "billing", "invoices", invoice.invoiceId),
    {
      amount,
      items: [
        { label: `${template.name} paid seats`, qty: selectedSeats.paidTotal, unitPrice: pricing.perSeat, total: selectedSeats.paidTotal * pricing.perSeat },
        { label: `${template.name} sponsored seats`, qty: selectedSeats.sponsoredTotal, unitPrice: pricing.sponsoredPerSeat, total: selectedSeats.sponsoredTotal * pricing.sponsoredPerSeat },
      ],
    },
    { merge: true }
  );
  await setDoc(
    doc(db, "orgs", params.orgId, "billing", "payments", invoice.paymentId),
    { amount },
    { merge: true }
  );

  return { requiresPayment: true as const, ...invoice, amount };
}

export async function confirmPayment(params: {
  orgId: string;
  invoiceId: string;
  paymentId: string;
  reference: string;
  actor: BillingActor;
}) {
  await runTransaction(db, async (tx) => {
    const invoiceRef = doc(db, "orgs", params.orgId, "billing", "invoices", params.invoiceId);
    const paymentRef = doc(db, "orgs", params.orgId, "billing", "payments", params.paymentId);
    const currentSubRef = subRef(params.orgId);

    const [invoiceSnap, paymentSnap, subSnap] = await Promise.all([tx.get(invoiceRef), tx.get(paymentRef), tx.get(currentSubRef)]);
    if (!invoiceSnap.exists()) throw new Error("Invoice not found.");
    if (!paymentSnap.exists()) throw new Error("Payment not found.");

    const invoice = invoiceSnap.data() as any;
    const payment = paymentSnap.data() as any;
    if (invoice.status === "paid" || payment.status === "confirmed") return;

    const qty = Number(invoice.qty ?? payment.qty ?? 0);
    const seatType = (invoice.seatType ?? payment.seatType ?? "paid") as "paid" | "sponsored";
    const purpose = (invoice.purpose ?? payment.purpose ?? "seat_purchase") as "seat_purchase" | "plan_change";

    const currentSub = (subSnap.exists() ? subSnap.data() : null) as SubscriptionCurrent | null;
    const currentSeats = currentSub?.seats ?? { paidTotal: 0, sponsoredTotal: 0 };
    let nextSeats = {
      paidTotal: Number(currentSeats.paidTotal ?? 0) + (seatType === "paid" ? qty : 0),
      sponsoredTotal: Number(currentSeats.sponsoredTotal ?? 0) + (seatType === "sponsored" ? qty : 0),
    };
    let planPatch: Partial<SubscriptionCurrent> = {};
    if (purpose === "plan_change") {
      const planTemplateId = (invoice.planTemplateId ?? payment.planTemplateId) as PlanTemplateId | null;
      const billingCycle = (invoice.billingCycle ?? payment.billingCycle ?? "monthly") as "monthly" | "annual";
      const selectedSeats = (invoice.selectedSeats ?? payment.selectedSeats ?? null) as { paidTotal: number; sponsoredTotal: number } | null;
      const keepOverrides = Boolean(invoice.keepOverrides ?? payment.keepOverrides ?? true);
      if (planTemplateId) {
        const templateSnap = await tx.get(doc(db, "billingPlanTemplates", planTemplateId));
        if (templateSnap.exists()) {
          const template = templateSnap.data() as BillingPlanTemplate;
          planPatch = applySubscriptionTemplateValues(template, billingCycle, {
            seats: selectedSeats ?? template.defaultSeats,
            keepOverrides,
            existing: currentSub,
          });
          nextSeats = selectedSeats ?? template.defaultSeats;
        }
      }
    }

    tx.set(
      invoiceRef,
      {
        status: "paid",
        paidAt: serverTimestamp(),
        reference: params.reference,
      },
      { merge: true }
    );

    tx.set(
      paymentRef,
      {
        status: "confirmed",
        confirmedAt: serverTimestamp(),
        reference: params.reference,
      },
      { merge: true }
    );

    tx.set(
      currentSubRef,
      {
        ...planPatch,
        status: "active",
        startAt: serverTimestamp(),
        renewAt: (invoice.billingCycle ?? payment.billingCycle ?? "monthly") === "annual"
          ? new Date(new Date().setFullYear(new Date().getFullYear() + 1))
          : new Date(new Date().setMonth(new Date().getMonth() + 1)),
        seats: nextSeats,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    tx.set(doc(seatLedgerCol(params.orgId)), {
      type: "PAYMENT_MARKED_PAID",
      memberId: null,
      memberUid: null,
      actorUid: params.actor.uid,
      actorName: params.actor.name,
      createdAt: serverTimestamp(),
      note: `Invoice ${params.invoiceId} paid (${seatType} x${qty})`,
      delta: {
        paid: seatType === "paid" ? qty : 0,
        sponsored: seatType === "sponsored" ? qty : 0,
      },
      snapshotAfter: null,
    });

    tx.set(doc(seatLedgerCol(params.orgId)), {
      type: purpose === "plan_change" ? "PLAN_CHANGED" : (seatType === "paid" ? "PAID_SEAT_PURCHASED" : "SPONSORED_SEAT_ADDED"),
      memberId: null,
      memberUid: null,
      actorUid: params.actor.uid,
      actorName: params.actor.name,
      createdAt: serverTimestamp(),
      note: purpose === "plan_change"
        ? `Plan payment confirmed for ${invoice.planTemplateId ?? payment.planTemplateId}`
        : `${seatType} seats increased by ${qty}`,
      delta: {
        paid: purpose === "plan_change" ? (nextSeats.paidTotal - Number(currentSeats.paidTotal ?? 0)) : (seatType === "paid" ? qty : 0),
        sponsored: purpose === "plan_change" ? (nextSeats.sponsoredTotal - Number(currentSeats.sponsoredTotal ?? 0)) : (seatType === "sponsored" ? qty : 0),
      },
      snapshotAfter: null,
    });
  });
}

export async function recreateSubscriptionFromFreeTemplate(orgId: string, actor: BillingActor) {
  await seedBillingPlanTemplates();
  const templateSnap = await getDoc(doc(db, "billingPlanTemplates", "free"));
  const template = templateSnap.exists() ? (templateSnap.data() as BillingPlanTemplate) : DEFAULT_TEMPLATES.free;
  const payload = applySubscriptionTemplateValues(template, "monthly", { seats: template.defaultSeats, keepOverrides: false });
  await setDoc(
    subRef(orgId),
    {
      ...payload,
      status: "active",
      startAt: serverTimestamp(),
      renewAt: null,
      cancelAt: null,
    },
    { merge: true }
  );
  await getBillingSettings(orgId);
  await writeLedgerEvent(orgId, {
    type: "PLAN_CHANGED",
    actor,
    note: "Recreated from free template",
    delta: { paid: 0, sponsored: 0 },
  });
}

export async function listBillingDocs(orgId: string) {
  const [invoicesSnap, paymentsSnap, ledgerSnap] = await Promise.all([
    getDocs(query(invoicesCol(orgId))),
    getDocs(query(paymentsCol(orgId))),
    getDocs(query(seatLedgerCol(orgId))),
  ]);

  return {
    invoices: invoicesSnap.docs
      .map((snap) => ({ id: snap.id, ...(snap.data() as any) }))
      .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0)),
    payments: paymentsSnap.docs
      .map((snap) => ({ id: snap.id, ...(snap.data() as any) }))
      .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0)),
    ledger: ledgerSnap.docs
      .map((snap) => ({ id: snap.id, ...(snap.data() as any) }))
      .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0)),
  };
}

export async function applyAutoUnassignOnSuspended(orgId: string, actor: BillingActor) {
  const settings = await getBillingSettings(orgId);
  if (!settings.autoUnassignSeatsOnSuspension) return;

  const suspendedMembers = await getDocs(
    query(membersCol(orgId), where("status", "in", ["suspended", "rejected"]))
  );

  for (const memberDoc of suspendedMembers.docs) {
    const member = memberDoc.data() as any;
    const seatType = (member.seatType ?? member.seatStatus ?? member.premiumSeatType ?? "none") as SeatType;
    if (seatType === "none") continue;
    await unassignSeat(orgId, memberDoc.id, actor);
  }
}

