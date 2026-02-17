import { auth } from "@/lib/firebase";

export type IntlPolicyShock = "none" | "tariff increase" | "tariff removal" | "border delays";
export type IntlSeasonFactor = "in-season" | "shoulder" | "off-season";

export type IntlSimulationInput = {
  orgId: string;
  crop: string;
  market: string;
  horizonWeeks: 2 | 4 | 6;
  localPriceKESPerKg: number;
  importPressure: number;
  fxShockPercent: number;
  importShockEvent: boolean;
  policyShock: IntlPolicyShock;
  seasonFactor: IntlSeasonFactor;
};

export type IntlSimulationResult = {
  localPriceKESPerKg: number;
  projectedMin: number;
  projectedMid: number;
  projectedMax: number;
  direction: "up" | "down" | "flat";
  volatilityScore: number;
  importPressure: number;
  importPressureLabel: "Low" | "Medium" | "High";
  fxShockPercent: number;
  policyShock: IntlPolicyShock;
  seasonFactor: IntlSeasonFactor;
  shockOn: boolean;
  horizonWeeks: 2 | 4 | 6;
  confidence: "Low" | "Medium" | "High";
  drivers: string[];
  recommendations: string[];
  timeline: Array<{ label: string; min: number; mid: number; max: number }>;
  currency: "KES";
};

export type IntlScenario = {
  orgId: string;
  scenarioId: string;
  name: string;
  crop: string;
  market: string;
  horizonWeeks: number;
  importPressure: number;
  fxShockPercent: number;
  policyShock: IntlPolicyShock;
  seasonFactor: IntlSeasonFactor;
  importShockEvent: boolean;
  projectedMid: number;
  localPriceKESPerKg: number;
  result: IntlSimulationResult;
  createdAt: string;
  createdByUid: string;
};

const resolveBaseUrl = () => {
  const primary = import.meta.env.VITE_ASHA_API_BASE_URL as string | undefined;
  const fallback = import.meta.env.VITE_COMMUNITY_API_BASE_URL as string | undefined;
  const value = (primary || fallback || "").trim();
  if (!value) {
    throw new Error("Intl simulation API base URL is not configured.");
  }
  return value.replace(/\/$/, "");
};

const getAuthHeaders = async (extra?: Record<string, string>) => {
  const token = await auth.currentUser?.getIdToken();
  if (!token) {
    throw new Error("Authentication required.");
  }
  return {
    Authorization: `Bearer ${token}`,
    ...(extra || {}),
  };
};

const parseJson = async (response: Response) => {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { message: text || "Unexpected response" };
  }
};

const parseError = (payload: any, fallback: string) =>
  payload?.error || payload?.message || fallback;

export async function runIntlSimulation(input: IntlSimulationInput): Promise<IntlSimulationResult> {
  const response = await fetch(`${resolveBaseUrl()}/intl/simulate`, {
    method: "POST",
    headers: await getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(input),
  });
  const data = await parseJson(response);
  if (!response.ok || data?.ok === false || !data?.result) {
    throw new Error(parseError(data, "Simulation failed."));
  }
  return data.result as IntlSimulationResult;
}

export async function listIntlScenarios(orgId: string): Promise<IntlScenario[]> {
  const response = await fetch(`${resolveBaseUrl()}/intl/scenarios?orgId=${encodeURIComponent(orgId)}`, {
    method: "GET",
    headers: await getAuthHeaders(),
  });
  const data = await parseJson(response);
  if (!response.ok || data?.ok === false) {
    throw new Error(parseError(data, "Failed to load scenarios."));
  }
  return Array.isArray(data?.items) ? (data.items as IntlScenario[]) : [];
}

export async function saveIntlScenario(payload: {
  orgId: string;
  name: string;
  crop: string;
  market: string;
  horizonWeeks: number;
  importPressure: number;
  fxShockPercent: number;
  policyShock: IntlPolicyShock;
  seasonFactor: IntlSeasonFactor;
  importShockEvent: boolean;
  result: IntlSimulationResult;
}): Promise<IntlScenario> {
  const response = await fetch(`${resolveBaseUrl()}/intl/scenarios`, {
    method: "POST",
    headers: await getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  const data = await parseJson(response);
  if (!response.ok || data?.ok === false || !data?.item) {
    throw new Error(parseError(data, "Failed to save scenario."));
  }
  return data.item as IntlScenario;
}

export async function deleteIntlScenario(orgId: string, scenarioId: string): Promise<void> {
  const response = await fetch(
    `${resolveBaseUrl()}/intl/scenarios/${encodeURIComponent(scenarioId)}?orgId=${encodeURIComponent(orgId)}`,
    {
      method: "DELETE",
      headers: await getAuthHeaders(),
    }
  );
  const data = await parseJson(response);
  if (!response.ok || data?.ok === false) {
    throw new Error(parseError(data, "Failed to delete scenario."));
  }
}
