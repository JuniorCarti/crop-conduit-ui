import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, CheckCircle2, XCircle, Clock, DollarSign, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatKsh } from "@/lib/currency";
import type { Worker } from "@/types/harvest";

interface AttendanceRecord {
  workerId: string;
  workerName: string;
  date: string;
  present: boolean;
  hoursWorked: number;
  payRate: number;
  totalPay: number;
  paid: boolean;
  notes?: string;
}

const SAMPLE_WORKERS: Worker[] = [
  { id: "w1", userId: "u1", name: "James Mwangi",   role: "Harvester",         phone: "+254712345678", status: "Active", assignedScheduleIds: ["s1"], createdAt: new Date(), updatedAt: new Date() },
  { id: "w2", userId: "u1", name: "Mary Wanjiku",   role: "Harvester",         phone: "+254723456789", status: "Active", assignedScheduleIds: ["s1"], createdAt: new Date(), updatedAt: new Date() },
  { id: "w3", userId: "u1", name: "Peter Kamau",    role: "Supervisor",        phone: "+254734567890", status: "Active", assignedScheduleIds: ["s1"], createdAt: new Date(), updatedAt: new Date() },
  { id: "w4", userId: "u1", name: "Grace Njeri",    role: "Quality Inspector", phone: "+254745678901", status: "Active", assignedScheduleIds: ["s1"], createdAt: new Date(), updatedAt: new Date() },
  { id: "w5", userId: "u1", name: "David Ochieng",  role: "Transporter",       phone: "+254756789012", status: "Active", assignedScheduleIds: ["s1"], createdAt: new Date(), updatedAt: new Date() },
];

const DEFAULT_PAY_RATES: Record<Worker["role"], number> = {
  Harvester:          600,
  Supervisor:         1200,
  Transporter:        800,
  "Quality Inspector": 1000,
};

const SAMPLE_ATTENDANCE: AttendanceRecord[] = [
  { workerId: "w1", workerName: "James Mwangi",  date: "2025-01-20", present: true,  hoursWorked: 8, payRate: 600,  totalPay: 600,  paid: true  },
  { workerId: "w2", workerName: "Mary Wanjiku",  date: "2025-01-20", present: true,  hoursWorked: 8, payRate: 600,  totalPay: 600,  paid: true  },
  { workerId: "w3", workerName: "Peter Kamau",   date: "2025-01-20", present: true,  hoursWorked: 8, payRate: 1200, totalPay: 1200, paid: false },
  { workerId: "w4", workerName: "Grace Njeri",   date: "2025-01-20", present: false, hoursWorked: 0, payRate: 1000, totalPay: 0,    paid: false, notes: "Sick leave" },
  { workerId: "w5", workerName: "David Ochieng", date: "2025-01-20", present: true,  hoursWorked: 6, payRate: 800,  totalPay: 600,  paid: false },
];

