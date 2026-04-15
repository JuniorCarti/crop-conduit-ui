import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Plus, Trash2, TrendingDown, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { HarvestSchedule } from "@/types/harvest";

interface LossRecord {
  id: string;
  scheduleId: string;
  cropName: string;
  quantity: number;
  unit: string;
  cause: LossCause;
  stage: LossStage;
  date: string;
  notes?: string;
  estimatedValueKes?: number;
}

type LossCause = "spoilage" | "transport_damage" | "theft" | "weather" | "pest" | "market_rejection" | "other";
type LossStage = "field" | "storage" | "transport" | "market";

const CAUSE_LABELS: Record<LossCause, string> = {
  spoilage:          "Spoilage / Rot",
  transport_damage:  "Transport Damage",
  theft:             "Theft",
  weather:           "Weather Damage",
  pest:              "Pest / Disease",
  market_rejection:  "Market Rejection",
  other:             "Other",
};

const STAGE_LABELS: Record<LossStage, string> = {
  field:     "In Field",
  storage:   "In Storage",
  transport: "During Transport",
  market:    "At Market",
};

const CAUSE_COLOR: Record<LossCause, string> = {
  spoilage:         "bg-warning/10 text-warning border-warning/30",
  transport_damage: "bg-destructive/10 text-destructive border-destructive/30",
  theft:            "bg-destructive/10 text-destructive border-destructive/30",
  weather:          "bg-info/10 text-info border-info/30",
  pest:             "bg-warning/10 text-warning border-warning/30",
  market_rejection: "bg-muted/60 text-muted-foreground border-border",
  other:            "bg-muted/60 text-muted-foreground border-border",
};

const SAMPLE_LOSSES: LossRecord[] = [
  { id: "1", scheduleId: "s1", cropName: "Tomatoes",  quantity: 45,  unit: "kg",  cause: "spoilage",         stage: "storage",   date: "2025-01-18", estimatedValueKes: 2250, notes: "Stored too long before delivery" },
  { id: "2", scheduleId: "s1", cropName: "Tomatoes",  quantity: 20,  unit: "kg",  cause: "transport_damage", stage: "transport", date: "2025-01-19", estimatedValueKes: 1000 },
  { id: "3", scheduleId: "s2", cropName: "Kale",      quantity: 15,  unit: "kg",  cause: "market_rejection", stage: "market",    date: "2025-01-20", estimatedValueKes: 675,  notes: "Grade below buyer standard" },
];

