import { useMemo } from "react";
import type { MemberMapPoint } from "@/hooks/useMemberMapData";

export type CropTypeFilter = "main" | "secondary" | "both";
export type MapMode = "heatmap" | "dots" | "county";
export type TimeFilter = "all" | "last_3_months" | "this_season" | "last_year";
export type HeatIntensity = "farmer_count" | "estimated_production";

export type ClusterPoint = {
  lat: number;
  lon: number;
  count: number;
  members: MemberMapPoint[];
};

const cropFactors: Record<string, number> = {
  tomatoes: 1.0,
  cabbage: 0.8,
  kale: 0.7,
  maize: 0.6,
  beans: 0.5,
  onion: 0.9,
};

export const normalizeCrop = (value: string) => value.trim().toLowerCase();

export const extractMemberCrop = (member: MemberMapPoint, cropType: CropTypeFilter) => {
  const main = member.mainCrops.map(normalizeCrop);
  const secondary = member.secondaryCrops.map(normalizeCrop);
  if (cropType === "main") return main;
  if (cropType === "secondary") return secondary;
  return Array.from(new Set([...main, ...secondary]));
};

export const toDate = (value: any): Date | null => {
  if (!value) return null;
  const date = value?.toDate?.() ?? new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatDate = (value: any) => {
  const date = toDate(value);
  return date ? date.toLocaleDateString() : "N/A";
};

export const inTimeFilter = (dateValue: any, filter: TimeFilter) => {
  if (filter === "all") return true;
  const date = toDate(dateValue);
  if (!date) return true;
  const now = new Date();
  if (filter === "last_3_months") {
    const threshold = new Date();
    threshold.setMonth(threshold.getMonth() - 3);
    return date >= threshold;
  }
  if (filter === "last_year") {
    const threshold = new Date();
    threshold.setFullYear(threshold.getFullYear() - 1);
    return date >= threshold;
  }
  const quarter = Math.floor(now.getMonth() / 3);
  const quarterStart = new Date(now.getFullYear(), quarter * 3, 1);
  return date >= quarterStart;
};

export const getProductionEstimate = (member: MemberMapPoint) => {
  const directEstimate = Number((member as any).seasonalProductionEstimate ?? (member as any).productionEstimate ?? 0);
  if (Number.isFinite(directEstimate) && directEstimate > 0) return directEstimate;
  const farmSize = Number(member.farmSizeAcres ?? 0);
  if (!Number.isFinite(farmSize) || farmSize <= 0) return 1;
  const crop = normalizeCrop(member.mainCrops[0] || member.secondaryCrops[0] || "");
  const factor = cropFactors[crop] ?? 0.4;
  return Math.max(1, farmSize * factor);
};

export const getReadiness = (member: MemberMapPoint) => {
  const harvestDate = toDate((member as any).expectedHarvestDate ?? (member as any).harvestDate);
  if (!harvestDate) return "Unknown";
  const now = Date.now();
  const diffDays = Math.ceil((harvestDate.getTime() - now) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "Ready";
  if (diffDays <= 90) return "Growing";
  return "Off-season";
};

export const getTopCrops = (rows: MemberMapPoint[], key: "mainCrops" | "secondaryCrops") => {
  const counts: Record<string, number> = {};
  rows.forEach((row) => {
    row[key].forEach((crop) => {
      const value = crop.trim();
      if (!value) return;
      counts[value] = (counts[value] ?? 0) + 1;
    });
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([crop]) => crop);
};

export function useMapPlanningData(params: {
  members: MemberMapPoint[];
  cropFilter: string;
  cropType: CropTypeFilter;
  verifiedOnly: boolean;
  timeFilter: TimeFilter;
  mapMode: MapMode;
  zoom: number;
}) {
  const { members, cropFilter, cropType, verifiedOnly, timeFilter, mapMode, zoom } = params;

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

  const filteredMembers = useMemo(
    () =>
      members.filter((member) => {
        if (verifiedOnly && member.status !== "verified") return false;
        if (!inTimeFilter(member.createdAt, timeFilter)) return false;
        if (cropFilter === "all") return true;
        return extractMemberCrop(member, cropType).includes(normalizeCrop(cropFilter));
      }),
    [members, cropFilter, cropType, verifiedOnly, timeFilter]
  );

  const plottedMembers = useMemo(
    () => filteredMembers.filter((member) => member.lat !== null && member.lon !== null),
    [filteredMembers]
  );

  const countyAggregates = useMemo(() => {
    const map = new Map<string, MemberMapPoint[]>();
    filteredMembers.forEach((member) => {
      const key = (member.county || "Unknown").trim() || "Unknown";
      const existing = map.get(key);
      if (existing) {
        existing.push(member);
      } else {
        map.set(key, [member]);
      }
    });
    return map;
  }, [filteredMembers]);

  const maxCountyCount = useMemo(() => {
    const counts = Array.from(countyAggregates.values()).map((rows) => rows.length);
    return counts.length ? Math.max(...counts) : 0;
  }, [countyAggregates]);

  const clusterMode = plottedMembers.length > 3000 || zoom <= 7;

  const clusters = useMemo<ClusterPoint[]>(() => {
    if (!clusterMode || mapMode !== "dots") return [];
    const byKey = new Map<string, ClusterPoint>();
    plottedMembers.forEach((member) => {
      const lat = Number(member.lat);
      const lon = Number(member.lon);
      const key = `${Math.round(lat * 2) / 2}:${Math.round(lon * 2) / 2}`;
      const entry = byKey.get(key);
      if (!entry) {
        byKey.set(key, { lat, lon, count: 1, members: [member] });
        return;
      }
      entry.count += 1;
      entry.members.push(member);
    });
    return Array.from(byKey.values());
  }, [clusterMode, plottedMembers, mapMode]);

  return {
    cropOptions,
    filteredMembers,
    plottedMembers,
    countyAggregates,
    maxCountyCount,
    clusterMode,
    clusters,
  };
}