export function WorkerAttendanceTracker({ workers }: { workers: Worker[] }) {
  const displayWorkers = workers.length > 0 ? workers : SAMPLE_WORKERS;
  const isMockup = workers.length === 0;

  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(SAMPLE_ATTENDANCE);
  const [payRates, setPayRates] = useState<Record<string, number>>(
    Object.fromEntries(displayWorkers.map((w) => [w.id, DEFAULT_PAY_RATES[w.role] ?? 600]))
  );

  const dateRecords = attendance.filter((a) => a.date === selectedDate);

  const getRecord = (workerId: string) =>
    dateRecords.find((r) => r.workerId === workerId);

  const toggleAttendance = (worker: Worker) => {
    const existing = getRecord(worker.id);
    if (existing) {
      setAttendance((p) => p.map((r) =>
        r.workerId === worker.id && r.date === selectedDate
          ? { ...r, present: !r.present, totalPay: !r.present ? payRates[worker.id] ?? 600 : 0 }
          : r
      ));
    } else {
      const rate = payRates[worker.id] ?? DEFAULT_PAY_RATES[worker.role] ?? 600;
      setAttendance((p) => [...p, {
        workerId: worker.id,
        workerName: worker.name,
        date: selectedDate,
        present: true,
        hoursWorked: 8,
        payRate: rate,
        totalPay: rate,
        paid: false,
      }]);
    }
  };

  const markPaid = (workerId: string) => {
    setAttendance((p) => p.map((r) =>
      r.workerId === workerId && r.date === selectedDate ? { ...r, paid: true } : r
    ));
    toast.success("Marked as paid");
  };

  const sendWhatsApp = (worker: Worker) => {
    const record = getRecord(worker.id);
    if (!record) return;
    const text = `Hi ${worker.name}, your pay for ${selectedDate} is KES ${record.totalPay.toLocaleString()}. Thank you for your work today! — AgriSmart`;
    window.open(`https://wa.me/${worker.phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const presentCount = dateRecords.filter((r) => r.present).length;
  const totalPayToday = dateRecords.filter((r) => r.present).reduce((s, r) => s + r.totalPay, 0);
  const unpaidTotal = dateRecords.filter((r) => r.present && !r.paid).reduce((s, r) => s + r.totalPay, 0);

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-info/10">
              <Users className="h-3.5 w-3.5 text-info" />
            </div>
            <CardTitle className="text-base">Worker Attendance & Pay</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-info/10 text-info border-info/30 border text-xs">{presentCount} present</Badge>
            {isMockup && <Badge variant="outline" className="text-[10px]">Sample data</Badge>}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Daily attendance, hours worked, and pay tracking</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date selector + summary */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <Label className="text-xs">Date</Label>
            <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="h-8 text-xs w-40" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Present",    value: `${presentCount}/${displayWorkers.length}`, color: "text-success"     },
              { label: "Total pay",  value: formatKsh(totalPayToday),                   color: "text-foreground"  },
              { label: "Unpaid",     value: formatKsh(unpaidTotal),                     color: unpaidTotal > 0 ? "text-warning" : "text-muted-foreground" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-border/60 bg-muted/30 p-2 text-center">
                <p className={cn("text-sm font-bold", s.color)}>{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Worker rows */}
        <div className="space-y-2">
          {displayWorkers.map((worker) => {
            const record = getRecord(worker.id);
            const isPresent = record?.present ?? false;
            const isPaid = record?.paid ?? false;
            const pay = record?.totalPay ?? 0;

            return (
              <div key={worker.id} className={cn(
                "flex items-center gap-3 rounded-xl border p-3 transition-all",
                isPresent ? "border-success/30 bg-success/5" : "border-border/60 bg-background/60"
              )}>
                {/* Attendance toggle */}
                <button
                  type="button"
                  onClick={() => !isMockup && toggleAttendance(worker)}
                  className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                    isPresent ? "bg-success/20 text-success" : "bg-muted/40 text-muted-foreground"
                  )}
                >
                  {isPresent ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                </button>

                {/* Worker info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">{worker.name}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5">{worker.role}</Badge>
                    {record?.notes && <span className="text-[10px] text-muted-foreground italic">{record.notes}</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{record?.hoursWorked ?? 0}h</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <DollarSign className="h-3 w-3" />
                      <span>KES {payRates[worker.id] ?? DEFAULT_PAY_RATES[worker.role]}/day</span>
                    </div>
                  </div>
                </div>

                {/* Pay + actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {isPresent && (
                    <span className={cn("text-sm font-bold", isPaid ? "text-muted-foreground line-through" : "text-foreground")}>
                      {formatKsh(pay)}
                    </span>
                  )}
                  {isPresent && !isPaid && !isMockup && (
                    <Button type="button" size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => markPaid(worker.id)}>
                      Pay
                    </Button>
                  )}
                  {isPaid && <Badge className="bg-success/10 text-success border-success/30 border text-[10px]">Paid</Badge>}
                  {isPresent && (
                    <button type="button" onClick={() => sendWhatsApp(worker)} className="text-muted-foreground hover:text-success transition-colors" title="Send pay via WhatsApp">
                      <MessageSquare className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
