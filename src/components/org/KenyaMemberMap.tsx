import { useEffect, useMemo, useState } from "react";
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
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { useMemberMapData, type MemberMapPoint } from "@/hooks/useMemberMapData";
import KenyaMemberMapAdvanced from "@/components/coopMapAdvanced/KenyaMemberMapAdvanced";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const KENYA_CENTER: LatLngTuple = [-0.0236, 37.9062];
const DEFAULT_ZOOM = 6;

type CropTypeFilter = "main" | "secondary" | "both";
type MapMode = "dots" | "heatmap";

const getCropColor = (crop: string) => {
  const normalized = crop.toLowerCase();
  if (normalized.includes("maize")) return "#2f855a";
  if (normalized.includes("tomato")) return "#c53030";
  if (normalized.includes("cabbage")) return "#2d6a4f";
  if (normalized.includes("kale") || normalized.includes("sukuma")) return "#1b4332";
  if (normalized.includes("beans")) return "#6b46c1";
  return "#2563eb";
};

const formatDate = (value: any) => {
  const date = value?.toDate?.() ?? (value ? new Date(value) : null);
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString() : "--";
};

const ZoomWatcher = ({ onZoom }: { onZoom: (zoom: number) => void }) => {
  useMapEvents({
    zoomend: (event) => onZoom(event.target.getZoom()),
  });
  return null;
};

const MapResizer = () => {
  const map = useMap();
  useEffect(() => {
    const timer = window.setTimeout(() => {
      map.invalidateSize();
    }, 150);
    return () => window.clearTimeout(timer);
  }, [map]);
  return null;
};

const useDebouncedValue = <T,>(value: T, delayMs: number) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
};

