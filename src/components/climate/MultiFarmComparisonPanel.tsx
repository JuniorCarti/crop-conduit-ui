import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GitCompare, MapPin, Thermometer, CloudRain, Wind, Droplets, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FarmLocation } from "@/types/climate";
import type { ClimateSignal } from "@/lib/climateInsights";

interface FarmSnapshot {
  farm: FarmLocation;
  signals: ClimateSignal[];
  avgMaxTemp: number | null;
  avgRainChance: number | null;
  totalRainMm: number | null;
  avgWind: number | null;
  healthScore: number;
}

interface Props {
  farms: FarmLocation[];
  selectedFarmId: string | null;
  onSelectFarm: (id: string) => void;
}

const LEVEL_SCORE: Record<string, number> = {
  good: 95, low: 80, medium: 50, warning: 40, high: 20, critical: 5,
};

const SCORE_SIGNALS = ["heat-stress","cold-stress","rainfall-trend","irrigation-pressure","disease-pressure","harvest-disruption"];

function computeScore(signals: ClimateSignal[]): number {
  const relevant = signals.filter((s) => SCORE_SIGNALS.includes(s.id));
  if (!relevant.length) return 72;
  return Math.round(relevant.reduce((s, sig) => s + (LEVEL_SCORE[sig.level] ?? 50), 0) / relevant.length);
}

// Sample data for farms without live forecast
const SAMPLE_SNAPSHOTS: FarmSnapshot[] = [
  {
    farm: { id: "f1", uid: "u1", name: "Nakuru Farm", county: "Nakuru", ward: "Bahati", lat: -0.28, lon: 36.07, crops: ["Tomatoes","Kale"] },
    signals: [],
    avgMaxTemp: 28, avgRainChance: 45, totalRainMm: 18, avgWind: 14, healthScore: 74,
  },
  {
    farm: { id: "f2", uid: "u1", name: "Kiambu Plot", county: "Kiambu", ward: "Limuru", lat: -1.10, lon: 36.64, crops: ["Potatoes","Beans"] },
    signals: [],
    avgMaxTemp: 22, avgRainChance: 62, totalRainMm: 31, avgWind: 10, healthScore: 61,
  },
  {
    farm: { id: "f3", uid: "u1", name: "Meru Shamba", county: "Meru", ward: "Imenti", lat: 0.05, lon: 37.65, crops: ["Maize","Onions"] },
    signals: [],
    avgMaxTemp: 31, avgRainChance: 22, totalRainMm: 5, avgWind: 20, healthScore: 55,
  },
];

const SCORE_COLOR = (s: number) => s >= 75 ? "text-success" : s >= 50 ? "text-warning" : "text-destructive";
const SCORE_BG = (s: number) => s >= 75 ? "bg-success/10 border-success/30" : s >= 50 ? "bg-warning/10 border-warning/30" : "bg-destructive/10 border-destructive/30";

