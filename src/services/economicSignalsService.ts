/**
 * Economic Signals Service
 *
 * Stores external economic indicators (fuel price, exchange rate, inflation)
 * and applies them as adjustment multipliers on top of the Render prediction model output.
 *
 * Architecture:
 *   Render /predict → raw predicted price
 *   + Economic signals layer → adjusted price with explanation
 *
 * The model itself is not retrained. Instead, we compute a composite
 * adjustment factor from real-world economic signals and apply it post-prediction.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EconomicSignal {
  id?: string;
  type: EconomicSignalType;
  label: string;
  value: number;
  unit: string;
  previousValue?: number;
  changePct?: number;
  source: string;
  recordedAt: Date;
  notes?: string;
}

export type EconomicSignalType =
  | "fuel_price_ksh_per_litre"
  | "usd_kes_exchange_rate"
  | "inflation_index"
  | "transport_cost_index"
  | "fertilizer_price_index"
  | "electricity_tariff";

export interface EconomicAdjustment {
  rawPrice: number;
  adjustedPrice: number;
  adjustmentPct: number;
  adjustmentFactor: number;
  drivers: EconomicAdjustmentDriver[];
  confidence: "High" | "Medium" | "Low";
  summary: string;
}

export interface EconomicAdjustmentDriver {
  signal: EconomicSignalType;
  label: string;
  impact: "increase" | "decrease" | "neutral";
  impactPct: number;
  reason: string;
}

export interface EconomicSnapshot {
  signals: EconomicSignal[];
  lastUpdated: Date | null;
  isMockup: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COLLECTION = "economic_signals";

/**
 * Baseline values representing "normal" conditions.
 * Deviations from these baselines drive price adjustments.
 */
const BASELINES: Record<EconomicSignalType, number> = {
  fuel_price_ksh_per_litre:  180,   // KES/litre (Kenya average 2023)
  usd_kes_exchange_rate:     130,   // KES per USD
  inflation_index:           100,   // base index = 100
  transport_cost_index:      100,   // base index = 100
  fertilizer_price_index:    100,   // base index = 100
  electricity_tariff:        25,    // KES per kWh
};

/**
 * Sensitivity coefficients: how much a 1% change in each signal
 * translates to a % change in commodity prices.
 *
 * Based on Kenya agricultural economics research:
 * - Fuel: transport is ~15-25% of farm-gate price → 0.20 sensitivity
 * - Exchange rate: imported inputs (fertilizer, pesticides) → 0.15
 * - Inflation: general cost push → 0.10
 * - Transport cost index: direct pass-through → 0.25
 * - Fertilizer: input cost → 0.12
 * - Electricity: cold chain, processing → 0.05
 */
const SENSITIVITY: Record<EconomicSignalType, number> = {
  fuel_price_ksh_per_litre:  0.20,
  usd_kes_exchange_rate:     0.15,
  inflation_index:           0.10,
  transport_cost_index:      0.25,
  fertilizer_price_index:    0.12,
  electricity_tariff:        0.05,
};

const SIGNAL_LABELS: Record<EconomicSignalType, string> = {
  fuel_price_ksh_per_litre:  "Fuel Price (KES/litre)",
  usd_kes_exchange_rate:     "USD/KES Exchange Rate",
  inflation_index:           "Inflation Index",
  transport_cost_index:      "Transport Cost Index",
  fertilizer_price_index:    "Fertilizer Price Index",
  electricity_tariff:        "Electricity Tariff (KES/kWh)",
};

// ─── Sample / fallback data ───────────────────────────────────────────────────

