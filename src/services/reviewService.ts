import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  startAfter,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Listing } from "@/features/marketplace/models/types";
import type { Review, ReviewPage } from "@/types/review";

const LISTINGS_COLLECTION = "listings";
const ORDERS_COLLECTION = "orders";
const REVIEWS_SUBCOLLECTION = "reviews";

const REVIEWS_PAGE_SIZE = 10;

function toDate(value: unknown): Date {
  if (!value) return new Date(0);
  if (value instanceof Date) return value;
  if (typeof value === "object" && value && "toDate" in value) {
    try {
      return (value as Timestamp).toDate();
    } catch {
      return new Date(0);
    }
  }
  const parsed = new Date(value as string | number);
  return Number.isNaN(parsed.getTime()) ? new Date(0) : parsed;
}

function mapReviewSnap(snap: QueryDocumentSnapshot<DocumentData>): Review {
  const data = snap.data() as Omit<Review, "id"> & { createdAt?: unknown };
  return {
    ...data,
    id: snap.id,
    comment: typeof data.comment === "string" ? data.comment : "",
    createdAt: toDate(data.createdAt),
  } as Review;
}

export async function getListingReviews(
  listingId: string,
  pageSize: number = REVIEWS_PAGE_SIZE,
  cursor: QueryDocumentSnapshot<DocumentData> | null = null
): Promise<ReviewPage> {
  const reviewsRef = collection(db, LISTINGS_COLLECTION, listingId, REVIEWS_SUBCOLLECTION);
  const baseQuery = query(reviewsRef, orderBy("createdAt", "desc"), limit(pageSize));
  const reviewsQuery = cursor ? query(reviewsRef, orderBy("createdAt", "desc"), startAfter(cursor), limit(pageSize)) : baseQuery;

  const snapshot = await getDocs(reviewsQuery);
  const reviews = snapshot.docs.map(mapReviewSnap);
  const nextCursor = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
  const hasMore = snapshot.docs.length === pageSize;

  return {
    reviews,
    cursor: nextCursor,
    hasMore,
  };
}

export async function getMyReview(listingId: string, buyerId: string): Promise<Review | null> {
  const reviewRef = doc(db, LISTINGS_COLLECTION, listingId, REVIEWS_SUBCOLLECTION, buyerId);
  const snap = await getDoc(reviewRef);
  if (!snap.exists()) return null;
  const data = snap.data() as Omit<Review, "id"> & { createdAt?: unknown };
  return {
    ...data,
    id: snap.id,
    comment: typeof data.comment === "string" ? data.comment : "",
    createdAt: toDate(data.createdAt),
  } as Review;
}

export async function hasDeliveredOrder(listingId: string, buyerId: string): Promise<boolean> {
  const ordersRef = collection(db, ORDERS_COLLECTION);
  const deliveredOrdersQuery = query(
    ordersRef,
    where("buyerId", "==", buyerId),
    where("listingId", "==", listingId),
    where("status", "==", "Delivered"),
    limit(1)
  );
  const snapshot = await getDocs(deliveredOrdersQuery);
  return !snapshot.empty;
}

function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

export async function submitReview(
  listing: Listing,
  buyer: { id: string; name: string },
  rating: number,
  comment: string
): Promise<void> {
  const listingId = listing.id;
  if (!listingId) {
    throw new Error("Listing is missing an id.");
  }

  const listingRef = doc(db, LISTINGS_COLLECTION, listingId);
  const reviewRef = doc(db, LISTINGS_COLLECTION, listingId, REVIEWS_SUBCOLLECTION, buyer.id);

  await runTransaction(db, async (transaction) => {
    const [listingSnap, reviewSnap] = await Promise.all([
      transaction.get(listingRef),
      transaction.get(reviewRef),
    ]);

    if (!listingSnap.exists()) {
      throw new Error("Listing not found.");
    }

    if (reviewSnap.exists()) {
      throw new Error("You already reviewed this listing.");
    }

    const listingData = listingSnap.data() as Listing & {
      avgRating?: unknown;
      reviewCount?: unknown;
    };

    const currentAvg = typeof listingData.avgRating === "number" ? listingData.avgRating : 0;
    const currentCount = typeof listingData.reviewCount === "number" ? listingData.reviewCount : 0;
    const newCount = currentCount + 1;
    const newAvg = roundToTwoDecimals((currentAvg * currentCount + rating) / newCount);
    const snippet = comment.trim().slice(0, 80);

    transaction.set(reviewRef, {
      listingId,
      sellerId: listing.sellerId,
      buyerId: buyer.id,
      buyerName: buyer.name,
      rating,
      comment: comment.trim(),
      createdAt: serverTimestamp(),
    });

    transaction.update(listingRef, {
      avgRating: newAvg,
      reviewCount: newCount,
      latestReviewSnippet: snippet,
      latestReviewAt: serverTimestamp(),
    });
  });
}

