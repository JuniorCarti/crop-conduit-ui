import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sprout, TrendingUp, TrendingDown, Minus, CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";
import type { HarvestSchedule } from "@/types/harvest";

interface Props {
  schedules: HarvestSchedule[];
  onUpdateActual?: (scheduleId: string, actualYield: number) => void;
}

interface YieldRow {
  id: string;
  cropName: string;
  field: string;
  expected: number;
  actual: number | null;
  unit: string;
  status: HarvestSchedule["status"];
  pct: number | null;
  trend: "over" | "under" | "on_track" | "pending";
}

function buildRows(schedules: HarvestSchedule[]): YieldRow[] {
  return schedules.map((s) => {
    const actual = (s as any).actualYield ?? null;
    const pct = actual != null && s.expectedYield > 0
      ? Math.round((actual / s.expectedYield) * 100)
      : null;
    const trend: YieldRow["trend"] =
      pct == null ? "pending" :
      pct >= 100 ? "over" :
      pct >= 85 ? "on_track" : "under";
    return {
      id: s.id,
      cropName: s.cropName,
      field: s.field,
      expected: s.expectedYield,
      actual,
      unit: s.yieldUnit,
      status: s.status,
      pct,
      trend,
    };
  });
}

const TREND_CONFIG = {
  over:     { icon: TrendingUp,   color: "text-success",     bg: "bg-success/10",     label: "Above target" },
  on_track: { icon: CheckCircle2, color: "text-success",     bg: "bg-success/10",     label: "On track"     },
  under:    { icon: TrendingDown, color: "text-destructive", bg: "bg-destructive/10", label: "Below target" },
  pending:  { icon: Minus,        color: "text-muted-foreground", bg: "bg-muted/40",  label: "Pending"      },
};

const SAMPLE_ROWS: YieldRow[] = [
  { id: "1", cropName: "Tomatoes",  field: "Field A", expected: 500,  actual: 480,  unit: "kg",  status: "Harvested",  pct: 96,  trend: "on_track" },
  { id: "2", cropName: "Kale",      field: "Field B", expected: 200,  actual: 230,  unit: "kg",  status: "Harvested",  pct: 115, trend: "over"     },
  { id: "3", cropName: "Potatoes",  field: "Field C", expected: 800,  actual: 620,  unit: "kg",  status: "InProgress", pct: 78,  trend: "under"    },
  { id: "4", cropName: "Maize",     field: "Field D", expected: 1200, actual: null, unit: "kg",  status: "Pending",    pct: null, trend: "pending"  },
];

export function YieldVsTargetTracker({ schedules, onUpdateActual }: Props) {
  const rows = schedules.length ? buildRows(schedules) : SAMPLE_ROWS;
  const isMockup = schedules.length === 0;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const totalExpected = rows.reduce((s, r) => s + r.expected, 0);
  const totalActual = rows.filter((r) => r.actual != null).reduce((s, r) => s + (r.actual ?? 0), 0);
  const overallPct = totalExpected > 0 && totalActual > 0
    ? Math.round((totalActual / totalExpected) * 100)
    : null;

  const handleSave = (id: string) => {
    const val = parseFloat(editValue);
    if (isNaN(val) || val < 0) { toast.error("Enter a valid yield"); return; }
    onUpdateActual?.(id, val);
    toast.success("Actual yield updated");
    setEditingId(null);
    setEditValue("");
  };

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <Sprout className="h-3.5 w-3.5 text-primary" />
            </div>
            <CardTitle className="text-base">Yield vs Target</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {overallPct != null && (
              <Badge className={cn("border text-xs",
                overallPct >= 100 ? "bg-success/10 text-success border-success/30" :
                overallPct >= 85  ? "bg-success/10 text-success border-success/30" :
                "bg-warning/10 text-warning border-warning/30"
              )}>
                Overall {overallPct}%
              </Badge>
            )}
            {isMockup && <Badge variant="outline" className="text-[10px]">Sample data</Badge>}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Actual vs expected yield per harvest schedule</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Overall summary */}
        {totalActual > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Total expected", value: `${totalExpected.toLocaleString()} kg` },
              { label: "Total actual",   value: `${totalActual.toLocaleString()} kg`   },
              { label: "Achievement",    value: overallPct != null ? `${overallPct}%` : "--" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-border/60 bg-muted/30 p-2 text-center">
                <p className="text-sm font-bold text-foreground">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Per-schedule rows */}
        <div className="space-y-2">
          {rows.map((row) => {
            const cfg = TREND_CONFIG[row.trend];
            const Icon = cfg.icon;
            const barWidth = row.pct != null ? Math.min(row.pct, 120) : 0;
            const isEditing = editingId === row.id;

            return (
              <div key={row.id} className="rounded-xl border border-border/60 bg-background/60 p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-md", cfg.bg)}>
                      <Icon className={cn("h-3 w-3", cfg.color)} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{row.cropName}</p>
                      <p className="text-[10px] text-muted-foreground">{row.field}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={cn("border text-[10px] px-1.5", cfg.bg, cfg.color,
                      row.trend === "over" ? "border-success/30" :
                      row.trend === "on_track" ? "border-success/30" :
                      row.trend === "under" ? "border-destructive/30" : "border-border"
                    )}>
                      {row.pct != null ? `${row.pct}%` : cfg.label}
                    </Badge>
                    {row.status !== "Cancelled" && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] px-2"
                        onClick={() => { setEditingId(row.id); setEditValue(String(row.actual ?? "")); }}
                      >
                        {row.actual != null ? "Update" : "Record"}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all",
                        row.trend === "over" ? "bg-success" :
                        row.trend === "on_track" ? "bg-success" :
                        row.trend === "under" ? "bg-destructive/70" : "bg-muted-foreground/30"
                      )}
                      style={{ width: `${Math.min(barWidth, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Actual: {row.actual != null ? `${row.actual.toLocaleString()} ${row.unit}` : "Not recorded"}</span>
                    <span>Target: {row.expected.toLocaleString()} {row.unit}</span>
                  </div>
                </div>

                {/* Inline edit */}
                {isEditing && (
                  <div className="flex items-center gap-2 pt-1">
                    <Input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      placeholder={`Actual yield in ${row.unit}`}
                      className="h-7 text-xs flex-1"
                      autoFocus
                    />
                    <Button type="button" size="sm" className="h-7 text-xs" onClick={() => handleSave(row.id)}>Save</Button>
                    <Button type="button" size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingId(null)}>Cancel</Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {rows.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <Sprout className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No harvest schedules yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
