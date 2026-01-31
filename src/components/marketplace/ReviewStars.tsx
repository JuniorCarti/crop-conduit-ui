import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type ReviewStarsSize = "sm" | "md" | "lg";

interface ReviewStarsProps {
  rating: number;
  max?: number;
  size?: ReviewStarsSize;
  className?: string;
  onChange?: (nextRating: number) => void;
  disabled?: boolean;
}

const sizeClasses: Record<ReviewStarsSize, string> = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

export function ReviewStars({
  rating,
  max = 5,
  size = "md",
  className,
  onChange,
  disabled = false,
}: ReviewStarsProps) {
  const safeRating = Number.isFinite(rating) ? rating : 0;
  const fullStars = Math.floor(safeRating);
  const starSizeClass = sizeClasses[size];

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {Array.from({ length: max }, (_, index) => {
        const starNumber = index + 1;
        const isFilled = starNumber <= fullStars;
        const interactive = Boolean(onChange) && !disabled;

        return (
          <button
            key={starNumber}
            type="button"
            onClick={() => interactive && onChange?.(starNumber)}
            className={cn(interactive ? "cursor-pointer" : "cursor-default")}
            disabled={!interactive}
            aria-label={`Rate ${starNumber} out of ${max}`}
          >
            <Star
              className={cn(
                starSizeClass,
                isFilled ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

export default ReviewStars;

