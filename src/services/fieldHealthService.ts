/**
 * Field Health Service
 * Manages field health monitoring data
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

export interface FieldHealth {
  id?: string;
  fieldId: string;
  fieldName: string;
  cropId?: string;
  cropName?: string;
  health: "Excellent" | "Good" | "Moderate" | "Needs Attention" | "Critical";
  ndvi?: number; // 0-1
  moisture?: number; // percentage
  pestIssues?: string[];
  diseaseIssues?: string[];
  nutrientDeficiencies?: string[];
  notes?: string;
  lastChecked: Date | Timestamp | string;
  createdAt?: Date | Timestamp | string;
  updatedAt?: Date | Timestamp | string;
  userId?: string;
}

const FIELD_HEALTH_COLLECTION = "field_health";

const convertTimestamp = (timestamp: any): Date => {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  if (timestamp?.toDate) return timestamp.toDate();
  if (typeof timestamp === "string") return new Date(timestamp);
  return new Date();
};

/**
 * Subscribe to field health data with real-time updates
 */
export function subscribeToFieldHealth(
  userId: string,
  callback: (health: FieldHealth[]) => void
): () => void {
  try {
    const q = query(
      collection(db, FIELD_HEALTH_COLLECTION),
      where("userId", "==", userId),
      orderBy("lastChecked", "desc")
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const health: FieldHealth[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          health.push({
            id: doc.id,
            ...data,
            lastChecked: convertTimestamp(data.lastChecked),
            createdAt: convertTimestamp(data.createdAt),
            updatedAt: convertTimestamp(data.updatedAt),
          } as FieldHealth);
        });
        callback(health);
      },
      (error) => {
        console.error("Error subscribing to field health:", error);
        callback([]);
      }
    );
  } catch (error) {
    console.error("Error setting up field health subscription:", error);
    return () => {};
  }
}

/**
 * Get field health for a specific field
 */
export async function getFieldHealth(fieldId: string): Promise<FieldHealth | null> {
  try {
    const q = query(
      collection(db, FIELD_HEALTH_COLLECTION),
      where("fieldId", "==", fieldId),
      orderBy("lastChecked", "desc"),
      limit(1)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      lastChecked: convertTimestamp(data.lastChecked),
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: convertTimestamp(data.updatedAt),
    } as FieldHealth;
  } catch (error) {
    console.error("Error getting field health:", error);
    return null;
  }
}

/**
 * Create or update field health record
 */
export async function saveFieldHealth(
  health: Omit<FieldHealth, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  try {
    // Check if record exists for this field
    const existing = await getFieldHealth(health.fieldId);
    
    if (existing?.id) {
      // Update existing
      const docRef = doc(db, FIELD_HEALTH_COLLECTION, existing.id);
      await updateDoc(docRef, {
        ...health,
        lastChecked: health.lastChecked instanceof Date 
          ? Timestamp.fromDate(health.lastChecked) 
          : health.lastChecked,
        updatedAt: Timestamp.now(),
      });
      return existing.id;
    } else {
      // Create new
      const docRef = await addDoc(collection(db, FIELD_HEALTH_COLLECTION), {
        ...health,
        lastChecked: health.lastChecked instanceof Date 
          ? Timestamp.fromDate(health.lastChecked) 
          : health.lastChecked,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    }
  } catch (error) {
    console.error("Error saving field health:", error);
    throw error;
  }
}

/**
 * Get all field health records for user
 */
export async function getAllFieldHealth(userId: string): Promise<FieldHealth[]> {
  try {
    const q = query(
      collection(db, FIELD_HEALTH_COLLECTION),
      where("userId", "==", userId),
      orderBy("lastChecked", "desc")
    );

    const snapshot = await getDocs(q);
    const health: FieldHealth[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      health.push({
        id: doc.id,
        ...data,
        lastChecked: convertTimestamp(data.lastChecked),
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
      } as FieldHealth);
    });

    return health;
  } catch (error) {
    console.error("Error getting all field health:", error);
    throw error;
  }
}
