import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  TrendingUp, TrendingDown, Minus, Fuel, DollarSign,
  BarChart3, Truck, Leaf, Zap, AlertTriangle, CheckCircle2,
  RefreshCw, Info, ChevronDown, ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  getEconomicSnapshot,
  saveEconomicSignal,
  computeEconomicAdjustment,
  SAMPLE_ECONOMIC_SIGNALS,
  type EconomicSignal,
  type EconomicSignalType,
  type EconomicAdjustment,
} from "@/services/economicSignalsService";

// ─── Signal metadata ──────────────────────────────────────────────────────────

const SIGNAL_META: Record<EconomicSignalType, {
  icon: React.ElementType;
  color: string;
  bg: string;
  unit: string;
  placeholder: string;
  source: string;
}> = {
  fuel_price_ksh_per_litre: { icon: Fuel,       color: "text-warning",     bg: "bg-warning/10",     unit: "KES/L",   placeholder: "e.g. 217",  source: "EPRA Kenya"  },
  usd_kes_exchange_rate:    { icon: DollarSign,  color: "text-destructive", bg: "bg-destructive/10", unit: "KES/USD", placeholder: "e.g. 158",  source: "CBK"         },
  inflation_index:          { icon: BarChart3,   color: "text-orange-500",  bg: "bg-orange-500/10",  unit: "index",   placeholder: "e.g. 112",  source: "KNBS"        },
  transport_cost_index:     { icon: Truck,       color: "text-primary",     bg: "bg-primary/10",     unit: "index",   placeholder: "e.g. 118",  source: "Derived"     },
  fertilizer_price_index:   { icon: Leaf,        color: "text-success",     bg: "bg-success/10",     unit: "index",   placeholder: "e.g. 135",  source: "AMIS Kenya"  },
  electricity_tariff:       { icon: Zap,         color: "text-info",        bg: "bg-info/10",        unit: "KES/kWh", placeholder: "e.g. 28",   source: "KPLC"        },
};

