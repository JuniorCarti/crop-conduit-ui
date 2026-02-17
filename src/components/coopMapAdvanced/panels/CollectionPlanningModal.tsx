import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import type { MemberMapPoint } from "@/hooks/useMemberMapData";
import { downloadCsv } from "@/components/coopMapAdvanced/utils/exporters";
import {
  extractMemberCrop,
  getProductionEstimate,
  inTimeFilter,
  normalizeCrop,
  type CropTypeFilter,
  type HeatIntensity,
  type TimeFilter,
} from "@/components/coopMapAdvanced/hooks/useMapPlanningData";
import { toast } from "sonner";
import type { LatLngTuple } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { Circle, CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import {
  CalendarDays,
  CheckCircle2,
  Filter,
  Leaf,
  MapPin,
  Package,
  PhoneCall,
  Share2,
  SlidersHorizontal,
  Sparkles,
  Target,
} from "lucide-react";

type PlanItem = {
  member: MemberMapPoint;
  quantityEstimate: number;
  reliability: number;
  rankScore: number;
  trend: "up" | "flat" | "down";
};

type CollectionPlannerViewMode = "heatmap" | "list";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const KENYA_CENTER: LatLngTuple = [-0.0236, 37.9062];
const DEFAULT_ZOOM = 6;

const toDate = (value: any) => {
  const date = value?.toDate?.() ?? (value ? new Date(value) : null);
  return date && !Number.isNaN(date.getTime()) ? date : null;
};

const reliabilityTone = (value: number) => {
  if (value >= 1.4) return "bg-emerald-100 text-emerald-900";
  if (value >= 1.1) return "bg-amber-100 text-amber-900";
  return "bg-red-100 text-red-900";
};

const trendArrow = (trend: "up" | "flat" | "down") => {
  if (trend === "up") return "↑";
  if (trend === "down") return "↓";
  return "→";
};

const useDebouncedValue = <T,>(value: T, delayMs: number) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
};

const MapResizer = () => {
  const map = useMap();
  useEffect(() => {
    const timer = window.setTimeout(() => map.invalidateSize(), 120);
    return () => window.clearTimeout(timer);
  }, [map]);
  return null;
};

const ZoomWatcher = ({ onZoom }: { onZoom: (zoom: number) => void }) => {
  useMapEvents({
    zoomend: (event) => onZoom(event.target.getZoom()),
  });
  return null;
};

