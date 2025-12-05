/**
 * Field Health Hooks
 * Real-time hooks for field health monitoring
 */

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import * as FieldHealthService from "../services/fieldHealthService";
import type { FieldHealth } from "../services/fieldHealthService";

/**
 * Subscribe to field health data with real-time updates
 */
export function useFieldHealth() {
  const { currentUser } = useAuth();
  const [health, setHealth] = useState<FieldHealth[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.uid) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = FieldHealthService.subscribeToFieldHealth(
      currentUser.uid,
      (data) => {
        setHealth(data);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid]);

  return { health, isLoading };
}

/**
 * Get field health for a specific field
 */
export function useFieldHealthByField(fieldId: string | null) {
  const [health, setHealth] = useState<FieldHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!fieldId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    FieldHealthService.getFieldHealth(fieldId).then((data) => {
      setHealth(data);
      setIsLoading(false);
    });
  }, [fieldId]);

  return { health, isLoading };
}

/**
 * Save field health mutation
 */
export function useSaveFieldHealth() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  return useMutation({
    mutationFn: async (health: Omit<FieldHealth, "id" | "createdAt" | "updatedAt">) => {
      if (!currentUser?.uid) throw new Error("User must be authenticated");
      return FieldHealthService.saveFieldHealth({
        ...health,
        userId: currentUser.uid,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fieldHealth"] });
      toast.success("Field health updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save field health");
    },
  });
}
