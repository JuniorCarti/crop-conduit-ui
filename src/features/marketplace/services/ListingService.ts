/**
 * Listing Service
 * Handles listing creation, updates, search, and filtering
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Listing, ListingFilters, ListingSortBy } from "../models/types";
import { uploadImage } from "./StorageService";

const LISTINGS_COLLECTION = "listings";

/**
 * Convert Firestore timestamp to Date
 */
const convertTimestamp = (timestamp: any): Date => {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  if (timestamp?.toDate) return timestamp.toDate();
  if (typeof timestamp === "string") return new Date(timestamp);
  return new Date();
};

/**
 * Create a new listing
 */
export async function createListing(
  listing: Omit<Listing, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  try {
    const cleanData: any = {
      ...listing,
      images: listing.images || [],
      tags: listing.tags || [],
      status: listing.status || "active",
      availability: listing.availability
        ? {
            startDate:
              listing.availability.startDate instanceof Date
                ? Timestamp.fromDate(listing.availability.startDate)
                : listing.availability.startDate,
            endDate:
              listing.availability.endDate instanceof Date
                ? Timestamp.fromDate(listing.availability.endDate)
                : listing.availability.endDate,
          }
        : undefined,
      metadata: listing.metadata || {},
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, LISTINGS_COLLECTION), cleanData);
    return docRef.id;
  } catch (error) {
    console.error("Error creating listing:", error);
    throw error;
  }
}

/**
 * Update an existing listing
 */
export async function updateListing(
  id: string,
  updates: Partial<Listing>
): Promise<void> {
  try {
    const docRef = doc(db, LISTINGS_COLLECTION, id);
    const cleanUpdates: any = { ...updates };

    if (updates.availability) {
      cleanUpdates.availability = {
        startDate:
          updates.availability.startDate instanceof Date
            ? Timestamp.fromDate(updates.availability.startDate)
            : updates.availability.startDate,
        endDate:
          updates.availability.endDate instanceof Date
            ? Timestamp.fromDate(updates.availability.endDate)
            : updates.availability.endDate,
      };
    }

    await updateDoc(docRef, {
      ...cleanUpdates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error updating listing:", error);
    throw error;
  }
}

/**
 * Delete a listing
 */
export async function deleteListing(id: string): Promise<void> {
  try {
    const docRef = doc(db, LISTINGS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting listing:", error);
    throw error;
  }
}

/**
 * Get a single listing by ID
 */
export async function getListing(id: string): Promise<Listing | null> {
  try {
    const docRef = doc(db, LISTINGS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
        availability: data.availability
          ? {
              startDate: convertTimestamp(data.availability.startDate),
              endDate: convertTimestamp(data.availability.endDate),
            }
          : undefined,
      } as Listing;
    }
    return null;
  } catch (error) {
    console.error("Error getting listing:", error);
    throw error;
  }
}

/**
 * Search and filter listings
 */
export async function searchListings(
  filters: ListingFilters = {},
  sortBy: ListingSortBy = "newest",
  pageSize: number = 20,
  lastDoc?: QueryDocumentSnapshot<DocumentData>
): Promise<{ listings: Listing[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null }> {
  try {
    let q = query(collection(db, LISTINGS_COLLECTION));

    // Apply filters
    if (filters.cropType) {
      q = query(q, where("cropType", "==", filters.cropType));
    }
    if (filters.variety) {
      q = query(q, where("variety", "==", filters.variety));
    }
    if (filters.minPrice !== undefined) {
      q = query(q, where("pricePerUnit", ">=", filters.minPrice));
    }
    if (filters.maxPrice !== undefined) {
      q = query(q, where("pricePerUnit", "<=", filters.maxPrice));
    }
    if (filters.sellerId) {
      q = query(q, where("sellerId", "==", filters.sellerId));
    }
    if (filters.tags && filters.tags.length > 0) {
      q = query(q, where("tags", "array-contains-any", filters.tags));
    }

    // Status filter (only active by default)
    q = query(q, where("status", "==", "active"));

    // Apply sorting
    switch (sortBy) {
      case "price_low":
        q = query(q, orderBy("pricePerUnit", "asc"));
        break;
      case "price_high":
        q = query(q, orderBy("pricePerUnit", "desc"));
        break;
      case "newest":
        q = query(q, orderBy("createdAt", "desc"));
        break;
      case "rating":
        // Note: Rating sorting requires denormalized rating field or separate query
        q = query(q, orderBy("createdAt", "desc"));
        break;
      case "nearest":
        // Note: Location-based sorting requires geohash or separate calculation
        q = query(q, orderBy("createdAt", "desc"));
        break;
    }

    // Pagination
    q = query(q, limit(pageSize));
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const snapshot = await getDocs(q);
    const listings: Listing[] = [];
    let newLastDoc: QueryDocumentSnapshot<DocumentData> | null = null;

    snapshot.forEach((doc) => {
      const data = doc.data();
      listings.push({
        id: doc.id,
        ...data,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
        availability: data.availability
          ? {
            startDate: convertTimestamp(data.availability.startDate),
            endDate: convertTimestamp(data.availability.endDate),
          }
          : undefined,
      } as Listing);
      newLastDoc = doc;
    });

    // Apply location filter if provided (client-side for now)
    let filteredListings = listings;
    if (filters.location) {
      filteredListings = listings.filter((listing) => {
        const distance = calculateDistance(
          filters.location!.lat,
          filters.location!.lng,
          listing.location.lat,
          listing.location.lng
        );
        return distance <= (filters.location!.radiusKm || 50); // Default 50km
      });
    }

    return { listings: filteredListings, lastDoc: newLastDoc };
  } catch (error) {
    console.error("Error searching listings:", error);
    throw error;
  }
}

/**
 * Subscribe to listings with real-time updates
 */
export function subscribeToListings(
  filters: ListingFilters = {},
  callback: (listings: Listing[]) => void
): () => void {
  try {
    let q = query(collection(db, LISTINGS_COLLECTION));

    if (filters.cropType) {
      q = query(q, where("cropType", "==", filters.cropType));
    }
    if (filters.sellerId) {
      q = query(q, where("sellerId", "==", filters.sellerId));
    }
    q = query(q, where("status", "==", "active"));
    q = query(q, orderBy("createdAt", "desc"));

    return onSnapshot(
      q,
      (snapshot) => {
        const listings: Listing[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          listings.push({
            id: doc.id,
            ...data,
            createdAt: convertTimestamp(data.createdAt),
            updatedAt: convertTimestamp(data.updatedAt),
            availability: data.availability
              ? {
                  startDate: convertTimestamp(data.availability.startDate),
                  endDate: convertTimestamp(data.availability.endDate),
                }
              : undefined,
          } as Listing);
        });
        callback(listings);
      },
      (error) => {
        console.error("Error subscribing to listings:", error);
        callback([]);
      }
    );
  } catch (error) {
    console.error("Error setting up listing subscription:", error);
    return () => {}; // Return no-op unsubscribe
  }
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 * Returns distance in kilometers
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
