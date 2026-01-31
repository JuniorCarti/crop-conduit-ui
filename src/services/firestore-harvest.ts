/**
 * Harvest Module Firestore Service
 * 
 * Provides CRUD operations for Harvest Schedules, Workers, and Deliveries
 * All operations are user-scoped (multi-tenant) using userId
 * Supports realtime updates via onSnapshot
 */

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Query,
  getDocs,
  getDoc,
  doc,
  serverTimestamp,
  Timestamp,
  writeBatch,
  QueryConstraint,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  HarvestSchedule,
  Worker,
  Delivery,
  CreateHarvestScheduleInput,
  CreateWorkerInput,
  CreateDeliveryInput,
} from "@/types/harvest";

// ============================================================================
// Helper: Build user-scoped collection reference
// ============================================================================

function getUserCollectionRef(userId: string, collectionName: string) {
  return collection(db, "users", userId, "harvest", "default", collectionName);
}

// ============================================================================
// HARVEST SCHEDULES
// ============================================================================

/**
 * Create a new harvest schedule
 */
export async function createHarvestSchedule(
  userId: string,
  data: CreateHarvestScheduleInput
): Promise<HarvestSchedule> {
  const schedulesRef = getUserCollectionRef(userId, "schedules");

  const docData = {
    ...data,
    userId,
    status: "Pending" as const,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(schedulesRef, docData);

  // Fetch the created document to get the real timestamps
  const docSnap = await getDoc(docRef);
  return {
    id: docRef.id,
    ...docSnap.data(),
  } as HarvestSchedule;
}

/**
 * Get all harvest schedules for a user (one-time fetch)
 */
export async function getHarvestSchedules(userId: string): Promise<HarvestSchedule[]> {
  const schedulesRef = getUserCollectionRef(userId, "schedules");
  const q = query(schedulesRef);

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as HarvestSchedule[];
}

/**
 * Subscribe to harvest schedules with realtime updates
 */
export function subscribeToHarvestSchedules(
  userId: string,
  callback: (schedules: HarvestSchedule[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const schedulesRef = getUserCollectionRef(userId, "schedules");
  const q = query(schedulesRef);

  return onSnapshot(
    q,
    (snapshot) => {
      const schedules = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as HarvestSchedule[];
      callback(schedules);
    },
    (error) => {
      console.error("Error subscribing to harvest schedules:", error);
      if (onError) onError(error as Error);
    }
  );
}

/**
 * Get a single harvest schedule by ID
 */
export async function getHarvestScheduleById(
  userId: string,
  scheduleId: string
): Promise<HarvestSchedule | null> {
  const docRef = doc(db, "users", userId, "harvest", "default", "schedules", scheduleId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return {
    id: docSnap.id,
    ...docSnap.data(),
  } as HarvestSchedule;
}

/**
 * Update a harvest schedule
 */
export async function updateHarvestSchedule(
  userId: string,
  scheduleId: string,
  updates: Partial<CreateHarvestScheduleInput>
): Promise<void> {
  const docRef = doc(db, "users", userId, "harvest", "default", "schedules", scheduleId);

  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete a harvest schedule
 */
export async function deleteHarvestSchedule(
  userId: string,
  scheduleId: string
): Promise<void> {
  const docRef = doc(db, "users", userId, "harvest", "default", "schedules", scheduleId);
  await deleteDoc(docRef);
}

/**
 * Get harvest schedules filtered by status
 */
export async function getHarvestSchedulesByStatus(
  userId: string,
  status: HarvestSchedule["status"]
): Promise<HarvestSchedule[]> {
  const schedulesRef = getUserCollectionRef(userId, "schedules");
  const q = query(schedulesRef, where("status", "==", status));

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as HarvestSchedule[];
}

// ============================================================================
// WORKERS
// ============================================================================

/**
 * Create a new worker
 */
export async function createWorker(
  userId: string,
  data: CreateWorkerInput
): Promise<Worker> {
  const workersRef = getUserCollectionRef(userId, "workers");

  const docData = {
    ...data,
    userId,
    status: "Active" as const,
    assignedScheduleIds: data.assignedScheduleIds ?? [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(workersRef, docData);

  // Fetch the created document to get the real timestamps
  const docSnap = await getDoc(docRef);
  return {
    id: docRef.id,
    ...docSnap.data(),
  } as Worker;
}

/**
 * Get all workers for a user (one-time fetch)
 */
export async function getWorkers(userId: string): Promise<Worker[]> {
  const workersRef = getUserCollectionRef(userId, "workers");
  const q = query(workersRef);

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Worker[];
}

/**
 * Subscribe to workers with realtime updates
 */
export function subscribeToWorkers(
  userId: string,
  callback: (workers: Worker[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const workersRef = getUserCollectionRef(userId, "workers");
  const q = query(workersRef);

  return onSnapshot(
    q,
    (snapshot) => {
      const workers = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Worker[];
      callback(workers);
    },
    (error) => {
      console.error("Error subscribing to workers:", error);
      if (onError) onError(error as Error);
    }
  );
}

/**
 * Get active workers only
 */
export async function getActiveWorkers(userId: string): Promise<Worker[]> {
  const workersRef = getUserCollectionRef(userId, "workers");
  const q = query(workersRef, where("status", "==", "Active"));

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Worker[];
}

/**
 * Get a single worker by ID
 */
export async function getWorkerById(userId: string, workerId: string): Promise<Worker | null> {
  const docRef = doc(db, "users", userId, "harvest", "default", "workers", workerId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return {
    id: docSnap.id,
    ...docSnap.data(),
  } as Worker;
}

/**
 * Update a worker
 */
export async function updateWorker(
  userId: string,
  workerId: string,
  updates: Partial<CreateWorkerInput>
): Promise<void> {
  const docRef = doc(db, "users", userId, "harvest", "default", "workers", workerId);

  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete a worker
 */
export async function deleteWorker(userId: string, workerId: string): Promise<void> {
  const docRef = doc(db, "users", userId, "harvest", "default", "workers", workerId);
  await deleteDoc(docRef);
}

/**
 * Assign worker to schedule(s)
 */
export async function assignWorkerToSchedule(
  userId: string,
  workerId: string,
  scheduleIds: string[]
): Promise<void> {
  const docRef = doc(db, "users", userId, "harvest", "default", "workers", workerId);

  const workerSnap = await getDoc(docRef);
  const currentAssignments = (workerSnap.data()?.assignedScheduleIds as string[]) || [];
  const updatedAssignments = Array.from(new Set([...currentAssignments, ...scheduleIds]));

  await updateDoc(docRef, {
    assignedScheduleIds: updatedAssignments,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Remove worker from schedule(s)
 */
export async function unassignWorkerFromSchedule(
  userId: string,
  workerId: string,
  scheduleIds: string[]
): Promise<void> {
  const docRef = doc(db, "users", userId, "harvest", "default", "workers", workerId);

  const workerSnap = await getDoc(docRef);
  const currentAssignments = (workerSnap.data()?.assignedScheduleIds as string[]) || [];
  const updatedAssignments = currentAssignments.filter((id) => !scheduleIds.includes(id));

  await updateDoc(docRef, {
    assignedScheduleIds: updatedAssignments,
    updatedAt: serverTimestamp(),
  });
}

// ============================================================================
// DELIVERIES
// ============================================================================

/**
 * Create a new delivery
 */
export async function createDelivery(
  userId: string,
  data: CreateDeliveryInput
): Promise<Delivery> {
  const deliveriesRef = getUserCollectionRef(userId, "deliveries");

  const docData = {
    ...data,
    userId,
    status: "Pending" as const,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(deliveriesRef, docData);

  // Fetch the created document to get the real timestamps
  const docSnap = await getDoc(docRef);
  return {
    id: docRef.id,
    ...docSnap.data(),
  } as Delivery;
}

/**
 * Get all deliveries for a user (one-time fetch)
 */
export async function getDeliveries(userId: string): Promise<Delivery[]> {
  const deliveriesRef = getUserCollectionRef(userId, "deliveries");
  const q = query(deliveriesRef);

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Delivery[];
}

/**
 * Subscribe to deliveries with realtime updates
 */
export function subscribeToDeliveries(
  userId: string,
  callback: (deliveries: Delivery[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const deliveriesRef = getUserCollectionRef(userId, "deliveries");
  const q = query(deliveriesRef);

  return onSnapshot(
    q,
    (snapshot) => {
      const deliveries = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Delivery[];
      callback(deliveries);
    },
    (error) => {
      console.error("Error subscribing to deliveries:", error);
      if (onError) onError(error as Error);
    }
  );
}

/**
 * Get deliveries for a specific harvest schedule
 */
export async function getDeliveriesBySchedule(
  userId: string,
  scheduleId: string
): Promise<Delivery[]> {
  const deliveriesRef = getUserCollectionRef(userId, "deliveries");
  const q = query(deliveriesRef, where("scheduleId", "==", scheduleId));

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Delivery[];
}

/**
 * Get deliveries assigned to a specific worker
 */
export async function getDeliveriesByWorker(
  userId: string,
  workerId: string
): Promise<Delivery[]> {
  const deliveriesRef = getUserCollectionRef(userId, "deliveries");
  const q = query(deliveriesRef, where("assignedWorkerId", "==", workerId));

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Delivery[];
}

/**
 * Get a single delivery by ID
 */
export async function getDeliveryById(userId: string, deliveryId: string): Promise<Delivery | null> {
  const docRef = doc(db, "users", userId, "harvest", "default", "deliveries", deliveryId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return {
    id: docSnap.id,
    ...docSnap.data(),
  } as Delivery;
}

/**
 * Update a delivery
 */
export async function updateDelivery(
  userId: string,
  deliveryId: string,
  updates: Partial<CreateDeliveryInput> & {
    status?: Delivery["status"];
    actualDeliveryDate?: Date | string
  }
): Promise<void> {
  const docRef = doc(db, "users", userId, "harvest", "default", "deliveries", deliveryId);

  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete a delivery
 */
export async function deleteDelivery(userId: string, deliveryId: string): Promise<void> {
  const docRef = doc(db, "users", userId, "harvest", "default", "deliveries", deliveryId);
  await deleteDoc(docRef);
}

/**
 * Get deliveries by status
 */
export async function getDeliveriesByStatus(
  userId: string,
  status: Delivery["status"]
): Promise<Delivery[]> {
  const deliveriesRef = getUserCollectionRef(userId, "deliveries");
  const q = query(deliveriesRef, where("status", "==", status));

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Delivery[];
}

/**
 * Mark delivery as delivered
 */
export async function markDeliveryAsDelivered(
  userId: string,
  deliveryId: string,
  actualDeliveryDate?: Date
): Promise<void> {
  const docRef = doc(db, "users", userId, "harvest", "default", "deliveries", deliveryId);

  await updateDoc(docRef, {
    status: "Delivered",
    actualDeliveryDate: actualDeliveryDate ? new Date(actualDeliveryDate) : serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Delete multiple workers in a batch
 */
export async function deleteWorkersBatch(userId: string, workerIds: string[]): Promise<void> {
  const batch = writeBatch(db);

  workerIds.forEach((workerId) => {
    const docRef = doc(db, "users", userId, "harvest", "default", "workers", workerId);
    batch.delete(docRef);
  });

  await batch.commit();
}

/**
 * Update multiple deliveries status in a batch
 */
export async function updateDeliveriesStatusBatch(
  userId: string,
  deliveryIds: string[],
  status: Delivery["status"]
): Promise<void> {
  const batch = writeBatch(db);

  deliveryIds.forEach((deliveryId) => {
    const docRef = doc(db, "users", userId, "harvest", "default", "deliveries", deliveryId);
    batch.update(docRef, {
      status,
      updatedAt: serverTimestamp(),
    });
  });

  await batch.commit();
}


