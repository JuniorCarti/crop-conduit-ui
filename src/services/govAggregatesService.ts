import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  where,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type GovSummaryDoc = {
  totalCooperatives?: number;
  totalVerifiedFarmers?: number;
  totalActiveSeats?: number;
  topCounties?: Array<{ county: string; verifiedFarmers: number }>;
  todayRisks?: Array<{ title: string; severity: "low" | "medium" | "high" }>;
  verifiedFarmersTrend?: Array<{ month: string; value: number }>;
  seatUsageTrend?: Array<{ month: string; paid: number; sponsored: number }>;
  countyHeatmap?: Array<{ county: string; score: number }>;
};

export type GovStatsDoc = {
  membership?: { active: number; pending: number; suspended: number };
  seats?: { paidUsed: number; paidTotal: number; sponsoredUsed: number; sponsoredTotal: number };
  trainings?: { total: number; attendance: number; completionRate: number };
  marketplace?: { listings: number; transactions: number };
  monthlyVerified?: Array<{ month: string; value: number }>;
  monthlyTrainingAttendance?: Array<{ month: string; value: number }>;
  adoptionGrowth?: Array<{ month: string; value: number }>;
};

const EMPTY_ARRAY: any[] = [];

const asArray = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : EMPTY_ARRAY as T[]);

async function getGovDoc<T>(path: string[]): Promise<T | null> {
  const snap = await getDoc(doc(db, ...path));
  if (!snap.exists()) return null;
  return snap.data() as T;
}

export async function getNationalSummary() {
  return getGovDoc<GovSummaryDoc>(["govAggregates", "national", "summary"]);
}

export async function getNationalStats() {
  return getGovDoc<GovStatsDoc>(["govAggregates", "national", "stats"]);
}

export async function getNationalClimateSummary() {
  return getGovDoc<Record<string, any>>(["govAggregates", "national", "climateSummary"]);
}

export async function getNationalFoodSecurity() {
  return getGovDoc<Record<string, any>>(["govAggregates", "national", "foodSecurity"]);
}

export async function listCountiesClimate() {
  const snap = await getDocs(collection(db, "govAggregates", "counties", "items"));
  return snap.docs.map((item) => ({ id: item.id, ...(item.data() as DocumentData) }));
}

export async function listCoopsIndex() {
  const snap = await getDocs(query(collection(db, "govAggregates", "national", "coopsIndex"), orderBy("verifiedFarmers", "desc")));
  return snap.docs.map((item) => ({ id: item.id, ...(item.data() as DocumentData) }));
}

export async function getCoopSummary(orgId: string) {
  return getGovDoc<Record<string, any>>(["govAggregates", "coops", orgId, "summary"]);
}

export async function listValueChains() {
  const snap = await getDocs(collection(db, "govAggregates", "national", "valueChains"));
  return snap.docs.map((item) => ({ id: item.id, ...(item.data() as DocumentData) }));
}

export async function getMarketSnapshot(params: { commodity: string; countyId?: string | null }) {
  const basePath = params.countyId
    ? ["govAggregates", "counties", params.countyId, "markets", params.commodity]
    : ["govAggregates", "markets", params.commodity];
  return getGovDoc<Record<string, any>>(basePath);
}

export async function listGovReports() {
  const snap = await getDocs(query(collection(db, "govAggregates", "reports", "items"), orderBy("createdAt", "desc")));
  return snap.docs.map((item) => ({ id: item.id, ...(item.data() as DocumentData) }));
}

export async function createGovReport(params: {
  type: "national_summary" | "county_summary" | "market_trend" | "climate_risk";
  filters?: Record<string, unknown>;
  createdByUid: string;
}) {
  return addDoc(collection(db, "govAggregates", "reports", "items"), {
    type: params.type,
    filters: params.filters ?? {},
    createdByUid: params.createdByUid,
    createdAt: serverTimestamp(),
    status: "generated",
  });
}

export async function listGovAlerts() {
  const snap = await getDocs(query(collection(db, "govAggregates", "alerts"), orderBy("createdAt", "desc")));
  return snap.docs.map((item) => ({ id: item.id, ...(item.data() as DocumentData) }));
}

export async function createGovAlert(params: {
  type: "climate" | "market" | "disease";
  severity: "low" | "medium" | "high";
  title: string;
  message: string;
  countiesAffected: string[];
  createdBy: string;
}) {
  return addDoc(collection(db, "govAggregates", "alerts"), {
    type: params.type,
    severity: params.severity,
    title: params.title,
    message: params.message,
    countiesAffected: params.countiesAffected,
    createdBy: params.createdBy,
    createdAt: serverTimestamp(),
  });
}

export async function listGovernmentTeam(orgId: string) {
  const snap = await getDocs(
    query(collection(db, "orgs", orgId, "members"), where("role", "in", ["gov_admin", "gov_analyst", "gov_viewer", "org_staff", "org_admin"]))
  );
  return snap.docs.map((item) => ({ id: item.id, ...(item.data() as DocumentData) }));
}

export function safeArray<T>(value: unknown): T[] {
  return asArray<T>(value);
}
