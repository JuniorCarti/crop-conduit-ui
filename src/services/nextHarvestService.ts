/**
 * Next Harvest Service
 * Manages upcoming harvest schedule data
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
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface NextHarvest {
  id?: string;
  fieldId: string;
  fieldName: string;
  cropId?: string;
  cropName: string;
  optimalDate: Date | Timestamp | string;
  estimatedYield: number; // kg or tons
  yieldUnit: string; // "kg" | "tons"
  status: "Ready" | "Pending" | "Scheduled" | "Completed";
  workers?: number;
  equipment?: string[];
  notes?: string;
  createdAt?: Date | Timestamp | string;
  updatedAt?: Date | Timestamp | string;
  userId?: string;
}

const NEXT_HARVEST_COLLECTION = "next_harvest";

const convertTimestamp = (timestamp: any): Date => {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  if (timestamp?.toDate) return timestamp.toDate();
  if (typeof timestamp === "string") return new Date(timestamp);
  return new Date();
};

/**
 * Subscribe to next harvest schedule with real-time updates
 */
export function subscribeToNextHarvest(
  userId: string,
  callback: (harvests: NextHarvest[]) => void
): () => void {
  try {
    const q = query(
      collection(db, NEXT_HARVEST_COLLECTION),
      where("userId", "==", userId),
      orderBy("optimalDate", "asc")
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const harvests: NextHarvest[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          harvests.push({
            id: doc.id,
            ...data,
            optimalDate: convertTimestamp(data.optimalDate),
            createdAt: convertTimestamp(data.createdAt),
            updatedAt: convertTimestamp(data.updatedAt),
          } as NextHarvest);
        });
        callback(harvests);
      },
      (error) => {
        console.error("Error subscribing to next harvest:", error);
        callback([]);
      }
    );
  } catch (error) {
    console.error("Error setting up next harvest subscription:", error);
    return () => {};
  }
}

/**
 * Get next harvest for a specific field
 */
export async function getNextHarvest(fieldId: string): Promise<NextHarvest | null> {
  try {
    // Query without status filter first, then filter client-side to avoid index requirement
    const q = query(
      collection(db, NEXT_HARVEST_COLLECTION),
      where("fieldId", "==", fieldId),
      orderBy("optimalDate", "asc"),
      limit(10) // Get more results to filter client-side
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    // Filter by status client-side to avoid index requirement
    const validStatuses = ["Ready", "Pending", "Scheduled"];
    const validHarvests = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          optimalDate: convertTimestamp(data.optimalDate),
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt),
        } as NextHarvest;
      })
      .filter((h) => validStatuses.includes(h.status));

    return validHarvests.length > 0 ? validHarvests[0] : null;
  } catch (error) {
    console.error("Error getting next harvest:", error);
    return null;
  }
}

/**
 * Create or update next harvest record
 */
