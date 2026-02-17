import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { assertBuyerApproved } from "@/services/buyerAuthorizationService";

export type ListingDoc = {
  id: string;
  orgId?: string;
  orgName?: string;
  commodity?: string;
  grade?: string;
  unit?: string;
  quantityAvailable?: number;
  minOrderQty?: number;
  priceType?: "fixed" | "negotiable";
  indicativePrice?: number;
  location?: { county?: string; subcounty?: string };
  deliveryOptions?: Array<"pickup" | "delivery">;
  verifiedOrg?: boolean;
  premiumOrg?: boolean;
  status?: "active" | "paused" | "sold";
  nextAvailableDate?: any;
  viewsCount?: number;
  bidsCount?: number;
  reliabilityScore?: number;
  updatedAt?: any;
};

export type BuyerBidStatus =
  | "draft"
  | "pending_deposit"
  | "submitted"
  | "accepted"
  | "rejected"
  | "expired"
  | "cancelled";

export type BuyerBidDoc = {
  id: string;
  buyerUid: string;
  orgId: string;
  listingId: string;
  commodity: string;
  qty: number;
  unitPrice: number;
  totalValue: number;
  depositPercent: number;
  depositAmount: number;
  platformFeeAmount: number;
  status: BuyerBidStatus;
  depositStatus: "unpaid" | "pending" | "paid" | "refunded";
  notes?: string;
  deliveryOption?: "pickup" | "delivery";
  deliveryWindow?: string;
  createdAt?: any;
  updatedAt?: any;
  expiresAt?: any;
};

export type ContractDoc = {
  id: string;
  bidId: string;
  buyerUid: string;
  orgId: string;
  commodity?: string;
  totalValue: number;
  depositPaid: number;
  balanceDue: number;
  deliveryStatus: "scheduled" | "in_transit" | "delivered" | "confirmed";
  createdAt?: any;
  updatedAt?: any;
};

export type WalletTxnDoc = {
  id: string;
  buyerUid: string;
  type: "deposit" | "refund" | "fee" | "balance";
  amount: number;
  status: "pending" | "completed" | "failed";
  method?: string;
  reference?: string;
  createdAt?: any;
};

const toDate = (value: any) => value?.toDate?.() ?? (value ? new Date(value) : null);

const mapDoc = <T extends DocumentData>(id: string, data: T) => ({ id, ...(data as any) });

export const BUYER_TRADE_ENABLED =
  String((import.meta as any).env?.VITE_ENABLE_BUYER_TRADE ?? "false").toLowerCase() === "true";

export async function listMarketplaceListings(filters?: {
  commodity?: string[];
  county?: string;
  grade?: string;
  verifiedOnly?: boolean;
  premiumOnly?: boolean;
  unit?: string;
  priceType?: "fixed" | "negotiable";
  minQty?: number;
  maxQty?: number;
  deliveryMethod?: "pickup" | "delivery" | "";
}) {
  const snap = await getDocs(collection(db, "marketplaceListings"));
  let rows = snap.docs.map((d) => mapDoc<ListingDoc>(d.id, d.data() as any));

  if (filters?.commodity?.length) {
    const set = new Set(filters.commodity.map((x) => x.toLowerCase()));
    rows = rows.filter((r) => set.has(String(r.commodity || "").toLowerCase()));
  }
  if (filters?.county) {
    rows = rows.filter((r) => String(r.location?.county || "").toLowerCase().includes(filters.county!.toLowerCase()));
  }
  if (filters?.grade) {
    rows = rows.filter((r) => String(r.grade || "").toUpperCase() === filters.grade!.toUpperCase());
  }
  if (filters?.verifiedOnly) {
    rows = rows.filter((r) => r.verifiedOrg === true);
  }
  if (filters?.premiumOnly) {
    rows = rows.filter((r) => r.premiumOrg === true);
  }
  if (filters?.unit) {
    rows = rows.filter((r) => String(r.unit || "").toLowerCase() === filters.unit!.toLowerCase());
  }
  if (filters?.priceType) {
    rows = rows.filter((r) => r.priceType === filters.priceType);
  }
  if (typeof filters?.minQty === "number") {
    rows = rows.filter((r) => Number(r.quantityAvailable || 0) >= filters.minQty!);
  }
  if (typeof filters?.maxQty === "number") {
    rows = rows.filter((r) => Number(r.quantityAvailable || 0) <= filters.maxQty!);
  }
  if (filters?.deliveryMethod) {
    rows = rows.filter((r) => (r.deliveryOptions || []).includes(filters.deliveryMethod as any));
  }
  return rows;
}

export async function getMarketplaceListingById(listingId: string) {
  const snap = await getDoc(doc(db, "marketplaceListings", listingId));
  if (!snap.exists()) return null;
  return mapDoc<ListingDoc>(snap.id, snap.data() as any);
}

export async function createBuyerBid(input: Omit<BuyerBidDoc, "id" | "createdAt" | "updatedAt">) {
  await assertBuyerApproved();
  const ref = await addDoc(collection(db, "buyerBids"), {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function listBuyerBids(buyerUid: string) {
  const snap = await getDocs(query(collection(db, "buyerBids"), where("buyerUid", "==", buyerUid)));
  return snap.docs
    .map((d) => mapDoc<BuyerBidDoc>(d.id, d.data() as any))
    .sort((a, b) => (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0));
}

export async function setBuyerBidStatus(bidId: string, buyerUid: string, patch: Partial<BuyerBidDoc>) {
  const ref = doc(db, "buyerBids", bidId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Bid not found.");
  const data = snap.data() as BuyerBidDoc;
  if (data.buyerUid !== buyerUid) throw new Error("Not allowed.");
  await updateDoc(ref, { ...patch, updatedAt: serverTimestamp() } as any);
}

export async function listBuyerContracts(buyerUid: string) {
  const snap = await getDocs(query(collection(db, "tradeContracts"), where("buyerUid", "==", buyerUid)));
  return snap.docs
    .map((d) => mapDoc<ContractDoc>(d.id, d.data() as any))
    .sort((a, b) => (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0));
}

export async function listBuyerWalletTransactions(buyerUid: string) {
  const q = query(collection(db, "buyerWalletTransactions"), where("buyerUid", "==", buyerUid));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => mapDoc<WalletTxnDoc>(d.id, d.data() as any))
    .sort((a, b) => (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0));
}

export async function setBuyerContractDeliveryStatus(
  contractId: string,
  buyerUid: string,
  status: ContractDoc["deliveryStatus"]
) {
  await assertBuyerApproved();
  const ref = doc(db, "tradeContracts", contractId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Contract not found.");
  const data = snap.data() as ContractDoc;
  if (data.buyerUid !== buyerUid) throw new Error("Not allowed.");
  await updateDoc(ref, { deliveryStatus: status, updatedAt: serverTimestamp() });
}

export async function createBuyerBuyRequest(input: {
  buyerUid: string;
  commodity: string;
  qty: number;
  targetPriceRange: string;
  county: string;
  deliveryPreference: "pickup" | "delivery";
}) {
  await assertBuyerApproved();
  const ref = await addDoc(collection(db, "buyerBuyRequests"), {
    ...input,
    status: "open",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}
