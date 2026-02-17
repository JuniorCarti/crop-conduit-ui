import type {
  AdminSetPremiumRequest,
  AdminSetTierRequest,
  BuyerMetrics,
  BuyerRecord,
  BuyerTier,
  CommitPurchaseRequest,
  PremiumPlan,
  PremiumStatus,
} from "../types";
import { HttpError } from "./errors";

export const isApproved = (buyer: BuyerRecord): boolean => buyer.approvalStatus === "APPROVED";

export const requireApproved = (buyer: BuyerRecord, action: string) => {
  if (!isApproved(buyer)) {
    throw new HttpError(403, "APPROVAL_REQUIRED", `Buyer approval required to ${action}`);
  }
};

export const normalizePremiumPlan = (value: unknown): PremiumPlan => {
  const v = String(value || "NONE").toUpperCase();
  if (v === "GOLD_ADDON" || v === "ENTERPRISE" || v === "NONE") return v;
  return "NONE";
};

export const normalizePremiumStatus = (value: unknown): PremiumStatus => {
  const v = String(value || "TRIAL").toUpperCase();
  if (["TRIAL", "ACTIVE", "EXPIRED", "PAST_DUE", "CANCELLED"].includes(v)) {
    return v as PremiumStatus;
  }
  return "TRIAL";
};

export const normalizeTier = (value: unknown): BuyerTier => {
  const v = String(value || "BRONZE").toUpperCase();
  if (v === "SILVER" || v === "GOLD" || v === "BRONZE") return v;
  return "BRONZE";
};

export const evaluateTier = (metrics: BuyerMetrics): BuyerTier => {
  if (metrics.successfulPurchasesCount >= 20 && metrics.disputesCount <= 2) return "GOLD";
  if (metrics.successfulPurchasesCount >= 5 && metrics.disputesCount <= 1) return "SILVER";
  return "BRONZE";
};

export const isTrialExpired = (buyer: BuyerRecord): boolean => {
  const t = Date.parse(buyer.trialEndAt || "");
  return Number.isFinite(t) ? Date.now() > t : false;
};

export const trialDaysLeft = (buyer: BuyerRecord): number => {
  const t = Date.parse(buyer.trialEndAt || "");
  if (!Number.isFinite(t)) return 0;
  const diff = t - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const applyPurchase = (buyer: BuyerRecord, req: CommitPurchaseRequest): BuyerRecord => {
  const amount = Number(req.amountKes);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new HttpError(400, "VALIDATION_ERROR", "amountKes must be greater than 0");
  }

  const nextMetrics: BuyerMetrics = {
    successfulPurchasesCount: Number(buyer.metrics?.successfulPurchasesCount || 0) + 1,
    totalSpendKes: Number((Number(buyer.metrics?.totalSpendKes || 0) + amount).toFixed(2)),
    disputesCount: Number(buyer.metrics?.disputesCount || 0) + (req.hasDispute ? 1 : 0),
  };

  return {
    ...buyer,
    metrics: nextMetrics,
    buyerTier: evaluateTier(nextMetrics),
    updatedAt: new Date().toISOString(),
  };
};

export const applyAdminTier = (buyer: BuyerRecord, body: AdminSetTierRequest): BuyerRecord => ({
  ...buyer,
  buyerTier: normalizeTier(body.buyerTier),
  updatedAt: new Date().toISOString(),
});

export const applyAdminPremium = (buyer: BuyerRecord, body: AdminSetPremiumRequest): BuyerRecord => {
  const premiumPlan = normalizePremiumPlan(body.premiumPlan);
  const premiumStatus = normalizePremiumStatus(body.premiumStatus);
  return {
    ...buyer,
    premiumPlan,
    premiumStatus,
    billing: {
      ...buyer.billing,
      currency: "KES",
      monthlyPriceKes:
        body.monthlyPriceKes ??
        (premiumPlan === "GOLD_ADDON" ? 6000 : premiumPlan === "ENTERPRISE" ? 15000 : 0),
      nextBillingDate: body.nextBillingDate ?? buyer.billing?.nextBillingDate ?? null,
      lastPaymentAt: body.lastPaymentAt ?? buyer.billing?.lastPaymentAt ?? null,
      paymentStatus: body.paymentStatus ?? buyer.billing?.paymentStatus ?? "ACTIVE",
    },
    updatedAt: new Date().toISOString(),
  };
};
