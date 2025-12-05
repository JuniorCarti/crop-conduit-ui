/**
 * Rating Hooks with Real-time Updates
 */

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import * as RatingService from "../services/RatingService";
import type { Rating } from "../models/types";

/**
 * Subscribe to listing ratings with real-time updates
 */
export function useListingRatings(listingId: string | null) {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!listingId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = RatingService.subscribeToListingRatings(listingId, (data) => {
      setRatings(data);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [listingId]);

  return { ratings, isLoading };
}

/**
 * Subscribe to seller ratings with real-time updates
 */
export function useSellerRatings(sellerId: string | null) {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!sellerId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = RatingService.subscribeToSellerRatings(sellerId, (data) => {
      setRatings(data);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [sellerId]);

  return { ratings, isLoading };
}

/**
 * Subscribe to seller's aggregated rating summary (real-time)
 */
export function useSellerRatingSummary(sellerId: string | null) {
  const [summary, setSummary] = useState<{ avg: number; count: number }>({ avg: 0, count: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!sellerId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = RatingService.subscribeToSellerRatingSummary(sellerId, (data) => {
      setSummary(data);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [sellerId]);

  return { summary, isLoading };
}

/**
 * Create rating mutation with optimistic UI
 */
export function useCreateRating() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  return useMutation({
    mutationFn: async (rating: Omit<Rating, "id" | "createdAt">) => {
      if (!currentUser?.uid) throw new Error("User must be authenticated");
      return RatingService.createRating({
        ...rating,
        fromUserId: currentUser.uid,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ratings"] });
      toast.success("Rating submitted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to submit rating");
    },
  });
}