export function MultiFarmComparisonPanel({ farms, selectedFarmId, onSelectFarm }: Props) {
  const isMockup = farms.length < 2;
  const snapshots: FarmSnapshot[] = isMockup
    ? SAMPLE_SNAPSHOTS
    : farms.slice(0, 4).map((farm) => ({
        farm,
        signals: [],
        avgMaxTemp: null,
        avgRainChance: null,
        totalRainMm: null,
        avgWind: null,
        healthScore: computeScore([]),
      }));

  const best = [...snapshots].sort((a, b) => b.healthScore - a.healthScore)[0];

  const metrics = [
    { key: "avgMaxTemp",    label: "Avg Max Temp", unit: "°C",  icon: Thermometer, color: "text-warning",  better: "lower" as const },
    { key: "avgRainChance", label: "Rain Chance",  unit: "%",   icon: CloudRain,   color: "text-info",     better: "higher" as const },
    { key: "totalRainMm",   label: "Total Rain",   unit: "mm",  icon: Droplets,    color: "text-success",  better: "higher" as const },
    { key: "avgWind",       label: "Avg Wind",     unit: "kph", icon: Wind,        color: "text-muted-foreground", better: "lower" as const },
  ];

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <GitCompare className="h-3.5 w-3.5 text-primary" />
            </div>
            <CardTitle className="text-base">Multi-Farm Comparison</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">{snapshots.length} farms</Badge>
            {isMockup && <Badge variant="outline" className="text-[10px]">UI Mockup</Badge>}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Side-by-side climate signals and health scores across your farms</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Best farm banner */}
        {best && (
          <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/5 px-3 py-2">
            <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{best.farm.name}</span> has the best conditions this week (score: {best.healthScore}/100)
            </p>
          </div>
        )}

        {/* Farm score cards */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {snapshots.map((snap) => {
            const isSelected = snap.farm.id === selectedFarmId;
            return (
              <button
                key={snap.farm.id}
                type="button"
                onClick={() => onSelectFarm(snap.farm.id)}
                className={cn(
                  "flex flex-col gap-2 rounded-xl border p-3 text-left transition-all hover:shadow-sm",
                  isSelected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border/60 bg-background/60"
                )}
              >
                <div className="flex items-start justify-between gap-1">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{snap.farm.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                      <p className="text-[10px] text-muted-foreground truncate">{snap.farm.county}</p>
                    </div>
                  </div>
                  <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-sm font-bold", SCORE_BG(snap.healthScore), SCORE_COLOR(snap.healthScore))}>
                    {snap.healthScore}
                  </div>
                </div>
                {snap.farm.crops?.length ? (
                  <div className="flex flex-wrap gap-1">
                    {snap.farm.crops.slice(0, 2).map((c) => (
                      <Badge key={c} variant="secondary" className="text-[10px] px-1.5">{c}</Badge>
                    ))}
                  </div>
                ) : null}
                {isSelected && (
                  <Badge className="bg-primary/10 text-primary border-primary/30 border text-[10px] w-fit">Active farm</Badge>
                )}
              </button>
            );
          })}
        </div>

        {/* Metric comparison table */}
        <div className="overflow-x-auto rounded-xl border border-border/60">
          <table className="w-full text-xs">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-3 py-2 text-left text-muted-foreground font-medium">Metric</th>
                {snapshots.map((s) => (
                  <th key={s.farm.id} className="px-3 py-2 text-center text-muted-foreground font-medium">
                    {s.farm.name.split(" ")[0]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric) => {
                const values = snapshots.map((s) => s[metric.key as keyof FarmSnapshot] as number | null);
                const validVals = values.filter((v): v is number => v !== null);
                const bestVal = validVals.length
                  ? metric.better === "higher" ? Math.max(...validVals) : Math.min(...validVals)
                  : null;
                const Icon = metric.icon;
                return (
                  <tr key={metric.key} className="border-t border-border/60">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <Icon className={cn("h-3.5 w-3.5", metric.color)} />
                        <span className="text-muted-foreground">{metric.label}</span>
                      </div>
                    </td>
                    {snapshots.map((s) => {
                      const val = s[metric.key as keyof FarmSnapshot] as number | null;
                      const isBest = val !== null && val === bestVal;
                      return (
                        <td key={s.farm.id} className="px-3 py-2 text-center">
                          <span className={cn("font-medium", isBest ? "text-success" : "text-foreground")}>
                            {val !== null ? `${val}${metric.unit}` : "—"}
                          </span>
                          {isBest && <span className="ml-1 text-[9px] text-success">✓</span>}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              <tr className="border-t border-border/60 bg-muted/20">
                <td className="px-3 py-2 font-semibold text-foreground">Health Score</td>
                {snapshots.map((s) => (
                  <td key={s.farm.id} className="px-3 py-2 text-center">
                    <span className={cn("font-bold", SCORE_COLOR(s.healthScore))}>{s.healthScore}</span>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
