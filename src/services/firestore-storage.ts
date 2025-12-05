/**
 * Firestore Service for Storage Optimizer
 * Handles all storage-related database operations
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
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  StorageUnit,
  StoredCrop,
  StorageAlert,
} from "./firestore";

const STORAGE_UNITS_COLLECTION = "storageUnits";
const STORED_CROPS_COLLECTION = "storedCrops";
const STORAGE_ALERTS_COLLECTION = "storageAlerts";

// Helper function to convert Firestore timestamps
const convertTimestamp = (timestamp: any): Date => {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  if (timestamp?.toDate) return timestamp.toDate();
  if (typeof timestamp === "string") return new Date(timestamp);
  return new Date();
};

// ============================================================================
// STORAGE UNIT OPERATIONS
// ============================================================================

/**
 * Subscribe to storage units for a user
 */
export function subscribeToStorageUnits(
  userId: string,
  callback: (units: StorageUnit[]) => void
) {
  const q = query(
    collection(db, STORAGE_UNITS_COLLECTION),
    where("userId", "==", userId),
    orderBy("name", "asc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const units = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt),
        } as StorageUnit;
      });
      callback(units);
    },
    (error) => {
      console.error("Error subscribing to storage units:", error);
      callback([]);
    }
  );
}

/**
 * Create a new storage unit
 */
export async function createStorageUnit(
  unit: Omit<StorageUnit, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  try {
    const unitData = {
      ...unit,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const cleanData = Object.fromEntries(
      Object.entries(unitData).filter(([_, value]) => value !== undefined)
    ) as any;

    const docRef = await addDoc(collection(db, STORAGE_UNITS_COLLECTION), cleanData);
    return docRef.id;
  } catch (error) {
    console.error("Error creating storage unit:", error);
    throw error;
  }
}

/**
 * Update a storage unit
 */
export async function updateStorageUnit(
  id: string,
  updates: Partial<StorageUnit>
): Promise<void> {
  try {
    const docRef = doc(db, STORAGE_UNITS_COLLECTION, id);
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now(),
    };

    const cleanData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    await updateDoc(docRef, cleanData);
  } catch (error) {
    console.error("Error updating storage unit:", error);
    throw error;
  }
}

/**
 * Delete a storage unit
 */
export async function deleteStorageUnit(id: string): Promise<void> {
  try {
    const docRef = doc(db, STORAGE_UNITS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting storage unit:", error);
    throw error;
  }
}

// ============================================================================
// STORED CROP OPERATIONS
// ============================================================================

/**
 * Subscribe to stored crops for a user
 */
export function subscribeToStoredCrops(
  userId: string,
  storageUnitId?: string,
  callback?: (crops: StoredCrop[]) => void
) {
  const constraints: any[] = [where("userId", "==", userId)];

  if (storageUnitId) {
    constraints.push(where("storageUnitId", "==", storageUnitId));
  }

  constraints.push(orderBy("storedDate", "desc"));

  const q = query(collection(db, STORED_CROPS_COLLECTION), ...constraints);

  if (callback) {
    return onSnapshot(
      q,
      (snapshot) => {
        const crops = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            storedDate: convertTimestamp(data.storedDate),
            releaseDate: convertTimestamp(data.releaseDate),
            createdAt: convertTimestamp(data.createdAt),
            updatedAt: convertTimestamp(data.updatedAt),
          } as StoredCrop;
        });
        callback(crops);
      },
      (error) => {
        console.error("Error subscribing to stored crops:", error);
        if (callback) callback([]);
      }
    );
  }

  return () => {};
}

/**
 * Get a single stored crop
 */
export async function getStoredCrop(id: string): Promise<StoredCrop | null> {
  try {
    const docRef = doc(db, STORED_CROPS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        storedDate: convertTimestamp(data.storedDate),
        releaseDate: convertTimestamp(data.releaseDate),
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
      } as StoredCrop;
    }
    return null;
  } catch (error) {
    console.error("Error getting stored crop:", error);
    throw error;
  }
}

/**
 * Create a new stored crop
 */
