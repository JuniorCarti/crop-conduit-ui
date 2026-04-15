import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bug, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  crop?: string;
  currentMonth?: number;
}

interface PestEntry {
  name: string;
  months: number[];
  severity: "high" | "medium" | "low";
  symptoms: string;
  action: string;
}

const PEST_DB: Record<string, PestEntry[]> = {
  tomatoes: [
    { name: "Early Blight",        months: [3,4,5,10,11],   severity: "high",   symptoms: "Brown spots with yellow rings on lower leaves", action: "Apply mancozeb fungicide, remove infected leaves" },
    { name: "Late Blight",         months: [4,5,6,11,12],   severity: "high",   symptoms: "Water-soaked lesions, white mold on underside",  action: "Apply copper-based fungicide immediately" },
    { name: "Whitefly",            months: [1,2,6,7,8,9],   severity: "medium", symptoms: "Yellowing leaves, sticky honeydew residue",      action: "Use yellow sticky traps, neem oil spray" },
    { name: "Tomato Leaf Miner",   months: [6,7,8,9],       severity: "medium", symptoms: "Winding mines visible on leaf surface",          action: "Remove affected leaves, use spinosad" },
    { name: "Bacterial Wilt",      months: [3,4,5,10,11,12],severity: "high",   symptoms: "Sudden wilting of entire plant",                 action: "Remove and destroy infected plants, improve drainage" },
  ],
  maize: [
    { name: "Fall Armyworm",       months: [1,2,3,10,11,12],severity: "high",   symptoms: "Ragged holes in leaves, frass in whorl",         action: "Apply emamectin benzoate, scout weekly" },
    { name: "Maize Streak Virus",  months: [4,5,6,7],       severity: "high",   symptoms: "Yellow streaks along leaf veins",                action: "Control leafhopper vectors, use resistant varieties" },
    { name: "Stalk Borer",         months: [2,3,4,9,10],    severity: "medium", symptoms: "Dead heart in young plants, entry holes",        action: "Apply granular insecticide in whorl" },
    { name: "Grey Leaf Spot",      months: [5,6,7,8],       severity: "medium", symptoms: "Rectangular grey lesions on leaves",             action: "Apply triazole fungicide, improve air circulation" },
  ],
  potatoes: [
    { name: "Late Blight",         months: [4,5,6,11,12],   severity: "high",   symptoms: "Dark water-soaked lesions, white sporulation",   action: "Apply metalaxyl fungicide, destroy infected tubers" },
    { name: "Potato Aphid",        months: [6,7,8,9],       severity: "medium", symptoms: "Curled leaves, stunted growth",                  action: "Apply imidacloprid, use reflective mulch" },
    { name: "Bacterial Soft Rot",  months: [3,4,5,10,11],   severity: "high",   symptoms: "Mushy, foul-smelling tubers",                    action: "Improve drainage, avoid wounding tubers" },
    { name: "Nematodes",           months: [1,2,3,4,5,6,7,8,9,10,11,12], severity: "medium", symptoms: "Stunted growth, galls on roots",    action: "Rotate with non-host crops, use nematicides" },
  ],
  kale: [
    { name: "Diamondback Moth",    months: [1,2,3,6,7,8,9], severity: "high",   symptoms: "Small holes in leaves, window-pane damage",      action: "Apply Bt (Bacillus thuringiensis), use pheromone traps" },
    { name: "Aphids",              months: [6,7,8,9,10],    severity: "medium", symptoms: "Curled leaves, sticky residue, yellowing",       action: "Spray with soapy water or neem oil" },
    { name: "Downy Mildew",        months: [4,5,6,11,12],   severity: "medium", symptoms: "Yellow patches on upper leaf, grey mold below",  action: "Improve spacing, apply copper fungicide" },
  ],
  default: [
    { name: "Aphids",              months: [6,7,8,9,10],    severity: "medium", symptoms: "Curled leaves, sticky honeydew",                 action: "Neem oil spray, introduce ladybirds" },
    { name: "Whitefly",            months: [1,2,6,7,8,9],   severity: "medium", symptoms: "Yellowing, sticky leaves",                      action: "Yellow sticky traps, insecticidal soap" },
    { name: "Fungal Diseases",     months: [4,5,6,11,12],   severity: "high",   symptoms: "Spots, lesions, wilting",                       action: "Apply appropriate fungicide, improve drainage" },
  ],
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const SEVERITY_STYLE = {
  high:   { badge: "bg-destructive/10 text-destructive border-destructive/30", dot: "bg-destructive" },
  medium: { badge: "bg-warning/10 text-warning border-warning/30",             dot: "bg-warning"     },
  low:    { badge: "bg-success/10 text-success border-success/30",             dot: "bg-success"     },
};

export function PestDiseaseCalendar({ crop = "tomatoes", currentMonth }: Props) {
  const month = currentMonth ?? new Date().getMonth() + 1;
  const cropKey = Object.keys(PEST_DB).find((k) => crop.toLowerCase().includes(k)) ?? "default";
  const pests = PEST_DB[cropKey] ?? PEST_DB.default;
  const activePests = pests.filter((p) => p.months.includes(month));
  const upcomingPests = pests.filter((p) => !p.months.includes(month) && p.months.includes(month + 1 > 12 ? 1 : month + 1));

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-warning/10">
              <Bug className="h-3.5 w-3.5 text-warning" />
            </div>
            <CardTitle className="text-base">Pest & Disease Calendar</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs capitalize">{crop}</Badge>
            <Badge variant="outline" className="text-[10px]">UI Mockup</Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Seasonal pest pressure for <span className="font-medium text-foreground capitalize">{crop}</span> · Current month: <span className="font-medium text-foreground">{MONTHS[month - 1]}</span>
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Monthly heatmap strip */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pressure calendar</p>
          <div className="grid grid-cols-12 gap-1">
            {MONTHS.map((m, i) => {
              const monthNum = i + 1;
              const active = pests.filter((p) => p.months.includes(monthNum));
              const hasHigh = active.some((p) => p.severity === "high");
              const hasMed = active.some((p) => p.severity === "medium");
              const isCurrent = monthNum === month;
              return (
                <div key={m} className="flex flex-col items-center gap-1">
                  <div className={cn(
                    "h-6 w-full rounded-md flex items-center justify-center text-[9px] font-medium transition-all",
                    isCurrent ? "ring-2 ring-primary ring-offset-1" : "",
                    hasHigh ? "bg-destructive/20 text-destructive" :
                    hasMed  ? "bg-warning/20 text-warning" :
                    active.length ? "bg-success/20 text-success" :
                    "bg-muted/40 text-muted-foreground"
                  )}>
                    {m.slice(0, 1)}
                  </div>
                  <span className="text-[8px] text-muted-foreground">{m.slice(0,3)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active this month */}
        {activePests.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
              <p className="text-xs font-semibold text-foreground">Active this month ({MONTHS[month - 1]})</p>
            </div>
            {activePests.map((p) => {
              const s = SEVERITY_STYLE[p.severity];
              return (
                <div key={p.name} className={cn("rounded-xl border p-3 space-y-1.5", s.badge)}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={cn("h-2 w-2 rounded-full shrink-0", s.dot)} />
                      <span className="text-sm font-semibold text-foreground">{p.name}</span>
                    </div>
                    <Badge className={cn("border text-[10px] px-1.5 capitalize", s.badge)}>{p.severity}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground"><span className="font-medium">Symptoms:</span> {p.symptoms}</p>
                  <p className="text-xs text-foreground"><span className="font-medium">Action:</span> {p.action}</p>
                </div>
              );
            })}
          </div>
        )}

        {activePests.length === 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/5 p-3">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <p className="text-xs text-success font-medium">No major pest pressure expected this month</p>
          </div>
        )}

        {/* Coming next month */}
        {upcomingPests.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Watch next month</p>
            {upcomingPests.map((p) => (
              <div key={p.name} className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-warning shrink-0" />
                <span className="text-xs text-foreground font-medium">{p.name}</span>
                <span className="text-xs text-muted-foreground truncate">— {p.symptoms}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
