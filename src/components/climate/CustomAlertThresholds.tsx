import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { SlidersHorizontal, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ThresholdRule {
  id: string;
  metric: string;
  operator: ">" | "<" | ">=" | "<=";
  value: number;
  unit: string;
  enabled: boolean;
  label: string;
}

const METRIC_OPTIONS = [
  { value: "rain_mm",      label: "Daily rainfall",       unit: "mm",  defaultVal: 15, operators: [">", ">="] },
  { value: "rain_chance",  label: "Rain probability",     unit: "%",   defaultVal: 70, operators: [">", ">="] },
  { value: "max_temp",     label: "Max temperature",      unit: "°C",  defaultVal: 32, operators: [">", ">="] },
  { value: "min_temp",     label: "Min temperature",      unit: "°C",  defaultVal: 5,  operators: ["<", "<="] },
  { value: "wind_kph",     label: "Wind speed",           unit: "kph", defaultVal: 30, operators: [">", ">="] },
  { value: "humidity",     label: "Avg humidity",         unit: "%",   defaultVal: 80, operators: [">", ">="] },
];

const SAMPLE_RULES: ThresholdRule[] = [
  { id: "r1", metric: "rain_mm",     operator: ">=", value: 20,  unit: "mm",  enabled: true,  label: "Heavy rain alert" },
  { id: "r2", metric: "min_temp",    operator: "<=", value: 4,   unit: "°C",  enabled: true,  label: "Frost warning"    },
  { id: "r3", metric: "wind_kph",    operator: ">=", value: 30,  unit: "kph", enabled: false, label: "High wind alert"  },
];

export function CustomAlertThresholds() {
  const [rules, setRules] = useState<ThresholdRule[]>(SAMPLE_RULES);
  const [newMetric, setNewMetric] = useState("rain_mm");
  const [newOperator, setNewOperator] = useState<ThresholdRule["operator"]>(">=");
  const [newValue, setNewValue] = useState("15");
  const [newLabel, setNewLabel] = useState("");
  const [saved, setSaved] = useState(false);

  const selectedMeta = METRIC_OPTIONS.find((m) => m.value === newMetric);

  const addRule = () => {
    if (!newLabel.trim() || !newValue) return;
    const meta = METRIC_OPTIONS.find((m) => m.value === newMetric);
    const rule: ThresholdRule = {
      id: `r${Date.now()}`,
      metric: newMetric,
      operator: newOperator,
      value: parseFloat(newValue),
      unit: meta?.unit ?? "",
      enabled: true,
      label: newLabel.trim(),
    };
    setRules((prev) => [...prev, rule]);
    setNewLabel("");
    setNewValue(String(meta?.defaultVal ?? 10));
  };

  const removeRule = (id: string) => setRules((prev) => prev.filter((r) => r.id !== id));
  const toggleRule = (id: string) => setRules((prev) => prev.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r));

  const handleSave = () => {
    setSaved(true);
    toast.success("Alert thresholds saved");
    setTimeout(() => setSaved(false), 3000);
  };

  const activeCount = rules.filter((r) => r.enabled).length;

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-warning/10">
              <SlidersHorizontal className="h-3.5 w-3.5 text-warning" />
            </div>
            <CardTitle className="text-base">Custom Alert Thresholds</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-success/10 text-success border-success/30 border text-xs">{activeCount} active</Badge>
            <Badge variant="outline" className="text-[10px]">UI Mockup</Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Set your own trigger conditions for climate alerts</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing rules */}
        <div className="space-y-2">
          {rules.map((rule) => (
            <div key={rule.id} className={cn(
              "flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-opacity",
              rule.enabled ? "border-border/60 bg-background/60" : "border-border/40 bg-muted/20 opacity-60"
            )}>
              <Switch checked={rule.enabled} onCheckedChange={() => toggleRule(rule.id)} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{rule.label}</p>
                <p className="text-xs text-muted-foreground">
                  {METRIC_OPTIONS.find((m) => m.value === rule.metric)?.label} {rule.operator} {rule.value} {rule.unit}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeRule(rule.id)}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Add new rule */}
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-3 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Add new threshold</p>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs">Metric</Label>
              <Select value={newMetric} onValueChange={(v) => {
                setNewMetric(v);
                const meta = METRIC_OPTIONS.find((m) => m.value === v);
                setNewValue(String(meta?.defaultVal ?? 10));
                setNewOperator((meta?.operators[0] ?? ">=") as ThresholdRule["operator"]);
              }}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {METRIC_OPTIONS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Condition</Label>
              <Select value={newOperator} onValueChange={(v: any) => setNewOperator(v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(selectedMeta?.operators ?? [">=", ">"]).map((op) => (
                    <SelectItem key={op} value={op}>{op} (greater than)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Value ({selectedMeta?.unit})</Label>
              <Input
                type="number"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Alert label (e.g. Heavy rain alert)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="h-8 text-xs flex-1"
            />
            <Button type="button" size="sm" variant="outline" onClick={addRule} className="h-8 gap-1 text-xs shrink-0">
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          </div>
        </div>

        <Button type="button" className="w-full gap-2" onClick={handleSave}>
          {saved ? <CheckCircle2 className="h-4 w-4" /> : <SlidersHorizontal className="h-4 w-4" />}
          {saved ? "Thresholds saved!" : "Save thresholds"}
        </Button>
      </CardContent>
    </Card>
  );
}
