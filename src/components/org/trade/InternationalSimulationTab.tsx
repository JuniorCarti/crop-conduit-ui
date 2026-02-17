import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Info, Loader2, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getSupportedMarkets } from "@/services/marketOracleService";
import { getMarketPrices } from "@/services/marketPriceService";
import {
  deleteIntlScenario,
  listIntlScenarios,
  runIntlSimulation,
  saveIntlScenario,
  type IntlPolicyShock,
  type IntlScenario,
  type IntlSeasonFactor,
  type IntlSimulationResult,
} from "@/services/intlSimulationService";

const CROP_OPTIONS = ["Tomatoes", "Kale", "Cabbage", "Onions"] as const;
const HORIZON_OPTIONS = [2, 4, 6] as const;
const POLICY_OPTIONS: IntlPolicyShock[] = ["none", "tariff increase", "tariff removal", "border delays"];
const SEASON_OPTIONS: IntlSeasonFactor[] = ["in-season", "shoulder", "off-season"];

type ListingSignal = { crop: string; direction: "up" | "down" | "flat"; projectedMid: number; createdAt: string };

type Props = {
  orgId: string;
  onSignalsChange?: (signals: ListingSignal[]) => void;
};

const byLatest = (rows: IntlScenario[]) =>
  rows
    .slice()
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

const localStorageKey = (orgId: string) => `intl_sim_scenarios_${orgId}`;

