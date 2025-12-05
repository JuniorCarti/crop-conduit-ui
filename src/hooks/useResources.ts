/**
 * React hooks for Firestore Resources
 */

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscribeToResources,
  getResource,
  createResource,
  updateResource,
  deleteResource,
  subscribeToResourceUsage,
  addResourceUsage,
  subscribeToSuppliers,
  createSupplier,
  type Resource,
  type ResourceUsage,
  type Supplier,
} from "@/services/firestore";
import { toast } from "sonner";

// ============================================================================
// RESOURCES HOOKS
// ============================================================================

interface UseResourcesFilters {
  type?: string;
  cropId?: string;
  search?: string;
  sortBy?: "name" | "unitCost" | "totalCost" | "applicationDate" | "recommendedQuantity";
  sortOrder?: "asc" | "desc";
}

/**
 * Hook to get all resources with real-time updates
 */
export function useResources(filters?: UseResourcesFilters) {
  const { currentUser } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!currentUser?.uid) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = subscribeToResources(
      currentUser.uid,
      (data) => {
        setResources(data);
        setIsLoading(false);
      },
      filters
    );

    return () => {
      unsubscribe();
    };
  }, [
    currentUser?.uid,
    filters?.type,
    filters?.cropId,
    filters?.search,
    filters?.sortBy,
    filters?.sortOrder,
  ]);

  return { resources, isLoading, error };
}

/**
 * Hook to get a single resource
 */
export function useResource(resourceId: string | null) {
  const { currentUser } = useAuth();
  const [resource, setResource] = useState<Resource | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!resourceId || !currentUser?.uid) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    getResource(resourceId)
      .then((data) => {
        setResource(data);
        setIsLoading(false);
      })
      .catch(() => {
        setResource(null);
        setIsLoading(false);
      });
  }, [resourceId, currentUser?.uid]);

  return { resource, isLoading };
}

/**
 * Hook to create a new resource
 */
export function useCreateResource() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  return useMutation({
    mutationFn: async (resource: Omit<Resource, "id" | "createdAt" | "updatedAt">) => {
      if (!currentUser?.uid) {
        throw new Error("User not authenticated");
      }
      return createResource({ ...resource, userId: currentUser.uid });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      toast.success("Resource added successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add resource");
    },
  });
}

/**
 * Hook to update a resource
 */
export function useUpdateResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ resourceId, updates }: { resourceId: string; updates: Partial<Resource> }) => {
      return updateResource(resourceId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      toast.success("Resource updated successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update resource");
    },
  });
}

/**
 * Hook to delete a resource
 */
export function useDeleteResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteResource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      toast.success("Resource deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete resource");
    },
  });
}

// ============================================================================
// RESOURCE USAGE HOOKS
// ============================================================================

/**
 * Hook to get resource usage with real-time updates
 */
export function useResourceUsage(resourceId?: string) {
  const { currentUser } = useAuth();
  const [usage, setUsage] = useState<ResourceUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.uid) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = subscribeToResourceUsage(
      currentUser.uid,
      resourceId,
      (data) => {
        setUsage(data);
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [currentUser?.uid, resourceId]);

  return { usage, isLoading };
}

/**
 * Hook to add resource usage
 */
export function useAddResourceUsage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addResourceUsage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resourceUsage"] });
      toast.success("Usage recorded successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to record usage");
    },
  });
}

// ============================================================================
// SUPPLIERS HOOKS
// ============================================================================

/**
 * Hook to get suppliers with real-time updates
 */
export function useSuppliers() {
  const { currentUser } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.uid) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = subscribeToSuppliers(currentUser.uid, (data) => {
      setSuppliers(data);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser?.uid]);

  return { suppliers, isLoading };
}

/**
 * Hook to create a supplier
 */
export function useCreateSupplier() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  return useMutation({
    mutationFn: async (supplier: Omit<Supplier, "id" | "createdAt">) => {
      if (!currentUser?.uid) {
        throw new Error("User not authenticated");
      }
      return createSupplier({ ...supplier, userId: currentUser.uid });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier added successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add supplier");
    },
  });
}

