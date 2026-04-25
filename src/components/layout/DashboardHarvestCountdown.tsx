import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface HarvestItem {
  crop: string;
  optimalDate: string;
  field?: string;
}

interface Props {
  schedules: HarvestItem[];
}

function getDaysRemaining(dateStr: string): number {
  const today = new Date(); today.setHours(0,0,0,0);
  const target = new Date(dateStr); target.setHours(0,0,0,0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

const SAMPLE: HarvestItem[] = [
  { crop: "Tomatoes",  optimalDate: new Date(Date.now() + 1 * 86400000).toISOString().slice(0,10), field: "Field A" },
  { crop: "Kale",      optimalDate: new Date(Date.now() + 5 * 86400000).toISOString().slice(0,10), field: "Field B" },
  { crop: "Potatoes",  optimalDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0,10), field: "Field C" },
];

export function DashboardHarvestCountdown({ schedules }: Props) {
  const navigate = useNavigate();
  const items = schedules.length ? schedules : SAMPLE;
  const isMockup = schedules.length === 0;

  const withDays = items
    .map((s) => ({ ...s, days: getDaysRemaining(s.optimalDate) }))
    .filter((s) => s.days >= -3)
    .sort((a, b) => a.days - b.days)
    .slice(0, 3);

  const urgent = withDays.filter((s) => s.days <= 3 && s.days >= 0);

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-warning/10">
              <Clock className="h-3.5 w-3.5 text-warning" />
            </div>
            <CardTitle className="text-base">Harvest Countdown</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {urgent.length > 0 && (
              <Badge className="bg-warning/10 text-warning border-warning/30 border text-xs">
                {urgent.length} urgent
              </Badge>
            )}
            {isMockup && <Badge variant="outline" className="text-[10px]">Sample</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {withDays.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <Calendar className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No upcoming harvests</p>
            <Button size="sm" variant="outline" onClick={() => navigate("/harvest")}>Add schedule</Button>
          </div>
        ) : (
          withDays.map((item) => {
            const isOverdue = item.days < 0;
            const isReady = item.days === 0;
            const isUrgent = item.days > 0 && item.days <= 3;
            const Icon = isOverdue || isUrgent ? AlertTriangle : isReady ? CheckCircle2 : Calendar;
            const tone = isOverdue ? "critical" : isReady ? "good" : isUrgent ? "warning" : "neutral";
            const TONE_BG: Record<string, string> = {
              critical: "border-destructive/30 bg-destructive/5",
              good:     "border-success/30 bg-success/5",
              warning:  "border-warning/30 bg-warning/5",
              neutral:  "border-border/60 bg-background/60",
            };
            const TONE_TEXT: Record<string, string> = {
              critical: "text-destructive", good: "text-success", warning: "text-warning", neutral: "text-muted-foreground",
            };
            return (
              <div key={`${item.crop}-${item.optimalDate}`} className={cn("flex items-center gap-3 rounded-xl border p-2.5", TONE_BG[tone])}>
                <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-bold text-sm", TONE_BG[tone])}>
                  <span className={cn("text-base font-bold", TONE_TEXT[tone])}>
                    {isOverdue ? Math.abs(item.days) : item.days}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{item.crop}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {item.field && `${item.field} · `}
                    {isOverdue ? `${Math.abs(item.days)}d overdue` : isReady ? "Harvest today!" : `${item.days} day${item.days !== 1 ? "s" : ""} remaining`}
                  </p>
                </div>
                <Icon className={cn("h-4 w-4 shrink-0", TONE_TEXT[tone])} />
              </div>
            );
          })
        )}
        <Button variant="ghost" size="sm" className="w-full justify-between text-xs" onClick={() => navigate("/harvest")}>
          View all schedules <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </CardContent>
    </Card>
  );
}
