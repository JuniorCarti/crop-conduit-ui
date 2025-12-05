/**
 * Geolocation Service
 * Handles geohash encoding and proximity queries for farmers
 */

import {
  collection,
  query,
  where,
  getDocs,
  limit,
  onSnapshot,
  doc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserProfile } from "../models/types";

const USERS_COLLECTION = "users";

/**
 * Encode latitude and longitude to geohash
 * Simplified geohash implementation (for production, use geohash library)
 */
export function encodeGeohash(lat: number, lng: number, precision: number = 9): string {
  const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";
  let bits = 0;
  let even = true;
  let geohash = "";

  let latMin = -90.0;
  let latMax = 90.0;
  let lngMin = -180.0;
  let lngMax = 180.0;

  while (geohash.length < precision) {
    if (even) {
      const lngMid = (lngMin + lngMax) / 2;
      if (lng >= lngMid) {
        bits = bits * 2 + 1;
        lngMin = lngMid;
      } else {
        bits = bits * 2;
        lngMax = lngMid;
      }
    } else {
      const latMid = (latMin + latMax) / 2;
      if (lat >= latMid) {
        bits = bits * 2 + 1;
        latMin = latMid;
      } else {
        bits = bits * 2;
        latMax = latMid;
      }
    }
    even = !even;

    if (bits >= 32) {
      geohash += BASE32[bits];
      bits = 0;
    }
  }

  return geohash;
}

/**
 * Get neighboring geohashes for a given geohash
 * Used for proximity searches
 */
export function getNeighbors(geohash: string): string[] {
  const neighbors: string[] = [];
  const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";
  
  // Get adjacent geohashes (simplified - for production use proper geohash library)
  const centerIndex = BASE32.indexOf(geohash[geohash.length - 1]);
  
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      if (i === 0 && j === 0) continue;
      const newIndex = centerIndex + i + j * 5;
      if (newIndex >= 0 && newIndex < BASE32.length) {
        neighbors.push(geohash.slice(0, -1) + BASE32[newIndex]);
      }
    }
  }
  
  return neighbors;
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 * Returns distance in kilometers
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

/**
 * Find farmers within radius (using geohash or direct distance calculation)
 */
export async function findFarmersInRadius(
  centerLat: number,
  centerLng: number,
  radiusKm: number,
  maxResults: number = 50
): Promise<{ farmers: UserProfile[]; count: number }> {
  try {
    // Get all users with farmer role
    const q = query(
      collection(db, USERS_COLLECTION),
      where("role", "==", "farmer"),
      limit(1000) // Firestore limit, then filter client-side
    );

    const snapshot = await getDocs(q);
    const farmers: Array<UserProfile & { distance: number }> = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.location && data.location.lat && data.location.lng) {
        const distance = calculateDistance(
          centerLat,
          centerLng,
          data.location.lat,
          data.location.lng
        );

        if (distance <= radiusKm) {
          farmers.push({
            uid: doc.id,
            ...data,
            location: data.location,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            distance,
          } as UserProfile & { distance: number });
        }
      }
    });

    // Sort by distance
    farmers.sort((a, b) => a.distance - b.distance);

    // Limit results
    const limitedFarmers = farmers.slice(0, maxResults);

    return {
      farmers: limitedFarmers.map(({ distance, ...farmer }) => farmer),
      count: farmers.length,
    };
  } catch (error) {
    console.error("Error finding farmers in radius:", error);
    throw error;
  }
}

/**
 * Subscribe to farmers in radius with real-time updates
 */
export function subscribeToFarmersInRadius(
  centerLat: number,
  centerLng: number,
  radiusKm: number,
  callback: (farmers: UserProfile[], count: number) => void
): () => void {
  try {
    const q = query(
      collection(db, USERS_COLLECTION),
      where("role", "==", "farmer"),
      limit(1000)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const farmers: Array<UserProfile & { distance: number }> = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.location && data.location.lat && data.location.lng) {
            const distance = calculateDistance(
              centerLat,
              centerLng,
              data.location.lat,
              data.location.lng
            );

            if (distance <= radiusKm) {
              farmers.push({
                uid: doc.id,
                ...data,
                location: data.location,
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),
                distance,
              } as UserProfile & { distance: number });
            }
          }
        });

        farmers.sort((a, b) => a.distance - b.distance);
        const result = farmers.map(({ distance, ...farmer }) => farmer);

        callback(result, farmers.length);
      },
      (error) => {
        console.error("Error subscribing to farmers:", error);
        callback([], 0);
      }
    );
  } catch (error) {
    console.error("Error setting up farmer subscription:", error);
    return () => {};
  }
}

/**
 * Update user's geohash in their profile
 */
export async function updateUserGeohash(userId: string, lat: number, lng: number): Promise<void> {
  try {
    const geohash = encodeGeohash(lat, lng);
    const userRef = doc(db, USERS_COLLECTION, userId);
    
    await updateDoc(userRef, {
      "location.geohash": geohash,
      "location.lat": lat,
      "location.lng": lng,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error updating user geohash:", error);
    throw error;
  }
}
