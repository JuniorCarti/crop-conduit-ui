/**
 * React hooks for Firestore Harvest Planner
 */

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscribeToHarvestPlans,
  getHarvestPlan,
  createHarvestPlan,
  updateHarvestPlan,
  deleteHarvestPlan,
  subscribeToHarvestTasks,
  createHarvestTask,
  updateHarvestTask,
  deleteHarvestTask,
  subscribeToEquipment,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  type HarvestPlan,
  type HarvestTask,
  type EquipmentItem,
} from "@/services/firestore-harvest";
import { toast } from "sonner";

// ============================================================================
// HARVEST PLAN HOOKS
// ============================================================================

export function useHarvestPlans() {
  const { currentUser } = useAuth();
  const [plans, setPlans] = useState<HarvestPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!currentUser?.uid) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = subscribeToHarvestPlans(
      currentUser.uid,
      (data) => {
        setPlans(data);
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [currentUser?.uid]);

  return { plans, isLoading, error };
}

export function useHarvestPlan(planId: string | null) {
  const { currentUser } = useAuth();
  const [plan, setPlan] = useState<HarvestPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!planId || !currentUser?.uid) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    getHarvestPlan(planId)
      .then((data) => {
        setPlan(data);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err);
        setIsLoading(false);
      });
  }, [planId, currentUser?.uid]);

  return { plan, isLoading, error };
}

export function useCreateHarvestPlan() {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (plan: Omit<HarvestPlan, "id" | "createdAt" | "updatedAt" | "userId">) => {
      if (!currentUser?.uid) {
        throw new Error("User not authenticated");
      }
      return createHarvestPlan({
        ...plan,
        userId: currentUser.uid,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["harvestPlans"] });
      toast.success("Harvest plan created successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create harvest plan");
    },
  });
}

export function useUpdateHarvestPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<HarvestPlan> }) => {
      return updateHarvestPlan(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["harvestPlans"] });
      toast.success("Harvest plan updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update harvest plan");
    },
  });
}

export function useDeleteHarvestPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return deleteHarvestPlan(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["harvestPlans"] });
      toast.success("Harvest plan deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete harvest plan");
    },
  });
}

// ============================================================================
// HARVEST TASK HOOKS
// ============================================================================

export function useHarvestTasks(harvestPlanId?: string) {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState<HarvestTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!currentUser?.uid) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = subscribeToHarvestTasks(
      currentUser.uid,
      harvestPlanId,
      (data) => {
        setTasks(data);
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [currentUser?.uid, harvestPlanId]);

  return { tasks, isLoading, error };
}

export function useCreateHarvestTask() {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (task: Omit<HarvestTask, "id" | "createdAt" | "updatedAt" | "userId">) => {
      if (!currentUser?.uid) {
        throw new Error("User not authenticated");
      }
      return createHarvestTask({
        ...task,
        userId: currentUser.uid,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["harvestTasks"] });
      toast.success("Task created successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create task");
    },
  });
}

export function useUpdateHarvestTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<HarvestTask> }) => {
      return updateHarvestTask(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["harvestTasks"] });
      toast.success("Task updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update task");
    },
  });
}

export function useDeleteHarvestTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return deleteHarvestTask(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["harvestTasks"] });
      toast.success("Task deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete task");
    },
  });
}

// ============================================================================
// EQUIPMENT HOOKS
// ============================================================================

export function useEquipment() {
  const { currentUser } = useAuth();
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!currentUser?.uid) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = subscribeToEquipment(
      currentUser.uid,
      (data) => {
        setEquipment(data);
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [currentUser?.uid]);

  return { equipment, isLoading, error };
}

export function useCreateEquipment() {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: Omit<EquipmentItem, "id" | "createdAt" | "updatedAt" | "userId">) => {
      if (!currentUser?.uid) {
        throw new Error("User not authenticated");
      }
      return createEquipment({
        ...item,
        userId: currentUser.uid,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      toast.success("Equipment added successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add equipment");
    },
  });
}

export function useUpdateEquipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<EquipmentItem> }) => {
      return updateEquipment(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      toast.success("Equipment updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update equipment");
    },
  });
}

export function useDeleteEquipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return deleteEquipment(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      toast.success("Equipment deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete equipment");
    },
  });
}

