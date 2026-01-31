import { useMemo, useState } from "react";
import { Loader2, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Listing } from "@/features/marketplace/models/types";
import { ReviewStars } from "@/components/marketplace/ReviewStars";
import { ReviewModal } from "@/components/marketplace/ReviewModal";
import { useListingReviews, useReviewEligibility } from "@/hooks/useReviews";

interface ReviewsSectionProps {
  listing: Listing;
  currentUser: {
    uid?: string | null;
    displayName?: string | null;
  } | null;
}

function formatReviewDate(value: unknown): string {
  const date = value instanceof Date ? value : new Date(value as string | number);
  if (Number.isNaN(date.getTime())) return "Recently";
  return format(date, "MMM d, yyyy");
}

export function ReviewsSection({ listing, currentUser }: ReviewsSectionProps) {
  const listingId = listing.id ?? null;
  const uid = currentUser?.uid ?? null;
  const buyerName = currentUser?.displayName?.trim() || "Anonymous buyer";

  const [isModalOpen, setIsModalOpen] = useState(false);
  const { reviews, hasMore, isLoading, isLoadingMore, loadMore, refresh } = useListingReviews(listingId);
  const { eligible, hasDeliveredOrder, hasReview, isChecking, refresh: refreshEligibility } =
    useReviewEligibility(listingId, uid);

  const avgRating = useMemo(() => (typeof listing.avgRating === "number" ? listing.avgRating : 0), [listing.avgRating]);
  const reviewCount = useMemo(
    () => (typeof listing.reviewCount === "number" ? listing.reviewCount : 0),
    [listing.reviewCount]
  );

  const summaryText =
    reviewCount > 0 ? `${avgRating.toFixed(1)} (${reviewCount})` : "No reviews yet";

  const handleReviewSubmitted = async () => {
    await Promise.all([refresh(), refreshEligibility()]);
  };

  return (
    <section className="space-y-4 pt-4 border-t">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">Reviews</h3>
          <p className="text-sm text-muted-foreground">See what buyers are saying</p>
        </div>
        {uid && (
          <div className="flex flex-col items-end gap-1">
            {eligible ? (
              <Button type="button" size="sm" onClick={() => setIsModalOpen(true)} disabled={isChecking}>
                Write a review
              </Button>
            ) : (
              <Button type="button" size="sm" variant="outline" disabled>
                Write a review
              </Button>
            )}
            {!eligible && !isChecking && (
              <p className="text-xs text-muted-foreground">
                {hasReview
                  ? "You already reviewed this listing."
                  : hasDeliveredOrder
                    ? "Review is unavailable."
                    : "Delivered orders can leave reviews."}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <ReviewStars rating={avgRating} size="md" />
        <Badge variant="secondary" className="gap-2">
          {summaryText}
        </Badge>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/60 p-4 text-sm text-muted-foreground flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          No reviews yet. Be the first to share feedback.
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-lg border border-border/60 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{review.buyerName}</p>
                  <p className="text-xs text-muted-foreground">{formatReviewDate(review.createdAt)}</p>
                </div>
                <ReviewStars rating={review.rating} size="sm" />
              </div>
              {review.comment && (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{review.comment}</p>
              )}
            </div>
          ))}

          {hasMore && (
            <div className="pt-1">
              <Button type="button" variant="outline" size="sm" onClick={loadMore} disabled={isLoadingMore}>
                {isLoadingMore ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load more"
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {uid && listingId && (
        <ReviewModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          listing={listing}
          buyer={{ id: uid, name: buyerName }}
          onSubmitted={handleReviewSubmitted}
        />
      )}
    </section>
  );
}

export default ReviewsSection;