const clusterIcon = (count: number) =>
  L.divIcon({
    className: "planner-cluster-icon",
    html: `<div style="background:#14532d;color:#fff;border-radius:9999px;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;">${count}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });

export default function CollectionPlanningModal({
  open,
  onOpenChange,
  members,
  cropOptions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: MemberMapPoint[];
  cropOptions: string[];
}) {
  const [crop, setCrop] = useState<string>("Tomatoes");
  const [targetQty, setTargetQty] = useState("1000");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [cropType, setCropType] = useState<CropTypeFilter>("both");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [viewMode, setViewMode] = useState<CollectionPlannerViewMode>("heatmap");
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [heatIntensity, setHeatIntensity] = useState<HeatIntensity>("farmer_count");
  const [countyFilter, setCountyFilter] = useState<string>("all");
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);

  const debounced = useDebouncedValue({ crop, cropType, timeFilter, verifiedOnly, countyFilter }, 250);

  useEffect(() => {
    if (!open) return;
    setCrop((prev) => {
      if (prev && cropOptions.includes(prev)) return prev;
      return cropOptions[0] ?? "Tomatoes";
    });
  }, [open, cropOptions]);

  const planned = useMemo(() => {
    const filtered = members.filter((member) => {
      if (debounced.verifiedOnly && member.status !== "verified") return false;
      if (!inTimeFilter(member.createdAt, debounced.timeFilter)) return false;
      if (debounced.countyFilter !== "all" && (member.county || "").trim() !== debounced.countyFilter) return false;
      if (!debounced.crop) return true;
      return extractMemberCrop(member, debounced.cropType).includes(normalizeCrop(debounced.crop));
    });

    const ranked: PlanItem[] = filtered.map((member) => {
      const quantityEstimate = getProductionEstimate(member);
      const joinedDate = toDate(member.createdAt);
      const ageMonths = joinedDate ? Math.max(1, (Date.now() - joinedDate.getTime()) / (1000 * 60 * 60 * 24 * 30)) : 1;
      const reliability = (member.status === "verified" ? 1.2 : 0.8) + Math.min(0.5, ageMonths / 24);
      const rankScore = quantityEstimate * 0.7 + reliability * 0.3;
      const trend: "up" | "flat" | "down" = ageMonths <= 3 ? "up" : ageMonths <= 8 ? "flat" : "down";
      return { member, quantityEstimate, reliability, rankScore, trend };
    });

    return ranked.sort((a, b) => b.rankScore - a.rankScore);
  }, [members, debounced]);

  const counties = useMemo(
    () =>
      Array.from(
        new Set(planned.map((item) => (item.member.county || "").trim()).values())
      )
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)),
    [planned]
  );

  const wardSuggestions = useMemo(() => {
    const map = new Map<string, number>();
    planned.forEach((item) => {
      const key = `${item.member.county || "Unknown"} / ${item.member.ward || "Unknown"}`;
      map.set(key, (map.get(key) ?? 0) + item.quantityEstimate);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [planned]);

  const estimatedAvailable = useMemo(
    () => planned.reduce((sum, item) => sum + item.quantityEstimate, 0),
    [planned]
  );

  const targetNumber = useMemo(() => Number(targetQty || 0), [targetQty]);
  const coveragePct = useMemo(() => {
    if (!Number.isFinite(targetNumber) || targetNumber <= 0) return 0;
    return (estimatedAvailable / targetNumber) * 100;
  }, [estimatedAvailable, targetNumber]);

  const topList = useMemo(() => {
    const target = Number(targetQty || 0);
    if (!Number.isFinite(target) || target <= 0) return planned.slice(0, 20);
    const out: PlanItem[] = [];
    let sum = 0;
    for (const item of planned) {
      out.push(item);
      sum += item.quantityEstimate;
      if (sum >= target) break;
    }
    return out;
  }, [planned, targetQty]);

  const totalPages = Math.max(1, Math.ceil(planned.length / 10));
  const pagedRows = useMemo(() => planned.slice((page - 1) * 10, page * 10), [planned, page]);

  useEffect(() => {
    setPage(1);
  }, [debounced]);

  const plotted = useMemo(
    () => planned.filter((item) => item.member.lat !== null && item.member.lon !== null),
    [planned]
  );

  const clusterMode = plotted.length > 300 || zoom <= 7;
  const clusters = useMemo(() => {
    if (!clusterMode || viewMode === "list") return [];
    const byKey = new Map<string, { lat: number; lon: number; items: PlanItem[] }>();
    plotted.forEach((item) => {
      const lat = Number(item.member.lat);
      const lon = Number(item.member.lon);
      const key = `${Math.round(lat * 2) / 2}:${Math.round(lon * 2) / 2}`;
      const existing = byKey.get(key);
      if (existing) {
        existing.items.push(item);
      } else {
        byKey.set(key, { lat, lon, items: [item] });
      }
    });
    return Array.from(byKey.values());
  }, [plotted, clusterMode, viewMode]);

  const selectedItems = useMemo(
    () => planned.filter((item) => selectedMemberIds.has(item.member.memberId)),
    [planned, selectedMemberIds]
  );
  const selectedQty = useMemo(
    () => selectedItems.reduce((sum, item) => sum + item.quantityEstimate, 0),
    [selectedItems]
  );

  const toggleSelect = (memberId: string) => {
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) next.delete(memberId);
      else next.add(memberId);
      return next;
    });
  };

  const selectedOrFallback = useMemo(() => {
    if (selectedItems.length > 0) return selectedItems;
    return topList;
  }, [selectedItems, topList]);

  const exportPickupCsv = () => {
    downloadCsv(
      `collection-plan-${Date.now()}.csv`,
      ["memberId", "name", "county", "ward", "crop", "quantityEstimate", "reliability", "deliveryDate"],
      selectedOrFallback.map((item) => [
        item.member.memberId,
        item.member.name,
        item.member.county,
        item.member.ward,
        crop,
        item.quantityEstimate.toFixed(2),
        item.reliability.toFixed(2),
        deliveryDate || "",
      ])
    );
  };

  const generatePickupPlan = () => {
    if (selectedOrFallback.length === 0) {
      toast.warning("No eligible members available for this plan.");
      return;
    }
    const qty = selectedOrFallback.reduce((sum, item) => sum + item.quantityEstimate, 0);
    if (targetNumber > 0 && qty < targetNumber) {
      toast.warning(`Only ${qty.toFixed(1)} kg available. Suggest expanding radius.`);
    } else {
      toast.success(`Pickup plan generated for ${selectedOrFallback.length} member(s).`);
    }
  };

  const placeholderAction = (label: string) => toast.info(`${label} coming soon.`);

  const filterBar = (
    <div className="rounded-xl border border-border/60 bg-background p-3 shadow-sm">
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">What to collect</p>
          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <div>
              <Label className="text-xs flex items-center gap-1"><Leaf className="h-3 w-3" />Crop</Label>
              <Select value={crop} onValueChange={setCrop}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {cropOptions.length === 0 ? (
                    <SelectItem value="Tomatoes">Tomatoes</SelectItem>
                  ) : (
                    cropOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs flex items-center gap-1"><Target className="h-3 w-3" />Target (kg)</Label>
              <Input value={targetQty} onChange={(event) => setTargetQty(event.target.value)} />
            </div>
            <div>
              <Label className="text-xs flex items-center gap-1"><CalendarDays className="h-3 w-3" />Delivery</Label>
              <Input type="date" value={deliveryDate} onChange={(event) => setDeliveryDate(event.target.value)} />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">How to analyze</p>
          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <div>
              <Label className="text-xs flex items-center gap-1"><SlidersHorizontal className="h-3 w-3" />Mode</Label>
              <Select value={viewMode} onValueChange={(value) => setViewMode(value as CollectionPlannerViewMode)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="heatmap">Heatmap</SelectItem>
                  <SelectItem value="list">List</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Crop type</Label>
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
              <Label className="text-xs">Time filter</Label>
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
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">Trust filters</p>
          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <div className="rounded-md border border-border/60 p-2">
              <Label className="text-xs">Verified only</Label>
              <div className="mt-1">
                <Switch checked={verifiedOnly} onCheckedChange={setVerifiedOnly} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Heat intensity</Label>
              <Select value={heatIntensity} onValueChange={(value) => setHeatIntensity(value as HeatIntensity)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="farmer_count">Farmer count</SelectItem>
                  <SelectItem value="estimated_production">Estimated production</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs flex items-center gap-1"><Filter className="h-3 w-3" />County</Label>
              <Select value={countyFilter} onValueChange={setCountyFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All counties</SelectItem>
                  {counties.map((county) => (
                    <SelectItem key={county} value={county}>{county}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[min(96vw,1400px)] h-[88vh] overflow-hidden p-0 flex flex-col">
        <DialogHeader className="border-b border-border/60 px-6 py-4 shrink-0">
          <DialogTitle>Plan Collection / Aggregation Planner</DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 min-h-0 flex-col px-6 py-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-border/60 bg-white p-4 shadow-sm">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Target className="h-3.5 w-3.5 text-primary" />Target Qty</p>
              <p className="text-2xl font-semibold">{Number.isFinite(targetNumber) ? targetNumber.toLocaleString() : "--"} <span className="text-sm">kg</span></p>
            </div>
            <div className="rounded-xl border border-border/60 bg-white p-4 shadow-sm">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Package className="h-3.5 w-3.5 text-primary" />Estimated Available</p>
              <p className="text-2xl font-semibold">{estimatedAvailable.toFixed(0)} <span className="text-sm">kg</span></p>
            </div>
            <div className="rounded-xl border border-border/60 bg-white p-4 shadow-sm">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-primary" />Coverage</p>
              <p className="text-2xl font-semibold">{coveragePct.toFixed(1)}%</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-white p-4 shadow-sm">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-primary" />Priority Zones</p>
              <p className="text-2xl font-semibold">{wardSuggestions.length}</p>
            </div>
          </div>

          <div className="mt-4 hidden md:block">{filterBar}</div>
          <div className="mt-4 md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full"><Filter className="h-4 w-4 mr-2" />Filters</Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[75vh] overflow-auto">
                <SheetHeader>
                  <SheetTitle>Planner Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-3">{filterBar}</div>
              </SheetContent>
            </Sheet>
          </div>

          {planned.length === 0 ? (
            <div className="mt-4 rounded border border-border/60 p-4 text-sm text-muted-foreground">
              No matching member data yet. Tips: ensure members are verified, mapped to coordinates, and crops are captured.
            </div>
          ) : (
            <div className="mt-4 grid min-h-0 flex-1 gap-4 lg:grid-cols-[1.55fr,1fr]">
              <div className="min-h-[300px] lg:min-h-0 rounded-xl border border-border/60 overflow-hidden bg-muted/10">
                <MapContainer center={KENYA_CENTER} zoom={DEFAULT_ZOOM} scrollWheelZoom className="h-full w-full">
                  <MapResizer />
                  <ZoomWatcher onZoom={setZoom} />
                  <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                  {viewMode === "heatmap" && plotted.map((item) => {
                    const weight = heatIntensity === "estimated_production" ? item.quantityEstimate : 1;
                    return (
                      <Circle
                        key={`heat-${item.member.memberId}`}
                        center={[Number(item.member.lat), Number(item.member.lon)]}
                        radius={Math.max(2000, 4500 + weight * 100)}
                        pathOptions={{
                          color: "#ef4444",
                          fillColor: "#ef4444",
                          weight: 0,
                          fillOpacity: Math.min(0.3, 0.08 + Math.min(weight, 8) * 0.02),
                        }}
                      />
                    );
                  })}

                  {viewMode === "list" && clusterMode && clusters.map((cluster) => (
                    <Marker key={`${cluster.lat}-${cluster.lon}`} position={[cluster.lat, cluster.lon]} icon={clusterIcon(cluster.items.length)}>
                      <Popup>
                        <p className="text-sm font-medium">{cluster.items.length} members</p>
                      </Popup>
                    </Marker>
                  ))}

                  {viewMode === "list" && !clusterMode && plotted.map((item) => (
                    <CircleMarker
                      key={item.member.memberId}
                      center={[Number(item.member.lat), Number(item.member.lon)]}
                      radius={6}
                      pathOptions={{
                        color: item.reliability >= 1.4 ? "#15803d" : item.reliability >= 1.1 ? "#d97706" : "#dc2626",
                        fillColor: item.reliability >= 1.4 ? "#22c55e" : item.reliability >= 1.1 ? "#f59e0b" : "#ef4444",
                        fillOpacity: 0.75,
                        weight: 1,
                      }}
                    >
                      <Popup>
                        <div className="space-y-1 text-xs min-w-[190px]">
                          <p className="font-semibold">{item.member.name || item.member.memberId}</p>
                          <p>Crops: {[...item.member.mainCrops, ...item.member.secondaryCrops].join(", ") || "N/A"}</p>
                          <p>Est. Qty: {item.quantityEstimate.toFixed(1)} kg</p>
                          <p>Reliability: {item.reliability.toFixed(2)}</p>
                          <Button size="sm" variant="outline" className="w-full" onClick={() => placeholderAction("Contact cooperative")}>
                            <PhoneCall className="h-3 w-3 mr-1" />Contact cooperative
                          </Button>
                        </div>
                      </Popup>
                    </CircleMarker>
                  ))}
                </MapContainer>
              </div>

              <div className="min-h-0 rounded-xl border border-border/60 flex flex-col bg-background">
                <div className="hidden md:block min-h-0 flex-1 overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10 bg-background border-b border-border/60">
                      <tr>
                        <th className="p-2 text-left">Member</th>
                        <th className="p-2 text-left">Location</th>
                        <th className="p-2 text-left">Crop</th>
                        <th className="p-2 text-left">Qty Est</th>
                        <th className="p-2 text-left">Reliability</th>
                        <th className="p-2 text-left">Distance</th>
                        <th className="p-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedRows.map((item) => (
                        <tr key={item.member.memberId} className="border-b border-border/40">
                          <td className="p-2">{item.member.name}</td>
                          <td className="p-2">{item.member.county || "N/A"} / {item.member.ward || "N/A"}</td>
                          <td className="p-2">{crop}</td>
                          <td className="p-2">{item.quantityEstimate.toFixed(1)} kg <span className="text-muted-foreground">{trendArrow(item.trend)}</span></td>
                          <td className="p-2"><Badge className={reliabilityTone(item.reliability)}>{item.reliability.toFixed(2)}</Badge></td>
                          <td className="p-2">N/A</td>
                          <td className="p-2">
                            <div className="flex justify-end gap-1">
                              <Button size="sm" variant={selectedMemberIds.has(item.member.memberId) ? "default" : "outline"} onClick={() => toggleSelect(item.member.memberId)}>
                                {selectedMemberIds.has(item.member.memberId) ? "Added" : "Add to Plan"}
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => placeholderAction("Contact")}>Contact</Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="md:hidden min-h-0 flex-1 overflow-auto space-y-2 p-3">
                  {pagedRows.map((item) => (
                    <div key={item.member.memberId} className="rounded-lg border border-border/60 p-2 text-sm">
                      <p className="font-medium">{item.member.name}</p>
                      <p className="text-xs text-muted-foreground">{item.member.county || "N/A"} / {item.member.ward || "N/A"}</p>
                      <p className="text-xs mt-1">Qty {item.quantityEstimate.toFixed(1)}kg • Reliability {item.reliability.toFixed(2)}</p>
                      <div className="mt-2 flex gap-2">
                        <Button size="sm" variant={selectedMemberIds.has(item.member.memberId) ? "default" : "outline"} onClick={() => toggleSelect(item.member.memberId)}>
                          {selectedMemberIds.has(item.member.memberId) ? "Added" : "Add to Plan"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => placeholderAction("Contact")}>Contact</Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border/60 p-3 flex items-center justify-between text-xs">
                  <span>Page {page} of {totalPages}</span>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
                    <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 sticky bottom-0 rounded-xl border border-border/60 bg-background p-3 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="text-sm">
                <p className="font-medium">
                  Selected Members: {selectedItems.length} • Total Qty: {selectedQty.toFixed(1)} kg
                </p>
                <p className="text-xs text-muted-foreground">
                  {targetNumber > 0 && selectedQty < targetNumber
                    ? `Only ${selectedQty.toFixed(1)}kg available. Suggest expanding radius.`
                    : "Ready to generate pickup plan."}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={generatePickupPlan}>
                  <Sparkles className="h-4 w-4 mr-1" />Generate Pickup Plan
                </Button>
                <Button variant="outline" onClick={exportPickupCsv}>
                  <Package className="h-4 w-4 mr-1" />Download CSV
                </Button>
                <Button variant="outline" onClick={() => placeholderAction("Share Plan")}>
                  <Share2 className="h-4 w-4 mr-1" />Share Plan
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
