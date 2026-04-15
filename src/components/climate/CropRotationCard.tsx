import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Leaf, ArrowRight, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ClimateSignal } from "@/lib/climateInsights";

interface Props {
  signals: ClimateSignal[];
  currentCrops?: string[];
}

interface RotationSuggestion {
  crop: string;
  reason: string;
  benefit: string;
  season: string;
  difficulty: "Easy" | "Moderate" | "Advanced";
}

const ROTATION_DB: Record<string, RotationSuggestion[]> = {
  tomatoes: [
    { crop: "Maize",   reason: "Breaks tomato disease cycle",       benefit: "Reduces blight & nematodes",    season: "Short rains", difficulty: "Easy"     },
    { crop: "Beans",   reason: "Fixes nitrogen depleted by tomatoes", benefit: "Improves soil fertility",      season: "Any",         difficulty: "Easy"     },
    { crop: "Onions",  reason: "Repels common tomato pests",         benefit: "Natural pest management",       season: "Dry season",  difficulty: "Moderate" },
  ],
  potatoes: [
    { crop: "Legumes", reason: "Restores nitrogen after heavy potato uptake", benefit: "Soil health recovery", season: "Short rains", difficulty: "Easy"     },
    { crop: "Maize",   reason: "Different root depth reduces soil compaction", benefit: "Improved soil structure", season: "Long rains", difficulty: "Easy"  },
    { crop: "Kale",    reason: "Different pest profile",             benefit: "Breaks pest cycles",            season: "Any",         difficulty: "Easy"     },
  ],
  maize: [
    { crop: "Beans",   reason: "Classic companion — fixes nitrogen", benefit: "Reduces fertilizer needs",      season: "Short rains", difficulty: "Easy"     },
    { crop: "Sorghum", reason: "Drought-tolerant alternative",       benefit: "Climate resilience",            season: "Dry season",  difficulty: "Easy"     },
    { crop: "Sunflower", reason: "Deep roots break hardpan",         benefit: "Improves drainage",             season: "Any",         difficulty: "Moderate" },
  ],
  default: [
    { crop: "Legumes", reason: "Universal soil restorer",            benefit: "Nitrogen fixation",             season: "Any",         difficulty: "Easy"     },
    { crop: "Sorghum", reason: "Drought-tolerant cover crop",        benefit: "Soil moisture retention",       season: "Dry season",  difficulty: "Easy"     },
    { crop: "Kale",    reason: "Fast-growing, low input",            benefit: "Quick income between seasons",  season: "Any",         difficulty: "Easy"     },
  ],
};

const DIFFICULTY_STYLE = {
  Easy:     "bg-success/10 text-success border-success/30",
  Moderate: "bg-warning/10 text-warning border-warning/30",
  Advanced: "bg-destructive/10 text-destructive border-destructive/30",
};

function getSignalContext(signals: ClimateSignal[]): string {
  const disease = signals.find((s) => s.id === "disease-pressure" && ["high", "critical", "warning", "medium"].includes(s.level));
  const waterlog = signals.find((s) => s.id === "soil-waterlogging" && ["high", "critical"].includes(s.level));
  const drought = signals.find((s) => s.id === "irrigation-pressure" && s.level === "high");
  if (disease) return "High disease pressure detected — rotation strongly recommended";
  if (waterlog) return "Waterlogging risk — choose crops with different drainage needs";
  if (drought) return "Dry conditions — consider drought-tolerant rotation crops";
  return "Routine rotation recommended to maintain soil health";
}

export function CropRotationCard({ signals, currentCrops = [] }: Props) {
  const isMockup = signals.length === 0;
  const primaryCrop = currentCrops[0]?.toLowerCase() ?? "default";
  const cropKey = Object.keys(ROTATION_DB).find((k) => primaryCrop.includes(k)) ?? "default";
  const suggestions = ROTATION_DB[cropKey] ?? ROTATION_DB.default;
  const context = signals.length ? getSignalContext(signals) : "Routine rotation recommended to maintain soil health";

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-success/10">
              <Leaf className="h-3.5 w-3.5 text-success" />
            </div>
            <CardTitle className="text-base">Crop Rotation Suggestions</CardTitle>
          </div>
          {isMockup && <Badge variant="outline" className="text-[10px]">UI Mockup</Badge>}
        </div>
        <p className="text-xs text-muted-foreground">
          {currentCrops.length > 0
            ? <>After <span className="font-medium text-foreground capitalize">{currentCrops.slice(0, 2).join(", ")}</span> — next season options</>
            : "Next season crop options based on climate signals"}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Signal context */}
        <div className="flex items-start gap-2 rounded-xl border border-info/30 bg-info/5 p-3">
          <Info className="h-4 w-4 text-info shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">{context}</p>
        </div>

        {/* Current → Next flow */}
        {currentCrops.length > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <div className="flex flex-wrap gap-1.5">
              {currentCrops.slice(0, 2).map((c) => (
                <Badge key={c} variant="secondary" className="capitalize text-xs">{c}</Badge>
              ))}
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground">Rotate to</span>
          </div>
        )}

        {/* Suggestions */}
        <div className="space-y-2">
          {suggestions.map((s, i) => (
            <div key={s.crop} className={cn(
              "rounded-xl border p-3 space-y-1.5",
              i === 0 ? "border-success/40 bg-success/5" : "border-border/60 bg-background/60"
            )}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {i === 0 && <CheckCircle2 className="h-3.5 w-3.5 text-success" />}
                  <span className="text-sm font-semibold text-foreground">{s.crop}</span>
                  <Badge variant="outline" className="text-[10px] px-1.5">{s.season}</Badge>
                </div>
                <Badge className={cn("border text-[10px] px-1.5", DIFFICULTY_STYLE[s.difficulty])}>
                  {s.difficulty}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{s.reason}</p>
              <p className="text-[10px] font-medium text-success">✓ {s.benefit}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
