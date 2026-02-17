import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Download, PlusCircle } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/firebase";
import { useUserAccount } from "@/hooks/useUserAccount";
import { getOrganization } from "@/services/orgService";
import { getSupportedMarkets } from "@/services/marketOracleService";
import { getMarketPrices } from "@/services/marketPriceService";
import {
  runInternationalSimulation,
  type InternationalSimulationOutput,
} from "@/services/internationalSimulationService";
import { InternationalKpiCards } from "@/components/org/international/InternationalKpiCards";
import {
  InternationalControlsPanel,
  type InternationalControlsState,
} from "@/components/org/international/InternationalControlsPanel";
import { InternationalResultsPanel } from "@/components/org/international/InternationalResultsPanel";
import { MarketComparisonPanel } from "@/components/org/international/MarketComparisonPanel";
import { ExportPartnersSection } from "@/components/org/international/ExportPartnersSection";
import { InsightsFeed } from "@/components/org/international/InsightsFeed";
import { SimulationEmptyState } from "@/components/org/international/SimulationEmptyState";

const CROP_OPTIONS = ["Maize", "Tomatoes", "Cabbage", "Kale", "Onions"];
const STORAGE_KEY = "org_international_controls";
const FALLBACK_LOCAL_PRICE: Record<string, number> = {
  Maize: 46,
  Tomatoes: 95,
  Cabbage: 52,
  Kale: 60,
  Onions: 78,
};

const toCsv = (result: InternationalSimulationOutput | null, controls: InternationalControlsState) => {
  if (!result) return "";
  const rows = [
    ["field", "value"],
    ["crop", controls.crop],
    ["market", controls.market],
    ["horizon_days", controls.horizonDays],
    ["local_price_kes_per_kg", result.kpis.localPriceKESPerKg ?? ""],
    ["projected_min", result.priceBand.min ?? ""],
    ["projected_mid", result.priceBand.mid ?? ""],
    ["projected_max", result.priceBand.max ?? ""],
    ["confidence", result.confidence],
    ["drivers", result.drivers.join(" | ")],
    ["recommendations", result.recommendedActions.map((item) => item.title).join(" | ")],
  ];
  return rows.map((row) => row.map((item) => `"${String(item).replace(/"/g, '""')}"`).join(",")).join("\n");
};

