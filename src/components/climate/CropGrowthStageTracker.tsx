import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sprout, Calendar, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { FarmLocation } from "@/types/climate";

interface Props {
  farms: FarmLocation[];
  selectedFarmId: string | null;
}

interface GrowthStageEntry {
  farmId: string;
  crop: string;
  plantingDate: string;
  stage: string;
  daysToHarvest: number;
  totalDays: number;
}

const CROP_DURATIONS: Record<string, { total: number; stages: { name: string; days: number }[] }> = {
  tomatoes:  { total: 90,  stages: [{ name: "Seedling", days: 14 }, { name: "Vegetative", days: 28 }, { name: "Flowering", days: 21 }, { name: "Fruiting", days: 21 }, { name: "Harvest", days: 6 }] },
  maize:     { total: 120, stages: [{ name: "Germination", days: 10 }, { name: "Vegetative", days: 45 }, { name: "Tasseling", days: 20 }, { name: "Grain fill", days: 35 }, { name: "Harvest", days: 10 }] },
  potatoes:  { total: 100, stages: [{ name: "Emergence", days: 14 }, { name: "Vegetative", days: 30 }, { name: "Tuber init.", days: 25 }, { name: "Bulking", days: 25 }, { name: "Harvest", days: 6 }] },
  kale:      { total: 60,  stages: [{ name: "Seedling", days: 14 }, { name: "Vegetative", days: 30 }, { name: "Harvest", days: 16 }] },
  beans:     { total: 75,  stages: [{ name: "Germination", days: 7 }, { name: "Vegetative", days: 28 }, { name: "Flowering", days: 20 }, { name: "Pod fill", days: 14 }, { name: "Harvest", days: 6 }] },
  cabbage:   { total: 80,  stages: [{ name: "Seedling", days: 21 }, { name: "Vegetative", days: 35 }, { name: "Heading", days: 18 }, { name: "Harvest", days: 6 }] },
  onion:     { total: 110, stages: [{ name: "Seedling", days: 21 }, { name: "Vegetative", days: 50 }, { name: "Bulbing", days: 30 }, { name: "Harvest", days: 9 }] },
};

const SAMPLE_ENTRIES: GrowthStageEntry[] = [
  { farmId: "f1", crop: "Tomatoes",  plantingDate: new Date(Date.now() - 45 * 86400000).toISOString().slice(0, 10), stage: "Flowering",  daysToHarvest: 45, totalDays: 90  },
  { farmId: "f1", crop: "Kale",      plantingDate: new Date(Date.now() - 20 * 86400000).toISOString().slice(0, 10), stage: "Vegetative", daysToHarvest: 40, totalDays: 60  },
  { farmId: "f2", crop: "Maize",     plantingDate: new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10), stage: "Tasseling",  daysToHarvest: 60, totalDays: 120 },
];

function getCurrentStage(crop: string, daysElapsed: number): string {
  const profile = CROP_DURATIONS[crop.toLowerCase()] ?? CROP_DURATIONS.tomatoes;
  let cumDays = 0;
  for (const stage of profile.stages) {
    cumDays += stage.days;
    if (daysElapsed <= cumDays) return stage.name;
  }
  return "Harvest";
}

function getDaysToHarvest(crop: string, daysElapsed: number): number {
  const profile = CROP_DURATIONS[crop.toLowerCase()] ?? CROP_DURATIONS.tomatoes;
  return Math.max(0, profile.total - daysElapsed);
}

function getProgress(crop: string, daysElapsed: number): number {
  const profile = CROP_DURATIONS[crop.toLowerCase()] ?? CROP_DURATIONS.tomatoes;
  return Math.min(100, Math.round((daysElapsed / profile.total) * 100));
}

export function CropGrowthStageTracker({ farms, selectedFarmId }: Props) {
  const isMockup = farms.length === 0;
  const [entries, setEntries] = useState<GrowthStageEntry[]>(SAMPLE_ENTRIES);
  const [newCrop, setNewCrop] = useState("tomatoes");
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));
  const [newFarmId, setNewFarmId] = useState(selectedFarmId ?? "f1");

  const addEntry = () => {
    const daysElapsed = Math.floor((Date.now() - new Date(newDate).getTime()) / 86400000);
    const stage = getCurrentStage(newCrop, daysElapsed);
    const daysToHarvest = getDaysToHarvest(newCrop, daysElapsed);
    const profile = CROP_DURATIONS[newCrop.toLowerCase()] ?? CROP_DURATIONS.tomatoes;
    setEntries((prev) => [...prev, {
      farmId: newFarmId,
      crop: newCrop.charAt(0).toUpperCase() + newCrop.slice(1),
      plantingDate: newDate,
      stage,
      daysToHarvest,
      totalDays: profile.total,
    }]);
    toast.success(`${newCrop} growth tracker added`);
  };

  const removeEntry = (idx: number) => setEntries((prev) => prev.filter((_, i) => i !== idx));

  const urgentEntries = entries.filter((e) => e.daysToHarvest <= 14 && e.daysToHarvest > 0);

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-success/10">
              <Sprout className="h-3.5 w-3.5 text-success" />
            </div>
            <CardTitle className="text-base">Crop Growth Stage Tracker</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">{entries.length} crops</Badge>
            {isMockup && <Badge variant="outline" className="text-[10px]">UI Mockup</Badge>}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Track growth stages and days-to-harvest for each crop per farm</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Urgent harvest alert */}
        {urgentEntries.length > 0 && (
          <div className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/5 p-3">
            <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{urgentEntries.map((e) => e.crop).join(", ")}</span> approaching harvest in ≤14 days — plan logistics now
            </p>
          </div>
        )}

        {/* Crop entries */}
        <div className="space-y-3">
          {entries.map((entry, idx) => {
            const daysElapsed = Math.floor((Date.now() - new Date(entry.plantingDate).getTime()) / 86400000);
            const progress = getProgress(entry.crop, daysElapsed);
            const isUrgent = entry.daysToHarvest <= 14 && entry.daysToHarvest > 0;
            const isDone = entry.daysToHarvest === 0;

            return (
              <div key={idx} className={cn(
                "rounded-xl border p-3 space-y-2",
                isDone ? "border-success/40 bg-success/5" : isUrgent ? "border-warning/40 bg-warning/5" : "border-border/60 bg-background/60"
              )}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{entry.crop}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5">{entry.stage}</Badge>
                    {isDone && <Badge className="bg-success/10 text-success border-success/30 border text-[10px]">Ready</Badge>}
                    {isUrgent && !isDone && <Badge className="bg-warning/10 text-warning border-warning/30 border text-[10px]">Harvest soon</Badge>}
                  </div>
                  <button type="button" onClick={() => removeEntry(idx)} className="text-muted-foreground hover:text-destructive text-xs">×</button>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", isDone ? "bg-success" : isUrgent ? "bg-warning" : "bg-primary")}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Planted {entry.plantingDate}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {isDone ? "Ready to harvest" : `${entry.daysToHarvest}d to harvest`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add new entry */}
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-3 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Track new crop</p>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs">Crop</Label>
              <Select value={newCrop} onValueChange={setNewCrop}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.keys(CROP_DURATIONS).map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Planting date</Label>
              <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="h-8 text-xs" />
            </div>
            {!isMockup && farms.length > 1 && (
              <div className="space-y-1">
                <Label className="text-xs">Farm</Label>
                <Select value={newFarmId} onValueChange={setNewFarmId}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {farms.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <Button type="button" size="sm" variant="outline" onClick={addEntry} className="gap-1.5 text-xs">
            <Sprout className="h-3.5 w-3.5" /> Add crop tracker
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
