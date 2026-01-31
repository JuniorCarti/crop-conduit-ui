import { useCallback, useEffect, useMemo, useState } from "react";
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import { toast } from "sonner";
import type { Listing } from "@/features/marketplace/models/types";
import type { Review, ReviewEligibility } from "@/types/review";
import {
  getListingReviews,
  getMyReview,
  hasDeliveredOrder,
  submitReview as submitReviewService,
} from "@/services/reviewService";

const DEFAULT_PAGE_SIZE = 10;

export function useListingReviews(listingId: string | null, pageSize: number = DEFAULT_PAGE_SIZE) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const refresh = useCallback(async () => {
    if (!listingId) {
      setReviews([]);
      setCursor(null);
      setHasMore(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const page = await getListingReviews(listingId, pageSize, null);
      setReviews(page.reviews);
      setCursor(page.cursor);
      setHasMore(page.hasMore);
    } catch (error) {
      console.error("Failed to load reviews:", error);
      toast.error("Failed to load reviews.");
      setReviews([]);
      setCursor(null);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [listingId, pageSize]);

  const loadMore = useCallback(async () => {
    if (!listingId || !cursor || !hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const page = await getListingReviews(listingId, pageSize, cursor);
      setReviews((prev) => [...prev, ...page.reviews]);
      setCursor(page.cursor);
      setHasMore(page.hasMore);
    } catch (error) {
      console.error("Failed to load more reviews:", error);
      toast.error("Failed to load more reviews.");
    } finally {
      setIsLoadingMore(false);
    }
  }, [cursor, hasMore, isLoadingMore, listingId, pageSize]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    reviews,
    hasMore,
    isLoading,
    isLoadingMore,
    refresh,
    loadMore,
  };
}

export function useMyReview(listingId: string | null, uid: string | null) {
  const [review, setReview] = useState<Review | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!listingId || !uid) {
      setReview(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const result = await getMyReview(listingId, uid);
      setReview(result);
    } catch (error) {
      console.error("Failed to load my review:", error);
      setReview(null);
    } finally {
      setIsLoading(false);
    }
  }, [listingId, uid]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { review, isLoading, refresh };
}

export function useReviewEligibility(listingId: string | null, uid: string | null) {
  const [eligibility, setEligibility] = useState<ReviewEligibility>({
    eligible: false,
    hasDeliveredOrder: false,
    hasReview: false,
  });
  const [isChecking, setIsChecking] = useState(false);

  const refresh = useCallback(async () => {
    if (!listingId || !uid) {
      setEligibility({ eligible: false, hasDeliveredOrder: false, hasReview: false });
      setIsChecking(false);
      return;
    }

    setIsChecking(true);
    try {
      const [delivered, existingReview] = await Promise.all([
        hasDeliveredOrder(listingId, uid),
        getMyReview(listingId, uid),
      ]);
      const hasReview = Boolean(existingReview);
      setEligibility({
        hasDeliveredOrder: delivered,
        hasReview,
        eligible: delivered && !hasReview,
      });
    } catch (error) {
      console.error("Failed to check review eligibility:", error);
      setEligibility({ eligible: false, hasDeliveredOrder: false, hasReview: false });
    } finally {
      setIsChecking(false);
    }
  }, [listingId, uid]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...eligibility, isChecking, refresh };
}

export function useSubmitReview() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = useCallback(
    async (listing: Listing, buyer: { id: string; name: string }, rating: number, comment: string) => {
      setIsSubmitting(true);
      try {
        await submitReviewService(listing, buyer, rating, comment);
        toast.success("Review submitted.");
      } catch (error) {
        console.error("Failed to submit review:", error);
        toast.error((error as Error)?.message || "Failed to submit review.");
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  return useMemo(
    () => ({
      submit,
      isSubmitting,
    }),
    [isSubmitting, submit]
  );
}

