import { Timestamp } from "firebase/firestore";

export type ListingEditStatus = "pending" | "approved" | "rejected";

export interface ListingEdit {
  id?: string;
  listingId: string;
  sellerId: string;
  patch: Record<string, unknown>;
  status: ListingEditStatus;
  submittedAt: Date | Timestamp;
  reviewAfterAt: Date | Timestamp;
  reviewedAt?: Date | Timestamp;
  reviewerId?: string;
  reason?: string;
}

export type CartCurrency = "KES" | "USD";

export interface CartItem {
  listingId: string;
  sellerId: string;
  sellerName?: string;
  title: string;
  imageUrl: string;
  unit: string;
  pricePerUnit: number;
  currency: CartCurrency;
  county: string;
  listingLat?: number | null;
  listingLng?: number | null;
  quantity: number;
  maxQuantity?: number;
}

export interface OrderItem {
  listingId: string;
  title: string;
  sellerId: string;
  imageUrl: string;
  unit: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
}

export interface BuyerProfile {
  fullName: string;
  phone: string;
  email?: string;
  county: string;
  town: string;
  addressLine: string;
  landmark?: string;
  latitude: number | null;
  longitude: number | null;
  updatedAt?: Date | Timestamp;
}

export type PaymentMethod = "pay_on_delivery" | "mpesa" | "airtel" | "card";

export type PaymentStatus = "pending" | "paid" | "cash_on_delivery";
