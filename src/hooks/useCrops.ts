/**
 * React Query hooks for Firestore Crops
 */

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscribeToCrops,
  getCrop,
  createCrop,
  updateCrop,
  deleteCrop,
  subscribeToCropActivities,
  subscribeToCropRecommendations,
  subscribeToCropGrowthData,
  addCropActivity,
  addCropGrowthData,
  type Crop,
  type CropActivity,
  type CropRecommendation,
  type CropGrowthData,
} from "@/services/firestore";
import { toast } from "sonner";

// ============================================================================
// CROPS HOOKS
// ============================================================================

interface UseCropsFilters {
  type?: string;
  status?: string;
  search?: string;
  sortBy?: "plantingDate" | "harvestDate" | "estimatedYield" | "name";
  sortOrder?: "asc" | "desc";
}

/**
 * Hook to get all crops with real-time updates
 */
export function useCrops(filters?: UseCropsFilters) {
  const { currentUser } = useAuth();
  const [crops, setCrops] = useState<Crop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!currentUser?.uid) {
      console.log("[useCrops] No user ID, skipping fetch");
      setIsLoading(false);
      setCrops([]);
      return;
    }

    console.log(`[useCrops] Setting up subscription for user ${currentUser.uid}`);
    setIsLoading(true);
    setError(null);

    let unsubscribe: (() => void) | null = null;

    try {
      unsubscribe = subscribeToCrops(
        currentUser.uid,
        (data) => {
          console.log(`[useCrops] Received ${data.length} crops from Firestore`);
          console.log("[useCrops] Crop IDs:", data.map(c => c.id));
          setCrops(data);
          setIsLoading(false);
          setError(null);
        },
        filters
      );
      
      if (!unsubscribe) {
        throw new Error("Failed to set up Firestore subscription");
      }
    } catch (error: any) {
      console.error("[useCrops] Error setting up subscription:", error);
      setError(new Error(error.message || "Failed to fetch crops"));
      setIsLoading(false);
      setCrops([]);
    }

    return () => {
      if (unsubscribe) {
        console.log("[useCrops] Cleaning up subscription");
        unsubscribe();
      }
    };
  }, [currentUser?.uid, filters?.type, filters?.status, filters?.search, filters?.sortBy, filters?.sortOrder]);

  return { crops, isLoading, error };
}

/**
 * Hook to get a single crop
 */
export function useCrop(cropId: string | null) {
  return useQuery({
    queryKey: ["crop", cropId],
    queryFn: () => (cropId ? getCrop(cropId) : null),
    enabled: !!cropId,
    staleTime: 0, // Always fetch fresh data
  });
}

/**
 * Hook to create a new crop
 */
export function useCreateCrop() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  return useMutation({
    mutationFn: async (crop: Omit<Crop, "id" | "createdAt" | "updatedAt">) => {
      if (!currentUser?.uid) {
        throw new Error("User not authenticated");
      }
      return createCrop({ ...crop, userId: currentUser.uid });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crops"] });
      toast.success("Crop added successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add crop");
    },
  });
}

/**
 * Hook to update a crop
 */
export function useUpdateCrop() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cropId, updates }: { cropId: string; updates: Partial<Crop> }) => {
      return updateCrop(cropId, updates);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["crops"] });
      queryClient.invalidateQueries({ queryKey: ["crop", variables.cropId] });
      toast.success("Crop updated successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update crop");
    },
  });
}

/**
 * Hook to delete a crop
 */
export function useDeleteCrop() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCrop,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crops"] });
      toast.success("Crop deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete crop");
    },
  });
}

// ============================================================================
// CROP ACTIVITIES HOOKS
// ============================================================================

/**
 * Hook to get crop activities with real-time updates
 */
export function useCropActivities(cropId: string | null) {
  const [activities, setActivities] = useState<CropActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!cropId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = subscribeToCropActivities(cropId, (data) => {
      setActivities(data);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [cropId]);

  return { activities, isLoading };
}

/**
 * Hook to add a crop activity
 */
export function useAddCropActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addCropActivity,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cropActivities", variables.cropId] });
      toast.success("Activity recorded successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to record activity");
    },
  });
}

// ============================================================================
// CROP RECOMMENDATIONS HOOKS
// ============================================================================

/**
 * Hook to get crop recommendations with real-time updates
 */
export function useCropRecommendations(cropId: string | null) {
  const [recommendations, setRecommendations] = useState<CropRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!cropId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = subscribeToCropRecommendations(cropId, (data) => {
      setRecommendations(data);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [cropId]);

  return { recommendations, isLoading };
}

// ============================================================================
// CROP GROWTH DATA HOOKS
// ============================================================================

/**
 * Hook to get crop growth data with real-time updates (for charts)
 */
export function useCropGrowthData(cropId: string | null) {
  const [growthData, setGrowthData] = useState<CropGrowthData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!cropId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = subscribeToCropGrowthData(cropId, (data) => {
      setGrowthData(data);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [cropId]);

  return { growthData, isLoading };
}

/**
 * Hook to add growth data point
 */
export function useAddGrowthData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addCropGrowthData,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["growthData", variables.cropId] });
      toast.success("Growth data recorded!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to record growth data");
    },
  });
}

