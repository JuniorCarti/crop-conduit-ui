import { AlertTriangle, CalendarRange, CloudRain, TrendingUp, Bug, Sprout } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { formatKsh } from "@/lib/currency";
import type { DecisionSupportOutput } from "@/services/decisionSupportService";
import { DecisionSupportCard } from "@/components/climate/DecisionSupportCard";

interface DecisionSupportSectionProps {
  data: DecisionSupportOutput | null;
  isLoading: boolean;
  error?: string | null;
}

export function DecisionSupportSection({ data, isLoading, error }: DecisionSupportSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">Farm Decision Insights</h2>
        <p className="text-sm text-muted-foreground whitespace-normal break-words">
          Smart recommendations from weather + market intelligence
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="space-y-3">
          {[0, 1, 2].map((item) => (
            <Skeleton key={item} className="h-36 w-full rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && data && (
        <div className="space-y-4">
          <DecisionSupportCard
            title="Planting Window Advisor"
            subtitle={data.plantingAdvice.window}
            badge={data.plantingAdvice.confidence}
            badgeTone={
              data.plantingAdvice.confidence === "High"
                ? "success"
                : data.plantingAdvice.confidence === "Medium"
                ? "warning"
                : "danger"
            }
            icon={<CalendarRange className="h-4 w-4 text-primary" />}
            items={[
              ...data.plantingAdvice.reasons,
              `Suggested crops: ${data.plantingAdvice.cropSuggestions.join(", ")}`,
            ]}
            footer={data.plantingAdvice.caution ?? data.plantingAdvice.fallback}
          />

          <DecisionSupportCard
            title="Harvest Timing Advisor"
            subtitle={data.harvestAdvice.recommendation}
            badge={data.harvestAdvice.weatherRisk}
            badgeTone={
              data.harvestAdvice.weatherRisk === "Rain"
                ? "warning"
                : data.harvestAdvice.weatherRisk === "Heat"
                ? "danger"
                : data.harvestAdvice.weatherRisk === "Wind"
                ? "warning"
                : "neutral"
            }
            icon={<CloudRain className="h-4 w-4 text-primary" />}
            items={[
              ...data.harvestAdvice.reasons,
              data.harvestAdvice.marketSignal ?? "Market signal: weather-only guidance",
            ]}
            footer={data.harvestAdvice.profitHint ?? data.harvestAdvice.storageNote ?? data.harvestAdvice.fallback}
          />

          <DecisionSupportCard
            title="Market Opportunity Signal"
            subtitle={data.marketSignal.summary}
            badge={data.marketSignal.volatility ?? "Forecast-only"}
            badgeTone={
              data.marketSignal.volatility
                ? data.marketSignal.volatility === "Volatile"
                  ? "warning"
                  : "success"
                : "neutral"
            }
            icon={<TrendingUp className="h-4 w-4 text-primary" />}
            items={[
              data.marketSignal.bestMarket ? `Best market: ${data.marketSignal.bestMarket}` : "No market available",
              data.marketSignal.price != null
                ? `Price: ${formatKsh(data.marketSignal.price)}`
                : "Price: n/a",
              data.marketSignal.changePct != null
                ? `Change: ${data.marketSignal.changePct > 0 ? "+" : ""}${data.marketSignal.changePct}%`
                : "Change: n/a",
              data.marketSignal.demand ? `Demand: ${data.marketSignal.demand}` : "Demand: n/a",
            ]}
            footer={data.marketSignal.transportTip ?? data.marketSignal.fallback}
          />

          <DecisionSupportCard
            title="Risk Alert"
            subtitle={data.riskAlert.title}
            badge={data.riskAlert.level}
            badgeTone={
              data.riskAlert.level === "Red"
                ? "danger"
                : data.riskAlert.level === "Orange"
                ? "warning"
                : "success"
            }
            icon={<Bug className="h-4 w-4 text-primary" />}
            items={data.riskAlert.tips}
          />

          <DecisionSupportCard
            title="Profit Optimization Tip"
            subtitle={data.profitTip.tip}
            badge="Weekly tip"
            badgeTone="success"
            icon={<Sprout className="h-4 w-4 text-primary" />}
          />
        </div>
      )}

      {!isLoading && !data && !error && (
        <DecisionSupportCard
          title="Farm Decision Insights"
          subtitle="Weather-only guidance"
          icon={<AlertTriangle className="h-4 w-4 text-primary" />}
        />
      )}
    </div>
  );
}
