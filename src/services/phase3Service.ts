import {
  addDoc,
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getOrgFeatureFlags } from "@/services/orgFeaturesService";

export type PartnerType = "ngo" | "bank" | "enterprise";
export type PartnerMemberRole = "partner_admin" | "partner_analyst" | "partner_finance";
export type SponsorshipStatus = "proposed" | "active" | "paused" | "ended" | "rejected";
export type BatchStatus = "draft" | "collecting" | "ready" | "sold" | "settled";

const asNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

async function isFeatureEnabled(orgId: string, key: keyof Awaited<ReturnType<typeof getOrgFeatureFlags>>) {
  const flags = await getOrgFeatureFlags(orgId);
  return Boolean(flags[key]);
}

export async function listPartners() {
  const snap = await getDocs(query(collection(db, "partners"), orderBy("createdAt", "desc")));
  return snap.docs.map((row) => ({ id: row.id, ...(row.data() as DocumentData) }));
}

export async function createPartner(params: {
  name: string;
  type: PartnerType;
  contactEmail: string;
  contactPerson: string;
  createdByUid: string;
}) {
  const ref = await addDoc(collection(db, "partners"), {
    name: params.name,
    type: params.type,
    contactEmail: params.contactEmail,
    contactPerson: params.contactPerson,
    status: "pending",
    createdAt: serverTimestamp(),
    createdByUid: params.createdByUid,
  });
  return ref.id;
}

export async function listPartnerSponsorships(partnerId: string) {
  const snap = await getDocs(
    query(collectionGroup(db, "sponsorships"), where("partnerId", "==", partnerId), orderBy("createdAt", "desc"))
  );
  return snap.docs.map((row) => ({ id: row.id, ...(row.data() as DocumentData) }));
}

export async function listOrgSponsorships(orgId: string) {
  const enabled = await isFeatureEnabled(orgId, "phase3Sponsorships");
  if (!enabled) return [];
  const snap = await getDocs(
    query(collection(db, "orgs", orgId, "sponsorships"), orderBy("createdAt", "desc"))
  );
  return snap.docs.map((row) => ({ id: row.id, ...(row.data() as DocumentData) }));
}

export async function createOrgSponsorship(params: {
  orgId: string;
  partnerId: string;
  title: string;
  startAt: Date | null;
  endAt: Date | null;
  seatBudget: number;
  createdByUid: string;
}) {
  const enabled = await isFeatureEnabled(params.orgId, "phase3Sponsorships");
  if (!enabled) return { skipped: true as const };
  const ref = await addDoc(collection(db, "orgs", params.orgId, "sponsorships"), {
    partnerId: params.partnerId,
    orgId: params.orgId,
    title: params.title,
    startAt: params.startAt ?? null,
    endAt: params.endAt ?? null,
    seatBudget: asNumber(params.seatBudget),
    seatsAllocated: 0,
    seatsUsed: 0,
    status: "proposed",
    createdAt: serverTimestamp(),
    createdByUid: params.createdByUid,
    acceptedAt: null,
    acceptedByUid: null,
  });
  return { skipped: false as const, id: ref.id };
}

export async function setSponsorshipStatus(params: {
  orgId: string;
  sponsorshipId: string;
  status: SponsorshipStatus;
  actorUid: string;
}) {
  const enabled = await isFeatureEnabled(params.orgId, "phase3Sponsorships");
  if (!enabled) return;
  const patch: Record<string, unknown> = {
    status: params.status,
    updatedAt: serverTimestamp(),
  };
  if (params.status === "active") {
    patch.acceptedAt = serverTimestamp();
    patch.acceptedByUid = params.actorUid;
  }
  await setDoc(doc(db, "orgs", params.orgId, "sponsorships", params.sponsorshipId), patch, { merge: true });
}

export async function listSponsorPools(orgId: string) {
  const enabled = await isFeatureEnabled(orgId, "phase3Sponsorships");
  if (!enabled) return [];
  const snap = await getDocs(
    query(collection(db, "orgs", orgId, "sponsorships"), where("status", "==", "active"))
  );
  return snap.docs.map((row) => {
    const data = row.data() as any;
    const remaining = Math.max(0, asNumber(data.seatBudget) - asNumber(data.seatsUsed));
    return { id: row.id, ...data, remaining };
  });
}

