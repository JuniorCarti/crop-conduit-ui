import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Snowflake, CloudRain, AlertTriangle, CheckCircle2, XCircle, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AlertItem } from "@/types/climate";

interface Props {
  alerts: AlertItem[];
  language?: "en" | "sw";
}

type SeverityFilter = "all" | "High" | "Medium" | "Low";
type TypeFilter = "all" | "frost" | "rain";

const SAMPLE_ALERTS: AlertItem[] = [
  { id: "1",  type: "frost", farmId: "f1", severity: "High",   messageSw: "Hatari ya baridi kali usiku huu",         messageEn: "High frost risk tonight — protect sensitive crops",      status: "sent",      sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "2",  type: "rain",  farmId: "f1", severity: "Medium", messageSw: "Mvua nzito inatarajiwa kesho",             messageEn: "Heavy rain expected tomorrow — harvest before midday",    status: "sent",      sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "3",  type: "rain",  farmId: "f1", severity: "High",   messageSw: "Mvua kubwa — hatari ya mafuriko",          messageEn: "Heavy rainfall — flooding risk in low-lying fields",     status: "sent",      sentAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "4",  type: "frost", farmId: "f1", severity: "Low",    messageSw: "Baridi kidogo usiku — angalia mazao",      messageEn: "Mild frost possible overnight — monitor crops",          status: "sent",      sentAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "5",  type: "rain",  farmId: "f1", severity: "Medium", messageSw: "Mvua ya wastani wiki hii",                 messageEn: "Moderate rain this week — good for planting",            status: "sent",      sentAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "6",  type: "frost", farmId: "f1", severity: "High",   messageSw: "Baridi kali — linda mazao yako",           messageEn: "Severe frost alert — cover crops immediately",           status: "failed",    sentAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "7",  type: "rain",  farmId: "f1", severity: "Low",    messageSw: "Mvua nyepesi inatarajiwa",                 messageEn: "Light showers expected — no action needed",              status: "sent",      sentAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "8",  type: "rain",  farmId: "f1", severity: "High",   messageSw: "Mvua kubwa — usisafirisha mazao leo",      messageEn: "Heavy rain — avoid transporting produce today",          status: "scheduled", scheduledFor: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString() },
];

const SEVERITY_STYLE: Record<string, string> = {
  High:   "bg-destructive/10 text-destructive border-destructive/30",
  Medium: "bg-warning/10 text-warning border-warning/30",
  Low:    "bg-success/10 text-success border-success/30",
};

const STATUS_ICON: Record<string, React.ElementType> = {
  sent:      CheckCircle2,
  failed:    XCircle,
  scheduled: Bell,
};

const STATUS_COLOR: Record<string, string> = {
  sent:      "text-success",
  failed:    "text-destructive",
  scheduled: "text-info",
};

const PAGE_SIZE = 5;

function formatDate(value?: Date | string) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function AlertHistoryLog({ alerts, language = "en" }: Props) {
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [page, setPage] = useState(1);

  const source = alerts.length ? alerts : SAMPLE_ALERTS;
  const isMockup = alerts.length === 0;

  const filtered = source.filter((a) => {
    if (severityFilter !== "all" && a.severity !== severityFilter) return false;
    if (typeFilter !== "all" && a.type !== typeFilter) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <Bell className="h-3.5 w-3.5 text-primary" />
            </div>
            <CardTitle className="text-base">Alert History</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">{filtered.length} alerts</Badge>
            {isMockup && <Badge variant="outline" className="text-[10px]">UI Mockup</Badge>}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Full log of all climate alerts for your farm</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1">
            <Filter className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Type:</span>
          </div>
          {(["all", "frost", "rain"] as TypeFilter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => { setTypeFilter(f); setPage(1); }}
              className={cn(
                "flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                typeFilter === f
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/60 bg-background text-muted-foreground hover:bg-muted/30"
              )}
            >
              {f === "frost" && <Snowflake className="h-3 w-3" />}
              {f === "rain" && <CloudRain className="h-3 w-3" />}
              {f === "all" ? "All types" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          <div className="flex items-center gap-1 ml-2">
            <span className="text-xs text-muted-foreground">Severity:</span>
          </div>
          {(["all", "High", "Medium", "Low"] as SeverityFilter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => { setSeverityFilter(f); setPage(1); }}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                severityFilter === f
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/60 bg-background text-muted-foreground hover:bg-muted/30"
              )}
            >
              {f === "all" ? "All" : f}
            </button>
          ))}
        </div>

        {/* Alert rows */}
        <div className="space-y-2">
          {paginated.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No alerts match your filters</p>
            </div>
          ) : (
            paginated.map((alert) => {
              const TypeIcon = alert.type === "frost" ? Snowflake : CloudRain;
              const StatusIcon = STATUS_ICON[alert.status] ?? Bell;
              const dateValue = alert.status === "scheduled" ? alert.scheduledFor : alert.sentAt;
              return (
                <div key={alert.id} className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/60 p-3">
                  <div className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mt-0.5",
                    alert.type === "frost" ? "bg-info/10" : "bg-primary/10"
                  )}>
                    <TypeIcon className={cn("h-4 w-4", alert.type === "frost" ? "text-info" : "text-primary")} />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={cn("border text-[10px] px-1.5", SEVERITY_STYLE[alert.severity])}>
                        {alert.severity}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] px-1.5 capitalize">{alert.type}</Badge>
                      <span className="text-[10px] text-muted-foreground">{formatDate(dateValue)}</span>
                    </div>
                    <p className="text-xs text-foreground">
                      {language === "sw" ? alert.messageSw : alert.messageEn}
                    </p>
                  </div>
                  <StatusIcon className={cn("h-4 w-4 shrink-0 mt-1", STATUS_COLOR[alert.status])} />
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                Previous
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