const normalizeCrop = (value: string) => value.trim().toLowerCase();
const toTitle = (value: string) => {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const extractMemberCrop = (member: MemberMapPoint, cropType: CropTypeFilter) => {
  const main = member.mainCrops.map(normalizeCrop);
  const secondary = member.secondaryCrops.map(normalizeCrop);
  if (cropType === "main") return main;
  if (cropType === "secondary") return secondary;
  return Array.from(new Set([...main, ...secondary]));
};

const buildClusterIcon = (count: number) =>
  L.divIcon({
    className: "kenya-member-cluster-icon",
    html: `<div style="background:#0f766e;color:#fff;border-radius:9999px;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-weight:700;box-shadow:0 1px 8px rgba(0,0,0,.25);">${count}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });

export default function KenyaMemberMap({ orgId }: { orgId: string }) {
  const advancedEnabled =
    String((import.meta as any).env?.VITE_ENABLE_KENYA_MEMBER_MAP_ADVANCED ?? "false").toLowerCase() === "true";
  if (advancedEnabled) {
    return <KenyaMemberMapAdvanced orgId={orgId} />;
  }
  const navigate = useNavigate();
  const { loading, members, stats } = useMemberMapData(orgId);
  const [mapMode, setMapMode] = useState<MapMode>("dots");
  const [cropFilter, setCropFilter] = useState("all");
  const [cropType, setCropType] = useState<CropTypeFilter>("both");
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const debouncedFilters = useDebouncedValue({ cropFilter, cropType, verifiedOnly }, 250);

  const cropOptions = useMemo(() => {
    const set = new Set<string>();
    members.forEach((member) => {
      [...member.mainCrops, ...member.secondaryCrops].forEach((crop) => {
        const value = crop.trim();
        if (value) set.add(value);
      });
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [members]);

  const filtered = useMemo(() => {
    return members.filter((member) => {
      if (debouncedFilters.verifiedOnly && member.status !== "verified") return false;
      if (member.lat === null || member.lon === null) return false;
      if (debouncedFilters.cropFilter === "all") return true;
      return extractMemberCrop(member, debouncedFilters.cropType).includes(normalizeCrop(debouncedFilters.cropFilter));
    });
  }, [members, debouncedFilters]);

  const clusterMode = filtered.length > 3000 || zoom <= 7;
  const legendItems = useMemo(() => {
    const seen = new Set<string>();
    const items: Array<{ label: string; color: string }> = [];
    filtered.forEach((member) => {
      const crop = (member.mainCrops[0] || member.secondaryCrops[0] || "").trim();
      if (!crop) return;
      const key = normalizeCrop(crop);
      if (seen.has(key)) return;
      seen.add(key);
      items.push({ label: toTitle(crop), color: getCropColor(crop) });
    });
    return items.slice(0, 6);
  }, [filtered]);

  const clusters = useMemo(() => {
    if (!clusterMode || mapMode !== "dots") return [];
    const byKey = new Map<string, { lat: number; lon: number; count: number; sample: MemberMapPoint }>();
    filtered.forEach((member) => {
      const lat = Number(member.lat);
      const lon = Number(member.lon);
      const key = `${Math.round(lat * 2) / 2}:${Math.round(lon * 2) / 2}`;
      const entry = byKey.get(key);
      if (!entry) {
        byKey.set(key, { lat, lon, count: 1, sample: member });
        return;
      }
      entry.count += 1;
    });
    return Array.from(byKey.values());
  }, [clusterMode, filtered, mapMode]);

  const emptyState = !loading && filtered.length === 0;

  return (
    <Card className="border-border/60">
      <CardHeader className="space-y-3">
        <CardTitle>Kenya Member Map</CardTitle>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-xs">
          <div className="rounded border border-border/60 p-2">
            <p className="text-muted-foreground">Total onboarded</p>
            <p className="font-semibold">{stats.totalOnboarded}</p>
          </div>
          <div className="rounded border border-border/60 p-2">
            <p className="text-muted-foreground">Top main crops</p>
            <p className="font-semibold">{stats.topMainCrops.join(", ") || "--"}</p>
          </div>
          <div className="rounded border border-border/60 p-2">
            <p className="text-muted-foreground">Top secondary crops</p>
            <p className="font-semibold">{stats.topSecondaryCrops.join(", ") || "--"}</p>
          </div>
          <div className="rounded border border-border/60 p-2">
            <p className="text-muted-foreground">Most active county</p>
            <p className="font-semibold">{stats.mostActiveCounty}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative z-10 grid gap-3 md:grid-cols-5">
          <div>
            <Label>Mode</Label>
            <Select value={mapMode} onValueChange={(value) => setMapMode(value as MapMode)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="dots">Member dots</SelectItem>
                <SelectItem value="heatmap">Heatmap</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Crop filter</Label>
            <Select value={cropFilter} onValueChange={setCropFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All crops</SelectItem>
                {cropOptions.map((crop) => (
                  <SelectItem key={crop} value={crop}>{crop}</SelectItem>
                ))}
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
          <div className="flex items-end">
            <Button
              variant={verifiedOnly ? "default" : "outline"}
              onClick={() => setVerifiedOnly((prev) => !prev)}
              className="w-full"
            >
              Verified only {verifiedOnly ? "ON" : "OFF"}
            </Button>
          </div>
          <div className="flex items-end">
            <Badge variant="secondary" className="h-9 w-full justify-center">
              Plotted members: {filtered.length}
            </Badge>
          </div>
        </div>

        <div className="relative z-0 h-[470px] rounded-lg border border-border/60 overflow-hidden">
          <MapContainer center={KENYA_CENTER} zoom={DEFAULT_ZOOM} scrollWheelZoom className="h-full w-full">
            <MapResizer />
            <ZoomWatcher onZoom={setZoom} />
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {mapMode === "dots" && clusterMode && clusters.map((cluster) => (
              <Marker
                key={`cluster-${cluster.lat}-${cluster.lon}`}
                position={[cluster.lat, cluster.lon]}
                icon={buildClusterIcon(cluster.count)}
              >
                <Popup>
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">Clustered members: {cluster.count}</p>
                    <p className="text-muted-foreground">{cluster.sample.county || "County unknown"}</p>
                  </div>
                </Popup>
              </Marker>
            ))}

            {mapMode === "dots" && !clusterMode && filtered.map((member) => {
              const lat = Number(member.lat);
              const lon = Number(member.lon);
              const color = getCropColor(member.mainCrops[0] || member.secondaryCrops[0] || "");
              return (
                <CircleMarker
                  key={member.memberId}
                  center={[lat, lon]}
                  radius={6}
                  pathOptions={{ color, fillColor: color, fillOpacity: 0.75, weight: 1 }}
                >
                  <Popup>
                    <div className="space-y-2 text-sm min-w-[220px]">
                      <p className="font-semibold">{member.name || `Member ${member.memberId.slice(0, 6)}`}</p>
                      <p className="text-muted-foreground">{member.county || "--"}{member.ward ? `, ${member.ward}` : ""}</p>
                      <p><span className="text-muted-foreground">Main:</span> {member.mainCrops.join(", ") || "--"}</p>
                      <p><span className="text-muted-foreground">Secondary:</span> {member.secondaryCrops.join(", ") || "--"}</p>
                      <p><span className="text-muted-foreground">Farm size:</span> {member.farmSizeAcres ?? "--"} acres</p>
                      <p><span className="text-muted-foreground">Onboarded:</span> {formatDate(member.createdAt)}</p>
                      <Button size="sm" className="w-full" onClick={() => navigate(`/org/members?memberId=${member.memberId}`)}>
                        View Member Profile
                      </Button>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}

            {mapMode === "heatmap" && filtered.map((member) => {
              const lat = Number(member.lat);
              const lon = Number(member.lon);
              const radius = filtered.length > 3000 ? 7000 : 12000;
              return (
                <Circle
                  key={`heat-${member.memberId}`}
                  center={[lat, lon]}
                  radius={radius}
                  pathOptions={{
                    color: "#ef4444",
                    weight: 0,
                    fillColor: "#ef4444",
                    fillOpacity: 0.12,
                  }}
                />
              );
            })}
          </MapContainer>

          {legendItems.length > 0 && (
            <div className="absolute top-3 right-3 rounded-md border border-border/60 bg-background/95 px-3 py-2 text-xs shadow-sm">
              <p className="font-medium mb-1">Crop Legend</p>
              <div className="space-y-1">
                {legendItems.map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {emptyState && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/55 text-sm text-muted-foreground">
              Members will appear here once onboarded and verified.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
