import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const formatKES = (value: number | null) => (typeof value === "number" ? `KES ${value.toLocaleString()}` : "--");

export function MarketComparisonPanel({
  marketPrice,
  listingPrice,
  suggestedFloorPrice,
  onUseSuggestedFloorPrice,
}: {
  marketPrice: number | null;
  listingPrice: number | null;
  suggestedFloorPrice: number | null;
  onUseSuggestedFloorPrice: () => void;
}) {
  const deltaPct =
    marketPrice && suggestedFloorPrice
      ? (((suggestedFloorPrice - marketPrice) / marketPrice) * 100).toFixed(1)
      : null;

  return (
    <Card className="border-border/60">
      <CardHeader><CardTitle className="text-base">Market price comparison</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex items-center justify-between"><span className="text-muted-foreground">Current market price</span><span className="font-medium">{formatKES(marketPrice)}</span></div>
        <div className="flex items-center justify-between"><span className="text-muted-foreground">Cooperative listing price</span><span className="font-medium">{formatKES(listingPrice)}</span></div>
        <div className="flex items-center justify-between"><span className="text-muted-foreground">Suggested bid floor price</span><span className="font-medium">{formatKES(suggestedFloorPrice)}</span></div>
        <div className="flex items-center justify-between"><span className="text-muted-foreground">Delta vs market</span><span className="font-medium">{deltaPct !== null ? `${deltaPct}%` : "--"}</span></div>
        <Button onClick={onUseSuggestedFloorPrice} disabled={!suggestedFloorPrice}>Use suggested floor price</Button>
      </CardContent>
    </Card>
  );
}
