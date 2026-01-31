import type { DocumentData, QueryDocumentSnapshot, Timestamp } from "firebase/firestore";

export interface Review {
  id: string; // buyerId (docId)
  listingId: string;
  sellerId: string;
  buyerId: string;
  buyerName: string;
  rating: number; // 1..5
  comment: string;
  createdAt: Date | Timestamp;
}

export interface ReviewPage {
  reviews: Review[];
  cursor: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

export interface ReviewEligibility {
  eligible: boolean;
  hasDeliveredOrder: boolean;
  hasReview: boolean;
}