export async function createStoredCrop(
  crop: Omit<StoredCrop, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  try {
    const cropData = {
      ...crop,
      storedDate:
        crop.storedDate instanceof Date
          ? Timestamp.fromDate(crop.storedDate)
          : crop.storedDate,
      releaseDate: crop.releaseDate
        ? crop.releaseDate instanceof Date
          ? Timestamp.fromDate(crop.releaseDate)
          : crop.releaseDate
        : undefined,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Calculate remaining shelf life
    if (cropData.storedDate && cropData.expectedShelfLife) {
      const storedDate = convertTimestamp(cropData.storedDate);
      const expiryDate = new Date(storedDate);
      expiryDate.setDate(expiryDate.getDate() + cropData.expectedShelfLife);
      const today = new Date();
      const remaining = Math.max(0, Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
      cropData.remainingShelfLife = remaining;
    }

    const cleanData = Object.fromEntries(
      Object.entries(cropData).filter(([_, value]) => value !== undefined)
    ) as any;

    const docRef = await addDoc(collection(db, STORED_CROPS_COLLECTION), cleanData);
    return docRef.id;
  } catch (error) {
    console.error("Error creating stored crop:", error);
    throw error;
  }
}

/**
 * Update a stored crop
 */
export async function updateStoredCrop(
  id: string,
  updates: Partial<StoredCrop>
): Promise<void> {
  try {
    const docRef = doc(db, STORED_CROPS_COLLECTION, id);
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now(),
    };

    if (updateData.storedDate instanceof Date) {
      updateData.storedDate = Timestamp.fromDate(updateData.storedDate);
    }
    if (updateData.releaseDate instanceof Date) {
      updateData.releaseDate = Timestamp.fromDate(updateData.releaseDate);
    }

    // Recalculate remaining shelf life if needed
    if (updateData.storedDate || updateData.expectedShelfLife) {
      const existingDoc = await getDoc(docRef);
      if (existingDoc.exists()) {
        const existing = existingDoc.data();
        const storedDate = updateData.storedDate
          ? convertTimestamp(updateData.storedDate)
          : convertTimestamp(existing.storedDate);
        const shelfLife = updateData.expectedShelfLife || existing.expectedShelfLife;
        const expiryDate = new Date(storedDate);
        expiryDate.setDate(expiryDate.getDate() + shelfLife);
        const today = new Date();
        const remaining = Math.max(0, Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
        updateData.remainingShelfLife = remaining;
      }
    }

    const cleanData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    await updateDoc(docRef, cleanData);
  } catch (error) {
    console.error("Error updating stored crop:", error);
    throw error;
  }
}

/**
 * Delete a stored crop
 */
export async function deleteStoredCrop(id: string): Promise<void> {
  try {
    const docRef = doc(db, STORED_CROPS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting stored crop:", error);
    throw error;
  }
}

// ============================================================================
// STORAGE ALERT OPERATIONS
// ============================================================================

/**
 * Subscribe to storage alerts for a user
 */
export function subscribeToStorageAlerts(
  userId: string,
  resolved?: boolean,
  callback?: (alerts: StorageAlert[]) => void
) {
  const constraints: any[] = [where("userId", "==", userId)];

  if (resolved !== undefined) {
    constraints.push(where("resolved", "==", resolved));
  }

  constraints.push(orderBy("createdAt", "desc"));

  const q = query(collection(db, STORAGE_ALERTS_COLLECTION), ...constraints);

  if (callback) {
    return onSnapshot(
      q,
      (snapshot) => {
        const alerts = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            resolvedAt: convertTimestamp(data.resolvedAt),
            createdAt: convertTimestamp(data.createdAt),
          } as StorageAlert;
        });
        callback(alerts);
      },
      (error) => {
        console.error("Error subscribing to storage alerts:", error);
        if (callback) callback([]);
      }
    );
  }

  return () => {};
}

/**
 * Create a new storage alert
 */
export async function createStorageAlert(
  alert: Omit<StorageAlert, "id" | "createdAt">
): Promise<string> {
  try {
    const alertData = {
      ...alert,
      resolved: alert.resolved || false,
      resolvedAt: alert.resolvedAt
        ? alert.resolvedAt instanceof Date
          ? Timestamp.fromDate(alert.resolvedAt)
          : alert.resolvedAt
        : undefined,
      createdAt: Timestamp.now(),
    };

    const cleanData = Object.fromEntries(
      Object.entries(alertData).filter(([_, value]) => value !== undefined)
    ) as any;

    const docRef = await addDoc(collection(db, STORAGE_ALERTS_COLLECTION), cleanData);
    return docRef.id;
  } catch (error) {
    console.error("Error creating storage alert:", error);
    throw error;
  }
}

/**
 * Update a storage alert
 */
export async function updateStorageAlert(
  id: string,
  updates: Partial<StorageAlert>
): Promise<void> {
  try {
    const docRef = doc(db, STORAGE_ALERTS_COLLECTION, id);
    const updateData: any = {
      ...updates,
    };

    if (updateData.resolvedAt instanceof Date) {
      updateData.resolvedAt = Timestamp.fromDate(updateData.resolvedAt);
    }

    const cleanData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    await updateDoc(docRef, cleanData);
  } catch (error) {
    console.error("Error updating storage alert:", error);
    throw error;
  }
}

/**
 * Delete a storage alert
 */
export async function deleteStorageAlert(id: string): Promise<void> {
  try {
    const docRef = doc(db, STORAGE_ALERTS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting storage alert:", error);
    throw error;
  }
}