const SIGNAL_LABELS: Record<EconomicSignalType, string> = {
  fuel_price_ksh_per_litre: "Fuel Price",
  usd_kes_exchange_rate:    "USD/KES Rate",
  inflation_index:          "Inflation Index",
  transport_cost_index:     "Transport Cost Index",
  fertilizer_price_index:   "Fertilizer Price Index",
  electricity_tariff:       "Electricity Tariff",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SignalCard({ signal }: { signal: EconomicSignal }) {
  const meta = SIGNAL_META[signal.type];
  const Icon = meta.icon;
  const changePct = signal.changePct ?? 0;
  const TrendIcon = changePct > 0 ? TrendingUp : changePct < 0 ? TrendingDown : Minus;
  const trendColor = changePct > 5 ? "text-destructive" : changePct > 0 ? "text-warning" : changePct < -5 ? "text-success" : "text-muted-foreground";

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/60 p-3">
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", meta.bg)}>
        <Icon className={cn("h-4 w-4", meta.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground truncate">{SIGNAL_LABELS[signal.type]}</p>
        <p className="text-[10px] text-muted-foreground">{signal.source}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-foreground">{signal.value} <span className="text-[10px] font-normal text-muted-foreground">{meta.unit}</span></p>
        {signal.changePct != null && (
          <div className={cn("flex items-center gap-0.5 justify-end text-[10px] font-medium", trendColor)}>
            <TrendIcon className="h-3 w-3" />
            {changePct > 0 ? "+" : ""}{changePct.toFixed(1)}%
          </div>
        )}
      </div>
    </div>
  );
}

function AdjustmentBreakdown({ adjustment }: { adjustment: EconomicAdjustment }) {
  const isUp = adjustment.adjustmentPct > 0;
  const isDown = adjustment.adjustmentPct < 0;
  const magnitude = Math.abs(adjustment.adjustmentPct);

  return (
    <div className={cn(
      "rounded-xl border p-4 space-y-3",
      isUp ? "border-destructive/30 bg-destructive/5" :
      isDown ? "border-success/30 bg-success/5" :
      "border-border/60 bg-muted/20"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {isUp ? <TrendingUp className="h-4 w-4 text-destructive" /> :
           isDown ? <TrendingDown className="h-4 w-4 text-success" /> :
           <Minus className="h-4 w-4 text-muted-foreground" />}
          <p className="text-sm font-semibold text-foreground">
            Economic adjustment: {isUp ? "+" : ""}{adjustment.adjustmentPct}%
          </p>
        </div>
        <Badge className={cn("border text-xs",
          adjustment.confidence === "High" ? "bg-success/10 text-success border-success/30" :
          adjustment.confidence === "Medium" ? "bg-warning/10 text-warning border-warning/30" :
          "bg-muted/60 text-muted-foreground border-border"
        )}>
          {adjustment.confidence} confidence
        </Badge>
      </div>

      {/* Price comparison */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-muted/40 p-2 text-center">
          <p className="text-[10px] text-muted-foreground">Model prediction</p>
          <p className="text-base font-bold text-foreground">KES {adjustment.rawPrice.toLocaleString()}</p>
        </div>
        <div className={cn("rounded-lg p-2 text-center",
          isUp ? "bg-destructive/10" : isDown ? "bg-success/10" : "bg-muted/40"
        )}>
          <p className="text-[10px] text-muted-foreground">Adjusted forecast</p>
          <p className={cn("text-base font-bold",
            isUp ? "text-destructive" : isDown ? "text-success" : "text-foreground"
          )}>KES {adjustment.adjustedPrice.toLocaleString()}</p>
        </div>
      </div>

      {/* Summary */}
      <p className="text-xs text-muted-foreground">{adjustment.summary}</p>

      {/* Drivers */}
      {adjustment.drivers.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Price drivers</p>
          {adjustment.drivers.map((driver) => (
            <div key={driver.signal} className="flex items-start gap-2">
              <div className={cn("mt-0.5 h-2 w-2 rounded-full shrink-0",
                driver.impact === "increase" ? "bg-destructive" :
                driver.impact === "decrease" ? "bg-success" : "bg-muted-foreground"
              )} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-foreground">{driver.label}</span>
                  <span className={cn("text-xs font-semibold shrink-0",
                    driver.impact === "increase" ? "text-destructive" :
                    driver.impact === "decrease" ? "text-success" : "text-muted-foreground"
                  )}>
                    {driver.impactPct > 0 ? "+" : ""}{driver.impactPct}%
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">{driver.reason}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  rawPredictedPrice?: number | null;
  commodity?: string;
}

export function EconomicSignalsPanel({ rawPredictedPrice, commodity = "Tomatoes" }: Props) {
  const [signals, setSignals] = useState<EconomicSignal[]>(SAMPLE_ECONOMIC_SIGNALS);
  const [isMockup, setIsMockup] = useState(true);
  const [loading, setLoading] = useState(false);
  const [adjustment, setAdjustment] = useState<EconomicAdjustment | null>(null);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [showDrivers, setShowDrivers] = useState(true);

  // Update form state
  const [newType, setNewType] = useState<EconomicSignalType>("fuel_price_ksh_per_litre");
  const [newValue, setNewValue] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSignals();
  }, []);

  useEffect(() => {
    if (rawPredictedPrice != null && rawPredictedPrice > 0) {
      const adj = computeEconomicAdjustment(rawPredictedPrice, signals);
      setAdjustment(adj);
    }
  }, [rawPredictedPrice, signals]);

  const loadSignals = async () => {
    setLoading(true);
    try {
      const snapshot = await getEconomicSnapshot();
      setSignals(snapshot.signals);
      setIsMockup(snapshot.isMockup);
    } catch {
      setSignals(SAMPLE_ECONOMIC_SIGNALS);
      setIsMockup(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSignal = async () => {
    if (!newValue || isNaN(parseFloat(newValue))) {
      toast.error("Enter a valid numeric value");
      return;
    }
    setSaving(true);
    try {
      const meta = SIGNAL_META[newType];
      const existing = signals.find((s) => s.type === newType);
      const value = parseFloat(newValue);
      const changePct = existing
        ? Math.round(((value - existing.value) / existing.value) * 1000) / 10
        : undefined;

      await saveEconomicSignal({
        type: newType,
        label: SIGNAL_LABELS[newType],
        value,
        unit: meta.unit,
        previousValue: existing?.value,
        changePct,
        source: meta.source,
        recordedAt: new Date(),
      });

      toast.success(`${SIGNAL_LABELS[newType]} updated to ${value} ${meta.unit}`);
      setNewValue("");
      setShowUpdateForm(false);
      await loadSignals();
    } catch {
      toast.error("Failed to save signal");
    } finally {
      setSaving(false);
    }
  };

  // Compute adjustment for a demo price if no real price provided
  const demoPrice = rawPredictedPrice ?? 55;
  const displayAdjustment = adjustment ?? computeEconomicAdjustment(demoPrice, signals);

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-warning/10">
              <BarChart3 className="h-3.5 w-3.5 text-warning" />
            </div>
            <div>
              <CardTitle className="text-base">Economic Signals</CardTitle>
              <p className="text-xs text-muted-foreground">
                External factors adjusting the {commodity} price forecast
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isMockup && <Badge variant="outline" className="text-[10px]">Sample data</Badge>}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={loadSignals}
              disabled={loading}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* How it works banner */}
        <div className="flex items-start gap-2 rounded-xl border border-info/30 bg-info/5 p-3">
          <Info className="h-4 w-4 text-info shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            The AI model predicts prices from historical data. Economic signals (fuel, exchange rate, inflation)
            are applied as a <span className="font-medium text-foreground">post-prediction adjustment layer</span> to
            reflect real-world cost pressures the model hasn't seen yet.
          </p>
        </div>

        {/* Price adjustment result */}
        {rawPredictedPrice != null && rawPredictedPrice > 0 ? (
          <AdjustmentBreakdown adjustment={displayAdjustment} />
        ) : (
          <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground text-center">
              Select a commodity and market to see the economic adjustment applied to the AI prediction.
            </p>
            <div className="mt-2">
              <p className="text-[10px] text-muted-foreground text-center mb-1">Preview with KES {demoPrice}/kg baseline:</p>
              <AdjustmentBreakdown adjustment={displayAdjustment} />
            </div>
          </div>
        )}

        {/* Signal cards */}
        <div className="space-y-2">
          <button
            type="button"
            className="flex w-full items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors"
            onClick={() => setShowDrivers((p) => !p)}
          >
            <span>Active signals ({signals.length})</span>
            {showDrivers ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          {showDrivers && (
            <div className="grid gap-2 sm:grid-cols-2">
              {signals.map((signal) => (
                <SignalCard key={signal.type} signal={signal} />
              ))}
            </div>
          )}
        </div>

        {/* Update signal form */}
        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full gap-2 text-xs"
            onClick={() => setShowUpdateForm((p) => !p)}
          >
            {showUpdateForm ? "Cancel" : "Update an economic signal"}
          </Button>

          {showUpdateForm && (
            <div className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-3">
              <p className="text-xs font-semibold text-foreground">Record latest value</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Signal type</Label>
                  <Select value={newType} onValueChange={(v) => setNewType(v as EconomicSignalType)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(SIGNAL_LABELS) as EconomicSignalType[]).map((type) => (
                        <SelectItem key={type} value={type} className="text-xs">
                          {SIGNAL_LABELS[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">
                    New value ({SIGNAL_META[newType].unit})
                  </Label>
                  <Input
                    type="number"
                    placeholder={SIGNAL_META[newType].placeholder}
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] text-muted-foreground">
                  Source: {SIGNAL_META[newType].source}
                </p>
                <Button
                  type="button"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={handleSaveSignal}
                  disabled={saving || !newValue}
                >
                  {saving ? <RefreshCw className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                  Save
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Methodology note */}
        <div className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-1">
          <p className="text-xs font-semibold text-foreground">Adjustment methodology</p>
          <div className="grid gap-1 sm:grid-cols-2 text-[10px] text-muted-foreground">
            <span>• Fuel: 20% sensitivity (transport cost pass-through)</span>
            <span>• Exchange rate: 15% sensitivity (imported inputs)</span>
            <span>• Inflation: 10% sensitivity (general cost push)</span>
            <span>• Transport index: 25% sensitivity (direct logistics)</span>
            <span>• Fertilizer: 12% sensitivity (input cost)</span>
            <span>• Adjustment capped at ±40% to prevent extremes</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
