import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Leaf, Droplets, CloudRain, AlertTriangle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface HealthSignal {
  label: string;
  status: string;
  tone: "good" | "warning" | "critical" | "neutral";
}

interface Props {
  signals: HealthSignal[];
}

const TONE_SCORE: Record<string, number> = {
  good: 95, neutral: 60, warning: 40, critical: 15,
};

const TONE_RING: Record<string, string> = {
  good: "#22c55e", warning: "#f59e0b", critical: "#ef4444", neutral: "#94a3b8",
};

const SIGNAL_ICONS: Record<string, React.ElementType> = {
  "Crop Health":    Leaf,
  "Soil Moisture":  Droplets,
  "Rain Outlook":   CloudRain,
  "Disease Risk":   AlertTriangle,
};

export function DashboardFarmHealthScore({ signals }: Props) {
  const navigate = useNavigate();
  const score = signals.length
    ? Math.round(signals.reduce((s, sig) => s + (TONE_SCORE[sig.tone] ?? 60), 0) / signals.length)
    : 72;
  const tone = score >= 75 ? "good" : score >= 45 ? "warning" : "critical";
  const ringColor = TONE_RING[tone];
  const circumference = 2 * Math.PI * 32;
  const strokeDash = (score / 100) * circumference;

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            </div>
            <CardTitle className="text-base">Farm Health Score</CardTitle>
          </div>
          <Badge className={cn("border text-xs",
            tone === "good" ? "bg-success/10 text-success border-success/30" :
            tone === "warning" ? "bg-warning/10 text-warning border-warning/30" :
            "bg-destructive/10 text-destructive border-destructive/30"
          )}>
            {score >= 75 ? "Healthy" : score >= 45 ? "Monitor" : "At Risk"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-4">
          {/* Ring */}
          <div className="relative h-20 w-20 shrink-0">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="32" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
              <circle cx="40" cy="40" r="32" fill="none" stroke={ringColor} strokeWidth="8"
                strokeLinecap="round" strokeDasharray={`${strokeDash} ${circumference}`} className="transition-all duration-700" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold text-foreground">{score}</span>
              <span className="text-[9px] text-muted-foreground">/ 100</span>
            </div>
          </div>
          {/* Signal list */}
          <div className="flex-1 space-y-1.5">
            {signals.map((sig) => {
              const Icon = SIGNAL_ICONS[sig.label] ?? ShieldCheck;
              return (
                <div key={sig.label} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Icon className={cn("h-3.5 w-3.5",
                      sig.tone === "good" ? "text-success" :
                      sig.tone === "warning" ? "text-warning" :
                      sig.tone === "critical" ? "text-destructive" : "text-muted-foreground"
                    )} />
                    <span className="text-xs text-foreground">{sig.label}</span>
                  </div>
                  <Badge className={cn("border text-[10px] px-1.5",
                    sig.tone === "good" ? "bg-success/10 text-success border-success/30" :
                    sig.tone === "warning" ? "bg-warning/10 text-warning border-warning/30" :
                    sig.tone === "critical" ? "bg-destructive/10 text-destructive border-destructive/30" :
                    "bg-muted/60 text-muted-foreground border-border"
                  )}>
                    {sig.status}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
        <Button variant="outline" size="sm" className="w-full justify-between" onClick={() => navigate("/climate")}>
          View full climate report
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </CardContent>
    </Card>
  );
}