function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function OrgInternationalMarketsPage() {
  const account = useUserAccount();
  const navigate = useNavigate();
  const orgId = account.data?.orgId ?? "";
  const [orgName, setOrgName] = useState("Cooperative");
  const [loadingLocalPrice, setLoadingLocalPrice] = useState(false);
  const [loadingListingPrice, setLoadingListingPrice] = useState(false);
  const [marketPrice, setMarketPrice] = useState<number | null>(null);
  const [listingPrice, setListingPrice] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<InternationalSimulationOutput | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [controls, setControls] = useState<InternationalControlsState>({
    crop: CROP_OPTIONS[0],
    market: getSupportedMarkets()[0] || "Nakuru",
    horizonDays: 14,
    preset: "custom",
    importPressure: 35,
    fxShock: 0,
    freightPressure: 30,
    policyShock: "none",
    seasonalFactor: "normal",
    applyClimateRisk: false,
    useCoopStockLevels: false,
  });

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Partial<InternationalControlsState>;
      setControls((prev) => ({ ...prev, ...parsed }));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        crop: controls.crop,
        market: controls.market,
        horizonDays: controls.horizonDays,
      })
    );
  }, [controls.crop, controls.market, controls.horizonDays]);

  useEffect(() => {
    if (!orgId) return;
    getOrganization(orgId)
      .then((org) => setOrgName(org?.name || (org as any)?.orgName || "Cooperative"))
      .catch(() => setOrgName("Cooperative"));
  }, [orgId]);

  useEffect(() => {
    if (!controls.crop || !controls.market) return;
    setLoadingLocalPrice(true);
    getMarketPrices({ commodity: controls.crop, market: controls.market, limitCount: 1 })
      .then((rows) => {
        const row = rows[0];
        const next = Number(row?.retail ?? row?.wholesale ?? 0);
        setMarketPrice(next > 0 ? next : null);
      })
      .catch(() => setMarketPrice(null))
      .finally(() => setLoadingLocalPrice(false));
  }, [controls.crop, controls.market]);

  useEffect(() => {
    if (!orgId || !controls.crop) {
      setListingPrice(null);
      return;
    }
    setLoadingListingPrice(true);
    getDocs(collection(db, "orgs", orgId, "tradeListings"))
      .then((snap) => {
        const row = snap.docs
          .map((docSnap) => docSnap.data() as any)
          .find((item) => String(item.crop || "").toLowerCase() === controls.crop.toLowerCase() && item.status !== "sold");
        const next = Number(row?.pricePerKg ?? row?.minPrice ?? 0);
        setListingPrice(next > 0 ? next : null);
      })
      .catch(() => setListingPrice(null))
      .finally(() => setLoadingListingPrice(false));
  }, [orgId, controls.crop]);

  const runSimulation = () => {
    if (!orgId) {
      setErrorMessage("Organization context missing.");
      return;
    }
    const effectivePrice = marketPrice ?? FALLBACK_LOCAL_PRICE[controls.crop] ?? null;
    if (!effectivePrice) {
      setErrorMessage("No local price available for this crop/market. Choose another market or try later.");
      return;
    }
    setRunning(true);
    setErrorMessage(null);
    try {
      const next = runInternationalSimulation({
        orgId,
        crop: controls.crop,
        market: controls.market,
        horizonDays: controls.horizonDays,
        preset: controls.preset,
        importPressure: controls.importPressure,
        fxShock: controls.fxShock,
        freightPressure: controls.freightPressure,
        policyShock: controls.policyShock,
        seasonalFactor: controls.seasonalFactor,
        applyClimateRisk: controls.applyClimateRisk,
        useCoopStockLevels: controls.useCoopStockLevels,
        localPriceKESPerKg: effectivePrice,
      });
      setResult(next);
    } catch (error: any) {
      setErrorMessage(error?.message || "Could not run simulation.");
    } finally {
      setRunning(false);
    }
  };

  const applyPreset = (preset: string) => {
    setControls((prev) => {
      const patch: Partial<InternationalControlsState> = { preset };
      if (preset === "Imports surge") patch.importPressure = 80;
      if (preset === "Border disruption") patch.policyShock = "border_delays";
      if (preset === "Export ban shock") patch.policyShock = "export_ban";
      if (preset === "Demand spike (EU/UAE)") patch.fxShock = 3;
      if (preset === "Fuel cost spike") patch.freightPressure = 85;
      if (preset === "Currency weakening") patch.fxShock = 8;
      return { ...prev, ...patch };
    });
  };

  const resetControls = () => {
    setControls((prev) => ({
      ...prev,
      preset: "custom",
      importPressure: 35,
      fxShock: 0,
      freightPressure: 30,
      policyShock: "none",
      seasonalFactor: "normal",
      applyClimateRisk: false,
      useCoopStockLevels: false,
    }));
    setResult(null);
    setErrorMessage(null);
  };

  const onUseSuggestedFloorPrice = () => {
    if (!result?.suggestedFloorPrice) return;
    navigate(
      `/org/trade?openCreate=1&crop=${encodeURIComponent(controls.crop)}&floorPrice=${encodeURIComponent(result.suggestedFloorPrice)}`
    );
  };

  const downloadReport = () => {
    if (!result) {
      toast.error("Run simulation before downloading a report.");
      return;
    }
    const payload = {
      generatedAt: new Date().toISOString(),
      controls,
      result,
      marketPrice,
      listingPrice,
      orgId,
    };
    downloadFile(`international-simulation-${controls.crop.toLowerCase()}.json`, JSON.stringify(payload, null, 2), "application/json");
    downloadFile(`international-simulation-${controls.crop.toLowerCase()}.csv`, toCsv(result, controls), "text/csv;charset=utf-8");
    toast.success("Report downloaded.");
  };

  const kpis = useMemo(
    () =>
      result?.kpis ?? {
        localPriceKESPerKg: marketPrice ?? FALLBACK_LOCAL_PRICE[controls.crop] ?? null,
        importPressureIndex: controls.importPressure,
        importPressureLabel: controls.importPressure >= 67 ? "High" : controls.importPressure >= 34 ? "Medium" : "Low",
        fxShockPercent: controls.fxShock,
        freightPressureIndex: controls.freightPressure,
        policyRiskIndex: controls.policyShock === "none" ? 15 : 40,
        projectedMinKESPerKg: null,
        projectedMidKESPerKg: null,
        projectedMaxKESPerKg: null,
        confidence: marketPrice ? "Low" : "Low",
        confidenceReason: marketPrice ? "Run simulation to compute confidence." : "Using fallback local baseline because live market price is unavailable.",
      },
    [controls, marketPrice, result]
  );

  if (!orgId) {
    return <SimulationEmptyState message="Organization context missing. Refresh and try again." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">International Markets (Simulation)</h2>
          <p className="text-sm text-muted-foreground">
            See how imports, FX, and policy shocks could affect local prices. Simulation only (no real international feeds yet).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to={`/org/trade?openCreate=1&crop=${encodeURIComponent(controls.crop)}`}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create export-ready listing
            </Link>
          </Button>
          <Button onClick={downloadReport} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download report
          </Button>
        </div>
      </div>

      {(loadingLocalPrice || loadingListingPrice) && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
        </div>
      )}

      <InternationalKpiCards kpis={kpis} horizonDays={controls.horizonDays} />

      {errorMessage && <SimulationEmptyState message={errorMessage} />}
      {!marketPrice && !loadingLocalPrice && (
        <SimulationEmptyState message="Live local price is unavailable. Using fallback baseline for simulation." />
      )}

      <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
        <InternationalControlsPanel
          controls={controls}
          cropOptions={CROP_OPTIONS}
          marketOptions={getSupportedMarkets()}
          onChange={(patch) => setControls((prev) => ({ ...prev, ...patch }))}
          onApplyPreset={applyPreset}
          onRun={runSimulation}
          onReset={resetControls}
          running={running}
          canRun={Boolean(marketPrice ?? FALLBACK_LOCAL_PRICE[controls.crop])}
        />
        <InternationalResultsPanel result={result} />
      </div>

      <MarketComparisonPanel
        marketPrice={marketPrice}
        listingPrice={listingPrice}
        suggestedFloorPrice={result?.suggestedFloorPrice ?? null}
        onUseSuggestedFloorPrice={onUseSuggestedFloorPrice}
      />

      <ExportPartnersSection orgId={orgId} orgName={orgName} selectedCrop={controls.crop} />

      <InsightsFeed items={result?.insightsFeed ?? []} />

      <Card className="border-border/60">
        <CardContent className="pt-4 text-xs text-muted-foreground">
          Cooperative: {orgName} • data source: local market snapshots and simulation assumptions.
        </CardContent>
      </Card>
    </div>
  );
}
