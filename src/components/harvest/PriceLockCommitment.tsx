import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lock, Plus, CheckCircle2, Clock, AlertTriangle, Trash2, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatKsh } from "@/lib/currency";
import { toast } from "sonner";
import type { HarvestSchedule } from "@/types/harvest";

interface PriceLock {
  id: string;
  scheduleId: string;
  cropName: string;
  buyerName: string;
  buyerPhone?: string;
  quantityKg: number;
  agreedPricePerKg: number;
  deliveryDate: string;
  status: "verbal" | "written" | "confirmed" | "cancelled";
  notes?: string;
  createdAt: string;
}

const STATUS_CONFIG = {
  verbal:    { label: "Verbal",    bg: "bg-warning/10",     text: "text-warning",     border: "border-warning/30",     icon: Clock         },
  written:   { label: "Written",   bg: "bg-info/10",        text: "text-info",        border: "border-info/30",        icon: CheckCircle2  },
  confirmed: { label: "Confirmed", bg: "bg-success/10",     text: "text-success",     border: "border-success/30",     icon: CheckCircle2  },
  cancelled: { label: "Cancelled", bg: "bg-muted/40",       text: "text-muted-foreground", border: "border-border",   icon: AlertTriangle },
};

const SAMPLE_LOCKS: PriceLock[] = [
  {
    id: "pl1",
    scheduleId: "s1",
    cropName: "Tomatoes",
    buyerName: "Fresh Mart Kenya",
    buyerPhone: "+254712345678",
    quantityKg: 300,
    agreedPricePerKg: 68,
    deliveryDate: "2025-01-25",
    status: "confirmed",
    notes: "Confirmed via WhatsApp. Buyer will send truck.",
    createdAt: "2025-01-18",
  },
  {
    id: "pl2",
    scheduleId: "s1",
    cropName: "Tomatoes",
    buyerName: "James Kariuki",
    buyerPhone: "+254723456789",
    quantityKg: 150,
    agreedPricePerKg: 70,
    deliveryDate: "2025-01-26",
    status: "verbal",
    notes: "Verbal agreement at market. Need written confirmation.",
    createdAt: "2025-01-19",
  },
];

