import type {
  AdminSetPremiumRequest,
  AdminSetTierRequest,
  BuyerProfileCreateRequest,
  BuyerRecord,
  CommitPurchaseRequest,
  Env,
  PremiumUpgradeRequest,
} from "./types";
import { HttpError } from "./domain/errors";
import { requireAuth } from "./auth/requireAuth";
import { isSuperadmin } from "./auth/superadmin";
import { defaultBuyerRecord, getPendingBuyers, getUser, upsertUser, writeAuditEvent } from "./db/buyerStore";
import {
  applyAdminPremium,
  applyAdminTier,
  applyPurchase,
  normalizePremiumPlan,
  requireApproved,
} from "./domain/buyerRules";
import { serializeBuyerMe } from "./domain/serializers";
import { ok } from "./http/response";

const readJson = async <T>(request: Request): Promise<T> => {
  try {
    return (await request.json()) as T;
  } catch {
    throw new HttpError(400, "INVALID_JSON", "Invalid JSON body");
  }
};

const ensureBuyer = (uid: string, existing: BuyerRecord | null): BuyerRecord => {
  if (existing && existing.type === "buyer") return existing;
  const raw = (existing || {}) as Record<string, unknown>;
  const role = String(raw.role || "").toLowerCase();
  const buyerLike = role === "buyer" || raw.buyerProfileComplete === true || raw.profileComplete === true;
  if (!buyerLike) return defaultBuyerRecord(uid);

  const seeded = defaultBuyerRecord(uid);
  return {
    ...seeded,
    uid,
    type: "buyer",
    approvalStatus: String(raw.approvalStatus || seeded.approvalStatus).toUpperCase() as BuyerRecord["approvalStatus"],
    verifiedBuyer: raw.verifiedBuyer === true || String(raw.approvalStatus || "").toUpperCase() === "APPROVED",
    buyerTier: (raw.buyerTier as BuyerRecord["buyerTier"]) || seeded.buyerTier,
    premiumPlan: (raw.premiumPlan as BuyerRecord["premiumPlan"]) || seeded.premiumPlan,
    premiumStatus: (raw.premiumStatus as BuyerRecord["premiumStatus"]) || seeded.premiumStatus,
    trialStartAt: String(raw.trialStartAt || seeded.trialStartAt),
    trialEndAt: String(raw.trialEndAt || seeded.trialEndAt),
    metrics: {
      successfulPurchasesCount: Number((raw.metrics as any)?.successfulPurchasesCount || 0),
      totalSpendKes: Number((raw.metrics as any)?.totalSpendKes || 0),
      disputesCount: Number((raw.metrics as any)?.disputesCount || 0),
    },
    billing: {
      currency: "KES",
      monthlyPriceKes: Number((raw.billing as any)?.monthlyPriceKes || 0),
      nextBillingDate: (raw.billing as any)?.nextBillingDate || null,
      lastPaymentAt: (raw.billing as any)?.lastPaymentAt || null,
      paymentStatus: ((raw.billing as any)?.paymentStatus as BuyerRecord["billing"]["paymentStatus"]) || "ACTIVE",
    },
    buyerProfile: {
      ...((raw.buyerProfile as Record<string, unknown>) || {}),
      displayName: raw.displayName || null,
      companyName: raw.companyName || null,
      buyerType: raw.buyerType || raw.buyerRegistrationType || "LOCAL",
      preferences: {
        crops: Array.isArray(raw.interestedCrops) ? raw.interestedCrops : [],
        preferredMarkets: Array.isArray(raw.preferredMarkets) ? raw.preferredMarkets : [],
        preferredRegions:
          Array.isArray((raw.internationalLocation as any)?.destinations)
            ? (raw.internationalLocation as any).destinations
            : [],
      },
      company: {
        companyName: raw.companyName || null,
        country: (raw.internationalLocation as any)?.buyerCountry || null,
        cityOrRegion: (raw.internationalLocation as any)?.buyerRegion || raw.location || null,
        phone: raw.phone || null,
        email: raw.email || null,
        destinations:
          Array.isArray((raw.internationalLocation as any)?.destinations)
            ? (raw.internationalLocation as any).destinations
            : [],
      },
    },
    createdAt: String(raw.createdAt || seeded.createdAt),
    updatedAt: new Date().toISOString(),
  };
};

