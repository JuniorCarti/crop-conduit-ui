import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import type { LatLngTuple } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import {
  Circle,
  CircleMarker,
  MapContainer,
  Marker,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMemberMapData, type MemberMapPoint } from "@/hooks/useMemberMapData";
import { useNavigate } from "react-router-dom";
import {
  formatDate,
  getProductionEstimate,
  getReadiness,
  getTopCrops,
  HeatIntensity,
  MapMode,
  TimeFilter,
  CropTypeFilter,
  useMapPlanningData,
} from "@/components/coopMapAdvanced/hooks/useMapPlanningData";
import { useMarketOpportunity } from "@/components/coopMapAdvanced/hooks/useMarketOpportunity";
import { useRiskOverlay } from "@/components/coopMapAdvanced/hooks/useRiskOverlay";
import { exportMembersCsv } from "@/components/coopMapAdvanced/utils/exporters";
import InsightsSidePanel from "@/components/coopMapAdvanced/panels/InsightsSidePanel";
import CollectionPlanningModal from "@/components/coopMapAdvanced/panels/CollectionPlanningModal";

const CountyLayer = lazy(() => import("@/components/coopMapAdvanced/layers/CountyLayer"));
const MarketOpportunityLayer = lazy(() => import("@/components/coopMapAdvanced/layers/MarketOpportunityLayer"));
const RiskOverlayLayer = lazy(() => import("@/components/coopMapAdvanced/layers/RiskOverlayLayer"));

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const KENYA_CENTER: LatLngTuple = [-0.0236, 37.9062];
const DEFAULT_ZOOM = 6;

const getCropColor = (crop: string) => {
  const normalized = crop.toLowerCase();
  if (normalized.includes("maize")) return "#2f855a";
  if (normalized.includes("tomato")) return "#c53030";
  if (normalized.includes("cabbage")) return "#2d6a4f";
  if (normalized.includes("kale") || normalized.includes("sukuma")) return "#1b4332";
  if (normalized.includes("beans")) return "#6b46c1";
  if (normalized.includes("onion")) return "#b45309";
  return "#2563eb";
};

