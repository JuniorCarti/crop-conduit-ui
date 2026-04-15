import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Star, Plus, ClipboardList, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { HarvestSchedule } from "@/types/harvest";

type Grade = "A" | "B" | "C" | "Rejected";

interface GradeRecord {
  id: string;
  scheduleId: string;
  cropName: string;
  grade: Grade;
  weightKg: number;
  pricePerKg?: number;
  inspector?: string;
  date: string;
  notes?: string;
  buyerFeedback?: string;
}

const GRADE_CONFIG: Record<Grade, { label: string; desc: string; color: string; bg: string; border: string; stars: number }> = {
  A:        { label: "Grade A", desc: "Premium — export/supermarket quality", color: "text-success",     bg: "bg-success/10",     border: "border-success/30",     stars: 3 },
  B:        { label: "Grade B", desc: "Good — local market quality",          color: "text-info",        bg: "bg-info/10",        border: "border-info/30",        stars: 2 },
  C:        { label: "Grade C", desc: "Fair — processing / low-end market",   color: "text-warning",     bg: "bg-warning/10",     border: "border-warning/30",     stars: 1 },
  Rejected: { label: "Rejected", desc: "Below standard — not marketable",     color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30", stars: 0 },
};

const SAMPLE_RECORDS: GradeRecord[] = [
  { id: "1", scheduleId: "s1", cropName: "Tomatoes", grade: "A", weightKg: 280, pricePerKg: 65, inspector: "John M.", date: "2025-01-20", notes: "Firm, uniform size, no blemishes", buyerFeedback: "Excellent batch" },
  { id: "2", scheduleId: "s1", cropName: "Tomatoes", grade: "B", weightKg: 150, pricePerKg: 50, inspector: "John M.", date: "2025-01-20", notes: "Minor surface marks, good taste" },
  { id: "3", scheduleId: "s1", cropName: "Tomatoes", grade: "C", weightKg: 50,  pricePerKg: 30, inspector: "John M.", date: "2025-01-20", notes: "Overripe, suitable for processing" },
  { id: "4", scheduleId: "s2", cropName: "Kale",     grade: "A", weightKg: 180, pricePerKg: 45, inspector: "Mary W.", date: "2025-01-21" },
];

export function QualityGradingLog({ schedules }: { schedules: HarvestSchedule[] }) {
  const [records, setRecords] = useState<GradeRecord[]>(SAMPLE_RECORDS);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    scheduleId: schedules[0]?.id ?? "",
    grade: "A" as Grade,
    weightKg: "",
    pricePerKg: "",
    inspector: "",
    date: new Date().toISOString().slice(0, 10),
    notes: "",
    buyerFeedback: "",
  });

  const isMockup = schedules.length === 0;
  const display = isMockup ? SAMPLE_RECORDS : records.filter((r) => schedules.some((s) => s.id === r.scheduleId));

  const totalWeight = display.reduce((s, r) => s + r.weightKg, 0);
  const gradeA = display.filter((r) => r.grade === "A").reduce((s, r) => s + r.weightKg, 0);
  const gradeAPct = totalWeight > 0 ? Math.round((gradeA / totalWeight) * 100) : 0;

  const gradeSummary = (["A", "B", "C", "Rejected"] as Grade[]).map((g) => ({
    grade: g,
    weight: display.filter((r) => r.grade === g).reduce((s, r) => s + r.weightKg, 0),
    count: display.filter((r) => r.grade === g).length,
  })).filter((g) => g.weight > 0);

  const handleAdd = () => {
    if (!form.weightKg) { toast.error("Enter weight"); return; }
    const schedule = schedules.find((s) => s.id === form.scheduleId);
    const record: GradeRecord = {
      id: `g${Date.now()}`,
      scheduleId: form.scheduleId,
      cropName: schedule?.cropName ?? "Unknown",
      grade: form.grade,
      weightKg: parseFloat(form.weightKg),
      pricePerKg: form.pricePerKg ? parseFloat(form.pricePerKg) : undefined,
      inspector: form.inspector || undefined,
      date: form.date,
      notes: form.notes || undefined,
      buyerFeedback: form.buyerFeedback || undefined,
    };
    setRecords((p) => [record, ...p]);
    toast.success(`Grade ${form.grade} batch recorded`);
    setShowForm(false);
  };

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-warning/10">
              <Star className="h-3.5 w-3.5 text-warning" />
            </div>
            <CardTitle className="text-base">Quality Grading Log</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {gradeAPct > 0 && (
              <Badge className="bg-success/10 text-success border-success/30 border text-xs">{gradeAPct}% Grade A</Badge>
            )}
            {isMockup && <Badge variant="outline" className="text-[10px]">Sample data</Badge>}
            <Button type="button" size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => setShowForm((p) => !p)}>
              <Plus className="h-3.5 w-3.5" /> Grade batch
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Record quality grades per harvest batch with buyer feedback</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Grade distribution */}
        {gradeSummary.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Grade distribution</p>
            <div className="grid grid-cols-4 gap-1.5">
              {(["A","B","C","Rejected"] as Grade[]).map((g) => {
                const cfg = GRADE_CONFIG[g];
                const data = gradeSummary.find((s) => s.grade === g);
                return (
                  <div key={g} className={cn("rounded-xl border p-2 text-center", cfg.bg, cfg.border)}>
                    <div className="flex justify-center gap-0.5 mb-1">
                      {Array.from({ length: cfg.stars }).map((_, i) => (
                        <Star key={i} className={cn("h-2.5 w-2.5 fill-current", cfg.color)} />
                      ))}
                      {cfg.stars === 0 && <span className="text-[10px] text-destructive">✗</span>}
                    </div>
                    <p className={cn("text-sm font-bold", cfg.color)}>{data?.weight ?? 0} kg</p>
                    <p className="text-[10px] text-muted-foreground">{cfg.label}</p>
                  </div>
                );
              })}
            </div>
            {/* Distribution bar */}
            {totalWeight > 0 && (
              <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
                {gradeSummary.map((g) => {
                  const cfg = GRADE_CONFIG[g.grade];
                  const pct = (g.weight / totalWeight) * 100;
                  return (
                    <div
                      key={g.grade}
                      className={cn("h-full transition-all", g.grade === "A" ? "bg-success" : g.grade === "B" ? "bg-info" : g.grade === "C" ? "bg-warning" : "bg-destructive")}
                      style={{ width: `${pct}%` }}
                      title={`${cfg.label}: ${g.weight}kg (${Math.round(pct)}%)`}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Add form */}
        {showForm && (
          <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-3 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Record graded batch</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {!isMockup && (
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs">Schedule</Label>
                  <Select value={form.scheduleId} onValueChange={(v) => setForm((p) => ({ ...p, scheduleId: v }))}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{schedules.map((s) => <SelectItem key={s.id} value={s.id}>{s.cropName} — {s.field}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1">
                <Label className="text-xs">Grade</Label>
                <Select value={form.grade} onValueChange={(v: any) => setForm((p) => ({ ...p, grade: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{(["A","B","C","Rejected"] as Grade[]).map((g) => <SelectItem key={g} value={g}>{GRADE_CONFIG[g].label} — {GRADE_CONFIG[g].desc}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Weight (kg)</Label>
                <Input type="number" value={form.weightKg} onChange={(e) => setForm((p) => ({ ...p, weightKg: e.target.value }))} className="h-8 text-xs" placeholder="e.g. 150" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Price per kg (KES)</Label>
                <Input type="number" value={form.pricePerKg} onChange={(e) => setForm((p) => ({ ...p, pricePerKg: e.target.value }))} className="h-8 text-xs" placeholder="optional" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Inspector name</Label>
                <Input value={form.inspector} onChange={(e) => setForm((p) => ({ ...p, inspector: e.target.value }))} className="h-8 text-xs" placeholder="optional" />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">Quality notes</Label>
                <Textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} className="text-xs min-h-[50px]" placeholder="Size, colour, firmness, defects..." />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">Buyer feedback</Label>
                <Input value={form.buyerFeedback} onChange={(e) => setForm((p) => ({ ...p, buyerFeedback: e.target.value }))} className="h-8 text-xs" placeholder="optional" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={handleAdd} className="gap-1 text-xs"><Plus className="h-3.5 w-3.5" /> Save grade</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(false)} className="text-xs">Cancel</Button>
            </div>
          </div>
        )}

        {/* Records list */}
        <div className="space-y-2">
          {display.slice(0, 6).map((r) => {
            const cfg = GRADE_CONFIG[r.grade];
            return (
              <div key={r.id} className={cn("flex items-start gap-3 rounded-xl border p-3", cfg.bg, cfg.border)}>
                <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold text-sm", cfg.color, cfg.bg)}>
                  {r.grade}
                </div>
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{r.cropName}</span>
                    <span className="text-xs text-muted-foreground">{r.weightKg} kg</span>
                    {r.pricePerKg && <span className="text-xs text-muted-foreground">· KES {r.pricePerKg}/kg</span>}
                    <span className="text-[10px] text-muted-foreground">{r.date}</span>
                  </div>
                  {r.notes && <p className="text-xs text-muted-foreground">{r.notes}</p>}
                  {r.buyerFeedback && <p className="text-[10px] text-muted-foreground italic">"{r.buyerFeedback}"</p>}
                </div>
                {!isMockup && (
                  <button type="button" onClick={() => setRecords((p) => p.filter((x) => x.id !== r.id))} className="text-muted-foreground hover:text-destructive shrink-0">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
          {display.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <ClipboardList className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No grading records yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
