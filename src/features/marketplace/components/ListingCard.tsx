/**
 * Listing Card Component
 * Displays a single listing in a card format
 */

import { MapPin, Calendar } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatKsh } from "@/lib/currency";
import type { Listing } from "../models/types";
import { format } from "date-fns";
import { ReviewStars } from "@/components/marketplace/ReviewStars";

interface ListingCardProps {
  listing: Listing;
  onClick?: () => void;
  showActions?: boolean;
  onEdit?: () => void;
  editDisabled?: boolean;
  pendingLabel?: string;
  onAddToCart?: () => void;
  addToCartDisabled?: boolean;
}

export function ListingCard({
  listing,
  onClick,
  showActions = true,
  onEdit,
  editDisabled = false,
  pendingLabel = "Update pending",
  onAddToCart,
  addToCartDisabled = false,
}: ListingCardProps) {
  const mainImage = listing.images?.[0] || "/placeholder.svg";
  const avgRating = typeof listing.avgRating === "number" ? listing.avgRating : 0;
  const reviewCount = typeof listing.reviewCount === "number" ? listing.reviewCount : 0;
  const hasReviews = reviewCount > 0;
  const latestSnippet =
    typeof listing.latestReviewSnippet === "string" && listing.latestReviewSnippet.trim().length > 0
      ? listing.latestReviewSnippet.trim()
      : null;

  return (
    <Card
      className="overflow-visible hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="relative aspect-video bg-muted">
        <img
          src={mainImage}
          alt={listing.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/placeholder.svg";
          }}
        />
        {listing.status === "sold" && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge variant="destructive" className="text-lg px-4 py-2">
              Sold
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4 pb-4">
        <div className="flex items-start justify-between mb-2">
          <div className="space-y-1">
            <h3 className="font-semibold text-lg line-clamp-1">{listing.title}</h3>
            {listing.status === "pending_update" && (
              <Badge variant="secondary" className="text-xs">
                {pendingLabel}
              </Badge>
            )}
          </div>
          {listing.sellerName && (
            <Badge variant="outline" className="ml-2">
              {listing.sellerName}
            </Badge>
          )}
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>{listing.location.county}</span>
          </div>

          <div className="flex items-center gap-4">
            <span>
              {listing.quantity} {listing.unit}
            </span>
            <span className="font-semibold text-foreground">
              {formatKsh(listing.pricePerUnit)}/{listing.unit}
            </span>
          </div>

          {latestSnippet && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              "{latestSnippet}"
            </p>
          )}

          {listing.availability && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>
                {format(new Date(listing.availability.startDate), "MMM d")} -{" "}
                {format(new Date(listing.availability.endDate), "MMM d, yyyy")}
              </span>
            </div>
          )}

          {listing.tags && listing.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {listing.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>

      {showActions && (
        <CardFooter className="p-4 pt-2 flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0 flex items-center gap-2">
            <ReviewStars rating={avgRating} size="sm" />
            {hasReviews ? (
              <span className="text-xs text-muted-foreground truncate">({reviewCount})</span>
            ) : (
              <span className="text-xs text-muted-foreground truncate">No reviews</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2 justify-end w-full sm:w-auto">
            {onAddToCart && (
              <Button
                size="sm"
                disabled={addToCartDisabled}
                className="whitespace-nowrap shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToCart();
                }}
              >
                Add to Cart
              </Button>
            )}
            {onEdit && (
              <Button
                size="sm"
                variant="outline"
                disabled={editDisabled}
                className="whitespace-nowrap shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                Edit
              </Button>
            )}
            <Button
              size="sm"
              variant={onAddToCart ? "outline" : "default"}
              className="whitespace-nowrap shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onClick?.();
              }}
            >
              View Details
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