export async function saveNextHarvest(
  harvest: Omit<NextHarvest, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  try {
    // Validate required fields
    if (!harvest.fieldId || !harvest.fieldName || !harvest.cropName || !harvest.optimalDate) {
      throw new Error("Missing required fields: fieldId, fieldName, cropName, optimalDate");
    }

    // Check if record exists for this field
    const existing = await getNextHarvest(harvest.fieldId);
    
    if (existing?.id && existing.status !== "Completed") {
      // Update existing
      const docRef = doc(db, NEXT_HARVEST_COLLECTION, existing.id);
      await updateDoc(docRef, {
        ...harvest,
        optimalDate: harvest.optimalDate instanceof Date 
          ? Timestamp.fromDate(harvest.optimalDate) 
          : harvest.optimalDate,
        updatedAt: Timestamp.now(),
      });
      return existing.id;
    } else {
      // Create new
      const docRef = await addDoc(collection(db, NEXT_HARVEST_COLLECTION), {
        ...harvest,
        optimalDate: harvest.optimalDate instanceof Date 
          ? Timestamp.fromDate(harvest.optimalDate) 
          : harvest.optimalDate,
        status: harvest.status || "Pending",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    }
  } catch (error) {
    console.error("Error saving next harvest:", error);
    throw error;
  }
}

/**
 * Get all upcoming harvests for user
 */
export async function getAllNextHarvest(userId: string): Promise<NextHarvest[]> {
  try {
    // Query without status filter, then filter client-side to avoid index requirement
    const q = query(
      collection(db, NEXT_HARVEST_COLLECTION),
      where("userId", "==", userId),
      orderBy("optimalDate", "asc")
    );

    const snapshot = await getDocs(q);
    const harvests: NextHarvest[] = [];
    const validStatuses = ["Ready", "Pending", "Scheduled"];

    snapshot.forEach((doc) => {
      const data = doc.data();
      // Filter by status client-side
      if (validStatuses.includes(data.status)) {
        harvests.push({
          id: doc.id,
          ...data,
          optimalDate: convertTimestamp(data.optimalDate),
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt),
        } as NextHarvest);
      }
    });

    return harvests;
  } catch (error) {
    console.error("Error getting all next harvest:", error);
    throw error;
  }
}

/**
 * Get estimated supply for a crop (sum of upcoming harvests)
 */
export async function getEstimatedSupply(
  userId: string,
  cropName: string
): Promise<number> {
  try {
    // Query without status filter, then filter client-side to avoid index requirement
    const q = query(
      collection(db, NEXT_HARVEST_COLLECTION),
      where("userId", "==", userId),
      where("cropName", "==", cropName),
      orderBy("optimalDate", "asc")
    );

    const snapshot = await getDocs(q);
    let totalSupply = 0;
    const validStatuses = ["Ready", "Pending", "Scheduled"];

    snapshot.forEach((doc) => {
      const data = doc.data();
      // Filter by status client-side
      if (validStatuses.includes(data.status)) {
        totalSupply += data.estimatedYield || 0;
      }
    });

    return totalSupply;
  } catch (error) {
    console.error("Error getting estimated supply:", error);
    return 0;
  }
}

/**
 * Get upcoming harvests within N days
 */
export async function getUpcomingHarvests(
  userId: string,
  days: number = 30
): Promise<NextHarvest[]> {
  try {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    // Query without status filter, then filter client-side to avoid index requirement
    const q = query(
      collection(db, NEXT_HARVEST_COLLECTION),
      where("userId", "==", userId),
      where("optimalDate", ">=", Timestamp.fromDate(startDate)),
      where("optimalDate", "<=", Timestamp.fromDate(endDate)),
      orderBy("optimalDate", "asc")
    );

    const snapshot = await getDocs(q);
    const harvests: NextHarvest[] = [];
    const validStatuses = ["Ready", "Pending", "Scheduled"];

    snapshot.forEach((doc) => {
      const data = doc.data();
      // Filter by status client-side
      if (validStatuses.includes(data.status)) {
        harvests.push({
          id: doc.id,
          ...data,
          optimalDate: convertTimestamp(data.optimalDate),
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt),
        } as NextHarvest);
      }
    });

    return harvests;
  } catch (error) {
    console.error("Error getting upcoming harvests:", error);
    return [];
  }
}

/**
 * Create next harvest (for compatibility with existing hook)
 */
export async function createNextHarvest(
  harvest: Omit<NextHarvest, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  return saveNextHarvest(harvest);
}

/**
 * Update next harvest
 */
export async function updateNextHarvest(
  id: string,
  updates: Partial<NextHarvest>
): Promise<void> {
  try {
    const docRef = doc(db, NEXT_HARVEST_COLLECTION, id);
    const cleanUpdates: any = { ...updates };
    
    if (updates.optimalDate) {
      cleanUpdates.optimalDate = updates.optimalDate instanceof Date 
        ? Timestamp.fromDate(updates.optimalDate) 
        : updates.optimalDate;
    }
    
    await updateDoc(docRef, {
      ...cleanUpdates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error updating next harvest:", error);
    throw error;
  }
}
