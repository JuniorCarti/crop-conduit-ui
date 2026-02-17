import { CloudSun, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

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
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="space-y-2">
          <CardTitle className="text-base">Session</CardTitle>
          <p className="text-xs text-muted-foreground">{sessionId}</p>
          <Button variant="outline" size="sm" onClick={onNewSession}>
            <RotateCcw className="mr-2 h-3 w-3" />
            New session
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="asha-language">Language</Label>
            <select
              id="asha-language"
              className="h-8 rounded-md border border-input bg-background px-2 text-sm"
              value={language}
              onChange={(event) => {
                const next = event.target.value;
                if (next === "sw" || next === "en") {
                  onLanguageChange(next);
                  return;
                }
                onLanguageChange("auto");
              }}
            >
              <option value="auto">Auto detect</option>
              <option value="en">English</option>
              <option value="sw">Kiswahili</option>
            </select>
          </div>
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="asha-autoread">Auto-read replies</Label>
            <Switch id="asha-autoread" checked={autoRead} onCheckedChange={onAutoReadChange} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Farm context</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {farm.county || farm.ward || farm.lat != null || farm.lon != null ? (
            <>
              <p className="font-medium">{[farm.county, farm.ward].filter(Boolean).join(", ") || "Saved farm"}</p>
              <p className="text-muted-foreground">
                {farm.lat != null && farm.lon != null ? `${farm.lat}, ${farm.lon}` : "Coordinates not set"}
              </p>
              {farm.crops?.length ? (
                <div className="flex flex-wrap gap-2">
                  {farm.crops.slice(0, 4).map((crop) => (
                    <Badge key={crop} variant="secondary">
                      {crop}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No crops mapped for this farm yet.</p>
              )}
            </>
          ) : (
            <p className="text-muted-foreground">
              Looks like you haven&apos;t added a farm yet. Go to Climate - Add Farm, then come back here.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CloudSun className="h-4 w-4" />
            Weather snapshot
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {weather ? (
            <>
              <p className="font-medium">{weather.locationName || "Selected farm"}</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{weather.minTemp ?? "-"} C min</Badge>
                <Badge variant="secondary">{weather.maxTemp ?? "-"} C max</Badge>
                <Badge variant="secondary">{weather.rainChance ?? "-"}% rain</Badge>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">Select a farm in Climate to see forecast context.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
