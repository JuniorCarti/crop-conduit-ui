import { CloudSun, Store, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AshaCard } from "@/types/asha";

const iconMap = {
  climate: CloudSun,
  market: Store,
  logistics: Truck,
} as const;

const toneMap = {
  climate: "border-sky-200 bg-sky-50 text-sky-900",
  market: "border-emerald-200 bg-emerald-50 text-emerald-900",
  logistics: "border-amber-200 bg-amber-50 text-amber-900",
} as const;

export function AshaInsightCard({ card }: { card: AshaCard }) {
  const Icon = iconMap[card.type];
  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-2 text-xs",
        toneMap[card.type]
      )}
    >
      <div className="flex items-start gap-2">
        <div className="mt-0.5">
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <p className="font-semibold">{card.title}</p>
          {card.subtitle && <p className="text-[11px] opacity-80">{card.subtitle}</p>}
          {card.listing && (
            <div className="mt-1">
              <p className="font-medium">{card.listing.title}</p>
              <p className="text-[11px]">
                {card.listing.price ? `KES ${card.listing.price}` : ""}
                {card.listing.unit ? `/${card.listing.unit}` : ""}
                {card.listing.county ? ` • ${card.listing.county}` : ""}
              </p>
            </div>
          )}
          {card.items && card.items.length > 0 && (
            <ul className="mt-1 list-disc pl-4">
              {card.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
