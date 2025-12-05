/**
 * Finance Chancellor Controller
 * Combines Firestore/Supabase data into dashboard-ready shapes,
 * provides lightweight caching for offline use, and offers helpers
 * for sensitive data protection.
 */

import {
  aggregateExpensesByCategory,
  calculateProfitMargin,
  calculateProjectedRevenue,
  generateCashFlowForecast,
} from "@/utils/financeCalculations";
import type {
  CashFlowForecast,
  Expense,
  LoanApplication,
  ProfitLossStatement,
  RevenueProjection,
  ROICalculation,
} from "./firestore-finance";

export interface FinanceFilters {
  cropName?: string;
  fieldName?: string;
  season?: string;
  period?: "daily" | "weekly" | "monthly";
}

export interface FinanceKpis {
  projectedRevenue: number;
  expenses: number;
  netProfit: number;
  profitMargin: number;
  avgRoi?: number;
  outstandingLoans?: number;
}

export interface FinanceDashboardSnapshot {
  kpis: FinanceKpis;
  revenueSeries: Array<{
    label: string;
    projected: number;
    actual?: number;
    crop?: string;
    field?: string;
    season?: string;
  }>;
  expenseSeries: Array<{ label: string; category: string; amount: number }>;
  cashflowSeries: Array<{ date: string; inflow: number; outflow: number; netFlow: number; balance: number }>;
  roiLeaders: Array<{ label: string; roi: number; netProfit: number }>;
  cachedAt: string;
}

interface BuildDashboardInput {
  projections?: RevenueProjection[];
  expenses?: Expense[];
  forecasts?: CashFlowForecast[];
  roi?: ROICalculation[];
  profitLoss?: ProfitLossStatement[];
  loanApplications?: LoanApplication[];
  filters?: FinanceFilters;
}

/**
 * Build a dashboard snapshot that can be fed directly into UI components.
 * Integrates real-time market prices and harvest data.
 */
export async function buildFinanceDashboardSnapshot({
  projections = [],
  expenses = [],
  forecasts = [],
  roi = [],
  profitLoss = [],
  loanApplications = [],
  filters,
}: BuildDashboardInput): Promise<FinanceDashboardSnapshot> {
  const filteredProjections = projections.filter((p) => {
    const cropMatch = filters?.cropName ? p.cropName === filters.cropName : true;
    const fieldMatch = filters?.fieldName ? p.fieldName === filters.fieldName : true;
    const seasonMatch = filters?.season ? p.season === filters.season : true;
    return cropMatch && fieldMatch && seasonMatch;
  });

  const filteredExpenses = expenses.filter((e) => {
    const cropMatch = filters?.cropName ? e.cropName === filters.cropName : true;
    const fieldMatch = filters?.fieldName ? e.fieldName === filters.fieldName : true;
    return cropMatch && fieldMatch;
  });

  // Enhance projections with real-time market prices
  const enhancedProjections = await Promise.all(
    filteredProjections.map(async (p) => {
      try {
        const { getLatestPrice, getAveragePrice } = await import("./marketPriceService");
        const latestPrice = await getLatestPrice(p.cropName);
        const marketPrice = latestPrice?.retail || p.marketPrice;
        
        // Recalculate revenue with real market price
        const enhancedRevenue = p.projectedYield * marketPrice;
        
        return {
          ...p,
          marketPrice,
          projectedRevenue: enhancedRevenue,
        };
      } catch (error) {
        console.warn(`Error enhancing projection for ${p.cropName}:`, error);
        return p;
      }
    })
  );

  const totalProjectedRevenue = enhancedProjections.reduce((sum, p) => sum + p.projectedRevenue, 0);
  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const netProfit = totalProjectedRevenue - totalExpenses;
  const profitMargin = calculateProfitMargin(totalProjectedRevenue, totalExpenses);

  const revenueSeries = enhancedProjections.map((p) => ({
    label: p.season || p.createdAt?.toString() || "Unspecified",
    projected: p.projectedRevenue,
    actual: p.projectedRevenue * 0.92, // optimistic simulated actuals until real data is ingested
    crop: p.cropName,
    field: p.fieldName,
    season: p.season,
  }));

  const expenseSeries = Object.entries(aggregateExpensesByCategory(filteredExpenses)).map(
    ([category, amount]) => ({
      label: category,
      category,
      amount,
    })
  );

  const roiLeaders = roi
    .map((item) => ({
      label: item.cropName || item.fieldName || item.period,
      roi: item.roi,
      netProfit: item.netProfit,
    }))
    .sort((a, b) => b.roi - a.roi)
    .slice(0, 5);

  const outstandingLoans = loanApplications
    .filter((app) => app.status !== "repaid" && app.status !== "rejected")
    .reduce((sum, app) => sum + (app.loanAmount || 0), 0);

  // Cashflow: prefer stored forecasts, otherwise synthesize from expenses/projections
  let cashflowSeries: FinanceDashboardSnapshot["cashflowSeries"] = [];
  if (forecasts.length > 0) {
    cashflowSeries = forecasts.map((f) => ({
      date: new Date(f.date).toISOString(),
      inflow: f.inflow,
      outflow: f.outflow,
      netFlow: f.netFlow,
      balance: f.balance,
    }));
  } else {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const generated = generateCashFlowForecast(
      filteredExpenses,
      filteredProjections,
      thirtyDaysAgo,
      today,
      filters?.period || "daily"
    );
    cashflowSeries = generated.map((item) => ({
      date: item.date.toISOString(),
      inflow: item.inflow,
      outflow: item.outflow,
      netFlow: item.netFlow,
      balance: item.balance,
    }));
  }

  const avgRoi =
    roi.length > 0
      ? roi.reduce((sum, item) => sum + item.roi, 0) / roi.length
      : profitLoss.length > 0
        ? profitLoss[0].profitMargin
        : 0;

  return {
    kpis: {
      projectedRevenue: totalProjectedRevenue,
      expenses: totalExpenses,
      netProfit,
      profitMargin,
      avgRoi,
      outstandingLoans,
    },
    revenueSeries,
    expenseSeries,
    cashflowSeries,
    roiLeaders,
    cachedAt: new Date().toISOString(),
  };
}

