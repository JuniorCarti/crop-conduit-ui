import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import kenyaCentroids from "@/data/kenya_centroids.json";

export type MemberMapStatus = "verified" | "pending" | "other";

export type MemberMapPoint = {
  memberId: string;
  name: string;
  status: MemberMapStatus;
  county: string;
  ward: string;
  lat: number | null;
  lon: number | null;
  mainCrops: string[];
  secondaryCrops: string[];
  farmSizeAcres?: number | null;
  createdAt?: any;
};

type CountyCentroid = {
  lat: number;
  lon: number;
  wards?: Record<string, { lat: number; lon: number }>;
};

type CentroidData = {
  counties: Record<string, CountyCentroid>;
};

const centroidData = kenyaCentroids as CentroidData;

const toNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const normalizeName = (value: unknown) => String(value || "").trim().toLowerCase();

const asArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.filter((item) => typeof item === "string" && item.trim()).map((item) => item.trim());
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
};

const deriveStatus = (member: any): MemberMapStatus => {
  const raw = String(member?.status ?? member?.verificationStatus ?? "").toLowerCase();
  if (["active", "approved", "verified"].includes(raw)) return "verified";
  if (["submitted", "pending", "draft"].includes(raw)) return "pending";
  return "other";
};

const resolveFallbackCoords = (county: string, ward: string) => {
  const countyEntry = centroidData.counties[normalizeName(county)];
  if (!countyEntry) return { lat: null, lon: null };
  if (ward && countyEntry.wards) {
    const wardEntry = countyEntry.wards[normalizeName(ward)];
    if (wardEntry) return wardEntry;
  }
  return { lat: countyEntry.lat, lon: countyEntry.lon };
};

const resolveCoords = (member: any, county: string, ward: string) => {
  const lat =
    toNumber(member?.lat) ??
    toNumber(member?.latitude) ??
    toNumber(member?.location?.lat) ??
    toNumber(member?.farmLocation?.lat);
  const lon =
    toNumber(member?.lon) ??
    toNumber(member?.lng) ??
    toNumber(member?.longitude) ??
    toNumber(member?.location?.lng) ??
    toNumber(member?.location?.lon) ??
    toNumber(member?.farmLocation?.lng) ??
    toNumber(member?.farmLocation?.lon);
  if (lat !== null && lon !== null) return { lat, lon };
  return resolveFallbackCoords(county, ward);
};

export function useMemberMapData(orgId: string) {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<MemberMapPoint[]>([]);

  useEffect(() => {
    if (!orgId) {
      setRows([]);
      return;
    }
    let mounted = true;
    setLoading(true);

    getDocs(collection(db, "orgs", orgId, "members"))
      .then((snap) => {
        if (!mounted) return;
        const nextRows = snap.docs.map((docSnap) => {
          const member = docSnap.data() as any;
          const county = String(member?.county ?? member?.location?.county ?? "").trim();
          const ward = String(member?.ward ?? member?.location?.ward ?? "").trim();
          const coords = resolveCoords(member, county, ward);
          return {
            memberId: docSnap.id,
            name:
              member?.fullName ||
              member?.name ||
              member?.displayName ||
              member?.memberUniqueId ||
              `Member ${docSnap.id.slice(0, 6)}`,
            status: deriveStatus(member),
            county,
            ward,
            lat: coords.lat,
            lon: coords.lon,
            mainCrops: asArray(member?.mainCrops),
            secondaryCrops: asArray(member?.secondaryCrops),
            farmSizeAcres: toNumber(member?.farmSizeAcres),
            createdAt: member?.createdAt ?? member?.joinedAt ?? null,
          } as MemberMapPoint;
        });
        setRows(nextRows);
      })
      .catch(() => {
        if (mounted) setRows([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [orgId]);

  const stats = useMemo(() => {
    const verifiedRows = rows.filter((row) => row.status === "verified");
    const countBy = (items: string[]) =>
      items.reduce<Record<string, number>>((acc, item) => {
        const key = item.trim();
        if (!key) return acc;
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {});
    const topOf = (map: Record<string, number>) =>
      Object.entries(map)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name]) => name);

    const countyCounts = verifiedRows.reduce<Record<string, number>>((acc, row) => {
      if (!row.county) return acc;
      acc[row.county] = (acc[row.county] ?? 0) + 1;
      return acc;
    }, {});
    const mostActiveCounty = Object.entries(countyCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "--";

    return {
      totalOnboarded: rows.length,
      topMainCrops: topOf(countBy(verifiedRows.flatMap((row) => row.mainCrops))),
      topSecondaryCrops: topOf(countBy(verifiedRows.flatMap((row) => row.secondaryCrops))),
      mostActiveCounty,
    };
  }, [rows]);

  return {
    loading,
    members: rows,
    stats,
  };
}