export const SAMPLE_ECONOMIC_SIGNALS: EconomicSignal[] = [
  {
    type: "fuel_price_ksh_per_litre",
    label: "Fuel Price",
    value: 217,
    unit: "KES/litre",
    previousValue: 195,
    changePct: +11.3,
    source: "EPRA Kenya",
    recordedAt: new Date(),
    notes: "Super petrol pump price, Nairobi",
  },
  {
    type: "usd_kes_exchange_rate",
    label: "USD/KES Rate",
    value: 158,
    unit: "KES per USD",
    previousValue: 130,
    changePct: +21.5,
    source: "CBK",
    recordedAt: new Date(),
    notes: "Central Bank of Kenya mid-rate",
  },
  {
    type: "inflation_index",
    label: "Inflation Index",
    value: 112,
    unit: "index",
    previousValue: 100,
    changePct: +12.0,
    source: "KNBS",
    recordedAt: new Date(),
    notes: "Kenya National Bureau of Statistics CPI",
  },
  {
    type: "transport_cost_index",
    label: "Transport Cost Index",
    value: 118,
    unit: "index",
    previousValue: 100,
    changePct: +18.0,
    source: "Derived from fuel price",
    recordedAt: new Date(),
    notes: "Estimated from fuel price movement",
  },
  {
    type: "fertilizer_price_index",
    label: "Fertilizer Price Index",
    value: 135,
    unit: "index",
    previousValue: 100,
    changePct: +35.0,
    source: "AMIS Kenya",
    recordedAt: new Date(),
    notes: "DAP fertilizer price index",
  },
];

// ─── Core adjustment engine ───────────────────────────────────────────────────

/**
 * Compute the economic adjustment to apply on top of a raw model prediction.
 *
 * Formula per signal:
 *   deviation = (currentValue - baseline) / baseline   → fractional deviation
 *   signalImpact = deviation × sensitivity              → fractional price impact
 *
 * Total adjustment = sum of all signal impacts (capped at ±40%)
 */
export function computeEconomicAdjustment(
  rawPrice: number,
  signals: EconomicSignal[]
): EconomicAdjustment {
  if (!signals.length || rawPrice <= 0) {
    return {
      rawPrice,
      adjustedPrice: rawPrice,
      adjustmentPct: 0,
      adjustmentFactor: 1,
      drivers: [],
      confidence: "Low",
      summary: "No economic signals available — using raw model prediction.",
    };
  }

  const drivers: EconomicAdjustmentDriver[] = [];
  let totalImpactFraction = 0;

  for (const signal of signals) {
    const baseline = BASELINES[signal.type];
    const sensitivity = SENSITIVITY[signal.type];
    if (!baseline || !sensitivity) continue;

    const deviation = (signal.value - baseline) / baseline;
    const impactFraction = deviation * sensitivity;
    const impactPct = Math.round(impactFraction * 100 * 10) / 10;

    if (Math.abs(impactPct) < 0.5) continue; // ignore negligible signals

    totalImpactFraction += impactFraction;

    drivers.push({
      signal: signal.type,
      label: SIGNAL_LABELS[signal.type] ?? signal.label,
      impact: impactFraction > 0 ? "increase" : impactFraction < 0 ? "decrease" : "neutral",
      impactPct,
      reason: buildDriverReason(signal, impactPct),
    });
  }

  // Cap total adjustment at ±40% to prevent extreme outliers
  const cappedImpact = Math.max(-0.40, Math.min(0.40, totalImpactFraction));
  const adjustmentFactor = 1 + cappedImpact;
  const adjustedPrice = Math.round(rawPrice * adjustmentFactor);
  const adjustmentPct = Math.round(cappedImpact * 100 * 10) / 10;

  const confidence: EconomicAdjustment["confidence"] =
    signals.length >= 4 ? "High" : signals.length >= 2 ? "Medium" : "Low";

  const summary = buildAdjustmentSummary(adjustmentPct, drivers);

  return {
    rawPrice,
    adjustedPrice,
    adjustmentPct,
    adjustmentFactor,
    drivers,
    confidence,
    summary,
  };
}

