/**
 * Next Harvest Hooks
 * Real-time hooks for harvest schedule
 */

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import * as NextHarvestService from "../services/nextHarvestService";
import type { NextHarvest } from "../services/nextHarvestService";

/**
 * Subscribe to next harvest schedule with real-time updates
 */
export function useNextHarvest() {
  const { currentUser } = useAuth();
  const [harvests, setHarvests] = useState<NextHarvest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.uid) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = NextHarvestService.subscribeToNextHarvest(
      currentUser.uid,
      (data) => {
        setHarvests(data);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid]);

  return { harvests, isLoading };
}

/**
 * Get next harvest for a specific field
 */
export function useNextHarvestByField(fieldId: string | null) {
  const [harvest, setHarvest] = useState<NextHarvest | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!fieldId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    NextHarvestService.getNextHarvest(fieldId).then((data) => {
      setHarvest(data);
      setIsLoading(false);
    });
  }, [fieldId]);

  return { harvest, isLoading };
}

/**
 * Get estimated supply for a crop
 */
export function useEstimatedSupply(cropName: string | null) {
  const { currentUser } = useAuth();
  const [supply, setSupply] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.uid || !cropName) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    NextHarvestService.getEstimatedSupply(currentUser.uid, cropName).then((data) => {
      setSupply(data);
      setIsLoading(false);
    });
  }, [currentUser?.uid, cropName]);

  return { supply, isLoading };
}

/**
 * Create or update next harvest mutation
 */
export function useCreateNextHarvest() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  return useMutation({
    mutationFn: async (harvest: Omit<NextHarvest, "id" | "createdAt" | "updatedAt">) => {
      if (!currentUser?.uid) throw new Error("User must be authenticated");
      return NextHarvestService.saveNextHarvest({
        ...harvest,
        userId: currentUser.uid,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nextHarvest"] });
      queryClient.invalidateQueries({ queryKey: ["harvestSchedule"] });
      toast.success("Harvest schedule saved successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save harvest schedule");
    },
  });
}

/**
 * Update next harvest mutation
 */
export function useUpdateNextHarvest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<NextHarvest>;
    }) => {
      // For now, use saveNextHarvest which handles update logic
      // In production, you might want a separate update function
      const existing = await NextHarvestService.getNextHarvest(updates.fieldId || "");
      if (existing?.id) {
        const { updateDoc, doc } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase");
        const { Timestamp } = await import("firebase/firestore");
        
        const docRef = doc(db, "next_harvest", existing.id);
        await updateDoc(docRef, {
          ...updates,
          optimalDate: updates.optimalDate instanceof Date 
            ? Timestamp.fromDate(updates.optimalDate) 
            : updates.optimalDate,
          updatedAt: Timestamp.now(),
        });
        return existing.id;
      }
      throw new Error("Harvest record not found");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nextHarvest"] });
      queryClient.invalidateQueries({ queryKey: ["harvestSchedule"] });
      toast.success("Harvest schedule updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update harvest schedule");
    },
  });
}
