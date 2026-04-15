import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Database, CloudSun, TrendingUp, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdvisoryGenerateResponse } from "@/types/advisory";

interface Props {
  advisory: AdvisoryGenerateResponse | null;
}

interface ConfidenceFactor {
  label: string;
  available: boolean;
  icon: React.ElementType;
  weight: number;
  note: string;
}

function computeConfidence(advisory: AdvisoryGenerateResponse | null): {
  score: number;
  level: "High" | "Medium" | "Low";
  factors: ConfidenceFactor[];
} {
  const hasWeather = Boolean(advisory?.dataUsed?.weatherHighlights?.length);
  const hasMarket = Boolean(advisory?.dataUsed?.marketHighlights?.length);
  const hasSummary = Boolean(advisory?.summary);
  const hasActions = Boolean(advisory?.actions?.length);
  const hasRisks = Boolean(advisory?.risks?.length);
  const hasLocation = Boolean(advisory?.dataUsed?.locationName);

  const factors: ConfidenceFactor[] = [
    { label: "Weather data",    available: hasWeather,  icon: CloudSun,    weight: 30, note: hasWeather  ? "Live forecast data used"          : "No weather data available"       },
    { label: "Market prices",   available: hasMarket,   icon: TrendingUp,  weight: 25, note: hasMarket   ? "Live market prices used"          : "No market data — forecast only"  },
    { label: "Farm location",   available: hasLocation, icon: Database,    weight: 20, note: hasLocation ? "Farm GPS coordinates used"        : "Location not set"                },
    { label: "AI summary",      available: hasSummary,  icon: ShieldCheck, weight: 15, note: hasSummary  ? "Full advisory generated"          : "Advisory not yet generated"      },
    { label: "Action items",    available: hasActions,  icon: ShieldCheck, weight: 10, note: hasActions  ? `${advisory?.actions?.length} actions returned` : "No actions returned" },
  ];

  const score = factors.reduce((sum, f) => sum + (f.available ? f.weight : 0), 0);
  const level: "High" | "Medium" | "Low" = score >= 70 ? "High" : score >= 40 ? "Medium" : "Low";

  return { score, level, factors };
}

const SAMPLE_ADVISORY: AdvisoryGenerateResponse = {
  summary: "Moderate rain expected. Apply fungicide before rain window closes.",
  actions: ["Apply fungicide", "Stake plants"],
  risks: ["Blight risk elevated"],
  dataUsed: {
    locationName: "Nakuru / Bahati",
    weatherHighlights: ["Max 28°C, 65% rain chance"],
    weatherSource: "WeatherAPI",
    marketHighlights: ["Tomatoes KES 45/kg at Wakulima"],
  },
};

const LEVEL_STYLE = {
  High:   { badge: "bg-success/10 text-success border-success/30",     ring: "#22c55e", label: "High Confidence"   },
  Medium: { badge: "bg-warning/10 text-warning border-warning/30",     ring: "#f59e0b", label: "Medium Confidence" },
  Low:    { badge: "bg-destructive/10 text-destructive border-destructive/30", ring: "#ef4444", label: "Low Confidence" },
};

export function AdvisoryConfidenceScore({ advisory }: Props) {
  const source = advisory ?? SAMPLE_ADVISORY;
  const isMockup = !advisory;
  const { score, level, factors } = computeConfidence(source);
  const style = LEVEL_STYLE[level];
  const circumference = 2 * Math.PI * 32;
  const strokeDash = (score / 100) * circumference;

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            </div>
            <CardTitle className="text-base">Advisory Confidence Score</CardTitle>
          </div>
          {isMockup && <Badge variant="outline" className="text-[10px]">UI Mockup</Badge>}
        </div>
        <p className="text-xs text-muted-foreground">How reliable is this advisory based on available data</p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {/* Score ring */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            <div className="relative h-20 w-20">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="32" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                <circle
                  cx="40" cy="40" r="32" fill="none"
                  stroke={style.ring}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${strokeDash} ${circumference}`}
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-foreground">{score}</span>
                <span className="text-[9px] text-muted-foreground">/ 100</span>
              </div>
            </div>
            <Badge className={cn("border text-xs", style.badge)}>{style.label}</Badge>
          </div>

          {/* Factor breakdown */}
          <div className="flex-1 space-y-2">
            {factors.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.label} className="flex items-center gap-2.5">
                  <div className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
                    f.available ? "bg-success/10" : "bg-muted/60"
                  )}>
                    <Icon className={cn("h-3 w-3", f.available ? "text-success" : "text-muted-foreground")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-foreground">{f.label}</span>
                      <span className={cn("text-[10px]", f.available ? "text-success" : "text-muted-foreground")}>
                        {f.available ? `+${f.weight}` : "0"}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">{f.note}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {level === "Low" && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/5 p-3">
            <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Low confidence — add your farm location and generate an advisory with live weather data to improve accuracy.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
