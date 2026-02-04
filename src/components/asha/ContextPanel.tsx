import { useRef, useState } from "react";
import { CloudSun, ImagePlus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { uploadToR2 } from "@/services/r2UploadService";
import { toast } from "sonner";

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
  onFarmChange,
  onNewSession,
  weather,
}: {
  sessionId: string;
  language: "auto" | "en" | "sw";
  onLanguageChange: (value: "auto" | "en" | "sw") => void;
  autoRead: boolean;
  onAutoReadChange: (value: boolean) => void;
  farm: FarmContext;
  onFarmChange: (next: FarmContext) => void;
  onNewSession: () => void;
  weather?: WeatherSummary | null;
}) {
  const [uploading, setUploading] = useState(false);
  const [lastUpload, setLastUpload] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToR2(file);
      setLastUpload(url);
      toast.success("Uploaded to AgriSmart storage.");
    } catch (error: any) {
      toast.error(error?.message || "Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

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
            <Switch
              id="asha-autoread"
              checked={autoRead}
              onCheckedChange={onAutoReadChange}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Farm context</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2">
            <Label>County</Label>
            <Input
              value={farm.county || ""}
              onChange={(event) => onFarmChange({ ...farm, county: event.target.value })}
              placeholder="County"
            />
          </div>
          <div className="grid gap-2">
            <Label>Ward</Label>
            <Input
              value={farm.ward || ""}
              onChange={(event) => onFarmChange({ ...farm, ward: event.target.value })}
              placeholder="Ward"
            />
          </div>
          <div className="grid gap-2">
            <Label>Latitude</Label>
            <Input
              value={farm.lat ?? ""}
              onChange={(event) =>
                onFarmChange({
                  ...farm,
                  lat: event.target.value ? Number(event.target.value) : undefined,
                })
              }
              placeholder="-1.2921"
            />
          </div>
          <div className="grid gap-2">
            <Label>Longitude</Label>
            <Input
              value={farm.lon ?? ""}
              onChange={(event) =>
                onFarmChange({
                  ...farm,
                  lon: event.target.value ? Number(event.target.value) : undefined,
                })
              }
              placeholder="36.8219"
            />
          </div>
          <div className="grid gap-2">
            <Label>Crops (comma separated)</Label>
            <Input
              value={farm.crops?.join(", ") || ""}
              onChange={(event) =>
                onFarmChange({
                  ...farm,
                  crops: event.target.value
                    .split(",")
                    .map((crop) => crop.trim())
                    .filter(Boolean),
                })
              }
              placeholder="Tomatoes, Maize"
            />
          </div>
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
                <Badge variant="secondary">{weather.minTemp ?? "-"}°C min</Badge>
                <Badge variant="secondary">{weather.maxTemp ?? "-"}°C max</Badge>
                <Badge variant="secondary">{weather.rainChance ?? "-"}% rain</Badge>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">Add farm coordinates to see forecast.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Uploads</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            <ImagePlus className="mr-2 h-4 w-4" />
            {uploading ? "Uploading..." : "Upload farm photo"}
          </Button>
          {lastUpload && (
            <a
              href={lastUpload}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-primary underline"
            >
              View upload
            </a>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
