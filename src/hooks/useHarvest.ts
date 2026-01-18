/**
 * React Hooks for Harvest Module
 * 
 * Provides hooks for fetching, subscribing to, and managing harvest data
 * with proper loading/error states and realtime updates
 */

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscribeToHarvestSchedules,
  subscribeToWorkers,
  subscribeToDeliveries,
  createWorker,
  updateWorker,
  deleteWorker,
  createDelivery,
  updateDelivery,
  deleteDelivery,
  createHarvestSchedule,
  updateHarvestSchedule,
  deleteHarvestSchedule,
} from "@/services/firestore-harvest";
import {
  HarvestSchedule,
  Worker,
  Delivery,
  CreateWorkerInput,
  CreateDeliveryInput,
  CreateHarvestScheduleInput,
  CollectionHookReturn,
  DocumentHookReturn,
} from "@/types/harvest";

// ============================================================================
// HARVEST SCHEDULES HOOK
// ============================================================================

/**
 * Hook to manage harvest schedules with realtime updates
 * Returns schedules, loading/error states, and CRUD operations
 */
export function useHarvestSchedules() {
  const { currentUser } = useAuth();
  const [schedules, setSchedules] = useState<HarvestSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false);
      setSchedules([]);
      return;
    }

    setLoading(true);
    setError(null);

    // Subscribe to realtime updates
    const unsubscribe = subscribeToHarvestSchedules(
      currentUser.uid,
      (data) => {
        setSchedules(data);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid]);

  const add = useCallback(
    async (data: CreateHarvestScheduleInput): Promise<HarvestSchedule> => {
      if (!currentUser?.uid) throw new Error("No user logged in");
      return createHarvestSchedule(currentUser.uid, data);
    },
    [currentUser?.uid]
  );

  const update = useCallback(
    async (scheduleId: string, data: Partial<CreateHarvestScheduleInput>) => {
      if (!currentUser?.uid) throw new Error("No user logged in");
      return updateHarvestSchedule(currentUser.uid, scheduleId, data);
    },
    [currentUser?.uid]
  );

  const remove = useCallback(
    async (scheduleId: string) => {
      if (!currentUser?.uid) throw new Error("No user logged in");
      return deleteHarvestSchedule(currentUser.uid, scheduleId);
    },
    [currentUser?.uid]
  );

  return { schedules, loading, error, add, update, remove };
}

// ============================================================================
// WORKERS HOOK
// ============================================================================

/**
 * Hook to manage workers with realtime updates
 * Returns workers, loading/error states, and CRUD operations
 */
export function useWorkers() {
  const { currentUser } = useAuth();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false);
      setWorkers([]);
      return;
    }

    setLoading(true);
    setError(null);

    // Subscribe to realtime updates
    const unsubscribe = subscribeToWorkers(
      currentUser.uid,
      (data) => {
        setWorkers(data);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid]);

  const add = useCallback(
    async (data: CreateWorkerInput): Promise<Worker> => {
      if (!currentUser?.uid) throw new Error("No user logged in");
      return createWorker(currentUser.uid, data);
    },
    [currentUser?.uid]
  );

  const update = useCallback(
    async (workerId: string, data: Partial<CreateWorkerInput>) => {
      if (!currentUser?.uid) throw new Error("No user logged in");
      return updateWorker(currentUser.uid, workerId, data);
    },
    [currentUser?.uid]
  );

  const remove = useCallback(
    async (workerId: string) => {
      if (!currentUser?.uid) throw new Error("No user logged in");
      return deleteWorker(currentUser.uid, workerId);
    },
    [currentUser?.uid]
  );

  return { workers, loading, error, add, update, remove };
}

// ============================================================================
// DELIVERIES HOOK
// ============================================================================

/**
 * Hook to manage deliveries with realtime updates
 * Returns deliveries, loading/error states, and CRUD operations
 */
export function useDeliveries() {
  const { currentUser } = useAuth();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false);
      setDeliveries([]);
      return;
    }

    setLoading(true);
    setError(null);

    // Subscribe to realtime updates
    const unsubscribe = subscribeToDeliveries(
      currentUser.uid,
      (data) => {
        setDeliveries(data);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid]);

  const add = useCallback(
    async (data: CreateDeliveryInput): Promise<Delivery> => {
      if (!currentUser?.uid) throw new Error("No user logged in");
      return createDelivery(currentUser.uid, data);
    },
    [currentUser?.uid]
  );

  const update = useCallback(
    async (deliveryId: string, data: Partial<CreateDeliveryInput> & { status?: Delivery["status"] }) => {
      if (!currentUser?.uid) throw new Error("No user logged in");
      return updateDelivery(currentUser.uid, deliveryId, data);
    },
    [currentUser?.uid]
  );

  const remove = useCallback(
    async (deliveryId: string) => {
      if (!currentUser?.uid) throw new Error("No user logged in");
      return deleteDelivery(currentUser.uid, deliveryId);
    },
    [currentUser?.uid]
  );

  return { deliveries, loading, error, add, update, remove };
}

// ============================================================================
// HELPER HOOKS
// ============================================================================

/**
 * Get workers assigned to a specific schedule
 */
export function useScheduleWorkers(scheduleId: string | null) {
  const { workers } = useWorkers();

  return workers.filter((w) => scheduleId && w.assignedScheduleIds.includes(scheduleId));
}

/**
 * Get deliveries for a specific schedule
 */
export function useScheduleDeliveries(scheduleId: string | null) {
  const { deliveries } = useDeliveries();

  return deliveries.filter((d) => scheduleId && d.scheduleId === scheduleId);
}

/**
 * Get pending deliveries (not yet delivered)
 */
export function usePendingDeliveries() {
  const { deliveries } = useDeliveries();

  return deliveries.filter(
    (d) => d.status !== "Delivered" && d.status !== "Cancelled"
  );
}

