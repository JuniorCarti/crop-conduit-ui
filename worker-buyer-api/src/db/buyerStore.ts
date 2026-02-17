import type { BuyerRecord, Env, ApprovalStatus } from "../types";
import { createDocumentAutoId, getDocument, runStructuredQuery, setDocument } from "./firestoreRest";

const nowIso = () => new Date().toISOString();

export const defaultBuyerRecord = (uid: string): BuyerRecord => {
  const createdAt = nowIso();
  const trialEndAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
  return {
    uid,
    type: "buyer",
    approvalStatus: "PENDING",
    verifiedBuyer: false,
    buyerTier: "BRONZE",
    premiumPlan: "NONE",
    premiumStatus: "TRIAL",
    trialStartAt: createdAt,
    trialEndAt,
    metrics: {
      successfulPurchasesCount: 0,
      totalSpendKes: 0,
      disputesCount: 0,
    },
    billing: {
      currency: "KES",
      monthlyPriceKes: 0,
      nextBillingDate: null,
      lastPaymentAt: null,
      paymentStatus: "ACTIVE",
    },
    createdAt,
    updatedAt: createdAt,
  };
};

export const getUser = async (env: Env, uid: string): Promise<BuyerRecord | null> =>
  getDocument<BuyerRecord>(env, `users/${uid}`);

export const upsertUser = async (
  env: Env,
  uid: string,
  partialData: Record<string, unknown>,
  merge = true
): Promise<void> => {
  const updated = {
    ...partialData,
    updatedAt: nowIso(),
  };

  await Promise.all([
    setDocument(env, `users/${uid}`, updated, merge),
    setDocument(env, `buyerProfiles/${uid}`, updated, true),
    setDocument(env, `buyers/${uid}/profile/v1`, updated, true),
  ]);

  const billing = (partialData.billing || null) as Record<string, unknown> | null;
  if (billing) {
    await setDocument(env, `buyers/${uid}/billing/v1`, { ...billing, updatedAt: nowIso() }, true);
  }
};

export const getPendingBuyers = async (env: Env, status?: ApprovalStatus): Promise<BuyerRecord[]> => {
  const statusValue = status || "PENDING";
  // Avoid composite-index dependency in worker bootstrap environments:
  // query by type only, then filter status in memory.
  const rows = await runStructuredQuery<BuyerRecord>(env, {
    from: [{ collectionId: "users" }],
    where: {
      fieldFilter: {
        field: { fieldPath: "type" },
        op: "EQUAL",
        value: { stringValue: "buyer" },
      },
    },
    limit: 400,
  });

  return rows
    .filter((row) => String(row.approvalStatus || "PENDING").toUpperCase() === statusValue)
    .sort((a, b) => Date.parse(String(b.updatedAt || "")) - Date.parse(String(a.updatedAt || "")));
};

export const writeAuditEvent = async (env: Env, event: Record<string, unknown>): Promise<void> => {
  await createDocumentAutoId(env, "auditEvents", {
    ...event,
    createdAt: nowIso(),
  });
};