function buildDriverReason(signal: EconomicSignal, impactPct: number): string {
  const direction = impactPct > 0 ? "up" : "down";
  const magnitude = Math.abs(impactPct);

  switch (signal.type) {
    case "fuel_price_ksh_per_litre":
      return `Fuel at KES ${signal.value}/L (baseline ${BASELINES.fuel_price_ksh_per_litre}) pushes transport costs ${direction}, lifting farm-gate prices by ~${magnitude}%`;
    case "usd_kes_exchange_rate":
      return `KES weakened to ${signal.value}/USD — imported inputs (fertilizer, pesticides) cost more, pushing prices ${direction} by ~${magnitude}%`;
    case "inflation_index":
      return `Inflation index at ${signal.value} (base 100) — general cost-of-living pressure adds ~${magnitude}% to commodity prices`;
    case "transport_cost_index":
      return `Transport cost index at ${signal.value} — logistics costs are ${direction} by ~${magnitude}% vs baseline`;
    case "fertilizer_price_index":
      return `Fertilizer index at ${signal.value} — higher input costs pass through to farm-gate prices by ~${magnitude}%`;
    case "electricity_tariff":
      return `Electricity at KES ${signal.value}/kWh — cold chain and processing costs push prices ${direction} by ~${magnitude}%`;
    default:
      return `${signal.label} deviation contributes ~${magnitude}% price ${direction}`;
  }
}

function buildAdjustmentSummary(adjustmentPct: number, drivers: EconomicAdjustmentDriver[]): string {
  if (drivers.length === 0) return "Economic signals are near baseline — no significant adjustment applied.";

  const topDriver = [...drivers].sort((a, b) => Math.abs(b.impactPct) - Math.abs(a.impactPct))[0];
  const direction = adjustmentPct > 0 ? "upward" : "downward";
  const magnitude = Math.abs(adjustmentPct);

  return `Economic signals suggest a ${magnitude}% ${direction} adjustment. Primary driver: ${topDriver.label} (${topDriver.impactPct > 0 ? "+" : ""}${topDriver.impactPct}%).`;
}

// ─── Firestore persistence ────────────────────────────────────────────────────

export async function saveEconomicSignal(signal: Omit<EconomicSignal, "id">): Promise<string> {
  const id = `${signal.type}_${new Date().toISOString().slice(0, 10)}`;
  const ref = doc(db, COLLECTION, id);
  await setDoc(ref, {
    ...signal,
    recordedAt: Timestamp.fromDate(signal.recordedAt),
    createdAt: Timestamp.now(),
  }, { merge: true });
  return id;
}

export async function getLatestEconomicSignals(): Promise<EconomicSignal[]> {
  try {
    const q = query(
      collection(db, COLLECTION),
      orderBy("recordedAt", "desc"),
      limit(20)
    );
    const snap = await getDocs(q);
    if (snap.empty) return SAMPLE_ECONOMIC_SIGNALS;

    // Return only the most recent entry per signal type
    const byType = new Map<EconomicSignalType, EconomicSignal>();
    snap.forEach((d) => {
      const data = d.data() as any;
      const signal: EconomicSignal = {
        id: d.id,
        ...data,
        recordedAt: data.recordedAt?.toDate?.() ?? new Date(),
      };
      if (!byType.has(signal.type)) {
        byType.set(signal.type, signal);
      }
    });

    return Array.from(byType.values());
  } catch {
    return SAMPLE_ECONOMIC_SIGNALS;
  }
}

export async function getEconomicSnapshot(): Promise<EconomicSnapshot> {
  try {
    const signals = await getLatestEconomicSignals();
    const isMockup = signals === SAMPLE_ECONOMIC_SIGNALS;
    const lastUpdated = signals.length ? signals[0].recordedAt : null;
    return { signals, lastUpdated, isMockup };
  } catch {
    return {
      signals: SAMPLE_ECONOMIC_SIGNALS,
      lastUpdated: new Date(),
      isMockup: true,
    };
  }
}

/**
 * Apply economic adjustment to a raw Render API prediction.
 * This is the main integration point — call this after every /predict response.
 */
export async function applyEconomicAdjustmentToPrice(
  rawPrice: number,
  signals?: EconomicSignal[]
): Promise<EconomicAdjustment> {
  const activeSignals = signals ?? await getLatestEconomicSignals();
  return computeEconomicAdjustment(rawPrice, activeSignals);
}
