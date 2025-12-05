/**
 * React hooks for Firestore Storage Optimizer
 */

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscribeToStorageUnits,
  createStorageUnit,
  updateStorageUnit,
  deleteStorageUnit,
  subscribeToStoredCrops,
  getStoredCrop,
  createStoredCrop,
  updateStoredCrop,
  deleteStoredCrop,
  subscribeToStorageAlerts,
  createStorageAlert,
  updateStorageAlert,
  deleteStorageAlert,
  type StorageUnit,
  type StoredCrop,
  type StorageAlert,
} from "@/services/firestore-storage";
import { toast } from "sonner";

// ============================================================================
// STORAGE UNIT HOOKS
// ============================================================================

export function useStorageUnits() {
  const { currentUser } = useAuth();
  const [units, setUnits] = useState<StorageUnit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!currentUser?.uid) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = subscribeToStorageUnits(
      currentUser.uid,
      (data) => {
        setUnits(data);
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [currentUser?.uid]);

  return { units, isLoading, error };
}

export function useCreateStorageUnit() {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (unit: Omit<StorageUnit, "id" | "createdAt" | "updatedAt" | "userId">) => {
      if (!currentUser?.uid) {
        throw new Error("User not authenticated");
      }
      return createStorageUnit({
        ...unit,
        userId: currentUser.uid,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storageUnits"] });
      toast.success("Storage unit created successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create storage unit");
    },
  });
}

export function useUpdateStorageUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<StorageUnit> }) => {
      return updateStorageUnit(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storageUnits"] });
      toast.success("Storage unit updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update storage unit");
    },
  });
}

export function useDeleteStorageUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return deleteStorageUnit(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storageUnits"] });
      toast.success("Storage unit deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete storage unit");
    },
  });
}

// ============================================================================
// STORED CROP HOOKS
// ============================================================================

export function useStoredCrops(storageUnitId?: string) {
  const { currentUser } = useAuth();
  const [crops, setCrops] = useState<StoredCrop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!currentUser?.uid) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = subscribeToStoredCrops(
      currentUser.uid,
      storageUnitId,
      (data) => {
        setCrops(data);
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [currentUser?.uid, storageUnitId]);

  return { crops, isLoading, error };
}

export function useStoredCrop(cropId: string | null) {
  const { currentUser } = useAuth();
  const [crop, setCrop] = useState<StoredCrop | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!cropId || !currentUser?.uid) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    getStoredCrop(cropId)
      .then((data) => {
        setCrop(data);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err);
        setIsLoading(false);
      });
  }, [cropId, currentUser?.uid]);

  return { crop, isLoading, error };
}

export function useCreateStoredCrop() {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (crop: Omit<StoredCrop, "id" | "createdAt" | "updatedAt" | "userId">) => {
      if (!currentUser?.uid) {
        throw new Error("User not authenticated");
      }
      return createStoredCrop({
        ...crop,
        userId: currentUser.uid,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storedCrops"] });
      toast.success("Crop stored successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to store crop");
    },
  });
}

export function useUpdateStoredCrop() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<StoredCrop> }) => {
      return updateStoredCrop(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storedCrops"] });
      toast.success("Stored crop updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update stored crop");
    },
  });
}

export function useDeleteStoredCrop() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return deleteStoredCrop(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storedCrops"] });
      toast.success("Stored crop deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete stored crop");
    },
  });
}

// ============================================================================
// STORAGE ALERT HOOKS
// ============================================================================

export function useStorageAlerts(resolved?: boolean) {
  const { currentUser } = useAuth();
  const [alerts, setAlerts] = useState<StorageAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!currentUser?.uid) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = subscribeToStorageAlerts(
      currentUser.uid,
      resolved,
      (data) => {
        setAlerts(data);
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [currentUser?.uid, resolved]);

  return { alerts, isLoading, error };
}

export function useCreateStorageAlert() {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alert: Omit<StorageAlert, "id" | "createdAt" | "userId">) => {
      if (!currentUser?.uid) {
        throw new Error("User not authenticated");
      }
      return createStorageAlert({
        ...alert,
        userId: currentUser.uid,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storageAlerts"] });
      toast.success("Alert created successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create alert");
    },
  });
}

export function useUpdateStorageAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<StorageAlert> }) => {
      return updateStorageAlert(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storageAlerts"] });
      toast.success("Alert updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update alert");
    },
  });
}

export function useDeleteStorageAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return deleteStorageAlert(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storageAlerts"] });
      toast.success("Alert deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete alert");
    },
  });
}

