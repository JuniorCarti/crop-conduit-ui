import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Listing } from "@/features/marketplace/models/types";
import { ReviewStars } from "@/components/marketplace/ReviewStars";
import { useSubmitReview } from "@/hooks/useReviews";

const MAX_COMMENT_LENGTH = 500;

interface ReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listing: Listing;
  buyer: {
    id: string;
    name: string;
  };
  onSubmitted?: () => void;
}

export function ReviewModal({ open, onOpenChange, listing, buyer, onSubmitted }: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const { submit, isSubmitting } = useSubmitReview();

  const remainingChars = useMemo(
    () => Math.max(0, MAX_COMMENT_LENGTH - comment.length),
    [comment.length]
  );

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setRating(0);
      setComment("");
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = async () => {
    if (rating < 1 || rating > 5) {
      toast.error("Please select a star rating.");
      return;
    }

    if (comment.length > MAX_COMMENT_LENGTH) {
      toast.error("Comment is too long.");
      return;
    }

    try {
      await submit(listing, buyer, rating, comment);
      handleClose(false);
      onSubmitted?.();
    } catch {
      // Error is already handled in the hook.
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Write a Review</DialogTitle>
          <DialogDescription>
            Share your experience for "{listing.title}".
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Rating *</p>
            <ReviewStars rating={rating} onChange={setRating} size="lg" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">Comment</p>
              <span className="text-xs text-muted-foreground">{remainingChars} remaining</span>
            </div>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, MAX_COMMENT_LENGTH))}
              placeholder="What went well? Quality, delivery, communication..."
              rows={5}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Review"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ReviewModal;

