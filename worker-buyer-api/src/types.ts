export type Env = {
  ENV: string;
  FIREBASE_PROJECT_ID: string;
  FIREBASE_CLIENT_EMAIL: string;
  FIREBASE_PRIVATE_KEY: string;
  SUPERADMIN_EMAILS?: string;
  SUPERADMIN_UIDS?: string;
  CORS_ALLOW_ORIGINS?: string;
};

export type AuthClaims = {
  uid: string;
  email?: string;
  emailVerified?: boolean;
  claims: Record<string, unknown>;
};

export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";
export type BuyerTier = "BRONZE" | "SILVER" | "GOLD";
export type PremiumPlan = "NONE" | "GOLD_ADDON" | "ENTERPRISE";
export type PremiumStatus = "TRIAL" | "ACTIVE" | "EXPIRED" | "PAST_DUE" | "CANCELLED";
export type BillingPaymentStatus = "ACTIVE" | "PAST_DUE" | "CANCELLED";

export type BuyerMetrics = {
  successfulPurchasesCount: number;
  totalSpendKes: number;
  disputesCount: number;
};

export type BuyerRecord = {
  uid: string;
  type: "buyer";
  approvalStatus: ApprovalStatus;
  verifiedBuyer: boolean;
  buyerTier: BuyerTier;
  premiumPlan: PremiumPlan;
  premiumStatus: PremiumStatus;
  trialStartAt: string;
  trialEndAt: string;
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  metrics: BuyerMetrics;
  billing: {
    currency: "KES";
    monthlyPriceKes: number;
    nextBillingDate?: string | null;
    lastPaymentAt?: string | null;
    paymentStatus: BillingPaymentStatus;
  };
  buyerProfile?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type BuyerProfileCreateRequest = {
  displayName?: string;
  companyName?: string;
  buyerType?: "LOCAL" | "INTERNATIONAL";
  [k: string]: unknown;
};

export type PremiumUpgradeRequest = {
  premiumPlan?: PremiumPlan;
  notes?: string;
};

export type CommitPurchaseRequest = {
  amountKes: number;
  crop?: string;
  coopId?: string;
  orderId?: string;
  notes?: string;
  hasDispute?: boolean;
};

export type AdminSetTierRequest = {
  buyerTier: BuyerTier;
};

export type AdminSetPremiumRequest = {
  premiumPlan: PremiumPlan;
  premiumStatus: PremiumStatus;
  monthlyPriceKes?: number;
  nextBillingDate?: string;
  lastPaymentAt?: string;
  paymentStatus?: BillingPaymentStatus;
};

export type ApiSuccess<T> = { ok: true; data: T };
export type ApiError = { ok: false; code: string; error: string; details?: unknown };
