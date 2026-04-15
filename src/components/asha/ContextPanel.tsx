import { CloudSun, MapPin, RotateCcw, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type FarmContext = {
  lat?: number;
  lon?: number;
  county?: string;
  ward?: string;
  crops?: string[];
};

export type WeatherSummary = {
  locationName?: string;
  minTemp?: number;
  maxTemp?: number;
  rainChance?: number;
};

export function ContextPanel({
  sessionId,
  language,
  onLanguageChange,
  autoRead,
  onAutoReadChange,
  farm,
  onNewSession,
  weather,
}: {
  sessionId: string;
  language: "auto" | "en" | "sw";
  onLanguageChange: (value: "auto" | "en" | "sw") => void;
  autoRead: boolean;
  onAutoReadChange: (value: boolean) => void;
  farm: FarmContext;
  onNewSession: () => void;
  weather?: WeatherSummary | null;
}) {
  const hasFarm = Boolean(farm.county || farm.ward || farm.lat != null);

  return (
    <div className="space-y-4">
      {/* Session card */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-foreground">Session</CardTitle>
            <Button variant="outline" size="sm" onClick={onNewSession} className="h-7 gap-1.5 text-xs">
              <RotateCcw className="h-3 w-3" />
              New
            </Button>
          </div>
          <p className="text-[10px] font-mono text-muted-foreground truncate">{sessionId}</p>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="asha-language" className="text-sm">Language</Label>
            <select
              id="asha-language"
              className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
              value={language}
              onChange={(e) => {
                const next = e.target.value;
                onLanguageChange(next === "sw" ? "sw" : next === "en" ? "en" : "auto");
              }}
            >
              <option value="auto">Auto detect</option>
              <option value="en">English</option>
              <option value="sw">Kiswahili</option>
            </select>
          </div>
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="asha-autoread" className="text-sm">Auto-read replies</Label>
            <Switch id="asha-autoread" checked={autoRead} onCheckedChange={onAutoReadChange} />
          </div>
        </CardContent>
      </Card>

      {/* Farm context card */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <Sprout className="h-3.5 w-3.5 text-primary" />
            </div>
            <CardTitle className="text-sm font-semibold text-foreground">Farm context</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {hasFarm ? (
            <>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="font-medium text-foreground truncate">
                  {[farm.county, farm.ward].filter(Boolean).join(", ") || "Saved farm"}
                </span>
              </div>
              {farm.lat != null && farm.lon != null && (
                <p className="text-xs text-muted-foreground pl-5">
                  {farm.lat.toFixed(4)}, {farm.lon.toFixed(4)}
                </p>
              )}
              {farm.crops?.length ? (
                <div className="flex flex-wrap gap-1.5 pl-5">
                  {farm.crops.slice(0, 4).map((crop) => (
                    <Badge key={crop} variant="secondary" className="text-xs">
                      {crop}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground pl-5">No crops mapped yet.</p>
              )}
            </>
          ) : (
            <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
              No farm added yet. Go to Climate → Add Farm, then come back.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weather snapshot card */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-info/10">
              <CloudSun className="h-3.5 w-3.5 text-info" />
            </div>
            <CardTitle className="text-sm font-semibold text-foreground">Weather snapshot</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {weather ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">{weather.locationName || "Selected farm"}</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Min", value: `${weather.minTemp ?? "-"}°C` },
                  { label: "Max", value: `${weather.maxTemp ?? "-"}°C` },
                  { label: "Rain", value: `${weather.rainChance ?? "-"}%` },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg bg-muted/40 p-2 text-center">
                    <p className="text-xs font-semibold text-foreground">{item.value}</p>
                    <p className="text-[10px] text-muted-foreground">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
              Select a farm in Climate to see forecast context.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