const parseList = (value: string | null): IntlScenario[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const dedupeById = (rows: IntlScenario[]) => {
  const bag = new Map<string, IntlScenario>();
  rows.forEach((row) => bag.set(row.scenarioId, row));
  return byLatest(Array.from(bag.values()));
};

const confidenceLabel = (localPrice: number, result?: IntlSimulationResult | null) => {
  if (!result) return "Low";
  if (!localPrice || localPrice <= 0) return "Low";
  if (result.confidence === "High") return "Medium";
  return result.confidence;
};

export function InternationalSimulationTab({ orgId, onSignalsChange }: Props) {
  const [crop, setCrop] = useState<string>(CROP_OPTIONS[0]);
  const [market, setMarket] = useState<string>(getSupportedMarkets()[0] || "Nakuru");
  const [horizonWeeks, setHorizonWeeks] = useState<2 | 4 | 6>(4);
  const [importPressure, setImportPressure] = useState(35);
  const [fxShockPercent, setFxShockPercent] = useState(0);
  const [importShockEvent, setImportShockEvent] = useState(false);
  const [policyShock, setPolicyShock] = useState<IntlPolicyShock>("none");
  const [seasonFactor, setSeasonFactor] = useState<IntlSeasonFactor>("shoulder");
  const [scenarioName, setScenarioName] = useState("");

  const [localPrice, setLocalPrice] = useState<number | null>(null);
  const [marketLoading, setMarketLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<IntlSimulationResult | null>(null);
  const [scenarios, setScenarios] = useState<IntlScenario[]>([]);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const markets = useMemo(() => getSupportedMarkets(), []);

  useEffect(() => {
    if (!orgId) return;
    const localRows = parseList(localStorage.getItem(localStorageKey(orgId)));
    if (localRows.length) {
      setScenarios(dedupeById(localRows));
    }

    listIntlScenarios(orgId)
      .then((remoteRows) => {
        const merged = dedupeById([...remoteRows, ...localRows]);
        setScenarios(merged);
        localStorage.setItem(localStorageKey(orgId), JSON.stringify(merged));
      })
      .catch((error: any) => {
        if (localRows.length) return;
        toast.error(error?.message || "Could not load saved scenarios.");
      });
  }, [orgId]);

  useEffect(() => {
    if (!orgId || !crop || !market) {
      setLocalPrice(null);
      return;
    }
    let cancelled = false;
    setMarketLoading(true);
    getMarketPrices({ commodity: crop, market, limitCount: 1 })
      .then((rows) => {
        if (cancelled) return;
        const row = rows[0];
        const price = Number(row?.retail ?? row?.wholesale ?? 0);
        setLocalPrice(price > 0 ? price : null);
      })
      .catch(() => {
        if (!cancelled) setLocalPrice(null);
      })
      .finally(() => {
        if (!cancelled) setMarketLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orgId, crop, market]);

  useEffect(() => {
    if (!onSignalsChange) return;
    const latestByCrop = new Map<string, ListingSignal>();
    byLatest(scenarios).forEach((scenario) => {
      if (!latestByCrop.has(scenario.crop) && scenario?.result?.direction) {
        latestByCrop.set(scenario.crop, {
          crop: scenario.crop,
          direction: scenario.result.direction,
          projectedMid: Number(scenario.projectedMid ?? scenario.result?.projectedMid ?? 0),
          createdAt: scenario.createdAt,
        });
      }
    });
    onSignalsChange(Array.from(latestByCrop.values()));
  }, [onSignalsChange, scenarios]);

  const runSimulation = async () => {
    if (!orgId) {
      toast.error("Organization context missing.");
      return;
    }
    if (!localPrice || localPrice <= 0) {
      toast.error("No local price available for this crop/market. Choose another market or try later.");
      return;
    }
    setRunning(true);
    try {
      const next = await runIntlSimulation({
        orgId,
        crop,
        market,
        horizonWeeks,
        localPriceKESPerKg: localPrice,
        importPressure,
        fxShockPercent,
        importShockEvent,
        policyShock,
        seasonFactor,
      });
      setResult(next);
      toast.success("Simulation complete.");
    } catch (error: any) {
      toast.error(error?.message || "Simulation failed.");
    } finally {
      setRunning(false);
    }
  };

  const saveScenario = async () => {
    if (!orgId || !result) {
      toast.error("Run simulation before saving.");
      return;
    }
    const name = scenarioName.trim() || `${crop} ${market} ${new Date().toLocaleString()}`;
    setSaving(true);
    try {
      const saved = await saveIntlScenario({
        orgId,
        name,
        crop,
        market,
        horizonWeeks,
        importPressure,
        fxShockPercent,
        importShockEvent,
        policyShock,
        seasonFactor,
        result,
      });
      setScenarios((prev) => {
        const merged = dedupeById([saved, ...prev]);
        localStorage.setItem(localStorageKey(orgId), JSON.stringify(merged));
        return merged;
      });
      setScenarioName("");
      toast.success("Scenario saved.");
    } catch (error: any) {
      toast.error(error?.message || "Failed to save scenario.");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setHorizonWeeks(4);
    setImportPressure(35);
    setFxShockPercent(0);
    setImportShockEvent(false);
    setPolicyShock("none");
    setSeasonFactor("shoulder");
    setResult(null);
  };

  const removeScenario = async (scenarioId: string) => {
    try {
      await deleteIntlScenario(orgId, scenarioId);
      setScenarios((prev) => {
        const next = prev.filter((row) => row.scenarioId !== scenarioId);
        localStorage.setItem(localStorageKey(orgId), JSON.stringify(next));
        return next;
      });
      setCompareIds((prev) => prev.filter((id) => id !== scenarioId));
      toast.success("Scenario deleted.");
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete scenario.");
    }
  };

  const selectScenario = (scenario: IntlScenario) => {
    setCrop(scenario.crop || CROP_OPTIONS[0]);
    setMarket(scenario.market || markets[0] || "Nakuru");
    setHorizonWeeks(([2, 4, 6].includes(Number(scenario.horizonWeeks)) ? Number(scenario.horizonWeeks) : 4) as 2 | 4 | 6);
    setImportPressure(Number(scenario.importPressure ?? 35));
    setFxShockPercent(Number(scenario.fxShockPercent ?? 0));
    setImportShockEvent(Boolean(scenario.importShockEvent));
    setPolicyShock((scenario.policyShock as IntlPolicyShock) || "none");
    setSeasonFactor((scenario.seasonFactor as IntlSeasonFactor) || "shoulder");
    setResult(scenario.result || null);
  };

  const compareRows = useMemo(() => scenarios.filter((row) => compareIds.includes(row.scenarioId)).slice(0, 2), [compareIds, scenarios]);

  const projectedBand = result
    ? `KES ${result.projectedMin.toLocaleString()} / ${result.projectedMid.toLocaleString()} / ${result.projectedMax.toLocaleString()}`
    : "--";
  const importLabel = result?.importPressureLabel || (importPressure >= 67 ? "High" : importPressure >= 34 ? "Medium" : "Low");
  const confidence = confidenceLabel(localPrice || 0, result);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-2 text-sm text-amber-900">
        <Info className="mr-1 inline h-4 w-4" />
        Simulation only (no real international feeds yet).
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Card className="border-border/60"><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Local price today</p><p className="text-2xl font-semibold">{marketLoading ? "--" : localPrice ? `KES ${localPrice.toLocaleString()}` : "--"}</p><p className="text-xs text-muted-foreground">{crop} - {market}</p></CardContent></Card>
        <Card className="border-border/60"><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Import pressure (simulated)</p><p className="text-2xl font-semibold">{result?.importPressure ?? importPressure}</p><p className="text-xs text-muted-foreground">{importLabel}</p></CardContent></Card>
        <Card className="border-border/60"><CardContent className="pt-5"><p className="text-xs text-muted-foreground">FX shock (simulated)</p><p className="text-2xl font-semibold">{(result?.fxShockPercent ?? fxShockPercent).toFixed(1)}%</p><p className="text-xs text-muted-foreground">KES weakening/strengthening</p></CardContent></Card>
        <Card className="border-border/60"><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Projected price band</p><p className="text-sm font-semibold">{projectedBand}</p><p className="text-xs text-muted-foreground">{horizonWeeks}-week horizon</p></CardContent></Card>
        <Card className="border-border/60"><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Confidence</p><p className="text-2xl font-semibold">{confidence}</p><p className="text-xs text-muted-foreground">Based on local price data</p></CardContent></Card>
      </div>

      <Card className="border-border/60">
        <CardHeader><CardTitle className="text-base">Simulation controls</CardTitle></CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label>Crop</Label>
              <Select value={crop} onValueChange={setCrop}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CROP_OPTIONS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Market</Label>
              <Select value={market} onValueChange={setMarket}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{markets.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Horizon</Label>
              <Select value={String(horizonWeeks)} onValueChange={(value) => setHorizonWeeks(Number(value) as 2 | 4 | 6)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{HORIZON_OPTIONS.map((option) => <SelectItem key={option} value={String(option)}>{option} weeks</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Policy shock</Label>
              <Select value={policyShock} onValueChange={(value) => setPolicyShock(value as IntlPolicyShock)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{POLICY_OPTIONS.map((option) => <SelectItem key={option} value={option}>{option === "none" ? "None" : option}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Season factor</Label>
              <Select value={seasonFactor} onValueChange={(value) => setSeasonFactor(value as IntlSeasonFactor)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SEASON_OPTIONS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <Label>Import pressure: {importPressure}</Label>
              <Slider value={[importPressure]} min={0} max={100} step={1} onValueChange={(values) => setImportPressure(values[0] ?? 35)} />
            </div>
            <div>
              <Label>FX shock: {fxShockPercent.toFixed(1)}%</Label>
              <Slider value={[fxShockPercent]} min={-10} max={10} step={0.5} onValueChange={(values) => setFxShockPercent(values[0] ?? 0)} />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
              <div>
                <p className="text-sm font-medium">Import shock event</p>
                <p className="text-xs text-muted-foreground">Adds downside shock and volatility</p>
              </div>
              <Switch checked={importShockEvent} onCheckedChange={setImportShockEvent} />
            </div>
            <div>
              <Label>Scenario name (for saving)</Label>
              <Input value={scenarioName} onChange={(event) => setScenarioName(event.target.value)} placeholder="E.g. Tomato tariff stress" />
            </div>
          </div>

          <div className="lg:col-span-2 flex flex-wrap gap-2">
            <Button onClick={runSimulation} disabled={running || !localPrice}>
              {running && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Run simulation
            </Button>
            <Button variant="outline" onClick={saveScenario} disabled={!result || saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save scenario
            </Button>
            <Button variant="outline" onClick={resetForm}>Reset</Button>
            {!localPrice && !marketLoading && (
              <span className="inline-flex items-center text-xs text-amber-700">
                <AlertTriangle className="mr-1 h-3.5 w-3.5" />
                No local price available for this crop/market. Choose another market or try later.
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card className="border-border/60">
          <CardHeader><CardTitle className="text-base">Projected price band</CardTitle></CardHeader>
          <CardContent className="h-72">
            {!result ? (
              <p className="text-sm text-muted-foreground">Run simulation to view projection.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={result.timeline}>
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Line dataKey="min" stroke="hsl(var(--destructive))" strokeWidth={1.8} dot={false} />
                  <Line dataKey="mid" stroke="hsl(var(--primary))" strokeWidth={2.2} />
                  <Line dataKey="max" stroke="hsl(var(--chart-2))" strokeWidth={1.8} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-border/60">
            <CardHeader><CardTitle className="text-base">Drivers</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {(result?.drivers?.length ? result.drivers : ["Run simulation to generate price drivers."]).map((driver, index) => (
                <p key={`${driver}_${index}`}>- {driver}</p>
              ))}
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardHeader><CardTitle className="text-base">Recommendations</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {(result?.recommendations?.length ? result.recommendations : ["Recommendations will appear after simulation."]).map((item, index) => (
                <div key={`${item}_${index}`} className="flex items-center gap-2">
                  {result?.direction === "up" && <TrendingUp className="h-4 w-4 text-emerald-600" />}
                  {result?.direction === "down" && <TrendingDown className="h-4 w-4 text-amber-700" />}
                  {result?.direction === "flat" && <Minus className="h-4 w-4 text-muted-foreground" />}
                  {!result?.direction && <Minus className="h-4 w-4 text-muted-foreground" />}
                  <span>{item}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-border/60">
        <CardHeader><CardTitle className="text-base">Saved scenarios</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {scenarios.length === 0 ? (
            <p className="text-sm text-muted-foreground">No saved scenarios yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Crop</TableHead>
                  <TableHead>Market</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Import</TableHead>
                  <TableHead>FX</TableHead>
                  <TableHead>Horizon</TableHead>
                  <TableHead>Projected mid</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scenarios.map((row) => {
                  const comparing = compareIds.includes(row.scenarioId);
                  return (
                    <TableRow key={row.scenarioId}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell>{row.crop}</TableCell>
                      <TableCell>{row.market}</TableCell>
                      <TableCell>{new Date(row.createdAt).toLocaleString()}</TableCell>
                      <TableCell>{row.importPressure}</TableCell>
                      <TableCell>{row.fxShockPercent}%</TableCell>
                      <TableCell>{row.horizonWeeks}w</TableCell>
                      <TableCell>KES {Number(row.projectedMid || row.result?.projectedMid || 0).toLocaleString()}</TableCell>
                      <TableCell className="space-x-1">
                        <Button size="sm" variant="outline" onClick={() => selectScenario(row)}>View</Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setCompareIds((prev) => {
                              if (prev.includes(row.scenarioId)) return prev.filter((id) => id !== row.scenarioId);
                              if (prev.length >= 2) return [prev[1], row.scenarioId];
                              return [...prev, row.scenarioId];
                            })
                          }
                        >
                          {comparing ? "Comparing" : "Compare"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => removeScenario(row.scenarioId)}>Delete</Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {compareRows.length === 2 && (
            <div className="grid gap-3 md:grid-cols-2">
              {compareRows.map((row) => (
                <Card key={row.scenarioId} className="border-border/60">
                  <CardHeader><CardTitle className="text-sm">{row.name}</CardTitle></CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p><span className="text-muted-foreground">Crop:</span> {row.crop}</p>
                    <p><span className="text-muted-foreground">Market:</span> {row.market}</p>
                    <p><span className="text-muted-foreground">Direction:</span> <Badge variant="outline">{row.result?.direction || "flat"}</Badge></p>
                    <p><span className="text-muted-foreground">Projected band:</span> KES {row.result?.projectedMin} - {row.result?.projectedMax}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