export async function assignSponsorSeatFromPool(params: {
  orgId: string;
  sponsorshipId: string;
  memberDocId: string;
  actorUid: string;
}) {
  const enabled = await isFeatureEnabled(params.orgId, "phase3Sponsorships");
  if (!enabled) return { assigned: false as const, reason: "feature_disabled" };

  return runTransaction(db, async (tx) => {
    const sponsorshipRef = doc(db, "orgs", params.orgId, "sponsorships", params.sponsorshipId);
    const memberRef = doc(db, "orgs", params.orgId, "members", params.memberDocId);
    const sponsorshipSnap = await tx.get(sponsorshipRef);
    if (!sponsorshipSnap.exists()) {
      return { assigned: false as const, reason: "not_found" };
    }
    const sponsorship = sponsorshipSnap.data() as any;
    if (sponsorship.status !== "active") {
      return { assigned: false as const, reason: "inactive" };
    }
    const remaining = Math.max(0, asNumber(sponsorship.seatBudget) - asNumber(sponsorship.seatsUsed));
    if (remaining <= 0) {
      return { assigned: false as const, reason: "no_remaining" };
    }

    tx.set(
      sponsorshipRef,
      {
        seatsUsed: asNumber(sponsorship.seatsUsed) + 1,
        seatsAllocated: Math.max(asNumber(sponsorship.seatsAllocated), asNumber(sponsorship.seatsUsed) + 1),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    tx.set(
      memberRef,
      {
        seatType: "sponsored",
        seatStatus: "sponsored",
        premiumSeatType: "sponsored",
        sponsorId: sponsorship.partnerId ?? null,
        sponsorshipId: params.sponsorshipId,
        sponsoredAt: serverTimestamp(),
        seatAssignedBy: params.actorUid,
        seatAssignedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return { assigned: true as const, reason: null };
  });
}

export async function listSalesBatches(orgId: string) {
  const enabled = await isFeatureEnabled(orgId, "phase3SellOnBehalf");
  if (!enabled) return [];
  const snap = await getDocs(query(collection(db, "orgs", orgId, "salesBatches"), orderBy("createdAt", "desc")));
  return snap.docs.map((row) => ({ id: row.id, ...(row.data() as DocumentData) }));
}

export async function createSalesBatch(params: {
  orgId: string;
  batchName: string;
  commodity: string;
  grade: string;
  targetMarket: string;
  targetPricePerKg: number;
  notes?: string;
  createdByUid: string;
}) {
  const enabled = await isFeatureEnabled(params.orgId, "phase3SellOnBehalf");
  if (!enabled) return { skipped: true as const };
  const ref = await addDoc(collection(db, "orgs", params.orgId, "salesBatches"), {
    batchName: params.batchName,
    commodity: params.commodity,
    grade: params.grade,
    targetMarket: params.targetMarket,
    targetPricePerKg: asNumber(params.targetPricePerKg),
    status: "draft",
    createdAt: serverTimestamp(),
    createdByUid: params.createdByUid,
    totalKg: 0,
    totalValueKES: 0,
    notes: params.notes ?? null,
  });
  return { skipped: false as const, id: ref.id };
}

export async function addBatchContribution(params: {
  orgId: string;
  batchId: string;
  memberUid: string;
  memberId: string;
  kg: number;
  qualityNotes?: string;
  accepted?: boolean;
}) {
  const enabled = await isFeatureEnabled(params.orgId, "phase3SellOnBehalf");
  if (!enabled) return { skipped: true as const };
  await addDoc(collection(db, "orgs", params.orgId, "salesBatches", params.batchId, "contributions"), {
    memberUid: params.memberUid,
    memberId: params.memberId,
    kg: asNumber(params.kg),
    qualityNotes: params.qualityNotes ?? null,
    accepted: params.accepted ?? true,
    createdAt: serverTimestamp(),
  });
  return { skipped: false as const };
}

export async function upsertRevenueSettings(params: {
  orgId: string;
  mode: "none" | "per_member" | "commission" | "subscription";
  perMemberFeeKES?: number | null;
  commissionPercent?: number | null;
  farmerMonthlyKES?: number | null;
  active: boolean;
}) {
  const enabled = await isFeatureEnabled(params.orgId, "phase3RevenueShare");
  if (!enabled) return;
  await setDoc(
    doc(db, "orgs", params.orgId, "revenueModel", "settings"),
    {
      mode: params.mode,
      perMemberFeeKES: params.perMemberFeeKES ?? null,
      commissionPercent: params.commissionPercent ?? null,
      farmerMonthlyKES: params.farmerMonthlyKES ?? null,
      currency: "KES",
      active: Boolean(params.active),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function getRevenueSettings(orgId: string) {
  const enabled = await isFeatureEnabled(orgId, "phase3RevenueShare");
  if (!enabled) return null;
  const snap = await getDoc(doc(db, "orgs", orgId, "revenueModel", "settings"));
  return snap.exists() ? (snap.data() as any) : null;
}

export async function listImpactMonths(orgId: string) {
  const enabled = await isFeatureEnabled(orgId, "phase3Impact");
  if (!enabled) return [];
  const snap = await getDocs(query(collection(db, "orgs", orgId, "impact"), orderBy("month", "desc")));
  return snap.docs.map((row) => ({ id: row.id, ...(row.data() as DocumentData) }));
}

export async function upsertImpactMonth(orgId: string, month: string, payload: Record<string, unknown>) {
  const enabled = await isFeatureEnabled(orgId, "phase3Impact");
  if (!enabled) return;
  await setDoc(
    doc(db, "orgs", orgId, "impact", month),
    {
      month,
      ...payload,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function createReportMetadata(params: {
  orgId: string;
  type: "members" | "seats" | "impact" | "sales" | "sponsorUtilization";
  storagePath: string;
  createdByUid: string;
  filters?: Record<string, unknown>;
}) {
  const enabled = await isFeatureEnabled(params.orgId, "phase3Reports");
  if (!enabled) return { skipped: true as const };
  const ref = await addDoc(collection(db, "orgs", params.orgId, "reports"), {
    type: params.type,
    storagePath: params.storagePath,
    createdAt: serverTimestamp(),
    createdByUid: params.createdByUid,
    filters: params.filters ?? {},
  });
  return { skipped: false as const, id: ref.id };
}

export async function listReportMetadata(orgId: string) {
  const enabled = await isFeatureEnabled(orgId, "phase3Reports");
  if (!enabled) return [];
  const snap = await getDocs(query(collection(db, "orgs", orgId, "reports"), orderBy("createdAt", "desc")));
  return snap.docs.map((row) => ({ id: row.id, ...(row.data() as DocumentData) }));
}
