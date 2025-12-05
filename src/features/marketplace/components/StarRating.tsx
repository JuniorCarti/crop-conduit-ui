/**
 * Star Rating Component
 * Interactive star rating with real-time updates and optimistic UI
 */

import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface StarRatingProps {
  rating: number; // 0-5, can be decimal
  count?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onRate?: (rating: number) => void;
  isLoading?: boolean;
  showCount?: boolean;
  className?: string;
}

export function StarRating({
  rating,
  count = 0,
  size = "md",
  interactive = false,
  onRate,
  isLoading = false,
  showCount = true,
  className,
}: StarRatingProps) {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [pendingRating, setPendingRating] = useState<number | null>(null);

  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const displayRating = pendingRating ?? hoveredRating ?? rating;

  const handleClick = (value: number) => {
    if (interactive && onRate) {
      setPendingRating(value);
      onRate(value);
      // Clear pending after a delay (optimistic UI)
      setTimeout(() => setPendingRating(null), 2000);
    }
  };

  if (isLoading) {
    return <Skeleton className="h-4 w-24" />;
  }

  return (
    <TooltipProvider>
      <div className={cn("flex items-center gap-1", className)}>
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((value) => {
            const isFilled = value <= Math.round(displayRating);
            const isHalf = value - 0.5 <= displayRating && displayRating < value;

            return (
              <Tooltip key={value}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => handleClick(value)}
                    onMouseEnter={() => interactive && setHoveredRating(value)}
                    onMouseLeave={() => setHoveredRating(null)}
                    disabled={!interactive || isLoading}
                    className={cn(
                      "transition-colors",
                      interactive && "cursor-pointer hover:scale-110",
                      !interactive && "cursor-default",
                      pendingRating && "opacity-70"
                    )}
                  >
                    <Star
                      className={cn(
                        sizeClasses[size],
                        isFilled
                          ? "fill-yellow-400 text-yellow-400"
                          : isHalf
                            ? "fill-yellow-200 text-yellow-200"
                            : "fill-none text-muted-foreground"
                      )}
                    />
                  </button>
                </TooltipTrigger>
                {interactive && (
                  <TooltipContent>
                    <p>Rate {value} star{value !== 1 ? "s" : ""}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </div>
        {showCount && (
          <span className="text-xs text-muted-foreground ml-1">
            ({displayRating.toFixed(1)} {count > 0 && `• ${count} review${count !== 1 ? "s" : ""}`})
          </span>
        )}
        {pendingRating && (
          <span className="text-xs text-muted-foreground ml-1 animate-pulse">
            Saving...
          </span>
        )}
      </div>
    </TooltipProvider>
  );
}

/**
 * Star Rating Input Component
 * For submitting new ratings
 */
interface StarRatingInputProps {
  value: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
  label?: string;
}

export function StarRatingInput({
  value,
  onChange,
  disabled = false,
  label,
}: StarRatingInputProps) {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);

  const displayRating = hoveredRating ?? value;

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium">{label}</label>}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => !disabled && onChange(rating)}
              onMouseEnter={() => !disabled && setHoveredRating(rating)}
              onMouseLeave={() => setHoveredRating(null)}
              disabled={disabled}
              className={cn(
                "transition-all",
                !disabled && "cursor-pointer hover:scale-110",
                disabled && "cursor-not-allowed opacity-50"
              )}
            >
              <Star
                className={cn(
                  "h-6 w-6",
                  rating <= displayRating
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-none text-muted-foreground"
                )}
              />
            </button>
          ))}
        </div>
        {value > 0 && (
          <span className="text-sm text-muted-foreground">
            {value} star{value !== 1 ? "s" : ""}
          </span>
        )}
      </div>
    </div>
  );
}
