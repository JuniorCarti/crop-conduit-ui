import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Ruler, Droplets, Package, CheckCircle2, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  currentAcres?: number;
  currentCrop?: string;
  onSave?: (acres: number, unit: string) => void;
}

const CROP_YIELDS: Record<string, { yieldPerAcre: number; unit: string; irrigationPerAcre: number }> = {
  tomatoes:  { yieldPerAcre: 8000,  unit: "kg", irrigationPerAcre: 500  },
  maize:     { yieldPerAcre: 2500,  unit: "kg", irrigationPerAcre: 350  },
  potatoes:  { yieldPerAcre: 10000, unit: "kg", irrigationPerAcre: 450  },
  kale:      { yieldPerAcre: 5000,  unit: "kg", irrigationPerAcre: 300  },
  beans:     { yieldPerAcre: 800,   unit: "kg", irrigationPerAcre: 250  },
  cabbage:   { yieldPerAcre: 12000, unit: "kg", irrigationPerAcre: 400  },
  onion:     { yieldPerAcre: 6000,  unit: "kg", irrigationPerAcre: 380  },
  default:   { yieldPerAcre: 3000,  unit: "kg", irrigationPerAcre: 350  },
};

const UNIT_TO_ACRES: Record<string, number> = {
  acres: 1, hectares: 2.471, "sq meters": 0.000247,
};

export function FarmSizeCard({ currentAcres = 2, currentCrop = "tomatoes", onSave }: Props) {
  const [size, setSize] = useState(String(currentAcres));
  const [unit, setUnit] = useState("acres");
  const [crop, setCrop] = useState(currentCrop.toLowerCase());
  const [saved, setSaved] = useState(false);

  const sizeNum = parseFloat(size) || 0;
  const acres = sizeNum * (UNIT_TO_ACRES[unit] ?? 1);
  const cropKey = Object.keys(CROP_YIELDS).find((k) => crop.includes(k)) ?? "default";
  const profile = CROP_YIELDS[cropKey] ?? CROP_YIELDS.default;

  const estimatedYield = Math.round(acres * profile.yieldPerAcre);
  const irrigationLiters = Math.round(acres * profile.irrigationPerAcre * 1000);
  const irrigationM3 = Math.round(acres * profile.irrigationPerAcre);
  const revenueEstimate = estimatedYield * 45; // KES 45/kg average

  const handleSave = () => {
    setSaved(true);
    onSave?.(acres, unit);
    toast.success(`Farm size saved: ${sizeNum} ${unit}`);
    setTimeout(() => setSaved(false), 3000);
  };

  const stats = [
    {
      label: "Est. yield",
      value: `${estimatedYield.toLocaleString()} kg`,
      sub: `${profile.yieldPerAcre.toLocaleString()} kg/acre`,
      icon: Package,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      label: "Irrigation need",
      value: `${irrigationM3.toLocaleString()} m³`,
      sub: `${irrigationLiters.toLocaleString()} L/season`,
      icon: Droplets,
      color: "text-info",
      bg: "bg-info/10",
    },
    {
      label: "Revenue est.",
      value: `KES ${(revenueEstimate / 1000).toFixed(0)}K`,
      sub: "At KES 45/kg avg",
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-primary/10",
    },
  ];

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <Ruler className="h-3.5 w-3.5 text-primary" />
            </div>
            <CardTitle className="text-base">Farm Size & Estimates</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">{sizeNum} {unit}</Badge>
            <Badge variant="outline" className="text-[10px]">UI Mockup</Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Enter your farm size to get irrigation volume and harvest quantity estimates</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Inputs */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Farm size</Label>
            <Input
              type="number"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="h-8 text-sm"
              min="0.1"
              step="0.1"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Unit</Label>
            <Select value={unit} onValueChange={setUnit}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="acres">Acres</SelectItem>
                <SelectItem value="hectares">Hectares</SelectItem>
                <SelectItem value="sq meters">Sq. Meters</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Primary crop</Label>
            <Select value={crop} onValueChange={setCrop}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.keys(CROP_YIELDS).filter((k) => k !== "default").map((c) => (
                  <SelectItem key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Converted size */}
        {unit !== "acres" && (
          <p className="text-xs text-muted-foreground">
            = <span className="font-medium text-foreground">{acres.toFixed(2)} acres</span> ({(acres * 0.404686).toFixed(2)} ha)
          </p>
        )}

        {/* Estimate cards */}
        <div className="grid gap-3 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className={cn("rounded-xl border border-border/60 p-3 space-y-1", s.bg)}>
              <div className="flex items-center gap-1.5">
                <s.icon className={cn("h-4 w-4", s.color)} />
                <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
              </div>
              <p className={cn("text-base font-bold", s.color)}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Breakdown note */}
        <div className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-1">
          <p className="text-xs font-semibold text-foreground">Calculation basis</p>
          <div className="grid gap-1 sm:grid-cols-2 text-xs text-muted-foreground">
            <span>• Yield: {profile.yieldPerAcre.toLocaleString()} kg/acre for {cropKey}</span>
            <span>• Irrigation: {profile.irrigationPerAcre} m³/acre/season</span>
            <span>• Revenue: KES 45/kg market average</span>
            <span>• Estimates are indicative only</span>
          </div>
        </div>

        <Button type="button" className="w-full gap-2" onClick={handleSave}>
          {saved ? <CheckCircle2 className="h-4 w-4" /> : <Ruler className="h-4 w-4" />}
          {saved ? "Farm size saved!" : "Save farm size"}
        </Button>
      </CardContent>
    </Card>
  );
}
