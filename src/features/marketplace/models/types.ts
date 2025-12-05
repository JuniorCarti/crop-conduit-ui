/**
 * Marketplace Data Models
 * TypeScript interfaces for all Marketplace entities
 */

import { Timestamp } from "firebase/firestore";

// ============================================================================
// USER & PROFILE
// ============================================================================

export type UserRole = "farmer" | "buyer" | "supplier" | "admin";

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  phone?: string;
  role: UserRole;
  rating?: {
    average: number; // 1-5
    count: number;
  };
  verified?: boolean;
  location?: {
    lat: number;
    lng: number;
    county: string;
    address?: string;
  };
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

// ============================================================================
// LISTINGS
// ============================================================================

export type ListingStatus = "active" | "paused" | "sold" | "expired";

export interface Listing {
  id?: string;
  title: string;
  cropType: string;
  variety?: string;
  quantity: number;
  unit: "kg" | "tons" | "bags" | "crates" | "pieces";
  pricePerUnit: number;
  currency: "KES" | "USD";
  location: {
    lat: number;
    lng: number;
    county: string;
    address?: string;
  };
  images: string[]; // Supabase Storage URLs
  sellerId: string;
  sellerName?: string;
  description?: string;
  tags?: string[];
  availability?: {
    startDate: Date | Timestamp;
    endDate: Date | Timestamp;
  };
  status: ListingStatus;
  metadata?: {
    harvestDate?: Date | Timestamp;
    quality?: string;
    organic?: boolean;
    [key: string]: any;
  };
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export interface ListingFilters {
  cropType?: string;
  variety?: string;
  minPrice?: number;
  maxPrice?: number;
  location?: {
    lat: number;
    lng: number;
    radiusKm?: number;
  };
  minRating?: number;
  sellerId?: string;
  tags?: string[];
}

export type ListingSortBy = "nearest" | "price_low" | "price_high" | "rating" | "newest";

// ============================================================================
// ORDERS
// ============================================================================

export type OrderStatus =
  | "pending_payment"
  | "paid_in_escrow"
  | "shipped"
  | "delivered"
  | "completed"
  | "cancelled"
  | "dispute";

export interface Order {
  id?: string;
  listingId: string;
  listingSnapshot?: Listing; // Snapshot at time of order
  buyerId: string;
  buyerName?: string;
  sellerId: string;
  sellerName?: string;
  quantityOrdered: number;
  pricePerUnit: number;
  priceTotal: number;
  currency: "KES" | "USD";
  status: OrderStatus;
  shippingInfo?: {
    address: string;
    county: string;
    phone: string;
    notes?: string;
  };
  paymentRef?: string; // M-Pesa transaction reference
  transactionId?: string; // Reference to transactions collection
  receiptUrl?: string; // PDF receipt URL
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  shippedAt?: Date | Timestamp;
  deliveredAt?: Date | Timestamp;
  completedAt?: Date | Timestamp;
}

// ============================================================================
// TRANSACTIONS (PAYMENTS)
// ============================================================================

export type PaymentMethod = "mpesa" | "bank_transfer" | "cash";

export type TransactionStatus = "pending" | "completed" | "failed" | "cancelled" | "refunded";

export interface Transaction {
  id?: string;
  orderId: string;
  amount: number;
  currency: "KES" | "USD";
  method: PaymentMethod;
  status: TransactionStatus;
  mpesaCallback?: {
    MerchantRequestID?: string;
    CheckoutRequestID?: string;
    ResultCode?: number;
    ResultDesc?: string;
    MpesaReceiptNumber?: string;
    TransactionDate?: string;
    PhoneNumber?: string;
  };
  refundAmount?: number;
  refundReason?: string;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

// ============================================================================
// MESSAGES & CHAT
// ============================================================================

export interface Chat {
  id: string; // Format: `${userId1}_${userId2}` sorted
  participants: string[]; // User IDs
  listingId?: string; // If chat is about a listing
  orderId?: string; // If chat is about an order
  lastMessage?: {
    text: string;
    senderId: string;
    createdAt: Date | Timestamp;
  };
  unreadCount?: Record<string, number>; // userId -> count
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export interface ChatMessage {
  id?: string;
  chatId: string;
  senderId: string;
  receiverIds: string[]; // Can be multiple in group chats
  text: string;
  attachments?: {
    url: string; // Supabase URL
    type: "image" | "document";
    name: string;
  }[];
  offer?: {
    price: number;
    quantity: number;
    expiresAt?: Date | Timestamp;
    status: "pending" | "accepted" | "declined" | "expired";
  };
  readBy?: Record<string, Date | Timestamp>; // userId -> timestamp
  createdAt: Date | Timestamp;
}

// ============================================================================
// RATINGS & REVIEWS
// ============================================================================

export interface Rating {
  id?: string;
  orderId: string;
  fromUserId: string;
  fromUserName?: string;
  toUserId: string;
  toUserName?: string;
  rating: number; // 1-5
  comment?: string;
  createdAt: Date | Timestamp;
}

// ============================================================================
// DISPUTES
// ============================================================================

export type DisputeStatus = "open" | "under_review" | "resolved" | "closed";

export interface Dispute {
  id?: string;
  orderId: string;
  raisedBy: string; // User ID
  raisedByName?: string;
  reason: string;
  description: string;
  evidence: {
    url: string; // Supabase URL
    type: "image" | "document";
    name: string;
  }[];
  status: DisputeStatus;
  adminNotes?: string;
  resolution?: {
    action: "refund_full" | "refund_partial" | "release" | "reject";
    amount?: number;
    notes: string;
    resolvedBy: string;
    resolvedAt: Date | Timestamp;
  };
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export type NotificationType =
  | "new_order"
  | "payment_received"
  | "order_shipped"
  | "order_delivered"
  | "order_completed"
  | "new_message"
  | "offer_received"
  | "offer_accepted"
  | "dispute_opened"
  | "dispute_resolved";

export interface Notification {
  id?: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: {
    orderId?: string;
    listingId?: string;
    chatId?: string;
    disputeId?: string;
    [key: string]: any;
  };
  read: boolean;
  createdAt: Date | Timestamp;
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface MpesaSTKPushRequest {
  orderId: string;
  phone: string; // Format: 254712345678
  amount: number;
}

export interface MpesaSTKPushResponse {
  success: boolean;
  MerchantRequestID?: string;
  CheckoutRequestID?: string;
  ResponseCode?: string;
  ResponseDescription?: string;
  CustomerMessage?: string;
  error?: string;
}

export interface MpesaCallbackPayload {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{
          Name: string;
          Value: string | number;
        }>;
      };
    };
  };
}
