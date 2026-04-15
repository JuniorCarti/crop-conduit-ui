import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, MessageSquare, CheckCircle2, Clock, ArrowRight, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatKsh } from "@/lib/currency";
import { useNavigate } from "react-router-dom";

interface BuyerBid {
  id: string;
  buyerName: string;
  company?: string;
  crop: string;
  quantityKg: number;
  pricePerKg: number;
  deliveryDate: string;
  location: string;
  verified: boolean;
  reliabilityScore: number;
  status: "open" | "expiring" | "matched";
  notes?: string;
}

interface Props {
  cropName?: string;
  quantityKg?: number;
  bids?: BuyerBid[];
}

const SAMPLE_BIDS: BuyerBid[] = [
  {
    id: "b1",
    buyerName: "Fresh Mart Kenya",
    company: "Fresh Mart Ltd",
    crop: "Tomatoes",
    quantityKg: 300,
    pricePerKg: 68,
    deliveryDate: "2025-01-25",
    location: "Nairobi",
    verified: true,
    reliabilityScore: 94,
    status: "open",
    notes: "Requires Grade A only. Flexible on delivery time.",
  },
  {
    id: "b2",
    buyerName: "Naivas Supermarket",
    company: "Naivas Ltd",
    crop: "Tomatoes",
    quantityKg: 500,
    pricePerKg: 62,
    deliveryDate: "2025-01-24",
    location: "Nakuru",
    verified: true,
    reliabilityScore: 98,
    status: "expiring",
    notes: "Bid expires in 2 days. Consistent buyer — 12 previous orders.",
  },
  {
    id: "b3",
    buyerName: "James Kariuki",
    crop: "Tomatoes",
    quantityKg: 150,
    pricePerKg: 70,
    deliveryDate: "2025-01-26",
    location: "Thika",
    verified: false,
    reliabilityScore: 72,
    status: "open",
    notes: "Individual buyer. Cash on delivery.",
  },
];

const STATUS_CONFIG = {
  open:     { label: "Open",     bg: "bg-success/10",     text: "text-success",     border: "border-success/30"     },
  expiring: { label: "Expiring", bg: "bg-warning/10",     text: "text-warning",     border: "border-warning/30"     },
  matched:  { label: "Matched",  bg: "bg-primary/10",     text: "text-primary",     border: "border-primary/30"     },
};

export function BuyerPreOrderMatching({ cropName = "Tomatoes", quantityKg = 500, bids }: Props) {
  const navigate = useNavigate();
  const display = bids ?? SAMPLE_BIDS;
  const isMockup = !bids;

  const matchedQty = display.reduce((s, b) => s + b.quantityKg, 0);
  const coveragePct = quantityKg > 0 ? Math.min(Math.round((matchedQty / quantityKg) * 100), 100) : 0;
  const bestBid = [...display].sort((a, b) => b.pricePerKg - a.pricePerKg)[0];

  const handleContact = (bid: BuyerBid) => {
    const text = `Hi ${bid.buyerName}, I have ${quantityKg}kg of ${cropName} available for delivery by ${bid.deliveryDate}. Are you still interested? — AgriSmart Farmer`;
    navigate("/community/inbox");
  };

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-3.5 w-3.5 text-primary" />
            </div>
            <CardTitle className="text-base">Buyer Pre-Order Matching</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-primary/10 text-primary border-primary/30 border text-xs">
              {display.length} active bids
            </Badge>
            {isMockup && <Badge variant="outline" className="text-[10px]">Sample data</Badge>}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Buyers with active bids matching your <span className="font-medium text-foreground capitalize">{cropName}</span> harvest
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Coverage summary */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Demand coverage: {matchedQty} / {quantityKg} kg ({coveragePct}%)</span>
            {bestBid && (
              <span className="font-medium text-success">Best offer: {formatKsh(bestBid.pricePerKg)}/kg</span>
            )}
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", coveragePct >= 100 ? "bg-success" : coveragePct >= 60 ? "bg-primary" : "bg-warning")}
              style={{ width: `${coveragePct}%` }}
            />
          </div>
          {coveragePct >= 100 && (
            <p className="text-xs text-success font-medium flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Full harvest covered by buyer demand
            </p>
          )}
        </div>

        {/* Bid cards */}
        <div className="space-y-3">
          {display.map((bid) => {
            const cfg = STATUS_CONFIG[bid.status];
            const totalValue = bid.pricePerKg * Math.min(bid.quantityKg, quantityKg);
            return (
              <div key={bid.id} className={cn("rounded-xl border p-3 space-y-2", cfg.bg, cfg.border)}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground">{bid.buyerName}</span>
                      {bid.verified && (
                        <Badge className="bg-success/10 text-success border-success/30 border text-[10px] gap-0.5 px-1.5">
                          <CheckCircle2 className="h-2.5 w-2.5" /> Verified
                        </Badge>
                      )}
                      <Badge className={cn("border text-[10px] px-1.5", cfg.bg, cfg.border, cfg.text)}>
                        {cfg.label}
                      </Badge>
                    </div>
                    {bid.company && <p className="text-[10px] text-muted-foreground">{bid.company}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-base font-bold text-foreground">{formatKsh(bid.pricePerKg)}/kg</p>
                    <p className="text-[10px] text-muted-foreground">{bid.quantityKg} kg wanted</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />By {bid.deliveryDate}</span>
                  <span className="flex items-center gap-1"><Star className="h-3 w-3 text-warning" />{bid.reliabilityScore}% reliable</span>
                  <span className="font-medium text-foreground">{formatKsh(totalValue)} est.</span>
                </div>

                {bid.notes && <p className="text-[10px] text-muted-foreground italic">{bid.notes}</p>}

                <div className="flex gap-2 pt-1">
                  <Button type="button" size="sm" className="h-7 gap-1 text-xs flex-1" onClick={() => handleContact(bid)}>
                    <MessageSquare className="h-3.5 w-3.5" /> Contact buyer
                  </Button>
                  <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => navigate("/marketplace")}>
                    View listing
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => navigate("/marketplace")}>
          <Users className="h-3.5 w-3.5" />
          Browse all buyers
          <ArrowRight className="h-3.5 w-3.5 ml-auto" />
        </Button>
      </CardContent>
    </Card>
  );
}
