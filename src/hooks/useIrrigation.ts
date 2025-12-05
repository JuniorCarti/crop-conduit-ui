/**
 * React hooks for Firestore Irrigation Scheduler
 */

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscribeToIrrigationSchedules,
  getIrrigationSchedule,
  createIrrigationSchedule,
  updateIrrigationSchedule,
  deleteIrrigationSchedule,
  subscribeToWaterSources,
  createWaterSource,
  updateWaterSource,
  deleteWaterSource,
  subscribeToIrrigationEfficiency,
  addIrrigationEfficiency,
  type IrrigationSchedule,
  type WaterSource,
  type IrrigationEfficiency,
} from "@/services/firestore-irrigation";
import { toast } from "sonner";

// ============================================================================
// IRRIGATION SCHEDULE HOOKS
// ============================================================================

/**
 * Hook to get all irrigation schedules with real-time updates
 */
export function useIrrigationSchedules() {
  const { currentUser } = useAuth();
  const [schedules, setSchedules] = useState<IrrigationSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!currentUser?.uid) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = subscribeToIrrigationSchedules(
      currentUser.uid,
      (data) => {
        setSchedules(data);
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [currentUser?.uid]);

  return { schedules, isLoading, error };
}

/**
 * Hook to get a single irrigation schedule
 */
export function useIrrigationSchedule(scheduleId: string | null) {
  const { currentUser } = useAuth();
  const [schedule, setSchedule] = useState<IrrigationSchedule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!scheduleId || !currentUser?.uid) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    getIrrigationSchedule(scheduleId)
      .then((data) => {
        setSchedule(data);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err);
        setIsLoading(false);
      });
  }, [scheduleId, currentUser?.uid]);

  return { schedule, isLoading, error };
}

/**
 * Hook to create an irrigation schedule
 */
export function useCreateIrrigationSchedule() {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (schedule: Omit<IrrigationSchedule, "id" | "createdAt" | "updatedAt" | "userId">) => {
      if (!currentUser?.uid) {
        throw new Error("User not authenticated");
      }
      return createIrrigationSchedule({
        ...schedule,
        userId: currentUser.uid,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["irrigationSchedules"] });
      toast.success("Irrigation schedule created successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create irrigation schedule");
    },
  });
}

/**
 * Hook to update an irrigation schedule
 */
export function useUpdateIrrigationSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<IrrigationSchedule> }) => {
      return updateIrrigationSchedule(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["irrigationSchedules"] });
      toast.success("Irrigation schedule updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update irrigation schedule");
    },
  });
}

/**
 * Hook to delete an irrigation schedule
 */
export function useDeleteIrrigationSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return deleteIrrigationSchedule(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["irrigationSchedules"] });
      toast.success("Irrigation schedule deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete irrigation schedule");
    },
  });
}

// ============================================================================
// WATER SOURCE HOOKS
// ============================================================================

/**
 * Hook to get all water sources with real-time updates
 */
export function useWaterSources() {
  const { currentUser } = useAuth();
  const [sources, setSources] = useState<WaterSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!currentUser?.uid) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = subscribeToWaterSources(
      currentUser.uid,
      (data) => {
        setSources(data);
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [currentUser?.uid]);

  return { sources, isLoading, error };
}

/**
 * Hook to create a water source
 */
export function useCreateWaterSource() {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (source: Omit<WaterSource, "id" | "createdAt" | "updatedAt" | "userId">) => {
      if (!currentUser?.uid) {
        throw new Error("User not authenticated");
      }
      return createWaterSource({
        ...source,
        userId: currentUser.uid,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waterSources"] });
      toast.success("Water source created successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create water source");
    },
  });
}

/**
 * Hook to update a water source
 */
export function useUpdateWaterSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<WaterSource> }) => {
      return updateWaterSource(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waterSources"] });
      toast.success("Water source updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update water source");
    },
  });
}

/**
 * Hook to delete a water source
 */
export function useDeleteWaterSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return deleteWaterSource(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waterSources"] });
      toast.success("Water source deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete water source");
    },
  });
}

// ============================================================================
// IRRIGATION EFFICIENCY HOOKS
// ============================================================================

/**
 * Hook to get irrigation efficiency data
 */
export function useIrrigationEfficiency(cropId?: string) {
  const { currentUser } = useAuth();
  const [efficiency, setEfficiency] = useState<IrrigationEfficiency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!currentUser?.uid) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = subscribeToIrrigationEfficiency(
      currentUser.uid,
      cropId,
      (data) => {
        setEfficiency(data);
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [currentUser?.uid, cropId]);

  return { efficiency, isLoading, error };
}

/**
 * Hook to add irrigation efficiency data
 */
export function useAddIrrigationEfficiency() {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (efficiency: Omit<IrrigationEfficiency, "id" | "createdAt" | "userId">) => {
      if (!currentUser?.uid) {
        throw new Error("User not authenticated");
      }
      return addIrrigationEfficiency({
        ...efficiency,
        userId: currentUser.uid,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["irrigationEfficiency"] });
      toast.success("Efficiency data recorded successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to record efficiency data");
    },
  });
}