const requireSuperadmin = (authorized: boolean) => {
  if (!authorized) throw new HttpError(403, "FORBIDDEN", "Superadmin role required");
};

export async function route(request: Request, env: Env, pathname: string): Promise<Response> {
  if (request.method === "GET" && pathname === "/health") {
    return ok(request, env, { service: "agrismart-buyer-api", status: "ok" });
  }

  const auth = await requireAuth(request, env);
  const admin = isSuperadmin(auth, env);

  if (request.method === "GET" && pathname === "/buyers/me") {
    const stored = await getUser(env, auth.uid);
    const buyer = ensureBuyer(auth.uid, stored);
    if (!stored || stored.type !== "buyer") {
      await upsertUser(env, auth.uid, buyer, true);
    }
    return ok(request, env, serializeBuyerMe(buyer));
  }

  if (request.method === "POST" && pathname === "/buyers/createProfile") {
    const body = await readJson<BuyerProfileCreateRequest>(request);
    const existing = await getUser(env, auth.uid);
    const seeded = ensureBuyer(auth.uid, existing);

    const created: BuyerRecord = {
      ...seeded,
      uid: auth.uid,
      type: "buyer",
      approvalStatus: seeded.approvalStatus || "PENDING",
      verifiedBuyer: seeded.approvalStatus === "APPROVED",
      buyerTier: seeded.buyerTier || "BRONZE",
      premiumPlan: seeded.premiumPlan || "NONE",
      premiumStatus: seeded.premiumStatus || "TRIAL",
      trialStartAt: seeded.trialStartAt,
      trialEndAt: seeded.trialEndAt,
      metrics: seeded.metrics || { successfulPurchasesCount: 0, totalSpendKes: 0, disputesCount: 0 },
      billing: {
        currency: "KES",
        monthlyPriceKes: seeded.billing?.monthlyPriceKes || 0,
        nextBillingDate: seeded.billing?.nextBillingDate || null,
        lastPaymentAt: seeded.billing?.lastPaymentAt || null,
        paymentStatus: seeded.billing?.paymentStatus || "ACTIVE",
      },
      buyerProfile: {
        ...(seeded.buyerProfile || {}),
        ...body,
      },
      createdAt: seeded.createdAt,
      updatedAt: new Date().toISOString(),
    };

    await upsertUser(env, auth.uid, created, true);
    await writeAuditEvent(env, {
      action: "BUYER_CREATED",
      actorUid: auth.uid,
      actorEmail: auth.email || null,
      targetUid: auth.uid,
      approvalStatus: created.approvalStatus,
    });

    return ok(request, env, serializeBuyerMe(created));
  }

  if (request.method === "POST" && pathname === "/buyers/requestPremiumUpgrade") {
    const body = await readJson<PremiumUpgradeRequest>(request);
    const existing = await getUser(env, auth.uid);
    const buyer = ensureBuyer(auth.uid, existing);

    requireApproved(buyer, "request premium upgrade");

    const requestedPlan = normalizePremiumPlan(body?.premiumPlan || "GOLD_ADDON");
    const next = {
      premiumUpgradeRequest: {
        requestedPlan,
        status: "PENDING",
        notes: body?.notes || null,
        createdAt: new Date().toISOString(),
      },
    };

    await upsertUser(env, auth.uid, next, true);
    await writeAuditEvent(env, {
      action: "BUYER_PREMIUM_UPGRADE_REQUESTED",
      actorUid: auth.uid,
      actorEmail: auth.email || null,
      targetUid: auth.uid,
      premiumPlan: requestedPlan,
    });

    return ok(request, env, { requestedPlan, status: "PENDING" });
  }

  if (
    request.method === "POST" &&
    (pathname === "/buyers/commitPurchase" || pathname === "/buyers/recordPurchaseCompleted")
  ) {
    const body = await readJson<CommitPurchaseRequest>(request);
    const existing = await getUser(env, auth.uid);
    const buyer = ensureBuyer(auth.uid, existing);

    requireApproved(buyer, "record completed purchase");

    const updated = applyPurchase(buyer, body);
    await upsertUser(env, auth.uid, updated, true);

    await writeAuditEvent(env, {
      action: "BUYER_PURCHASE_COMPLETED",
      actorUid: auth.uid,
      actorEmail: auth.email || null,
      targetUid: auth.uid,
      amountKes: body.amountKes,
      orderId: body.orderId || null,
    });

    return ok(request, env, { metrics: updated.metrics, buyerTier: updated.buyerTier });
  }

  if (request.method === "GET" && pathname === "/admin/buyers") {
    requireSuperadmin(admin);

    const url = new URL(request.url);
    const status = (url.searchParams.get("status") || "PENDING").toUpperCase() as BuyerRecord["approvalStatus"];
    const items = await getPendingBuyers(env, status);
    return ok(request, env, { items, count: items.length });
  }

  const approveMatch = pathname.match(/^\/admin\/buyers\/([^/]+)\/approve$/);
  if (request.method === "POST" && approveMatch) {
    requireSuperadmin(admin);
    const targetUid = decodeURIComponent(approveMatch[1]);
    const target = ensureBuyer(targetUid, await getUser(env, targetUid));

    const updated: BuyerRecord = {
      ...target,
      approvalStatus: "APPROVED",
      verifiedBuyer: true,
      approvedBy: auth.uid,
      approvedAt: new Date().toISOString(),
      rejectionReason: null,
      updatedAt: new Date().toISOString(),
    };
    await upsertUser(env, targetUid, updated, true);
    await writeAuditEvent(env, {
      action: "BUYER_APPROVED",
      actorUid: auth.uid,
      actorEmail: auth.email || null,
      targetUid,
    });
    return ok(request, env, serializeBuyerMe(updated));
  }

  const rejectMatch = pathname.match(/^\/admin\/buyers\/([^/]+)\/reject$/);
  if (request.method === "POST" && rejectMatch) {
    requireSuperadmin(admin);
    const targetUid = decodeURIComponent(rejectMatch[1]);
    const body = await readJson<{ rejectionReason?: string; notes?: string }>(request);
    const reason = String(body?.rejectionReason || body?.notes || "").trim();
    if (!reason) throw new HttpError(400, "VALIDATION_ERROR", "rejectionReason is required");

    const target = ensureBuyer(targetUid, await getUser(env, targetUid));
    const updated: BuyerRecord = {
      ...target,
      approvalStatus: "REJECTED",
      verifiedBuyer: false,
      rejectionReason: reason,
      updatedAt: new Date().toISOString(),
    };

    await upsertUser(env, targetUid, updated, true);
    await writeAuditEvent(env, {
      action: "BUYER_REJECTED",
      actorUid: auth.uid,
      actorEmail: auth.email || null,
      targetUid,
      rejectionReason: reason,
    });

    return ok(request, env, serializeBuyerMe(updated));
  }

  const setTierMatch = pathname.match(/^\/admin\/buyers\/([^/]+)\/setTier$/);
  if (request.method === "POST" && setTierMatch) {
    requireSuperadmin(admin);
    const targetUid = decodeURIComponent(setTierMatch[1]);
    const body = await readJson<AdminSetTierRequest>(request);
    const target = ensureBuyer(targetUid, await getUser(env, targetUid));
    const updated = applyAdminTier(target, body);

    await upsertUser(env, targetUid, updated, true);
    await writeAuditEvent(env, {
      action: "BUYER_TIER_UPDATED",
      actorUid: auth.uid,
      actorEmail: auth.email || null,
      targetUid,
      buyerTier: updated.buyerTier,
    });

    return ok(request, env, serializeBuyerMe(updated));
  }

  const setPremiumMatch = pathname.match(/^\/admin\/buyers\/([^/]+)\/setPremium$/);
  if (request.method === "POST" && setPremiumMatch) {
    requireSuperadmin(admin);
    const targetUid = decodeURIComponent(setPremiumMatch[1]);
    const body = await readJson<AdminSetPremiumRequest>(request);
    const target = ensureBuyer(targetUid, await getUser(env, targetUid));
    const updated = applyAdminPremium(target, body);

    await upsertUser(env, targetUid, updated, true);
    await writeAuditEvent(env, {
      action: "BUYER_PREMIUM_UPDATED",
      actorUid: auth.uid,
      actorEmail: auth.email || null,
      targetUid,
      premiumPlan: updated.premiumPlan,
      premiumStatus: updated.premiumStatus,
    });

    return ok(request, env, serializeBuyerMe(updated));
  }

  throw new HttpError(404, "NOT_FOUND", "Route not found");
}
