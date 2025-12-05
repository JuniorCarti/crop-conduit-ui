/**
 * Listing Card Component
 * Displays a single listing in a card format
 */

import { MapPin, Star, Calendar } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatKsh } from "@/lib/currency";
import type { Listing } from "../models/types";
import { format } from "date-fns";

interface ListingCardProps {
  listing: Listing;
  onClick?: () => void;
  showActions?: boolean;
}

export function ListingCard({ listing, onClick, showActions = true }: ListingCardProps) {
  const mainImage = listing.images?.[0] || "/placeholder.svg";

  return (
    <Card
      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
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

      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg line-clamp-1">{listing.title}</h3>
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
        <CardFooter className="p-4 pt-0 flex justify-between items-center">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">4.5</span>
            <span className="text-xs text-muted-foreground">(12)</span>
          </div>
          <Button size="sm" onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}>
            View Details
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
