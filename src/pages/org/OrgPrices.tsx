import { useEffect, useMemo, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, BarChart3, MessageCircleMore, RefreshCw, Settings2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUserAccount } from "@/hooks/useUserAccount";
import { db } from "@/lib/firebase";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { toast } from "sonner";
import {
  formatDateLabel,
  loadHistoryForRow,
  PricePoint,
  PriceTableRow,
  readCachedDashboard,
  refreshGroupPriceData,
  resolveCoopFocus,
  toTimestampDate,
  type MarketRecommendation,
  type PriceAlert,
} from "@/services/groupPricesService";

type DashboardState = "idle" | "loading" | "ready" | "empty" | "error";

const ALERT_COLORS: Record<PriceAlert["severity"], string> = {
  low: "bg-amber-100 text-amber-800",
  medium: "bg-orange-100 text-orange-800",
  high: "bg-red-100 text-red-800",
};

const recommendationLabel = (value: PriceTableRow["recommendation"]) => {
  if (value === "best") return "Best market";
  if (value === "avoid") return "Avoid";
  return "Good";
};

const actionHint = (alert: PriceAlert) => {
  if (alert.severity === "high") return "Sell now or hedge contracts.";
  if (alert.severity === "medium") return "Monitor closely before dispatch.";
  return "Monitor and hold if possible.";
};

const safePct = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;

const toBulletinDate = () => {
  return new Date().toLocaleDateString(undefined, { day: "2-digit", month: "short" });
};