export function PostHarvestLossTracker({ schedules }: { schedules: HarvestSchedule[] }) {
  const [losses, setLosses] = useState<LossRecord[]>(SAMPLE_LOSSES);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    scheduleId: schedules[0]?.id ?? "",
    quantity: "",
    unit: "kg",
    cause: "spoilage" as LossCause,
    stage: "storage" as LossStage,
    date: new Date().toISOString().slice(0, 10),
    notes: "",
    estimatedValueKes: "",
  });

  const isMockup = schedules.length === 0;
  const displayLosses = isMockup ? SAMPLE_LOSSES : losses.filter((l) => schedules.some((s) => s.id === l.scheduleId));

  const totalLossKg = displayLosses.reduce((s, l) => s + l.quantity, 0);
  const totalLossKes = displayLosses.reduce((s, l) => s + (l.estimatedValueKes ?? 0), 0);

  const byCause = Object.entries(CAUSE_LABELS).map(([cause, label]) => ({
    cause: cause as LossCause,
    label,
    qty: displayLosses.filter((l) => l.cause === cause).reduce((s, l) => s + l.quantity, 0),
  })).filter((c) => c.qty > 0).sort((a, b) => b.qty - a.qty);

  const handleAdd = () => {
    if (!form.quantity || !form.scheduleId) { toast.error("Fill in all required fields"); return; }
    const schedule = schedules.find((s) => s.id === form.scheduleId);
    const record: LossRecord = {
      id: `l${Date.now()}`,
      scheduleId: form.scheduleId,
      cropName: schedule?.cropName ?? "Unknown",
      quantity: parseFloat(form.quantity),
      unit: form.unit,
      cause: form.cause,
      stage: form.stage,
      date: form.date,
      notes: form.notes || undefined,
      estimatedValueKes: form.estimatedValueKes ? parseFloat(form.estimatedValueKes) : undefined,
    };
    setLosses((prev) => [record, ...prev]);
    toast.success("Loss recorded");
    setShowForm(false);
    setForm({ scheduleId: schedules[0]?.id ?? "", quantity: "", unit: "kg", cause: "spoilage", stage: "storage", date: new Date().toISOString().slice(0, 10), notes: "", estimatedValueKes: "" });
  };

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-destructive/10">
              <TrendingDown className="h-3.5 w-3.5 text-destructive" />
            </div>
            <CardTitle className="text-base">Post-Harvest Loss Tracker</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {totalLossKg > 0 && (
              <Badge className="bg-destructive/10 text-destructive border-destructive/30 border text-xs">
                {totalLossKg} kg lost
              </Badge>
            )}
            {isMockup && <Badge variant="outline" className="text-[10px]">Sample data</Badge>}
            <Button type="button" size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => setShowForm((p) => !p)}>
              <Plus className="h-3.5 w-3.5" /> Record loss
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Track spoilage, damage, and losses across all harvest batches</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: "Total loss",    value: `${totalLossKg} kg`,                                    color: "text-destructive" },
            { label: "Est. value",    value: totalLossKes > 0 ? `KES ${totalLossKes.toLocaleString()}` : "--", color: "text-destructive" },
            { label: "Loss events",   value: String(displayLosses.length),                            color: "text-foreground"  },
            { label: "Top cause",     value: byCause[0]?.label.split(" ")[0] ?? "--",                 color: "text-warning"     },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border/60 bg-muted/30 p-2 text-center">
              <p className={cn("text-sm font-bold", s.color)}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Cause breakdown */}
        {byCause.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Loss by cause</p>
            {byCause.map((c) => (
              <div key={c.cause} className="flex items-center gap-2">
                <span className="text-xs text-foreground w-32 shrink-0 truncate">{c.label}</span>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-destructive/60" style={{ width: `${Math.min((c.qty / totalLossKg) * 100, 100)}%` }} />
                </div>
                <span className="text-xs text-muted-foreground shrink-0 w-12 text-right">{c.qty} kg</span>
              </div>
            ))}
          </div>
        )}

        {/* Add form */}
        {showForm && (
          <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-3 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Record new loss</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {!isMockup && (
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs">Harvest schedule</Label>
                  <Select value={form.scheduleId} onValueChange={(v) => setForm((p) => ({ ...p, scheduleId: v }))}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {schedules.map((s) => <SelectItem key={s.id} value={s.id}>{s.cropName} — {s.field}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1">
                <Label className="text-xs">Quantity lost</Label>
                <Input type="number" value={form.quantity} onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))} className="h-8 text-xs" placeholder="e.g. 25" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Unit</Label>
                <Select value={form.unit} onValueChange={(v) => setForm((p) => ({ ...p, unit: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["kg","bags","bundles","tons"].map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Cause</Label>
                <Select value={form.cause} onValueChange={(v: any) => setForm((p) => ({ ...p, cause: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CAUSE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Stage</Label>
                <Select value={form.stage} onValueChange={(v: any) => setForm((p) => ({ ...p, stage: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STAGE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Est. value lost (KES)</Label>
                <Input type="number" value={form.estimatedValueKes} onChange={(e) => setForm((p) => ({ ...p, estimatedValueKes: e.target.value }))} className="h-8 text-xs" placeholder="optional" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Date</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} className="h-8 text-xs" />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">Notes (optional)</Label>
                <Textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} className="text-xs min-h-[60px]" placeholder="What caused this loss?" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={handleAdd} className="gap-1 text-xs">
                <Plus className="h-3.5 w-3.5" /> Save loss
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(false)} className="text-xs">Cancel</Button>
            </div>
          </div>
        )}

        {/* Loss records */}
        <div className="space-y-2">
          {displayLosses.slice(0, 5).map((loss) => (
            <div key={loss.id} className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/60 p-3">
              <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{loss.cropName}</span>
                  <Badge className={cn("border text-[10px] px-1.5", CAUSE_COLOR[loss.cause])}>{CAUSE_LABELS[loss.cause]}</Badge>
                  <Badge variant="outline" className="text-[10px] px-1.5">{STAGE_LABELS[loss.stage]}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {loss.quantity} {loss.unit} lost · {loss.date}
                  {loss.estimatedValueKes ? ` · KES ${loss.estimatedValueKes.toLocaleString()}` : ""}
                </p>
                {loss.notes && <p className="text-[10px] text-muted-foreground italic">{loss.notes}</p>}
              </div>
              {!isMockup && (
                <button type="button" onClick={() => setLosses((p) => p.filter((l) => l.id !== loss.id))} className="text-muted-foreground hover:text-destructive shrink-0">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
          {displayLosses.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <Package className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No losses recorded — great work!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