export function PriceLockCommitment({ schedules }: { schedules: HarvestSchedule[] }) {
  const [locks, setLocks] = useState<PriceLock[]>(SAMPLE_LOCKS);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    scheduleId: schedules[0]?.id ?? "",
    buyerName: "",
    buyerPhone: "",
    quantityKg: "",
    agreedPricePerKg: "",
    deliveryDate: "",
    status: "verbal" as PriceLock["status"],
    notes: "",
  });

  const isMockup = schedules.length === 0;
  const display = isMockup ? SAMPLE_LOCKS : locks.filter((l) => schedules.some((s) => s.id === l.scheduleId));
  const active = display.filter((l) => l.status !== "cancelled");
  const totalCommitted = active.reduce((s, l) => s + l.quantityKg, 0);
  const totalValue = active.reduce((s, l) => s + l.quantityKg * l.agreedPricePerKg, 0);

  const handleAdd = () => {
    if (!form.buyerName || !form.quantityKg || !form.agreedPricePerKg || !form.deliveryDate) {
      toast.error("Fill in buyer, quantity, price, and delivery date");
      return;
    }
    const schedule = schedules.find((s) => s.id === form.scheduleId);
    const lock: PriceLock = {
      id: `pl${Date.now()}`,
      scheduleId: form.scheduleId,
      cropName: schedule?.cropName ?? "Unknown",
      buyerName: form.buyerName,
      buyerPhone: form.buyerPhone || undefined,
      quantityKg: parseFloat(form.quantityKg),
      agreedPricePerKg: parseFloat(form.agreedPricePerKg),
      deliveryDate: form.deliveryDate,
      status: form.status,
      notes: form.notes || undefined,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setLocks((p) => [lock, ...p]);
    toast.success("Price commitment recorded");
    setShowForm(false);
    setForm({ scheduleId: schedules[0]?.id ?? "", buyerName: "", buyerPhone: "", quantityKg: "", agreedPricePerKg: "", deliveryDate: "", status: "verbal", notes: "" });
  };

  const updateStatus = (id: string, status: PriceLock["status"]) => {
    setLocks((p) => p.map((l) => l.id === id ? { ...l, status } : l));
    toast.success(`Status updated to ${status}`);
  };

  const shareCommitment = (lock: PriceLock) => {
    const text = `📋 Price Commitment — AgriSmart\n\nCrop: ${lock.cropName}\nQuantity: ${lock.quantityKg} kg\nAgreed price: KES ${lock.agreedPricePerKg}/kg\nTotal value: KES ${(lock.quantityKg * lock.agreedPricePerKg).toLocaleString()}\nDelivery: ${lock.deliveryDate}\nBuyer: ${lock.buyerName}\nStatus: ${lock.status}\n\n${lock.notes ?? ""}`;
    if (navigator.share) {
      navigator.share({ title: "Price Commitment", text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => toast.success("Commitment copied"));
    }
  };

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-warning/10">
              <Lock className="h-3.5 w-3.5 text-warning" />
            </div>
            <CardTitle className="text-base">Price Lock & Commitments</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {totalCommitted > 0 && (
              <Badge className="bg-warning/10 text-warning border-warning/30 border text-xs">{totalCommitted} kg locked</Badge>
            )}
            {isMockup && <Badge variant="outline" className="text-[10px]">Sample data</Badge>}
            <Button type="button" size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => setShowForm((p) => !p)}>
              <Plus className="h-3.5 w-3.5" /> Record deal
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Record verbal and written price agreements with buyers before harvest</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        {active.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-border/60 bg-muted/30 p-3 text-center">
              <p className="text-base font-bold text-foreground">{totalCommitted} kg</p>
              <p className="text-xs text-muted-foreground">Quantity committed</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/30 p-3 text-center">
              <p className="text-base font-bold text-success">{formatKsh(totalValue)}</p>
              <p className="text-xs text-muted-foreground">Locked revenue</p>
            </div>
          </div>
        )}

        {/* Add form */}
        {showForm && (
          <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-3 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Record price commitment</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {!isMockup && schedules.length > 1 && (
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs">Schedule</Label>
                  <Select value={form.scheduleId} onValueChange={(v) => setForm((p) => ({ ...p, scheduleId: v }))}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{schedules.map((s) => <SelectItem key={s.id} value={s.id}>{s.cropName} — {s.field}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1">
                <Label className="text-xs">Buyer name</Label>
                <Input value={form.buyerName} onChange={(e) => setForm((p) => ({ ...p, buyerName: e.target.value }))} className="h-8 text-xs" placeholder="e.g. Fresh Mart" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Buyer phone</Label>
                <Input value={form.buyerPhone} onChange={(e) => setForm((p) => ({ ...p, buyerPhone: e.target.value }))} className="h-8 text-xs" placeholder="+254..." />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Quantity (kg)</Label>
                <Input type="number" value={form.quantityKg} onChange={(e) => setForm((p) => ({ ...p, quantityKg: e.target.value }))} className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Agreed price (KES/kg)</Label>
                <Input type="number" value={form.agreedPricePerKg} onChange={(e) => setForm((p) => ({ ...p, agreedPricePerKg: e.target.value }))} className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Delivery date</Label>
                <Input type="date" value={form.deliveryDate} onChange={(e) => setForm((p) => ({ ...p, deliveryDate: e.target.value }))} className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Agreement type</Label>
                <Select value={form.status} onValueChange={(v: any) => setForm((p) => ({ ...p, status: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="verbal">Verbal agreement</SelectItem>
                    <SelectItem value="written">Written / WhatsApp</SelectItem>
                    <SelectItem value="confirmed">Fully confirmed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">Notes</Label>
                <Textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} className="text-xs min-h-[50px]" placeholder="Details of the agreement..." />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={handleAdd} className="gap-1 text-xs"><Plus className="h-3.5 w-3.5" /> Save</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(false)} className="text-xs">Cancel</Button>
            </div>
          </div>
        )}

        {/* Lock records */}
        <div className="space-y-2">
          {display.map((lock) => {
            const cfg = STATUS_CONFIG[lock.status];
            const Icon = cfg.icon;
            const value = lock.quantityKg * lock.agreedPricePerKg;
            return (
              <div key={lock.id} className={cn("rounded-xl border p-3 space-y-2", cfg.bg, cfg.border)}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon className={cn("h-4 w-4 shrink-0", cfg.text)} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{lock.buyerName}</p>
                      <p className="text-[10px] text-muted-foreground">{lock.cropName} · {lock.deliveryDate}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-foreground">{formatKsh(lock.agreedPricePerKg)}/kg</p>
                    <p className="text-[10px] text-muted-foreground">{lock.quantityKg} kg · {formatKsh(value)}</p>
                  </div>
                </div>
                {lock.notes && <p className="text-[10px] text-muted-foreground italic">{lock.notes}</p>}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={cn("border text-[10px] px-1.5", cfg.bg, cfg.border, cfg.text)}>{cfg.label}</Badge>
                  {lock.status === "verbal" && !isMockup && (
                    <Button type="button" size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => updateStatus(lock.id, "written")}>
                      Mark written
                    </Button>
                  )}
                  {lock.status === "written" && !isMockup && (
                    <Button type="button" size="sm" className="h-6 text-[10px] px-2" onClick={() => updateStatus(lock.id, "confirmed")}>
                      Confirm
                    </Button>
                  )}
                  <button type="button" onClick={() => shareCommitment(lock)} className="ml-auto text-muted-foreground hover:text-primary">
                    <Share2 className="h-3.5 w-3.5" />
                  </button>
                  {!isMockup && (
                    <button type="button" onClick={() => setLocks((p) => p.filter((l) => l.id !== lock.id))} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {display.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <Lock className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No price commitments yet</p>
              <p className="text-xs text-muted-foreground">Record verbal agreements before harvest to secure your price</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
