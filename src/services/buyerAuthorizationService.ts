import { getBuyerMe } from "@/services/buyerAccountService";

type BuyerApprovalCache = {
  fetchedAt: number;
  approvalStatus: string;
};

let approvalCache: BuyerApprovalCache | null = null;
const CACHE_MS = 60_000;

export async function assertBuyerApproved(): Promise<void> {
  const now = Date.now();
  if (approvalCache && now - approvalCache.fetchedAt < CACHE_MS) {
    if (approvalCache.approvalStatus === "APPROVED") return;
    throw new Error("Buyer verification pending. Please wait for approval.");
  }

  const me = await getBuyerMe();
  const approvalStatus = String(me.approvalStatus || "PENDING").toUpperCase();
  approvalCache = { fetchedAt: now, approvalStatus };

  if (approvalStatus !== "APPROVED") {
    throw new Error("Buyer verification pending. Please wait for approval.");
  }
}

export function clearBuyerApprovalCache() {
  approvalCache = null;
}