export default function OrgPrices() {
  const accountQuery = useUserAccount();
  const orgId = accountQuery.data?.orgId ?? "";

  const [status, setStatus] = useState<DashboardState>("loading");
  const [errorText, setErrorText] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [range, setRange] = useState<"7d" | "30d">("7d");
  const [marketScope, setMarketScope] = useState<"nearby" | "selected">("nearby");
  const [priceView, setPriceView] = useState<"both" | "retail" | "wholesale">("both");

  const [topCrops, setTopCrops] = useState<string[]>([]);
  const [trackedMarkets, setTrackedMarkets] = useState<string[]>([]);
  const [orgCounty, setOrgCounty] = useState<string | null>(null);

  const [rows, setRows] = useState<PriceTableRow[]>([]);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [recommendations, setRecommendations] = useState<MarketRecommendation[]>([]);

  const [selectedRow, setSelectedRow] = useState<PriceTableRow | null>(null);
  const [selectedHistory, setSelectedHistory] = useState<PricePoint[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [queryText, setQueryText] = useState("");
  const [filterCrop, setFilterCrop] = useState("all");
  const [filterMarket, setFilterMarket] = useState("all");

  const [configOpen, setConfigOpen] = useState(false);
  const [bulletinOpen, setBulletinOpen] = useState(false);
  const [configMarkets, setConfigMarkets] = useState("");
  const [configCrops, setConfigCrops] = useState("");
  const [bulletinType, setBulletinType] = useState<"whatsapp" | "sms">("whatsapp");
  const [bulletinLang, setBulletinLang] = useState<"en" | "sw">("en");

  const bootstrap = async () => {
    if (!orgId) return;
    setStatus("loading");
    setErrorText(null);
    try {
      const focus = await resolveCoopFocus(orgId);
      setTopCrops(focus.topCrops);
      setTrackedMarkets(focus.markets);
      setOrgCounty(focus.county);
      setConfigMarkets(focus.markets.join(", "));
      setConfigCrops(focus.topCrops.join(", "));

      const cached = await readCachedDashboard(orgId);
      setRows(cached.rows);
      setAlerts(cached.alerts);
      setRecommendations(cached.recommendations);
      setStatus(cached.rows.length ? "ready" : "empty");
    } catch (error) {
      setStatus("error");
      setErrorText("Failed to initialize group prices dashboard.");
    }
  };

  useEffect(() => {
    if (!orgId) return;
    bootstrap().catch(() => {
      setStatus("error");
      setErrorText("Failed to load cooperative pricing context.");
    });
  }, [orgId]);

  const runRefresh = async () => {
    if (!orgId) return;
    if (topCrops.length === 0 || trackedMarkets.length === 0) {
      setStatus("empty");
      return;
    }
    setRefreshing(true);
    setErrorText(null);
    try {
      const selectedMarkets = marketScope === "nearby" ? trackedMarkets : trackedMarkets;
      const result = await refreshGroupPriceData({
        orgId,
        crops: topCrops,
        markets: selectedMarkets,
        forceRefresh: true,
      });
      setRows(result.rows);
      setAlerts(result.alerts);
      setRecommendations(result.recommendations);
      setStatus(result.rows.length ? "ready" : "empty");
      toast.success("Group prices refreshed from Market Oracle.");
    } catch (error) {
      const cached = await readCachedDashboard(orgId).catch(() => ({ rows: [], alerts: [], recommendations: [] }));
      setRows(cached.rows);
      setAlerts(cached.alerts);
      setRecommendations(cached.recommendations);
      setStatus(cached.rows.length ? "ready" : "error");
      setErrorText("Oracle refresh failed. Showing last cached snapshot.");
      toast.error("Oracle refresh failed. Showing cached results.");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!orgId) return;
    if (status === "empty" && topCrops.length > 0 && trackedMarkets.length > 0) {
      runRefresh().catch(() => undefined);
    }
  }, [orgId, status, topCrops, trackedMarkets]);

  const filteredRows = useMemo(() => {
    const term = queryText.trim().toLowerCase();
    return rows.filter((row) => {
      if (filterCrop !== "all" && row.crop !== filterCrop) return false;
      if (filterMarket !== "all" && row.market !== filterMarket) return false;
      if (!term) return true;
      return `${row.crop} ${row.market}`.toLowerCase().includes(term);
    });
  }, [rows, queryText, filterCrop, filterMarket]);

  const rowMarkets = useMemo(() => Array.from(new Set(rows.map((row) => row.market))).sort(), [rows]);
  const rowCrops = useMemo(() => Array.from(new Set(rows.map((row) => row.crop))).sort(), [rows]);

  const chartSeries = useMemo(() => {
    return selectedHistory.map((point) => ({
      date: formatDateLabel(point.date),
      retail: point.retail,
      wholesale: point.wholesale,
    }));
  }, [selectedHistory]);

  const loadSelectedHistory = async (row: PriceTableRow) => {
    if (!orgId) return;
    setSelectedRow(row);
    setHistoryLoading(true);
    try {
      const history = await loadHistoryForRow({ orgId, crop: row.crop, market: row.market, range });
      setSelectedHistory(history);
    } catch (error) {
      setSelectedHistory([]);
      toast.error("Failed to load trend chart for selected crop/market.");
    } finally {
      setHistoryLoading(false);
    }
  };

  const latestUpdated = useMemo(() => {
    const dates = rows
      .map((item) => item.latestDate)
      .filter(Boolean)
      .map((value) => new Date(value));
    if (!dates.length) return "Not updated";
    dates.sort((a, b) => b.getTime() - a.getTime());
    return dates[0].toLocaleString();
  }, [rows]);

  const bulletinBody = useMemo(() => {
    const topRows = filteredRows.slice(0, 5);
    const topAlert = alerts[0];
    const topRec = recommendations[0];
    const orgName = accountQuery.data?.displayName || "Cooperative";
    const marketLabel = filterMarket === "all" ? (trackedMarkets[0] ?? "Market") : filterMarket;

    if (bulletinType === "sms") {
      if (bulletinLang === "sw") {
        return `${orgName} Bei ${marketLabel} ${toBulletinDate()}: ${topRows
          .map((row) => `${row.crop} R${row.retail.toFixed(0)} W${row.wholesale.toFixed(0)} (${safePct(range === "7d" ? row.change7d : row.change30d)})`)
          .join("; ")}${topAlert ? `. Tahadhari: ${topAlert.commodity} ${topAlert.severity.toUpperCase()} ${safePct(topAlert.changePct)}.` : ""}${topRec ? ` Bora: ${topRec.market} kwa ${topRec.crop}.` : ""}`;
      }
      return `${orgName} Prices ${marketLabel} ${toBulletinDate()}: ${topRows
        .map((row) => `${row.crop} R${row.retail.toFixed(0)} W${row.wholesale.toFixed(0)} (${safePct(range === "7d" ? row.change7d : row.change30d)})`)
        .join("; ")}${topAlert ? `. Alert: ${topAlert.commodity} ${topAlert.severity.toUpperCase()} ${safePct(topAlert.changePct)}.` : ""}${topRec ? ` Best: ${topRec.market} for ${topRec.crop}.` : ""}`;
    }

    if (bulletinLang === "sw") {
      return `?? Taarifa ya Bei (${marketLabel}) - ${toBulletinDate()}\n${topRows
        .map((row) => `• ${row.crop}: Retail KES ${row.retail.toFixed(0)}/kg | Wholesale KES ${row.wholesale.toFixed(0)}/kg (${safePct(range === "7d" ? row.change7d : row.change30d)})`)
        .join("\n")}\n${topAlert ? `?? Tahadhari: ${topAlert.commodity} ${topAlert.severity.toUpperCase()} (${safePct(topAlert.changePct)})\n` : ""}${topRec ? `? Soko bora wiki hii: ${topRec.market} kwa ${topRec.crop} (+KSh ${topRec.expectedGain.toFixed(1)}/kg)` : ""}\n- Powered by AgriSmart`;
    }

    return `?? Price Bulletin (${marketLabel}) - ${toBulletinDate()}\n${topRows
      .map((row) => `• ${row.crop}: Retail KES ${row.retail.toFixed(0)}/kg | Wholesale KES ${row.wholesale.toFixed(0)}/kg (${safePct(range === "7d" ? row.change7d : row.change30d)})`)
      .join("\n")}\n${topAlert ? `?? Alert: ${topAlert.commodity} volatility ${topAlert.severity.toUpperCase()} (${safePct(topAlert.changePct)})\n` : ""}${topRec ? `? Best market this week: ${topRec.market} for ${topRec.crop} (+KSh ${topRec.expectedGain.toFixed(1)}/kg)` : ""}\n- Powered by AgriSmart`;
  }, [
    accountQuery.data?.displayName,
    alerts,
    bulletinLang,
    bulletinType,
    filterMarket,
    filteredRows,
    recommendations,
    range,
    trackedMarkets,
  ]);

  const saveConfig = async () => {
    if (!orgId) return;
    const markets = configMarkets
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const crops = configCrops
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    try {
      await setDoc(
        doc(db, "orgs", orgId),
        {
          marketsPreferred: markets,
          topCrops: crops,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setTrackedMarkets(markets);
      setTopCrops(crops);
      setConfigOpen(false);
      toast.success("Tracking settings updated.");
    } catch (error) {
      toast.error("Failed to save tracking settings.");
    }
  };

  if (accountQuery.isLoading || status === "loading") {
    return (
      <div className="space-y-4">
        <Card className="border-border/60"><CardContent className="p-6 text-sm text-muted-foreground">Loading group prices...</CardContent></Card>
        <Card className="border-border/60"><CardContent className="p-6 text-sm text-muted-foreground">Preparing Market Oracle feeds...</CardContent></Card>
      </div>
    );
  }

  if (!orgId) {
    return (
      <Card className="border-border/60">
        <CardHeader><CardTitle>No organization context found</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Please re-login and try again.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/60">
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-xl">Group Prices</CardTitle>
            <p className="text-sm text-muted-foreground">Live market intelligence for your cooperative.</p>
            <p className="text-xs text-muted-foreground">Last updated: {latestUpdated}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Tabs value={range} onValueChange={(value) => setRange(value as "7d" | "30d")}>
              <TabsList>
                <TabsTrigger value="7d">7 days</TabsTrigger>
                <TabsTrigger value="30d">30 days</TabsTrigger>
              </TabsList>
            </Tabs>
            <Select value={marketScope} onValueChange={(value) => setMarketScope(value as "nearby" | "selected") }>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Market scope" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nearby">Nearby markets</SelectItem>
                <SelectItem value="selected">Selected markets</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => setConfigOpen(true)}>
              <Settings2 className="mr-2 h-4 w-4" /> Configure
            </Button>
            <Button variant="outline" onClick={() => setBulletinOpen(true)}>
              <MessageCircleMore className="mr-2 h-4 w-4" /> Generate bulletin
            </Button>
            <Button onClick={runRefresh} disabled={refreshing || topCrops.length === 0 || trackedMarkets.length === 0}>
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Refreshing" : "Refresh"}
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card className="border-border/60">
        <CardContent className="pt-6 space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Top crops being tracked</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {topCrops.length === 0 ? <p className="text-sm text-muted-foreground">No crop signals yet.</p> : topCrops.map((crop) => <Badge key={crop} variant="secondary">{crop}</Badge>)}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Markets being tracked {orgCounty ? `(County: ${orgCounty})` : ""}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {trackedMarkets.length === 0 ? <p className="text-sm text-muted-foreground">No markets configured.</p> : trackedMarkets.map((market) => <Badge key={market} variant="outline">{market}</Badge>)}
            </div>
          </div>
        </CardContent>
      </Card>

      {errorText && (
        <Card className="border border-amber-300 bg-amber-50">
          <CardContent className="p-4 text-sm text-amber-800">{errorText}</CardContent>
        </Card>
      )}

      <Card className="border-border/60">
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle className="text-base">Prices table</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Search crop/market"
              value={queryText}
              onChange={(event) => setQueryText(event.target.value)}
              className="w-[220px]"
            />
            <Select value={filterCrop} onValueChange={setFilterCrop}>
              <SelectTrigger className="w-[170px]"><SelectValue placeholder="Filter crop" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All crops</SelectItem>
                {rowCrops.map((crop) => <SelectItem key={crop} value={crop}>{crop}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterMarket} onValueChange={setFilterMarket}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filter market" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All markets</SelectItem>
                {rowMarkets.map((market) => <SelectItem key={market} value={market}>{market}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={priceView} onValueChange={(value) => setPriceView(value as "both" | "retail" | "wholesale")}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Price view" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="both">Retail + Wholesale</SelectItem>
                <SelectItem value="retail">Retail only</SelectItem>
                <SelectItem value="wholesale">Wholesale only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRows.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/70 p-8 text-center">
              <p className="text-sm text-muted-foreground">No tracked markets/crops yet.</p>
              <Button variant="outline" className="mt-3" onClick={() => setConfigOpen(true)}>Configure tracking</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Crop</TableHead>
                  <TableHead>Market</TableHead>
                  {priceView !== "wholesale" && <TableHead>Retail (KES/kg)</TableHead>}
                  {priceView !== "retail" && <TableHead>Wholesale (KES/kg)</TableHead>}
                  <TableHead>{range} change</TableHead>
                  <TableHead>Trend</TableHead>
                  <TableHead>Recommendation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((row) => (
                  <TableRow key={row.id} className="cursor-pointer" onClick={() => loadSelectedHistory(row)}>
                    <TableCell className="font-medium">{row.crop}</TableCell>
                    <TableCell>{row.market}</TableCell>
                    {priceView !== "wholesale" && <TableCell>{row.retail.toFixed(1)}</TableCell>}
                    {priceView !== "retail" && <TableCell>{row.wholesale.toFixed(1)}</TableCell>}
                    <TableCell className={range === "7d" ? (row.change7d >= 0 ? "text-emerald-700" : "text-red-700") : (row.change30d >= 0 ? "text-emerald-700" : "text-red-700")}>{safePct(range === "7d" ? row.change7d : row.change30d)}</TableCell>
                    <TableCell className="w-[140px] h-[46px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={row.sparkline.map((price, idx) => ({ idx, price }))}>
                          <Line type="monotone" dataKey="price" stroke="hsl(var(--primary))" dot={false} strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </TableCell>
                    <TableCell><Badge variant={row.recommendation === "best" ? "default" : row.recommendation === "good" ? "secondary" : "outline"}>{recommendationLabel(row.recommendation)}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Trend chart</CardTitle>
            <p className="text-sm text-muted-foreground">
              {selectedRow ? `${selectedRow.crop} • ${selectedRow.market}` : "Select a row from prices table"}
            </p>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <p className="text-sm text-muted-foreground">Loading trend...</p>
            ) : chartSeries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No history points for selected row.</p>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartSeries}>
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip />
                    {(priceView === "both" || priceView === "retail") && <Line type="monotone" dataKey="retail" stroke="#16a34a" strokeWidth={2} dot={false} />}
                    {(priceView === "both" || priceView === "wholesale") && <Line type="monotone" dataKey="wholesale" stroke="#2563eb" strokeWidth={2} dot={false} />}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Best market recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recommendations yet. Run refresh first.</p>
            ) : (
              recommendations.map((item) => (
                <div key={`${item.crop}_${item.market}`} className="rounded-lg border border-border/60 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">{item.crop}</p>
                    <Badge>{item.market}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Sell as {item.basis}. Expected gain: KES {item.expectedGain.toFixed(1)}/kg</p>
                  <details className="mt-2 text-xs text-muted-foreground">
                    <summary className="cursor-pointer">Explain</summary>
                    <p className="mt-1">{item.explanation}</p>
                  </details>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="flex flex-row items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <CardTitle className="text-base">Price volatility alerts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active alerts.</p>
          ) : (
            alerts.slice(0, 12).map((alert) => (
              <div key={alert.id} className="rounded-lg border border-border/60 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{alert.commodity} • {alert.market}</p>
                  <Badge className={ALERT_COLORS[alert.severity]}>{alert.severity.toUpperCase()}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{alert.reason} ({safePct(alert.changePct)} / {alert.window})</p>
                <p className="text-xs mt-1">Suggested action: {actionHint(alert)}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle>Configure tracked crops and markets</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Top crops (comma separated)</Label>
              <Input value={configCrops} onChange={(event) => setConfigCrops(event.target.value)} placeholder="Tomatoes, Onions, Kale" />
            </div>
            <div>
              <Label>Markets to track (comma separated)</Label>
              <Input value={configMarkets} onChange={(event) => setConfigMarkets(event.target.value)} placeholder="Nakuru, Wakulima (Nairobi)" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfigOpen(false)}>Cancel</Button>
              <Button onClick={saveConfig}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={bulletinOpen} onOpenChange={setBulletinOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>Generate price bulletin</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Select value={bulletinType} onValueChange={(value) => setBulletinType(value as "whatsapp" | "sms")}>
                <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>
              <Select value={bulletinLang} onValueChange={(value) => setBulletinLang(value as "en" | "sw")}>
                <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">EN</SelectItem>
                  <SelectItem value="sw">SW</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/20 p-4 text-sm whitespace-pre-wrap">{bulletinBody}</div>
            <div className="flex justify-end">
              <Button onClick={async () => {
                await navigator.clipboard.writeText(bulletinBody);
                toast.success("Bulletin copied.");
              }}>Copy to clipboard</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

