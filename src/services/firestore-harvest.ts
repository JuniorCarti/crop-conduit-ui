/**
 * Firestore Service for Harvest Planner
 * Handles all harvest-related database operations
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
import type { HarvestPlan, HarvestTask, EquipmentItem } from "./firestore";

const HARVEST_PLANS_COLLECTION = "harvestPlans";
const HARVEST_TASKS_COLLECTION = "harvestTasks";
const EQUIPMENT_COLLECTION = "equipment";

// Helper function to convert Firestore timestamps
const convertTimestamp = (timestamp: any): Date => {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  if (timestamp?.toDate) return timestamp.toDate();
  if (typeof timestamp === "string") return new Date(timestamp);
  return new Date();
};

// ============================================================================
// HARVEST PLAN OPERATIONS
// ============================================================================

/**
 * Subscribe to harvest plans for a user
 */
export function subscribeToHarvestPlans(
  userId: string,
  callback: (plans: HarvestPlan[]) => void
) {
  const q = query(
    collection(db, HARVEST_PLANS_COLLECTION),
    where("userId", "==", userId),
    orderBy("estimatedHarvestDate", "asc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const plans = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          plantingDate: convertTimestamp(data.plantingDate),
          estimatedHarvestDate: convertTimestamp(data.estimatedHarvestDate),
          actualHarvestDate: convertTimestamp(data.actualHarvestDate),
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt),
        } as HarvestPlan;
      });
      callback(plans);
    },
    (error) => {
      console.error("Error subscribing to harvest plans:", error);
      callback([]);
    }
  );
}

/**
 * Get a single harvest plan
 */
export async function getHarvestPlan(id: string): Promise<HarvestPlan | null> {
  try {
    const docRef = doc(db, HARVEST_PLANS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        plantingDate: convertTimestamp(data.plantingDate),
        estimatedHarvestDate: convertTimestamp(data.estimatedHarvestDate),
        actualHarvestDate: convertTimestamp(data.actualHarvestDate),
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
      } as HarvestPlan;
    }
    return null;
  } catch (error) {
    console.error("Error getting harvest plan:", error);
    throw error;
  }
}

/**
 * Create a new harvest plan
 */
export async function createHarvestPlan(
  plan: Omit<HarvestPlan, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  try {
    const planData = {
      ...plan,
      plantingDate:
        plan.plantingDate instanceof Date
          ? Timestamp.fromDate(plan.plantingDate)
          : plan.plantingDate,
      estimatedHarvestDate:
        plan.estimatedHarvestDate instanceof Date
          ? Timestamp.fromDate(plan.estimatedHarvestDate)
          : plan.estimatedHarvestDate,
      actualHarvestDate: plan.actualHarvestDate
        ? plan.actualHarvestDate instanceof Date
          ? Timestamp.fromDate(plan.actualHarvestDate)
          : plan.actualHarvestDate
        : undefined,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const cleanData = Object.fromEntries(
      Object.entries(planData).filter(([_, value]) => value !== undefined)
    ) as any;

    const docRef = await addDoc(collection(db, HARVEST_PLANS_COLLECTION), cleanData);
    return docRef.id;
  } catch (error) {
    console.error("Error creating harvest plan:", error);
    throw error;
  }
}

/**
 * Update a harvest plan
 */
export async function updateHarvestPlan(
  id: string,
  updates: Partial<HarvestPlan>
): Promise<void> {
  try {
    const docRef = doc(db, HARVEST_PLANS_COLLECTION, id);
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now(),
    };

    if (updateData.plantingDate instanceof Date) {
      updateData.plantingDate = Timestamp.fromDate(updateData.plantingDate);
    }
    if (updateData.estimatedHarvestDate instanceof Date) {
      updateData.estimatedHarvestDate = Timestamp.fromDate(updateData.estimatedHarvestDate);
    }
    if (updateData.actualHarvestDate instanceof Date) {
      updateData.actualHarvestDate = Timestamp.fromDate(updateData.actualHarvestDate);
    }

    const cleanData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    await updateDoc(docRef, cleanData);
  } catch (error) {
    console.error("Error updating harvest plan:", error);
    throw error;
  }
}

/**
 * Delete a harvest plan
 */
export async function deleteHarvestPlan(id: string): Promise<void> {
  try {
    const docRef = doc(db, HARVEST_PLANS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting harvest plan:", error);
    throw error;
  }
}

// ============================================================================
// HARVEST TASK OPERATIONS
// ============================================================================

/**
 * Subscribe to harvest tasks for a user
 */
export function subscribeToHarvestTasks(
  userId: string,
  harvestPlanId?: string,
  callback?: (tasks: HarvestTask[]) => void
) {
  const constraints: any[] = [where("userId", "==", userId)];

  if (harvestPlanId) {
    constraints.push(where("harvestPlanId", "==", harvestPlanId));
  }

  constraints.push(orderBy("createdAt", "desc"));

  const q = query(collection(db, HARVEST_TASKS_COLLECTION), ...constraints);

  if (callback) {
    return onSnapshot(
      q,
      (snapshot) => {
        const tasks = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            dueDate: convertTimestamp(data.dueDate),
            completedAt: convertTimestamp(data.completedAt),
            createdAt: convertTimestamp(data.createdAt),
            updatedAt: convertTimestamp(data.updatedAt),
          } as HarvestTask;
        });
        callback(tasks);
      },
      (error) => {
        console.error("Error subscribing to harvest tasks:", error);
        if (callback) callback([]);
      }
    );
  }

  return () => {};
}