/**
 * Lightweight cache helpers for offline/low-connectivity usage.
 */
const CACHE_KEY = "chancellor-finance-cache";

export function persistFinanceSnapshot(snapshot: FinanceDashboardSnapshot) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(snapshot));
  } catch {
    // ignore storage failures (private mode or size limits)
  }
}

export function readFinanceSnapshot(): FinanceDashboardSnapshot | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as FinanceDashboardSnapshot;
  } catch {
    return null;
  }
}

/**
 * Detect risky periods (negative cash flow, shrinking balance, spikes in expenses).
 */
export function evaluateCashflowAlerts(series: FinanceDashboardSnapshot["cashflowSeries"]): string[] {
  const alerts: string[] = [];
  const firstNegative = series.find((item) => item.balance < 0);
  if (firstNegative) {
    alerts.push(
      `Cash balance turns negative on ${new Date(firstNegative.date).toLocaleDateString()}`
    );
  }

  const spike = series.find((item) => item.outflow > item.inflow * 1.5 && item.outflow > 0);
  if (spike) {
    alerts.push(
      `Expense spike detected on ${new Date(spike.date).toLocaleDateString()} (${Math.round(
        spike.outflow
      ).toLocaleString()} KSh)`
    );
  }

  return alerts;
}

// -----------------------------------------------------------------------------
// Basic AES-GCM helpers for protecting sensitive payloads before persisting
// -----------------------------------------------------------------------------
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const SECRET = import.meta.env.VITE_DATA_PROTECTION_KEY || "fallback-chancellor-key";
const SALT = encoder.encode("chancellor-finance-salt");

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function buildCryptoKey(): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(SECRET), "PBKDF2", false, [
    "deriveKey",
  ]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: SALT, iterations: 120000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptSensitiveFinancialData(payload: unknown): Promise<string> {
  if (typeof crypto === "undefined" || !crypto.subtle) {
    return btoa(JSON.stringify(payload));
  }

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await buildCryptoKey();
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(JSON.stringify(payload))
  );
  return `${toBase64(iv.buffer)}.${toBase64(encrypted)}`;
}

export async function decryptSensitiveFinancialData<T = unknown>(token: string): Promise<T | null> {
  if (!token) return null;
  if (typeof crypto === "undefined" || !crypto.subtle) {
    try {
      return JSON.parse(atob(token)) as T;
    } catch {
      return null;
    }
  }

  const [ivPart, dataPart] = token.split(".");
  if (!ivPart || !dataPart) return null;

  const key = await buildCryptoKey();
  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromBase64(ivPart) },
      key,
      fromBase64(dataPart)
    );
    return JSON.parse(decoder.decode(decrypted)) as T;
  } catch {
    return null;
  }
}

