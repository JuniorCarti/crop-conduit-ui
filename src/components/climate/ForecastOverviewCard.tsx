import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { WeatherApiForecast } from "@/services/weatherProxyService";

interface ForecastOverviewCardProps {
  forecast: WeatherApiForecast | null;
  isLoading: boolean;
  t: (key: string, defaultValue?: string) => string;
}

export function ForecastOverviewCard({
  forecast,
  isLoading,
  t,
}: ForecastOverviewCardProps) {
  if (isLoading) {
    return (
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>{t("climate.overview.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  const today = forecast?.forecast.forecastday[0];
  const nextDays = forecast?.forecast.forecastday.slice(0, 3) || [];

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-base">{t("climate.overview.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">{t("climate.overview.location")}</p>
          <p className="font-semibold">
            {forecast?.location.name || t("climate.overview.unknown")}
            {forecast?.location.region ? `, ${forecast.location.region}` : ""}
          </p>
        </div>

        <div className="rounded-md border border-border/60 p-3">
          <p className="text-xs text-muted-foreground">{t("climate.overview.today")}</p>
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div>
              <p className="text-xs text-muted-foreground">{t("climate.overview.minTemp")}</p>
              <p className="font-semibold">
                {today?.day.mintemp_c ?? 0} {t("climate.units.temp")}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("climate.overview.maxTemp")}</p>
              <p className="font-semibold">
                {today?.day.maxtemp_c ?? 0} {t("climate.units.temp")}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("climate.overview.rainChance")}</p>
              <p className="font-semibold">{today?.day.daily_chance_of_rain ?? 0}%</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{t("climate.overview.nextDays")}</p>
          {nextDays.map((day) => (
            <div key={day.date} className="flex items-center justify-between">
              <span className="text-muted-foreground">{day.date}</span>
              <span className="font-semibold">
                {day.day.mintemp_c} {t("climate.units.temp")} / {day.day.maxtemp_c} {t("climate.units.temp")}
              </span>
              <span className="text-muted-foreground">{day.day.daily_chance_of_rain ?? 0}%</span>
            </div>
          ))}
          {!nextDays.length && (
            <p className="text-xs text-muted-foreground">{t("climate.overview.noData")}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
