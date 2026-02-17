import { Card, CardContent } from "@/components/ui/card";
import type { BuyerKpiCard } from "@/types/buyerDashboard";

type Props = {
  cards: BuyerKpiCard[];
};

export function BuyerKpiGrid({ cards }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
      {cards.map((card) => (
        <Card key={card.id} className="border-border/60">
          <CardContent className="space-y-1 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{card.label}</p>
            <p className="text-2xl font-semibold">{card.value}</p>
            {card.hint ? <p className="text-xs text-muted-foreground">{card.hint}</p> : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
