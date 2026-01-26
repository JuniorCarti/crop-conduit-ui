import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { RainfallOutlook } from "@/services/weatherProxyService";
import { PremiumLock } from "@/components/climate/PremiumLock";

interface RainOutlookCardProps {
  rainfallOutlook: RainfallOutlook | null;
  isLoading: boolean;
  isPremium: boolean;
  t: (key: string, defaultValue?: string) => string;
  onUpgrade?: () => void;
}

const renderRow = (
  day: RainfallOutlook["days"][number],
  t: (key: string, defaultValue?: string) => string
) => (
  <div key={day.date} className="flex items-center gap-3 text-sm">
    <span className="w-16 text-muted-foreground">{day.date}</span>
    <div className="flex-1">
      <div className="h-2 rounded-full bg-muted">
        <div
          className="h-2 rounded-full bg-primary/60"
          style={{ width: `${Math.min(day.chancePct, 100)}%` }}
        />
      </div>
    </div>
    <span className="w-12 text-right font-semibold">{day.mm} {t("climate.rainOutlook.mm")}</span>
    <Badge variant="outline" className="w-12 justify-center">
      {day.chancePct}%
    </Badge>
  </div>
);

export function RainOutlookCard({
  rainfallOutlook,
  isLoading,
  isPremium,
  t,
  onUpgrade,
}: RainOutlookCardProps) {
  if (isLoading) {
    return (
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>{t("climate.rainfall.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  const next7All = rainfallOutlook?.days || [];
  const next7 = isPremium ? next7All : next7All.slice(0, 2);
  const totalLabel =
    typeof rainfallOutlook?.totalMm === "number"
      ? `${t("climate.rainOutlook.total")}: ${rainfallOutlook.totalMm} ${t("climate.rainOutlook.mm")}`
      : t("climate.rainOutlook.total");

  const card = (
    <Card className="border-border/60">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{t("climate.rainfall.title")}</CardTitle>
        <Badge variant="outline">
          {isPremium ? t("climate.rainOutlook.next7") : t("climate.rainOutlook.basic")}
        </Badge>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="summary" className="space-y-3">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="summary">{t("climate.rainOutlook.tabSummary")}</TabsTrigger>
            <TabsTrigger value="premium">{t("climate.rainOutlook.tabPremium")}</TabsTrigger>
          </TabsList>
          <TabsContent value="summary" className="space-y-2">
            {next7.map((day) => renderRow(day, t))}
            {!next7.length && (
              <p className="text-xs text-muted-foreground">{t("climate.rainOutlook.noData")}</p>
            )}
          </TabsContent>
          <TabsContent value="premium">
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{t("climate.rainOutlook.next7")}</p>
                  <Badge className="bg-primary/10 text-primary">{totalLabel}</Badge>
                </div>
              <div className="space-y-2">
                {next7All.slice(0, 7).map((day) => renderRow(day, t))}
                {!next7All.length && (
                  <p className="text-xs text-muted-foreground">{t("climate.rainOutlook.noData")}</p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );

  return (
    <PremiumLock
      locked={!isPremium}
      title={t("climate.premium.lockTitle")}
      description={t("climate.rainOutlook.premiumLock")}
      ctaLabel={t("climate.premium.upgrade")}
      onUpgrade={onUpgrade}
    >
      {card}
    </PremiumLock>
  );
}
