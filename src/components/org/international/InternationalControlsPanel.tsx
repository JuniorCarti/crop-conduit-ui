import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import type { InternationalPolicyShock, InternationalSeasonFactor } from "@/services/internationalSimulationService";

export type InternationalControlsState = {
  crop: string;
  market: string;
  horizonDays: 7 | 14 | 30 | 90;
  preset: string;
  importPressure: number;
  fxShock: number;
  freightPressure: number;
  policyShock: InternationalPolicyShock;
  seasonalFactor: InternationalSeasonFactor;
  applyClimateRisk: boolean;
  useCoopStockLevels: boolean;
};

const PRESETS = [
  "Imports surge",
  "Border disruption",
  "Export ban shock",
  "Demand spike (EU/UAE)",
  "Fuel cost spike",
  "Currency weakening",
] as const;

export function InternationalControlsPanel({
  controls,
  cropOptions,
  marketOptions,
  onChange,
  onApplyPreset,
  onRun,
  onReset,
  running,
  canRun,
}: {
  controls: InternationalControlsState;
  cropOptions: string[];
  marketOptions: string[];
  onChange: (patch: Partial<InternationalControlsState>) => void;
  onApplyPreset: (preset: string) => void;
  onRun: () => void;
  onReset: () => void;
  running: boolean;
  canRun: boolean;
}) {
  return (
    <Card className="border-border/60">
      <CardHeader><CardTitle className="text-base">Simulation controls</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label>Crop</Label>
            <Select value={controls.crop} onValueChange={(value) => onChange({ crop: value })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{cropOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Market</Label>
            <Select value={controls.market} onValueChange={(value) => onChange({ market: value })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{marketOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Horizon</Label>
            <Select value={String(controls.horizonDays)} onValueChange={(value) => onChange({ horizonDays: Number(value) as 7 | 14 | 30 | 90 })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7d</SelectItem>
                <SelectItem value="14">14d</SelectItem>
                <SelectItem value="30">30d</SelectItem>
                <SelectItem value="90">90d</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onApplyPreset(preset)}
              className={`rounded-full border px-3 py-1 text-xs ${controls.preset === preset ? "border-primary bg-primary/10 text-primary" : "border-border/60 text-muted-foreground"}`}
            >
              {preset}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Import pressure ({controls.importPressure})</Label>
            <Slider value={[controls.importPressure]} min={0} max={100} step={1} onValueChange={(values) => onChange({ importPressure: values[0] ?? 0 })} />
          </div>
          <div>
            <Label>FX shock intensity ({controls.fxShock.toFixed(1)}%)</Label>
            <Slider value={[controls.fxShock]} min={-10} max={10} step={0.5} onValueChange={(values) => onChange({ fxShock: values[0] ?? 0 })} />
          </div>
          <div>
            <Label>Freight pressure ({controls.freightPressure})</Label>
            <Slider value={[controls.freightPressure]} min={0} max={100} step={1} onValueChange={(values) => onChange({ freightPressure: values[0] ?? 0 })} />
          </div>
          <div>
            <Label>Policy shock</Label>
            <Select value={controls.policyShock} onValueChange={(value) => onChange({ policyShock: value as InternationalPolicyShock })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="tariff_increase">Tariff increase</SelectItem>
                <SelectItem value="tariff_removal">Tariff removal</SelectItem>
                <SelectItem value="border_delays">Border delays</SelectItem>
                <SelectItem value="export_ban">Export ban shock</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Seasonal factor</Label>
            <Select value={controls.seasonalFactor} onValueChange={(value) => onChange({ seasonalFactor: value as InternationalSeasonFactor })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="glut">Harvest glut</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="lean">Lean season</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
              <Label className="text-sm">Apply climate risk</Label>
              <Switch checked={controls.applyClimateRisk} onCheckedChange={(checked) => onChange({ applyClimateRisk: checked })} />
            </div>
            <div className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
              <Label className="text-sm">Use cooperative stock levels</Label>
              <Switch checked={controls.useCoopStockLevels} onCheckedChange={(checked) => onChange({ useCoopStockLevels: checked })} />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={onRun} disabled={!canRun || running}>{running ? "Running..." : "Run simulation"}</Button>
          <Button variant="outline" onClick={onReset}>Reset</Button>
          <Badge variant="outline" className="text-xs">Simulation only</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
