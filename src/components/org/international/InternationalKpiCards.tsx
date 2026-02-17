import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { InternationalKpiSet } from "@/services/internationalSimulationService";

export function InternationalKpiCards({ kpis, horizonDays }: { kpis: InternationalKpiSet; horizonDays: number }) {
  const projectedBand =
    kpis.projectedMinKESPerKg && kpis.projectedMaxKESPerKg
      ? `KES ${kpis.projectedMinKESPerKg.toLocaleString()} - ${kpis.projectedMaxKESPerKg.toLocaleString()}`
      : "--";

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
      <Card className="border-border/60"><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Local price today</p><p className="text-2xl font-semibold">{kpis.localPriceKESPerKg ? `KES ${kpis.localPriceKESPerKg.toLocaleString()}` : "--"}</p></CardContent></Card>
      <Card className="border-border/60"><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Import pressure index</p><p className="text-2xl font-semibold">{kpis.importPressureIndex}</p><p className="text-xs text-muted-foreground">{kpis.importPressureLabel}</p></CardContent></Card>
      <Card className="border-border/60"><CardContent className="pt-5"><p className="text-xs text-muted-foreground">FX shock</p><p className="text-2xl font-semibold">{kpis.fxShockPercent.toFixed(1)}%</p></CardContent></Card>
      <Card className="border-border/60"><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Freight pressure</p><p className="text-2xl font-semibold">{kpis.freightPressureIndex}</p></CardContent></Card>
      <Card className="border-border/60"><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Policy risk index</p><p className="text-2xl font-semibold">{kpis.policyRiskIndex}</p></CardContent></Card>
      <Card className="border-border/60"><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Projected price band</p><p className="text-sm font-semibold">{projectedBand}</p><p className="text-xs text-muted-foreground">{horizonDays} day horizon</p></CardContent></Card>
      <Card className="border-border/60"><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Confidence</p><div className="flex items-center gap-2"><p className="text-2xl font-semibold">{kpis.confidence}</p><TooltipProvider><Tooltip><TooltipTrigger className="text-xs text-muted-foreground underline">why</TooltipTrigger><TooltipContent><p className="max-w-xs text-xs">{kpis.confidenceReason}</p></TooltipContent></Tooltip></TooltipProvider></div></CardContent></Card>
    </div>
  );
}
