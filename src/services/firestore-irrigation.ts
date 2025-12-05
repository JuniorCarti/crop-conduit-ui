/**
 * Firestore Service for Irrigation Scheduler
 * Handles all irrigation-related database operations
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
  IrrigationSchedule,
  WaterSource,
  IrrigationEfficiency,
} from "./firestore";

const IRRIGATION_SCHEDULE_COLLECTION = "irrigationSchedules";
const WATER_SOURCES_COLLECTION = "waterSources";
const IRRIGATION_EFFICIENCY_COLLECTION = "irrigationEfficiency";

// Helper function to convert Firestore timestamps
const convertTimestamp = (timestamp: any): Date => {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  if (timestamp?.toDate) return timestamp.toDate();
  if (typeof timestamp === "string") return new Date(timestamp);
  return new Date();
};

// ============================================================================
// IRRIGATION SCHEDULE OPERATIONS
// ============================================================================

/**
 * Subscribe to irrigation schedules for a user
 */
export function subscribeToIrrigationSchedules(
  userId: string,
  callback: (schedules: IrrigationSchedule[]) => void
) {
  const q = query(
    collection(db, IRRIGATION_SCHEDULE_COLLECTION),
    where("userId", "==", userId),
    orderBy("scheduledDate", "asc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const schedules = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          scheduledDate: convertTimestamp(data.scheduledDate),
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt),
        } as IrrigationSchedule;
      });
      callback(schedules);
    },
    (error) => {
      console.error("Error subscribing to irrigation schedules:", error);
      callback([]);
    }
  );
}

/**
 * Get a single irrigation schedule
 */
export async function getIrrigationSchedule(id: string): Promise<IrrigationSchedule | null> {
  try {
    const docRef = doc(db, IRRIGATION_SCHEDULE_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        scheduledDate: convertTimestamp(data.scheduledDate),
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
      } as IrrigationSchedule;
    }
    return null;
  } catch (error) {
    console.error("Error getting irrigation schedule:", error);
    throw error;
  }
}

/**
 * Create a new irrigation schedule
 */
export async function createIrrigationSchedule(
  schedule: Omit<IrrigationSchedule, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  try {
    const scheduleData = {
      ...schedule,
      scheduledDate:
        schedule.scheduledDate instanceof Date
          ? Timestamp.fromDate(schedule.scheduledDate)
          : schedule.scheduledDate,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Clean undefined values
    const cleanData = Object.fromEntries(
      Object.entries(scheduleData).filter(([_, value]) => value !== undefined)
    ) as any;

    const docRef = await addDoc(collection(db, IRRIGATION_SCHEDULE_COLLECTION), cleanData);
    return docRef.id;
  } catch (error) {
    console.error("Error creating irrigation schedule:", error);
    throw error;
  }
}

/**
 * Update an irrigation schedule
 */
export async function updateIrrigationSchedule(
  id: string,
  updates: Partial<IrrigationSchedule>
): Promise<void> {
  try {
    const docRef = doc(db, IRRIGATION_SCHEDULE_COLLECTION, id);
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now(),
    };

    // Convert dates to timestamps
    if (updateData.scheduledDate instanceof Date) {
      updateData.scheduledDate = Timestamp.fromDate(updateData.scheduledDate);
    }

    // Clean undefined values
    const cleanData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    await updateDoc(docRef, cleanData);
  } catch (error) {
    console.error("Error updating irrigation schedule:", error);
    throw error;
  }
}

/**
 * Delete an irrigation schedule
 */
export async function deleteIrrigationSchedule(id: string): Promise<void> {
  try {
    const docRef = doc(db, IRRIGATION_SCHEDULE_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting irrigation schedule:", error);
    throw error;
  }
}

// ============================================================================
// WATER SOURCE OPERATIONS
// ============================================================================

/**
 * Subscribe to water sources for a user
 */
export function subscribeToWaterSources(
  userId: string,
  callback: (sources: WaterSource[]) => void
) {
  const q = query(
    collection(db, WATER_SOURCES_COLLECTION),
    where("userId", "==", userId),
    orderBy("name", "asc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const sources = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          lastRefilled: convertTimestamp(data.lastRefilled),
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt),
        } as WaterSource;
      });
      callback(sources);
    },
    (error) => {
      console.error("Error subscribing to water sources:", error);
      callback([]);
    }
  );
}

/**
 * Create a new water source
 */
export async function createWaterSource(
  source: Omit<WaterSource, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  try {
    const sourceData = {
      ...source,
      lastRefilled: source.lastRefilled
        ? source.lastRefilled instanceof Date
          ? Timestamp.fromDate(source.lastRefilled)
          : source.lastRefilled
        : undefined,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const cleanData = Object.fromEntries(
      Object.entries(sourceData).filter(([_, value]) => value !== undefined)
    ) as any;

    const docRef = await addDoc(collection(db, WATER_SOURCES_COLLECTION), cleanData);
    return docRef.id;
  } catch (error) {
    console.error("Error creating water source:", error);
    throw error;
  }
}

/**
 * Update a water source
 */
export async function updateWaterSource(
  id: string,
  updates: Partial<WaterSource>
): Promise<void> {
  try {
    const docRef = doc(db, WATER_SOURCES_COLLECTION, id);
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now(),
    };

    if (updateData.lastRefilled instanceof Date) {
      updateData.lastRefilled = Timestamp.fromDate(updateData.lastRefilled);
    }

    const cleanData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    await updateDoc(docRef, cleanData);
  } catch (error) {
    console.error("Error updating water source:", error);
    throw error;
  }
}

/**
 * Delete a water source
 */
export async function deleteWaterSource(id: string): Promise<void> {
  try {
    const docRef = doc(db, WATER_SOURCES_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting water source:", error);
    throw error;
  }
}

// ============================================================================
// IRRIGATION EFFICIENCY OPERATIONS
// ============================================================================

/**
 * Subscribe to irrigation efficiency data for a user
 */
export function subscribeToIrrigationEfficiency(
  userId: string,
  cropId?: string,
  callback?: (efficiency: IrrigationEfficiency[]) => void
) {
  const constraints: any[] = [where("userId", "==", userId)];

  if (cropId) {
    constraints.push(where("cropId", "==", cropId));
  }

  constraints.push(orderBy("date", "desc"));

  const q = query(collection(db, IRRIGATION_EFFICIENCY_COLLECTION), ...constraints);

  if (callback) {
    return onSnapshot(
      q,
      (snapshot) => {
        const efficiency = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            date: convertTimestamp(data.date),
            createdAt: convertTimestamp(data.createdAt),
          } as IrrigationEfficiency;
        });
        callback(efficiency);
      },
      (error) => {
        console.error("Error subscribing to irrigation efficiency:", error);
        if (callback) callback([]);
      }
    );
  }

  return () => {};
}

/**
 * Record irrigation efficiency
 */
export async function addIrrigationEfficiency(
  efficiency: Omit<IrrigationEfficiency, "id" | "createdAt">
): Promise<string> {
  try {
    const efficiencyData = {
      ...efficiency,
      date:
        efficiency.date instanceof Date
          ? Timestamp.fromDate(efficiency.date)
          : efficiency.date,
      createdAt: Timestamp.now(),
    };

    const cleanData = Object.fromEntries(
      Object.entries(efficiencyData).filter(([_, value]) => value !== undefined)
    ) as any;

    const docRef = await addDoc(collection(db, IRRIGATION_EFFICIENCY_COLLECTION), cleanData);
    return docRef.id;
  } catch (error) {
    console.error("Error adding irrigation efficiency:", error);
    throw error;
  }
}

