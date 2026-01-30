import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import type { FrostRiskSummary, FrostRiskLevel } from "@/services/weatherProxyService";
import { PremiumLock } from "@/components/climate/PremiumLock";

const severityStyles: Record<FrostRiskLevel, string> = {
  Low: "bg-success/10 text-success",
  Medium: "bg-warning/10 text-warning",
  High: "bg-destructive/10 text-destructive",
};

interface FrostRiskCardProps {
  frostRisk: FrostRiskSummary | null;
  isLoading: boolean;
  isPremium: boolean;
  t: (key: string, defaultValue?: string) => string;
  onUpgrade?: () => void;
}

export function FrostRiskCard({
  frostRisk,
  isLoading,
  isPremium,
  t,
  onUpgrade,
}: FrostRiskCardProps) {
  if (isLoading) {
    return (
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>{t("climate.frostRisk.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  const risk = frostRisk;
  const severity = risk?.riskLevel ?? "Low";
  const nextDays = risk?.days || [];
  const tomorrow = nextDays[1];
  const tomorrowSeverity = tomorrow?.risk ?? "Low";

  const card = (
    <Card className="border-border/60">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{t("climate.frostRisk.title")}</CardTitle>
        <Badge className={severityStyles[severity]}>{t(`climate.risk.${severity.toLowerCase()}`)}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs text-muted-foreground">{t("climate.frostRisk.tonight")}</p>
          <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
            <div className="rounded-md border border-border/60 p-2">
              <p className="text-muted-foreground">{t("climate.frostRisk.minTemp")}</p>
              <p className="font-semibold">
                {risk?.minTempC ?? 0} {t("climate.units.temp")}
              </p>
            </div>
            <div className="rounded-md border border-border/60 p-2">
              <p className="text-muted-foreground">{t("climate.frostRisk.level")}</p>
              <p className="font-semibold">{t(`climate.risk.${severity.toLowerCase()}`)}</p>
            </div>
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t("climate.frostRisk.tomorrow")}</span>
          <span className="font-semibold">
            {tomorrow?.minTempC ?? 0} {t("climate.units.temp")}
          </span>
          <Badge className={severityStyles[tomorrowSeverity]}>
            {t(`climate.risk.${tomorrowSeverity.toLowerCase()}`)}
          </Badge>
        </div>

        <Separator />
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{t("climate.frostRisk.next72h")}</p>
          <div className="space-y-2">
            {nextDays.slice(0, 3).map((item) => (
              <div key={item.date} className="flex items-center justify-between text-sm">
                <span>{item.date}</span>
                <span className="font-semibold">
                  {item.minTempC} {t("climate.units.temp")}
                </span>
                <Badge className={severityStyles[item.risk]}>
                  {t(`climate.risk.${item.risk.toLowerCase()}`)}
                </Badge>
              </div>
            ))}
            {!nextDays.length && (
              <p className="text-xs text-muted-foreground">{t("climate.frostRisk.noData")}</p>
            )}
          </div>
        </div>

      </CardContent>
    </Card>
  );

  return (
    <PremiumLock
      locked={!isPremium}
      title={t("climate.premium.lockTitle")}
      description={t("climate.frostRisk.premiumLock")}
      ctaLabel={t("climate.premium.upgrade")}
      onUpgrade={onUpgrade}
    >
      {card}
    </PremiumLock>
  );
}
