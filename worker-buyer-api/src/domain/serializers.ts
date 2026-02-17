import type { BuyerRecord } from "../types";
import { isTrialExpired, trialDaysLeft } from "./buyerRules";

export const serializeBuyerMe = (buyer: BuyerRecord) => {
  const trialExpired = isTrialExpired(buyer);
  const effectivePremiumStatus =
    trialExpired && buyer.premiumPlan === "NONE" && buyer.premiumStatus === "TRIAL"
      ? "EXPIRED"
      : buyer.premiumStatus;

  const profile = (buyer.buyerProfile || {}) as Record<string, unknown>;
  const preferences = (profile.preferences || {}) as Record<string, unknown>;
  const company = (profile.company || {}) as Record<string, unknown>;

  return {
    uid: buyer.uid,
    isBuyer: buyer.type === "buyer",
    displayName: (profile.displayName as string) || (profile.fullName as string) || "Buyer Account",
    companyName: (profile.companyName as string) || (company.companyName as string) || "Buyer",
    buyerType:
      String(profile.buyerType || profile.buyerRegistrationType || "LOCAL").toUpperCase() === "INTERNATIONAL"
        ? "INTERNATIONAL"
        : "LOCAL",
    approvalStatus: buyer.approvalStatus,
    verifiedBuyer: buyer.verifiedBuyer,
    buyerTier: buyer.buyerTier,
    premiumPlan: buyer.premiumPlan,
    premiumStatus: effectivePremiumStatus,
    trialStartAt: buyer.trialStartAt,
    trialEndAt: buyer.trialEndAt,
    trialDaysLeft: trialDaysLeft(buyer),
    metrics: buyer.metrics,
    billing: buyer.billing,
    verification: {
      verifiedBy: buyer.approvedBy ?? null,
      verifiedAt: buyer.approvedAt ?? null,
      verificationNotes: buyer.rejectionReason ?? null,
    },
    preferences: {
      ...(preferences || {}),
      crops: Array.isArray(preferences.crops) ? preferences.crops : [],
      preferredMarkets: Array.isArray(preferences.preferredMarkets) ? preferences.preferredMarkets : [],
      preferredRegions: Array.isArray(preferences.preferredRegions) ? preferences.preferredRegions : [],
    },
    company: {
      ...(company || {}),
      companyName: (profile.companyName as string) || (company.companyName as string) || "Buyer",
      country: company.country ?? null,
      cityOrRegion: company.cityOrRegion ?? null,
      address: company.address ?? null,
      phone: company.phone ?? null,
      whatsapp: company.whatsapp ?? null,
      email: company.email ?? null,
      website: company.website ?? null,
      destinations: Array.isArray(company.destinations) ? company.destinations : [],
    },
    activity: {
      recentOrders: [],
      recentBids: [],
      recentMessages: [],
      recentContractUpdates: [],
    },
    alerts: [],
    suppliers: [],
    orders: [],
    contracts: [],
    messages: [],
    recommendedLots: [],
    invoices: [],
    transactions: [],
    usageFees: [],
    paymentMethods: [],
    teamBilling: {
      seatCount: 1,
      canManageSeats: false,
    },
    premiumEntitlements: {
      canContactReveal: buyer.approvalStatus === "APPROVED" && ["ACTIVE", "TRIAL"].includes(effectivePremiumStatus),
      canUseAdvancedIntelligence:
        buyer.approvalStatus === "APPROVED" && ["ACTIVE", "TRIAL"].includes(effectivePremiumStatus),
      canUseBulkContracts: buyer.approvalStatus === "APPROVED" && ["ACTIVE", "TRIAL"].includes(effectivePremiumStatus),
      canCommitActions: buyer.approvalStatus === "APPROVED",
    },
    approvedBy: buyer.approvedBy ?? null,
    approvedAt: buyer.approvedAt ?? null,
    rejectionReason: buyer.rejectionReason ?? null,
    buyerProfile: buyer.buyerProfile ?? {},
    createdAt: buyer.createdAt,
    updatedAt: buyer.updatedAt,
  };
};
