/**
 * Dispute Service
 * Handles order disputes and resolution
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Dispute, DisputeStatus } from "../models/types";

const DISPUTES_COLLECTION = "disputes";

const convertTimestamp = (timestamp: any): Date => {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  if (timestamp?.toDate) return timestamp.toDate();
  if (typeof timestamp === "string") return new Date(timestamp);
  return new Date();
};

/**
 * Create a new dispute
 */
export async function createDispute(
  dispute: Omit<Dispute, "id" | "createdAt" | "updatedAt" | "status">
): Promise<string> {
  try {
    const disputeRef = await addDoc(collection(db, DISPUTES_COLLECTION), {
      ...dispute,
      status: "open" as DisputeStatus,
      evidence: dispute.evidence || [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return disputeRef.id;
  } catch (error) {
    console.error("Error creating dispute:", error);
    throw error;
  }
}

/**
 * Update dispute status (admin only)
 */
export async function updateDispute(
  disputeId: string,
  updates: Partial<Dispute>
): Promise<void> {
  try {
    const disputeRef = doc(db, DISPUTES_COLLECTION, disputeId);
    const cleanUpdates: any = { ...updates };

    if (updates.resolution) {
      cleanUpdates.resolution = {
        ...updates.resolution,
        resolvedAt:
          updates.resolution.resolvedAt instanceof Date
            ? Timestamp.fromDate(updates.resolution.resolvedAt)
            : updates.resolution.resolvedAt || Timestamp.now(),
      };
    }

    await updateDoc(disputeRef, {
      ...cleanUpdates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error updating dispute:", error);
    throw error;
  }
}

/**
 * Get dispute by ID
 */
export async function getDispute(disputeId: string): Promise<Dispute | null> {
  try {
    const disputeRef = doc(db, DISPUTES_COLLECTION, disputeId);
    const disputeSnap = await getDoc(disputeRef);

    if (disputeSnap.exists()) {
      const data = disputeSnap.data();
      return {
        id: disputeSnap.id,
        ...data,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
        resolution: data.resolution
          ? {
              ...data.resolution,
              resolvedAt: convertTimestamp(data.resolution.resolvedAt),
            }
          : undefined,
      } as Dispute;
    }
    return null;
  } catch (error) {
    console.error("Error getting dispute:", error);
    throw error;
  }
}

/**
 * Get disputes for an order
 */
export async function getOrderDisputes(orderId: string): Promise<Dispute[]> {
  try {
    const q = query(
      collection(db, DISPUTES_COLLECTION),
      where("orderId", "==", orderId),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    const disputes: Dispute[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      disputes.push({
        id: doc.id,
        ...data,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
        resolution: data.resolution
          ? {
              ...data.resolution,
              resolvedAt: convertTimestamp(data.resolution.resolvedAt),
            }
          : undefined,
      } as Dispute);
    });

    return disputes;
  } catch (error) {
    console.error("Error getting order disputes:", error);
    throw error;
  }
}

/**
 * Get all disputes (admin)
 */
export async function getAllDisputes(status?: DisputeStatus): Promise<Dispute[]> {
  try {
    let q = query(collection(db, DISPUTES_COLLECTION), orderBy("createdAt", "desc"));

    if (status) {
      q = query(q, where("status", "==", status));
    }

    const snapshot = await getDocs(q);
    const disputes: Dispute[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      disputes.push({
        id: doc.id,
        ...data,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
        resolution: data.resolution
          ? {
              ...data.resolution,
              resolvedAt: convertTimestamp(data.resolution.resolvedAt),
            }
          : undefined,
      } as Dispute);
    });

    return disputes;
  } catch (error) {
    console.error("Error getting all disputes:", error);
    throw error;
  }
}
