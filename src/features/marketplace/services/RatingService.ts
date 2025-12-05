/**
 * Rating Service - Enhanced with Real-time Aggregation
 * Handles ratings and reviews with live updates
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  runTransaction,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Rating } from "../models/types";

const RATINGS_COLLECTION = "ratings";
const RATINGS_AGG_COLLECTION = "ratings_agg";
const USERS_COLLECTION = "users";
const LISTINGS_COLLECTION = "listings";

const convertTimestamp = (timestamp: any): Date => {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  if (timestamp?.toDate) return timestamp.toDate();
  if (typeof timestamp === "string") return new Date(timestamp);
  return new Date();
};

/**
 * Create a rating for a listing or seller
 * Updates aggregated ratings in real-time
 */
export async function createRating(
  rating: Omit<Rating, "id" | "createdAt">
): Promise<string> {
  try {
    return await runTransaction(db, async (transaction) => {
      // Check if rating already exists
      const existingQuery = query(
        collection(db, RATINGS_COLLECTION),
        where("fromUserId", "==", rating.fromUserId),
        where("toUserId", "==", rating.toUserId)
      );
      
      if (rating.orderId) {
        // Check for order-specific rating
        const orderQuery = query(
          collection(db, RATINGS_COLLECTION),
          where("orderId", "==", rating.orderId),
          where("fromUserId", "==", rating.fromUserId)
        );
        const existingSnap = await getDocs(orderQuery);
        if (!existingSnap.empty) {
          throw new Error("Rating already exists for this order");
        }
      }

      // Validate rating value (1-5)
      if (rating.rating < 1 || rating.rating > 5) {
        throw new Error("Rating must be between 1 and 5");
      }

      // Create rating
      const ratingRef = doc(collection(db, RATINGS_COLLECTION));
      transaction.set(ratingRef, {
        ...rating,
        createdAt: Timestamp.now(),
      });

      // Update seller's aggregated rating
      const sellerRef = doc(db, USERS_COLLECTION, rating.toUserId);
      const sellerSnap = await transaction.get(sellerRef);

      if (sellerSnap.exists()) {
        const sellerData = sellerSnap.data();
        const currentRating = sellerData.ratingSummary || { avg: 0, count: 0 };
        const newCount = currentRating.count + 1;
        const newAvg =
          (currentRating.avg * currentRating.count + rating.rating) / newCount;

        transaction.update(sellerRef, {
          ratingSummary: {
            avg: Math.round(newAvg * 10) / 10, // Round to 1 decimal
            count: newCount,
          },
        });
      }

      // Update listing rating if listingId provided
      if (rating.orderId) {
        // Get order to find listingId
        const orderRef = doc(db, "orders", rating.orderId);
        const orderSnap = await transaction.get(orderRef);
        
        if (orderSnap.exists()) {
          const orderData = orderSnap.data();
          if (orderData.listingId) {
            const listingRef = doc(db, LISTINGS_COLLECTION, orderData.listingId);
            const listingSnap = await transaction.get(listingRef);
            
            if (listingSnap.exists()) {
              const listingData = listingSnap.data();
              const listingRating = listingData.ratingSummary || { avg: 0, count: 0 };
              const newListingCount = listingRating.count + 1;
              const newListingAvg =
                (listingRating.avg * listingRating.count + rating.rating) / newListingCount;

              transaction.update(listingRef, {
                ratingSummary: {
                  avg: Math.round(newListingAvg * 10) / 10,
                  count: newListingCount,
                },
              });
            }
          }
        }
      }

      return ratingRef.id;
    });
  } catch (error) {
    console.error("Error creating rating:", error);
    throw error;
  }
}

/**
 * Get ratings for a listing with real-time updates
 */
export function subscribeToListingRatings(
  listingId: string,
  callback: (ratings: Rating[]) => void
): () => void {
  try {
    const q = query(
      collection(db, RATINGS_COLLECTION),
      where("listingId", "==", listingId),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const ratings: Rating[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          ratings.push({
            id: doc.id,
            ...data,
            createdAt: convertTimestamp(data.createdAt),
          } as Rating);
        });
        callback(ratings);
      },
      (error) => {
        console.error("Error subscribing to listing ratings:", error);
        callback([]);
      }
    );
  } catch (error) {
    console.error("Error setting up rating subscription:", error);
    return () => {};
  }
}

/**
 * Get ratings for a seller with real-time updates
 */
export function subscribeToSellerRatings(
  sellerId: string,
  callback: (ratings: Rating[]) => void
): () => void {
  try {
    const q = query(
      collection(db, RATINGS_COLLECTION),
      where("toUserId", "==", sellerId),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const ratings: Rating[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          ratings.push({
            id: doc.id,
            ...data,
            createdAt: convertTimestamp(data.createdAt),
          } as Rating);
        });
        callback(ratings);
      },
      (error) => {
        console.error("Error subscribing to seller ratings:", error);
        callback([]);
      }
    );
  } catch (error) {
    console.error("Error setting up seller rating subscription:", error);
    return () => {};
  }
}

/**
 * Subscribe to seller's aggregated rating (real-time)
 */
export function subscribeToSellerRatingSummary(
  sellerId: string,
  callback: (summary: { avg: number; count: number }) => void
): () => void {
  try {
    const userRef = doc(db, USERS_COLLECTION, sellerId);

    return onSnapshot(
      userRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const summary = data.ratingSummary || { avg: 0, count: 0 };
          callback(summary);
        } else {
          callback({ avg: 0, count: 0 });
        }
      },
      (error) => {
        console.error("Error subscribing to rating summary:", error);
        callback({ avg: 0, count: 0 });
      }
    );
  } catch (error) {
    console.error("Error setting up rating summary subscription:", error);
    return () => {};
  }
}

/**
 * Get ratings for a user
 */
export async function getUserRatings(userId: string): Promise<Rating[]> {
  try {
    const q = query(
      collection(db, RATINGS_COLLECTION),
      where("toUserId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    const ratings: Rating[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      ratings.push({
        id: doc.id,
        ...data,
        createdAt: convertTimestamp(data.createdAt),
      } as Rating);
    });

    return ratings;
  } catch (error) {
    console.error("Error getting user ratings:", error);
    throw error;
  }
}

/**
 * Get rating for a specific order
 */
export async function getOrderRatings(orderId: string): Promise<Rating[]> {
  try {
    const q = query(
      collection(db, RATINGS_COLLECTION),
      where("orderId", "==", orderId),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    const ratings: Rating[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      ratings.push({
        id: doc.id,
        ...data,
        createdAt: convertTimestamp(data.createdAt),
      } as Rating);
    });

    return ratings;
  } catch (error) {
    console.error("Error getting order ratings:", error);
    throw error;
  }
}
