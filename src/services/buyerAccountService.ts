import { auth } from "@/lib/firebase";

export type BuyerApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "NEEDS_MORE_INFO";
export type BuyerTier = "BRONZE" | "SILVER" | "GOLD";
export type PremiumPlan = "NONE" | "GOLD_ADDON" | "ENTERPRISE";
export type PremiumStatus = "TRIAL" | "ACTIVE" | "EXPIRED" | "PAST_DUE" | "CANCELLED";

export interface BuyerMePayload {
  uid: string;
  displayName?: string;
  email?: string | null;
  phone?: string | null;
  companyName?: string;
  buyerType: "LOCAL" | "INTERNATIONAL";
  approvalStatus: BuyerApprovalStatus;
  verifiedBuyer: boolean;
  buyerTier: BuyerTier;
  premiumPlan: PremiumPlan;
  premiumStatus: PremiumStatus;
  trialStartAt?: string | null;
  trialEndAt?: string | null;
  trialRemainingDays: number;
  trialDays: number;
  verification?: {
    verifiedAt?: string | null;
    verifiedBy?: string | null;
    verificationNotes?: string | null;
  };
  metrics: Record<string, number>;
  billing: {
    currency: "KES";
    monthlyPriceKes: number;
    nextBillingDate?: string | null;
    lastPaymentAt?: string | null;
    paymentStatus: "ACTIVE" | "PAST_DUE" | "CANCELLED";
  };
  preferences?: Record<string, unknown>;
  company?: Record<string, unknown>;
  activity?: Record<string, unknown>;
  alerts?: any[];
  suppliers?: any[];
  orders?: any[];
  contracts?: any[];
  messages?: any[];
  recommendedLots?: any[];
  invoices?: any[];
  transactions?: any[];
  usageFees?: any[];
  paymentMethods?: any[];
  teamBilling?: { seatCount?: number; canManageSeats?: boolean };
  premiumEntitlements?: Record<string, boolean>;
}

const resolveBaseUrl = () => {
  const buyerApi = import.meta.env.VITE_BUYER_API_BASE_URL as string | undefined;
  const base =
    buyerApi ||
    (import.meta.env.VITE_COMMUNITY_API_BASE_URL as string | undefined) ||
    (import.meta.env.VITE_ASHA_API_BASE_URL as string | undefined);
  if (!base) {
    throw new Error("Backend API URL is not configured.");
  }
  return base.replace(/\/$/, "");
};

const getAuthHeaders = async (extra?: Record<string, string>) => {
  const token = await auth.currentUser?.getIdToken();
  if (!token) {
    throw new Error("Authentication required.");
  }
  return {
    Authorization: `Bearer ${token}`,
    ...(extra || {}),
  };
};

const parseJson = async (response: Response) => {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { ok: false, error: text || "Unexpected response" };
  }
};

const requestJson = async (path: string, options: RequestInit = {}) => {
  const response = await fetch(`${resolveBaseUrl()}${path}`, {
    ...options,
    headers: await getAuthHeaders({
      ...(options.headers as Record<string, string> | undefined),
      "Content-Type": "application/json",
    }),
  });
  const data = await parseJson(response);
  if (!response.ok || data?.ok === false) {
    throw new Error(data?.error || data?.message || `Request failed (${response.status})`);
  }
  return data;
};

export async function getBuyerMe(): Promise<BuyerMePayload> {
  const data = await requestJson("/buyers/me", { method: "GET" });
  const payload = data?.buyer ?? data?.data ?? data;
  if (payload?.isBuyer === false) {
    throw new Error("Authenticated account is not a buyer profile.");
  }
  return payload as BuyerMePayload;
}

export async function createBuyerProfile(payload: Record<string, unknown>) {
  return requestJson("/buyers/createProfile", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function requestPremiumUpgrade(payload: { premiumPlan: PremiumPlan; notes?: string }) {
  return requestJson("/buyers/requestPremiumUpgrade", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function recordPurchaseCompleted(payload: { amountKes: number; hasDispute?: boolean }) {
  try {
    return await requestJson("/buyers/commitPurchase", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (error: any) {
    const message = String(error?.message || "");
    if (message.includes("404") || message.toLowerCase().includes("not found")) {
      return requestJson("/buyers/recordPurchaseCompleted", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }
    throw error;
  }
}

export async function adminListBuyers(status?: BuyerApprovalStatus) {
  const search = status ? `?status=${encodeURIComponent(status)}` : "";
  return requestJson(`/admin/buyers${search}`, { method: "GET" });
}

export async function adminApproveBuyer(uid: string, notes?: string) {
  return requestJson(`/admin/buyers/${encodeURIComponent(uid)}/approve`, {
    method: "POST",
    body: JSON.stringify({ notes }),
  });
}

export async function adminRejectBuyer(uid: string, notes?: string) {
  return requestJson(`/admin/buyers/${encodeURIComponent(uid)}/reject`, {
    method: "POST",
    body: JSON.stringify({ notes }),
  });
}

export async function adminSetBuyerTier(uid: string, buyerTier: BuyerTier) {
  return requestJson(`/admin/buyers/${encodeURIComponent(uid)}/setTier`, {
    method: "POST",
    body: JSON.stringify({ buyerTier }),
  });
}

export async function adminSetBuyerPremium(
  uid: string,
  payload: {
    premiumPlan: PremiumPlan;
    premiumStatus: PremiumStatus;
    monthlyPriceKes?: number;
    nextBillingDate?: string;
    lastPaymentAt?: string;
    paymentStatus?: "ACTIVE" | "PAST_DUE" | "CANCELLED";
  }
) {
  return requestJson(`/admin/buyers/${encodeURIComponent(uid)}/setPremium`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