const buildClusterIcon = (count: number) =>
  L.divIcon({
    className: "kenya-member-cluster-icon",
    html: `<div style="background:#0f766e;color:#fff;border-radius:9999px;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-weight:700;box-shadow:0 1px 8px rgba(0,0,0,.25);">${count}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });

const MapResizer = () => {
  const map = useMap();
  useEffect(() => {
    const timer = window.setTimeout(() => map.invalidateSize(), 150);
    return () => window.clearTimeout(timer);
  }, [map]);
  return null;
};

const ZoomWatcher = ({ onZoom }: { onZoom: (zoom: number) => void }) => {
  useMapEvents({ zoomend: (event) => onZoom(event.target.getZoom()) });
  return null;
};

const useDebouncedValue = <T,>(value: T, delayMs: number) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
};

type InsightsPayload = { label: string; members: MemberMapPoint[] };

export default function KenyaMemberMapAdvanced({ orgId }: { orgId: string }) {
  const navigate = useNavigate();
  const { loading, members, stats } = useMemberMapData(orgId);

  const [mapMode, setMapMode] = useState<MapMode>("heatmap");
  const [cropFilter, setCropFilter] = useState("all");
  const [cropType, setCropType] = useState<CropTypeFilter>("both");
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [heatIntensity, setHeatIntensity] = useState<HeatIntensity>("farmer_count");
  const [insights, setInsights] = useState<InsightsPayload | null>(null);
  const [planningOpen, setPlanningOpen] = useState(false);

  const [marketOpportunityOn, setMarketOpportunityOn] = useState(false);
  const [riskMapOn, setRiskMapOn] = useState(false);

  const marketFeatureEnabled = String((import.meta as any).env?.VITE_ENABLE_KENYA_MEMBER_MAP_MARKET_OPPORTUNITY ?? "false").toLowerCase() === "true";
  const planningFeatureEnabled = String((import.meta as any).env?.VITE_ENABLE_KENYA_MEMBER_MAP_COLLECTION_PLANNING ?? "false").toLowerCase() === "true";
  const riskFeatureEnabled = String((import.meta as any).env?.VITE_ENABLE_KENYA_MEMBER_MAP_RISK ?? "false").toLowerCase() === "true";

  const debouncedFilters = useDebouncedValue({ cropFilter, cropType, verifiedOnly, timeFilter }, 250);

  const {
    cropOptions,
    filteredMembers,
    plottedMembers,
    countyAggregates,
    maxCountyCount,
    clusterMode,
    clusters,
  } = useMapPlanningData({
    members,
    cropFilter: debouncedFilters.cropFilter,
    cropType: debouncedFilters.cropType,
    verifiedOnly: debouncedFilters.verifiedOnly,
    timeFilter: debouncedFilters.timeFilter,
    mapMode,
    zoom,
  });

  const { loading: marketLoading, error: marketError, points: marketPoints, bestMarket } = useMarketOpportunity({
    enabled: marketFeatureEnabled && marketOpportunityOn,
    cropFilter: debouncedFilters.cropFilter,
    plottedMembers,
  });

  const { zoneMap } = useRiskOverlay({
    enabled: riskFeatureEnabled && riskMapOn,
    filteredMembers,
  });

  const openInsights = (label: string, rows: MemberMapPoint[]) => setInsights({ label, members: rows });

  const panelStats = useMemo(() => {
    if (!insights) return null;
    const rows = insights.members;
    const readinessCounts: Record<string, number> = { Ready: 0, Growing: 0, "Off-season": 0, Unknown: 0 };
    rows.forEach((row) => {
      const key = getReadiness(row);
      readinessCounts[key] = (readinessCounts[key] ?? 0) + 1;
    });
    return {
      membersCount: rows.length,
      verifiedCount: rows.filter((row) => row.status === "verified").length,
      topMain: getTopCrops(rows, "mainCrops"),
      topSecondary: getTopCrops(rows, "secondaryCrops"),
      productionTotal: rows.reduce((sum, row) => sum + getProductionEstimate(row), 0),
      readinessCounts,
    };
  }, [insights]);

  const emptyState = !loading && filteredMembers.length === 0;

  const exportCurrent = () => {
    const rows = insights?.members ?? filteredMembers;
    exportMembersCsv(rows, `member-map-${orgId}-${Date.now()}.csv`);
  };

  return (
    <Card className="border-border/60">
      <CardHeader className="space-y-3">
        <CardTitle>Kenya Member Map</CardTitle>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-xs">
          <div className="rounded border border-border/60 p-2"><p className="text-muted-foreground">Total onboarded</p><p className="font-semibold">{stats.totalOnboarded}</p></div>
          <div className="rounded border border-border/60 p-2"><p className="text-muted-foreground">Top main crops</p><p className="font-semibold">{stats.topMainCrops.join(", ") || "N/A"}</p></div>
          <div className="rounded border border-border/60 p-2"><p className="text-muted-foreground">Top secondary crops</p><p className="font-semibold">{stats.topSecondaryCrops.join(", ") || "N/A"}</p></div>
          <div className="rounded border border-border/60 p-2"><p className="text-muted-foreground">Most active county</p><p className="font-semibold">{stats.mostActiveCounty}</p></div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="relative z-10 grid gap-3 md:grid-cols-8">
          <div>
            <Label>Mode</Label>
            <Select value={mapMode} onValueChange={(value) => setMapMode(value as MapMode)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="heatmap">Heatmap</SelectItem>
                <SelectItem value="dots">Markers</SelectItem>
                <SelectItem value="county">County view</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Crop filter</Label>
            <Select value={cropFilter} onValueChange={setCropFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All crops</SelectItem>
                {cropOptions.map((crop) => <SelectItem key={crop} value={crop}>{crop}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Crop type</Label>
            <Select value={cropType} onValueChange={(value) => setCropType(value as CropTypeFilter)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="main">Main</SelectItem>
                <SelectItem value="secondary">Secondary</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Time filter</Label>
            <Select value={timeFilter} onValueChange={(value) => setTimeFilter(value as TimeFilter)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="last_3_months">Last 3 months</SelectItem>
                <SelectItem value="this_season">This season</SelectItem>
                <SelectItem value="last_year">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Heat intensity</Label>
            <Select value={heatIntensity} onValueChange={(value) => setHeatIntensity(value as HeatIntensity)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="farmer_count">Farmer count</SelectItem>
                <SelectItem value="estimated_production">Estimated production</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button variant={verifiedOnly ? "default" : "outline"} onClick={() => setVerifiedOnly((prev) => !prev)} className="w-full">
              Verified {verifiedOnly ? "ON" : "OFF"}
            </Button>
          </div>

          <div className="flex items-end">
            <Badge variant="secondary" className="h-9 w-full justify-center">Plotted: {plottedMembers.length}</Badge>
          </div>

          <div className="flex items-end">
            <Button variant="outline" className="w-full" onClick={exportCurrent}>Download CSV</Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {marketFeatureEnabled && (
            <Button variant={marketOpportunityOn ? "default" : "outline"} size="sm" onClick={() => setMarketOpportunityOn((v) => !v)}>
              Market Opportunity {marketOpportunityOn ? "ON" : "OFF"}
            </Button>
          )}
          {planningFeatureEnabled && (
            <Button variant="outline" size="sm" onClick={() => setPlanningOpen(true)}>Plan Collection</Button>
          )}
          {riskFeatureEnabled && (
            <Button variant={riskMapOn ? "default" : "outline"} size="sm" onClick={() => setRiskMapOn((v) => !v)}>
              Risk Map {riskMapOn ? "ON" : "OFF"}
            </Button>
          )}
          <Button size="sm" variant="outline" disabled title="TODO: map snapshot export">Export PNG (coming soon)</Button>
        </div>

        <div className="relative z-0 h-[500px] rounded-lg border border-border/60 overflow-hidden">
          <MapContainer center={KENYA_CENTER} zoom={DEFAULT_ZOOM} scrollWheelZoom className="h-full w-full">
            <MapResizer />
            <ZoomWatcher onZoom={setZoom} />
            <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {mapMode === "county" && (
              <Suspense fallback={null}>
                <CountyLayer countyAggregates={countyAggregates} maxCountyCount={maxCountyCount} onSelect={openInsights} />
              </Suspense>
            )}

            {mapMode === "dots" && clusterMode && clusters.map((cluster) => (
              <Marker
                key={`cluster-${cluster.lat}-${cluster.lon}`}
                position={[cluster.lat, cluster.lon]}
                icon={buildClusterIcon(cluster.count)}
                eventHandlers={{ click: () => openInsights("Custom cluster", cluster.members) }}
              >
                <Tooltip>Clustered members: {cluster.count}</Tooltip>
              </Marker>
            ))}

            {mapMode === "dots" && !clusterMode && plottedMembers.map((member) => {
              const lat = Number(member.lat);
              const lon = Number(member.lon);
              const color = getCropColor(member.mainCrops[0] || member.secondaryCrops[0] || "");
              return (
                <CircleMarker
                  key={member.memberId}
                  center={[lat, lon]}
                  radius={6}
                  pathOptions={{ color, fillColor: color, fillOpacity: 0.75, weight: 1 }}
                  eventHandlers={{ click: () => openInsights(member.county || "Member location", [member]) }}
                >
                  <Tooltip direction="top">
                    <div className="space-y-1 text-xs">
                      <p className="font-semibold">{member.name || `Member ${member.memberId.slice(0, 6)}`}</p>
                      <p>{member.county || "N/A"}{member.ward ? `, ${member.ward}` : ""}</p>
                      <p>{formatDate(member.createdAt)}</p>
                    </div>
                  </Tooltip>
                </CircleMarker>
              );
            })}

            {mapMode === "heatmap" && plottedMembers.map((member) => {
              const lat = Number(member.lat);
              const lon = Number(member.lon);
              const weight = heatIntensity === "estimated_production" ? getProductionEstimate(member) : 1;
              const radiusBase = plottedMembers.length > 3000 ? 4000 : 7000;
              const radius = Math.max(2000, radiusBase + weight * 120);
              return (
                <Circle
                  key={`heat-${member.memberId}`}
                  center={[lat, lon]}
                  radius={radius}
                  pathOptions={{ color: "#ef4444", weight: 0, fillColor: "#ef4444", fillOpacity: Math.min(0.35, 0.08 + Math.min(weight, 8) * 0.02) }}
                  eventHandlers={{
                    click: (event) => {
                      const { latlng } = event as any;
                      const nearby = plottedMembers.filter((row) => {
                        const rowLat = Number(row.lat);
                        const rowLon = Number(row.lon);
                        const diff = Math.abs(rowLat - latlng.lat) + Math.abs(rowLon - latlng.lng);
                        return diff < 0.35;
                      });
                      openInsights("Custom cluster", nearby.length ? nearby : [member]);
                    },
                  }}
                />
              );
            })}

            {marketFeatureEnabled && marketOpportunityOn && (
              <Suspense fallback={null}>
                <MarketOpportunityLayer points={marketPoints} />
              </Suspense>
            )}

            {riskFeatureEnabled && riskMapOn && (
              <Suspense fallback={null}>
                <RiskOverlayLayer plottedMembers={plottedMembers} zoneMap={zoneMap} />
              </Suspense>
            )}
          </MapContainer>

          <div className="absolute bottom-3 right-3 rounded-md border border-border/60 bg-background/95 px-3 py-2 text-xs shadow-sm max-w-[220px]">
            <p className="font-medium">Member crop concentration</p>
            <p className="text-muted-foreground mb-2">Based on: {heatIntensity === "farmer_count" ? "Farmer count" : "Estimated production"}</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2"><span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-200" />Low density</div>
              <div className="flex items-center gap-2"><span className="inline-block h-2.5 w-2.5 rounded-full bg-orange-400" />Medium density</div>
              <div className="flex items-center gap-2"><span className="inline-block h-2.5 w-2.5 rounded-full bg-red-600" />High density</div>
            </div>
          </div>

          {marketFeatureEnabled && marketOpportunityOn && (
            <div className="absolute top-3 right-3 rounded-md border border-border/60 bg-background/95 px-3 py-2 text-xs shadow-sm max-w-[230px]">
              <p className="font-medium">Market Opportunity</p>
              {marketLoading ? (
                <p className="text-muted-foreground">Loading market data...</p>
              ) : marketError ? (
                <p className="text-muted-foreground">Market data unavailable</p>
              ) : bestMarket ? (
                <div className="space-y-1">
                  <p>KES {bestMarket.pricePerKg.toFixed(0)}/kg</p>
                  <p>Trend: {bestMarket.trend === "up" ? "↑" : bestMarket.trend === "down" ? "↓" : "→"}</p>
                  <p>Best nearby: {bestMarket.label}</p>
                </div>
              ) : (
                <p className="text-muted-foreground">Market data unavailable</p>
              )}
            </div>
          )}

          {emptyState && <div className="absolute inset-0 flex items-center justify-center bg-background/55 text-sm text-muted-foreground">Members will appear here once onboarded and verified.</div>}

          {insights && panelStats && (
            <InsightsSidePanel
              label={insights.label}
              members={insights.members}
              stats={panelStats}
              onClose={() => setInsights(null)}
              onExport={exportCurrent}
              onOpenSingle={(memberId) => navigate(`/org/members?memberId=${memberId}`)}
            />
          )}
        </div>

        {planningFeatureEnabled && (
          <CollectionPlanningModal
            open={planningOpen}
            onOpenChange={setPlanningOpen}
            members={filteredMembers}
            cropOptions={cropOptions}
          />
        )}
      </CardContent>
    </Card>
  );
}
