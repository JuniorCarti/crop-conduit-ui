import { CalendarClock, Eye, Gavel, PauseCircle, Pencil, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusPill } from "@/components/shared/StatusPill";
import type { TradeListing } from "@/components/org/trade/types";

const mapStatus = (status: TradeListing["status"]) => {
  if (status === "active") return { label: "Active", variant: "active" as const };
  if (status === "paused") return { label: "Paused", variant: "pending" as const };
  return { label: "Sold", variant: "none" as const };
};

export function ListingCard({
  listing,
  onEdit,
  onToggle,
  onViewBids,
  intlSignal,
}: {
  listing: TradeListing;
  onEdit: (listing: TradeListing) => void;
  onToggle: (listing: TradeListing) => void;
  onViewBids: (listing: TradeListing) => void;
  intlSignal?: "upward" | "downward" | "neutral";
}) {
  const status = mapStatus(listing.status);
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{listing.crop}</CardTitle>
            <p className="text-xs text-muted-foreground">Grade {listing.grade}</p>
          </div>
          <StatusPill label={status.label} variant={status.variant} />
        </div>
        {intlSignal && (
          <p className="mt-2 text-xs text-muted-foreground">
            Intl simulation indicates:{" "}
            <span className="font-medium">{intlSignal === "upward" ? "Upward pressure" : intlSignal === "downward" ? "Downward pressure" : "Neutral"}</span>
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p><span className="text-muted-foreground">Quantity:</span> {listing.quantityKg.toLocaleString()} kg</p>
        <p><span className="text-muted-foreground">Location:</span> {listing.location}</p>
        <p className="flex items-center gap-2"><CalendarClock className="h-3.5 w-3.5 text-muted-foreground" /> Harvest: {listing.harvestDate}</p>
        <p><span className="text-muted-foreground">Price:</span> KES {listing.pricePerKg.toLocaleString()} /kg</p>
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" /> {listing.views} views</span>
          <span className="inline-flex items-center gap-1"><Gavel className="h-3 w-3" /> {listing.bids} bids</span>
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2 pt-2">
        <Button variant="outline" size="sm" onClick={() => onEdit(listing)}>
          <Pencil className="mr-1 h-3.5 w-3.5" />Edit
        </Button>
        <Button variant="outline" size="sm" onClick={() => onToggle(listing)}>
          {listing.status === "paused" ? <PlayCircle className="mr-1 h-3.5 w-3.5" /> : <PauseCircle className="mr-1 h-3.5 w-3.5" />}
          {listing.status === "paused" ? "Resume" : "Pause"}
        </Button>
        <Button size="sm" onClick={() => onViewBids(listing)}>View bids</Button>
      </CardFooter>
    </Card>
  );
}
