import { collection, doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type ProvisionActor = {
  uid: string;
  name: string;
  role: string;
};

const FREE_SUBSCRIPTION_DEFAULTS = {
  planId: "trial",
  status: "trialing",
  renewAt: null,
  cancelAt: null,
  billingCycle: "monthly",
  currency: "KES",
  exchangeRateUSD: 150,
  seatPricing: { perSeat: 300, sponsoredPerSeat: 250 },
  seats: { paidTotal: 20, sponsoredTotal: 10 },
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
  limits: { maxMembers: 50, maxMarketsTracked: 3 },
  templateAppliedFrom: "trial",
};

const BILLING_SETTINGS_DEFAULTS = {
  staffCanManageBilling: false,
  autoUnassignSeatsOnSuspension: true,
};

export async function ensureOrgSubscription(orgId: string, actor: ProvisionActor) {
  const subRef = doc(db, "orgs", orgId, "subscription", "current");
  const settingsRef = doc(db, "orgs", orgId, "billing", "settings");
  const ledgerRef = doc(collection(db, "orgs", orgId, "billing", "seatLedger"));

  return runTransaction(db, async (tx) => {
    const subSnap = await tx.get(subRef);
    const settingsSnap = await tx.get(settingsRef);
    const now = new Date();
    const trialEndsAt = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    let created = false;
    let expired = false;

    if (!subSnap.exists()) {
      created = true;
      tx.set(
        subRef,
        {
          ...FREE_SUBSCRIPTION_DEFAULTS,
          startAt: serverTimestamp(),
          trialEndsAt,
          renewAt: trialEndsAt,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      tx.set(ledgerRef, {
        type: "PLAN_CHANGED",
        actorUid: actor.uid,
        actorName: actor.name,
        createdAt: serverTimestamp(),
        note: "Auto-provisioned 60-day trial subscription",
      });
    } else {
      const data = subSnap.data() as any;
      const isTrial = data?.planId === "trial";
      const endDate = data?.trialEndsAt?.toDate?.() ?? (data?.trialEndsAt ? new Date(data.trialEndsAt) : null);
      const hasExpired = Boolean(isTrial && endDate && endDate.getTime() <= now.getTime() && data?.status !== "paused");
      if (hasExpired) {
        expired = true;
        const disabledFlags = Object.fromEntries(
          Object.keys((data?.featureFlags ?? FREE_SUBSCRIPTION_DEFAULTS.featureFlags) as Record<string, boolean>).map((key) => [key, false])
        );
        tx.set(
          subRef,
          {
            status: "paused",
            featureFlags: disabledFlags,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
        tx.set(ledgerRef, {
          type: "PLAN_CHANGED",
          actorUid: actor.uid,
          actorName: actor.name,
          createdAt: serverTimestamp(),
          note: "Trial expired; subscription paused",
        });
      }
    }

    if (!settingsSnap.exists()) {
      tx.set(
        settingsRef,
        {
          ...BILLING_SETTINGS_DEFAULTS,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }

    return {
      created,
      expired,
      subscription: subSnap.exists()
        ? (subSnap.data() as any)
        : {
            ...FREE_SUBSCRIPTION_DEFAULTS,
            startAt: new Date(),
            trialEndsAt,
            renewAt: trialEndsAt,
          },
    };
  });
}
