import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Scissors, Plus, Trash2, Package, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatKsh } from "@/lib/currency";
import type { HarvestSchedule } from "@/types/harvest";

interface Batch {
  id: string;
  scheduleId: string;
  label: string;
  quantity: number;
  unit: string;
  destination: string;
  buyer?: string;
  pricePerKg?: number;
  grade?: string;
  notes?: string;
}

const SAMPLE_BATCHES: Batch[] = [
  { id: "b1", scheduleId: "s1", label: "Batch A",  quantity: 280, unit: "kg", destination: "Wakulima Market",  buyer: "Buyer Co. Ltd",  pricePerKg: 65, grade: "A" },
  { id: "b2", scheduleId: "s1", label: "Batch B",  quantity: 150, unit: "kg", destination: "Marikiti Market",  buyer: "Fresh Mart",     pricePerKg: 50, grade: "B" },
  { id: "b3", scheduleId: "s1", label: "Batch C",  quantity: 50,  unit: "kg", destination: "Local processor",  pricePerKg: 30, grade: "C" },
  { id: "b4", scheduleId: "s1", label: "Reserve",  quantity: 20,  unit: "kg", destination: "Home storage",     notes: "For family use" },
];

const GRADE_COLOR: Record<string, string> = {
  A: "bg-success/10 text-success border-success/30",
  B: "bg-info/10 text-info border-info/30",
  C: "bg-warning/10 text-warning border-warning/30",
};

export function BatchSplitting({ schedules }: { schedules: HarvestSchedule[] }) {
  const [batches, setBatches] = useState<Batch[]>(SAMPLE_BATCHES);
  const [showForm, setShowForm] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState(schedules[0]?.id ?? "s1");
  const [form, setForm] = useState({
    label: "",
    quantity: "",
    unit: "kg",
    destination: "",
    buyer: "",
    pricePerKg: "",
    grade: "",
    notes: "",
  });

  const isMockup = schedules.length === 0;
  const schedule = schedules.find((s) => s.id === selectedScheduleId);
  const display = isMockup ? SAMPLE_BATCHES : batches.filter((b) => b.scheduleId === selectedScheduleId);

  const totalSplit = display.reduce((s, b) => s + b.quantity, 0);
  const expectedYield = schedule?.expectedYield ?? 500;
  const remaining = expectedYield - totalSplit;
  const splitPct = expectedYield > 0 ? Math.round((totalSplit / expectedYield) * 100) : 0;
  const totalRevenue = display.reduce((s, b) => s + (b.pricePerKg ? b.quantity * b.pricePerKg : 0), 0);

  const handleAdd = () => {
    if (!form.label || !form.quantity || !form.destination) { toast.error("Fill in label, quantity, and destination"); return; }
    const batch: Batch = {
      id: `b${Date.now()}`,
      scheduleId: selectedScheduleId,
      label: form.label,
      quantity: parseFloat(form.quantity),
      unit: form.unit,
      destination: form.destination,
      buyer: form.buyer || undefined,
      pricePerKg: form.pricePerKg ? parseFloat(form.pricePerKg) : undefined,
      grade: form.grade || undefined,
      notes: form.notes || undefined,
    };
    setBatches((p) => [...p, batch]);
    toast.success(`${form.label} added`);
    setShowForm(false);
    setForm({ label: "", quantity: "", unit: "kg", destination: "", buyer: "", pricePerKg: "", grade: "", notes: "" });
  };

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <Scissors className="h-3.5 w-3.5 text-primary" />
            </div>
            <CardTitle className="text-base">Batch Splitting</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">{display.length} batches</Badge>
            {isMockup && <Badge variant="outline" className="text-[10px]">Sample data</Badge>}
            <Button type="button" size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => setShowForm((p) => !p)}>
              <Plus className="h-3.5 w-3.5" /> Add batch
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Split one harvest into multiple batches for different buyers or markets</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Schedule selector */}
        {!isMockup && schedules.length > 1 && (
          <div className="space-y-1">
            <Label className="text-xs">Schedule</Label>
            <Select value={selectedScheduleId} onValueChange={setSelectedScheduleId}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{schedules.map((s) => <SelectItem key={s.id} value={s.id}>{s.cropName} — {s.field}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        )}

        {/* Split progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Split: {totalSplit} / {expectedYield} kg ({splitPct}%)</span>
            <span className={cn("font-medium", remaining < 0 ? "text-destructive" : remaining === 0 ? "text-success" : "text-muted-foreground")}>
              {remaining >= 0 ? `${remaining} kg unallocated` : `${Math.abs(remaining)} kg over-allocated`}
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", splitPct > 100 ? "bg-destructive" : splitPct === 100 ? "bg-success" : "bg-primary")}
              style={{ width: `${Math.min(splitPct, 100)}%` }}
            />
          </div>
          {totalRevenue > 0 && (
            <p className="text-xs text-muted-foreground">
              Projected revenue: <span className="font-semibold text-foreground">{formatKsh(totalRevenue)}</span>
            </p>
          )}
        </div>

        {/* Add form */}
        {showForm && (
          <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-3 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">New batch</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Batch label</Label>
                <Input value={form.label} onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))} className="h-8 text-xs" placeholder="e.g. Batch A" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Quantity (kg)</Label>
                <Input type="number" value={form.quantity} onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))} className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Destination</Label>
                <Input value={form.destination} onChange={(e) => setForm((p) => ({ ...p, destination: e.target.value }))} className="h-8 text-xs" placeholder="Market / Buyer / Storage" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Buyer name</Label>
                <Input value={form.buyer} onChange={(e) => setForm((p) => ({ ...p, buyer: e.target.value }))} className="h-8 text-xs" placeholder="optional" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Price per kg (KES)</Label>
                <Input type="number" value={form.pricePerKg} onChange={(e) => setForm((p) => ({ ...p, pricePerKg: e.target.value }))} className="h-8 text-xs" placeholder="optional" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Grade</Label>
                <Select value={form.grade} onValueChange={(v) => setForm((p) => ({ ...p, grade: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select grade" /></SelectTrigger>
                  <SelectContent>
                    {["A","B","C","Mixed"].map((g) => <SelectItem key={g} value={g}>Grade {g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={handleAdd} className="gap-1 text-xs"><Plus className="h-3.5 w-3.5" /> Add</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(false)} className="text-xs">Cancel</Button>
            </div>
          </div>
        )}

        {/* Batch cards */}
        <div className="space-y-2">
          {display.map((batch) => (
            <div key={batch.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/60 p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Package className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{batch.label}</span>
                  <span className="text-xs text-muted-foreground">{batch.quantity} {batch.unit}</span>
                  {batch.grade && (
                    <Badge className={cn("border text-[10px] px-1.5", GRADE_COLOR[batch.grade] ?? "bg-muted/60 text-muted-foreground border-border")}>
                      Grade {batch.grade}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <ArrowRight className="h-3 w-3" />
                  <span className="truncate">{batch.destination}</span>
                  {batch.buyer && <span>· {batch.buyer}</span>}
                  {batch.pricePerKg && <span>· {formatKsh(batch.pricePerKg)}/kg</span>}
                </div>
              </div>
              {batch.pricePerKg && (
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-success">{formatKsh(batch.quantity * batch.pricePerKg)}</p>
                  <p className="text-[10px] text-muted-foreground">revenue</p>
                </div>
              )}
              {!isMockup && (
                <button type="button" onClick={() => setBatches((p) => p.filter((b) => b.id !== batch.id))} className="text-muted-foreground hover:text-destructive shrink-0">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
          {display.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <Scissors className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No batches yet — add your first split</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