/**
 * Create a new harvest task
 */
export async function createHarvestTask(
  task: Omit<HarvestTask, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  try {
    const taskData = {
      ...task,
      dueDate: task.dueDate
        ? task.dueDate instanceof Date
          ? Timestamp.fromDate(task.dueDate)
          : task.dueDate
        : undefined,
      completedAt: task.completedAt
        ? task.completedAt instanceof Date
          ? Timestamp.fromDate(task.completedAt)
          : task.completedAt
        : undefined,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const cleanData = Object.fromEntries(
      Object.entries(taskData).filter(([_, value]) => value !== undefined)
    ) as any;

    const docRef = await addDoc(collection(db, HARVEST_TASKS_COLLECTION), cleanData);
    return docRef.id;
  } catch (error) {
    console.error("Error creating harvest task:", error);
    throw error;
  }
}

/**
 * Update a harvest task
 */
export async function updateHarvestTask(
  id: string,
  updates: Partial<HarvestTask>
): Promise<void> {
  try {
    const docRef = doc(db, HARVEST_TASKS_COLLECTION, id);
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now(),
    };

    if (updateData.dueDate instanceof Date) {
      updateData.dueDate = Timestamp.fromDate(updateData.dueDate);
    }
    if (updateData.completedAt instanceof Date) {
      updateData.completedAt = Timestamp.fromDate(updateData.completedAt);
    }

    const cleanData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    await updateDoc(docRef, cleanData);
  } catch (error) {
    console.error("Error updating harvest task:", error);
    throw error;
  }
}

/**
 * Delete a harvest task
 */
export async function deleteHarvestTask(id: string): Promise<void> {
  try {
    const docRef = doc(db, HARVEST_TASKS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting harvest task:", error);
    throw error;
  }
}

// ============================================================================
// EQUIPMENT OPERATIONS
// ============================================================================

/**
 * Subscribe to equipment for a user
 */
export function subscribeToEquipment(
  userId: string,
  callback: (equipment: EquipmentItem[]) => void
) {
  const q = query(
    collection(db, EQUIPMENT_COLLECTION),
    where("userId", "==", userId),
    orderBy("name", "asc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const equipment = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          lastMaintenance: convertTimestamp(data.lastMaintenance),
          nextMaintenance: convertTimestamp(data.nextMaintenance),
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt),
        } as EquipmentItem;
      });
      callback(equipment);
    },
    (error) => {
      console.error("Error subscribing to equipment:", error);
      callback([]);
    }
  );
}

/**
 * Create a new equipment item
 */
export async function createEquipment(
  equipment: Omit<EquipmentItem, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  try {
    const equipmentData = {
      ...equipment,
      lastMaintenance: equipment.lastMaintenance
        ? equipment.lastMaintenance instanceof Date
          ? Timestamp.fromDate(equipment.lastMaintenance)
          : equipment.lastMaintenance
        : undefined,
      nextMaintenance: equipment.nextMaintenance
        ? equipment.nextMaintenance instanceof Date
          ? Timestamp.fromDate(equipment.nextMaintenance)
          : equipment.nextMaintenance
        : undefined,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const cleanData = Object.fromEntries(
      Object.entries(equipmentData).filter(([_, value]) => value !== undefined)
    ) as any;

    const docRef = await addDoc(collection(db, EQUIPMENT_COLLECTION), cleanData);
    return docRef.id;
  } catch (error) {
    console.error("Error creating equipment:", error);
    throw error;
  }
}

/**
 * Update an equipment item
 */
export async function updateEquipment(
  id: string,
  updates: Partial<EquipmentItem>
): Promise<void> {
  try {
    const docRef = doc(db, EQUIPMENT_COLLECTION, id);
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now(),
    };

    if (updateData.lastMaintenance instanceof Date) {
      updateData.lastMaintenance = Timestamp.fromDate(updateData.lastMaintenance);
    }
    if (updateData.nextMaintenance instanceof Date) {
      updateData.nextMaintenance = Timestamp.fromDate(updateData.nextMaintenance);
    }

    const cleanData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    await updateDoc(docRef, cleanData);
  } catch (error) {
    console.error("Error updating equipment:", error);
    throw error;
  }
}

/**
 * Delete an equipment item
 */
export async function deleteEquipment(id: string): Promise<void> {
  try {
    const docRef = doc(db, EQUIPMENT_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting equipment:", error);
    throw error;
  }
}

