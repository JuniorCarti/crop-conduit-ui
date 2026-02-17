import { useEffect, useMemo, useState } from "react";
import type { MemberMapPoint } from "@/hooks/useMemberMapData";
import { fetchForecast } from "@/services/weatherProxyService";
import centroids from "@/data/kenya_centroids.json";

export type RiskZone = {
  county: string;
  level: "low" | "medium" | "high";
  score: number;
  lat: number;
  lon: number;
};

const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, { at: number; risk: RiskZone }>();

const normalizedCentroids = (centroids as any)?.counties ?? {};

const normalize = (value: string) => value.trim().toLowerCase();

const computeRisk = (forecast: any) => {
  const days = forecast?.forecast?.forecastday ?? [];
  if (!days.length) return { score: 0, level: "low" as const };
  const rainRisk = days.reduce((sum: number, day: any) => sum + Number(day?.day?.daily_chance_of_rain ?? 0), 0) / days.length;
  const precipTotal = days.reduce((sum: number, day: any) => sum + Number(day?.day?.totalprecip_mm ?? 0), 0);
  const avgTemp = days.reduce((sum: number, day: any) => sum + Number(day?.day?.maxtemp_c ?? 0), 0) / days.length;

  let score = 0;
  if (rainRisk >= 65 || precipTotal >= 40) score += 50;
  else if (rainRisk >= 35 || precipTotal >= 20) score += 30;

  if (precipTotal < 8 && avgTemp >= 30) score += 35;
  else if (precipTotal < 15 && avgTemp >= 27) score += 20;

  if (score >= 65) return { score, level: "high" as const };
  if (score >= 35) return { score, level: "medium" as const };
  return { score, level: "low" as const };
};

export function useRiskOverlay(params: { enabled: boolean; filteredMembers: MemberMapPoint[] }) {
  const { enabled, filteredMembers } = params;
  const [loading, setLoading] = useState(false);
  const [zones, setZones] = useState<RiskZone[]>([]);

  const counties = useMemo(() => {
    const unique = new Set<string>();
    filteredMembers.forEach((m) => {
      const county = String(m.county || "").trim();
      if (county) unique.add(county);
    });
    return Array.from(unique);
  }, [filteredMembers]);

  useEffect(() => {
    if (!enabled || !counties.length) {
      setZones([]);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    Promise.all(
      counties.map(async (county) => {
        const key = normalize(county);
        const coords = normalizedCentroids[key];
        if (!coords?.lat || !coords?.lon) return null;

        const cacheKey = `${key}:7d`;
        const cached = cache.get(cacheKey);
        if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.risk;

        try {
          const forecast = await fetchForecast({ lat: Number(coords.lat), lon: Number(coords.lon), days: 7 });
          const risk = computeRisk(forecast);
          const zone: RiskZone = {
            county,
            level: risk.level,
            score: risk.score,
            lat: Number(coords.lat),
            lon: Number(coords.lon),
          };
          cache.set(cacheKey, { at: Date.now(), risk: zone });
          return zone;
        } catch {
          return null;
        }
      })
    )
      .then((rows) => {
        if (!active) return;
        setZones(rows.filter(Boolean) as RiskZone[]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [enabled, counties]);

  const zoneMap = useMemo(() => {
    const map = new Map<string, RiskZone>();
    zones.forEach((zone) => map.set(normalize(zone.county), zone));
    return map;
  }, [zones]);

  return { loading, zones, zoneMap };
}
