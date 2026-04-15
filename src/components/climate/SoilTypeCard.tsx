import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Layers, CheckCircle2, Droplets, Wind, Sprout } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  currentSoilType?: string;
  onSave?: (soilType: string) => void;
}

interface SoilProfile {
  id: string;
  name: string;
  description: string;
  drainage: "excellent" | "good" | "moderate" | "poor";
  waterRetention: "low" | "medium" | "high";
  irrigationAdjust: number;   // % adjustment to ET0
  waterloggingRisk: "low" | "medium" | "high";
  bestCrops: string[];
  avoidCrops: string[];
  tips: string[];
}

const SOIL_PROFILES: SoilProfile[] = [
  {
    id: "sandy",
    name: "Sandy",
    description: "Light, fast-draining soil with low nutrient retention",
    drainage: "excellent",
    waterRetention: "low",
    irrigationAdjust: +25,
    waterloggingRisk: "low",
    bestCrops: ["Carrots", "Groundnuts", "Watermelon", "Sweet potato"],
    avoidCrops: ["Rice", "Taro"],
    tips: ["Irrigate more frequently in smaller amounts", "Add organic matter to improve retention", "Use mulch to reduce evaporation"],
  },
  {
    id: "loam",
    name: "Loam",
    description: "Ideal balanced soil — good drainage and water retention",
    drainage: "good",
    waterRetention: "medium",
    irrigationAdjust: 0,
    waterloggingRisk: "low",
    bestCrops: ["Tomatoes", "Maize", "Beans", "Kale", "Potatoes"],
    avoidCrops: [],
    tips: ["Standard irrigation schedule applies", "Excellent for most crops", "Maintain organic matter with compost"],
  },
  {
    id: "clay",
    name: "Clay",
    description: "Heavy soil with high water retention and slow drainage",
    drainage: "poor",
    waterRetention: "high",
    irrigationAdjust: -20,
    waterloggingRisk: "high",
    bestCrops: ["Rice", "Cabbage", "Wheat", "Sorghum"],
    avoidCrops: ["Carrots", "Groundnuts", "Onions"],
    tips: ["Reduce irrigation frequency — soil holds water longer", "Improve drainage with raised beds", "Avoid working soil when wet"],
  },
  {
    id: "silt",
    name: "Silty",
    description: "Smooth, fertile soil with moderate drainage",
    drainage: "moderate",
    waterRetention: "medium",
    irrigationAdjust: -10,
    waterloggingRisk: "medium",
    bestCrops: ["Vegetables", "Maize", "Wheat", "Sunflower"],
    avoidCrops: [],
    tips: ["Good fertility — reduce fertilizer inputs", "Monitor for compaction after rain", "Avoid heavy machinery on wet soil"],
  },
  {
    id: "peaty",
    name: "Peaty",
    description: "Dark, organic-rich soil with high moisture retention",
    drainage: "poor",
    waterRetention: "high",
    irrigationAdjust: -30,
    waterloggingRisk: "high",
    bestCrops: ["Blueberries", "Vegetables", "Potatoes"],
    avoidCrops: ["Drought-tolerant crops"],
    tips: ["Rarely needs irrigation", "Excellent organic matter — low fertilizer needed", "Drain well before planting"],
  },
  {
    id: "chalky",
    name: "Chalky",
    description: "Alkaline, stony soil with fast drainage",
    drainage: "excellent",
    waterRetention: "low",
    irrigationAdjust: +20,
    waterloggingRisk: "low",
    bestCrops: ["Lavender", "Spinach", "Brassicas", "Wheat"],
    avoidCrops: ["Acid-loving crops"],
    tips: ["Add sulfur to lower pH if needed", "Irrigate frequently", "Use acidifying fertilizers"],
  },
];

const DRAINAGE_STYLE: Record<string, string> = {
  excellent: "bg-success/10 text-success border-success/30",
  good:      "bg-success/10 text-success border-success/30",
  moderate:  "bg-warning/10 text-warning border-warning/30",
  poor:      "bg-destructive/10 text-destructive border-destructive/30",
};

const RETENTION_STYLE: Record<string, string> = {
  low:    "bg-warning/10 text-warning border-warning/30",
  medium: "bg-success/10 text-success border-success/30",
  high:   "bg-info/10 text-info border-info/30",
};

export function SoilTypeCard({ currentSoilType = "loam", onSave }: Props) {
  const [selected, setSelected] = useState(currentSoilType);
  const [saved, setSaved] = useState(false);
  const profile = SOIL_PROFILES.find((s) => s.id === selected) ?? SOIL_PROFILES[1];

  const handleSave = () => {
    setSaved(true);
    onSave?.(selected);
    toast.success(`Soil type set to ${profile.name}`);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-warning/10">
              <Layers className="h-3.5 w-3.5 text-warning" />
            </div>
            <CardTitle className="text-base">Soil Type & Impact</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs capitalize">{profile.name}</Badge>
            <Badge variant="outline" className="text-[10px]">UI Mockup</Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Select your soil type to refine irrigation and waterlogging estimates</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Soil type selector */}
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {SOIL_PROFILES.map((soil) => (
            <button
              key={soil.id}
              type="button"
              onClick={() => setSelected(soil.id)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-center transition-all",
                selected === soil.id
                  ? "border-primary bg-primary/10 ring-1 ring-primary"
                  : "border-border/60 bg-background/60 hover:bg-muted/30"
              )}
            >
              <Layers className={cn("h-4 w-4", selected === soil.id ? "text-primary" : "text-muted-foreground")} />
              <span className={cn("text-xs font-medium", selected === soil.id ? "text-primary" : "text-foreground")}>
                {soil.name}
              </span>
            </button>
          ))}
        </div>

        {/* Profile detail */}
        <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
          <div>
            <p className="text-sm font-semibold text-foreground">{profile.name} Soil</p>
            <p className="text-xs text-muted-foreground">{profile.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: "Drainage",      value: profile.drainage,        style: DRAINAGE_STYLE[profile.drainage]   },
              { label: "Water Retention", value: profile.waterRetention, style: RETENTION_STYLE[profile.waterRetention] },
              { label: "Waterlogging",  value: profile.waterloggingRisk, style: DRAINAGE_STYLE[profile.waterloggingRisk === "low" ? "good" : profile.waterloggingRisk === "medium" ? "moderate" : "poor"] },
              {
                label: "Irrigation adj.",
                value: profile.irrigationAdjust === 0 ? "Standard" : `${profile.irrigationAdjust > 0 ? "+" : ""}${profile.irrigationAdjust}%`,
                style: profile.irrigationAdjust > 0 ? "bg-info/10 text-info border-info/30" : profile.irrigationAdjust < 0 ? "bg-success/10 text-success border-success/30" : "bg-muted/60 text-muted-foreground border-border",
              },
            ].map((item) => (
              <div key={item.label} className={cn("rounded-lg border p-2 text-center", item.style)}>
                <p className="text-xs font-semibold capitalize">{item.value}</p>
                <p className="text-[10px] opacity-80">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Sprout className="h-3.5 w-3.5 text-success" />
                <p className="text-xs font-medium text-foreground">Best crops</p>
              </div>
              <div className="flex flex-wrap gap-1">
                {profile.bestCrops.slice(0, 4).map((c) => (
                  <Badge key={c} variant="secondary" className="text-[10px] px-1.5">{c}</Badge>
                ))}
              </div>
            </div>
            {profile.avoidCrops.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Avoid</p>
                <div className="flex flex-wrap gap-1">
                  {profile.avoidCrops.map((c) => (
                    <Badge key={c} className="bg-destructive/10 text-destructive border-destructive/30 border text-[10px] px-1.5">{c}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Droplets className="h-3.5 w-3.5 text-info" />
              <p className="text-xs font-medium text-foreground">Management tips</p>
            </div>
            {profile.tips.map((tip) => (
              <p key={tip} className="text-xs text-muted-foreground flex gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                {tip}
              </p>
            ))}
          </div>
        </div>

        <Button type="button" className="w-full gap-2" onClick={handleSave}>
          {saved ? <CheckCircle2 className="h-4 w-4" /> : <Layers className="h-4 w-4" />}
          {saved ? "Soil type saved!" : `Save soil type: ${profile.name}`}
        </Button>
      </CardContent>
    </Card>
  );
}
