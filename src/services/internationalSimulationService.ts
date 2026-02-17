export type InternationalPolicyShock =
  | "none"
  | "tariff_increase"
  | "tariff_removal"
  | "border_delays"
  | "export_ban";

export type InternationalSeasonFactor = "glut" | "normal" | "lean";

export type InternationalSimulationInput = {
  orgId: string;
  crop: string;
  market: string;
  horizonDays: 7 | 14 | 30 | 90;
  preset?: string;
  importPressure: number;
  fxShock: number;
  freightPressure: number;
  policyShock: InternationalPolicyShock;
  seasonalFactor: InternationalSeasonFactor;
  applyClimateRisk: boolean;
  useCoopStockLevels: boolean;
  localPriceKESPerKg: number | null;
};

export type InternationalKpiSet = {
  localPriceKESPerKg: number | null;
  importPressureIndex: number;
  importPressureLabel: "Low" | "Medium" | "High";
  fxShockPercent: number;
  freightPressureIndex: number;
  policyRiskIndex: number;
  projectedMinKESPerKg: number | null;
  projectedMidKESPerKg: number | null;
  projectedMaxKESPerKg: number | null;
  confidence: "Low" | "Medium" | "High";
  confidenceReason: string;
};

export type InternationalRecommendation = {
  title: string;
  reason: string;
};

export type InternationalInsightItem = {
  id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high";
};

export type InternationalSimulationOutput = {
  kpis: InternationalKpiSet;
  priceBand: {
    min: number | null;
    mid: number | null;
    max: number | null;
  };
  series: Array<{ label: string; min: number; mid: number; max: number }>;
  drivers: string[];
  recommendedActions: InternationalRecommendation[];
  insightsFeed: InternationalInsightItem[];
  confidence: "Low" | "Medium" | "High";
  assumptions: string[];
  suggestedFloorPrice: number | null;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const round2 = (value: number) => Math.round(value * 100) / 100;

function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return hash >>> 0;
}

function seededRandom(seedText: string): () => number {
  let seed = hashString(seedText) || 1;
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

const labelForPressure = (value: number): "Low" | "Medium" | "High" =>
  value >= 67 ? "High" : value >= 34 ? "Medium" : "Low";

const policyMultiplier = (policy: InternationalPolicyShock): number => {
  switch (policy) {
    case "tariff_increase":
      return 0.05;
    case "tariff_removal":
      return -0.06;
    case "border_delays":
      return 0.03;
    case "export_ban":
      return -0.08;
    default:
      return 0;
  }
};

const seasonMultiplier = (season: InternationalSeasonFactor): number => {
  switch (season) {
    case "glut":
      return -0.07;
    case "lean":
      return 0.06;
    default:
      return 0;
  }
};

const horizonFactor = (horizonDays: number) => (horizonDays <= 14 ? 0.6 : horizonDays <= 30 ? 1 : 1.35);

export function runInternationalSimulation(input: InternationalSimulationInput): InternationalSimulationOutput {
  const seedKey = [
    input.orgId,
    input.crop,
    input.market,
    input.horizonDays,
    input.preset || "custom",
    input.importPressure,
    input.fxShock,
    input.freightPressure,
    input.policyShock,
    input.seasonalFactor,
    input.applyClimateRisk ? 1 : 0,
    input.useCoopStockLevels ? 1 : 0,
  ].join("|");
  const rand = seededRandom(seedKey);

  const localPrice = input.localPriceKESPerKg && input.localPriceKESPerKg > 0 ? input.localPriceKESPerKg : null;
  const base = localPrice ?? 0;
  const hFactor = horizonFactor(input.horizonDays);

  const importEffect = -(input.importPressure / 100) * 0.18 * base * hFactor;
  const fxEffect = (input.fxShock / 100) * 0.1 * base * hFactor;
  const freightEffect = (input.freightPressure / 100) * 0.06 * base * hFactor;
  const policyEffect = policyMultiplier(input.policyShock) * base * hFactor;
  const seasonEffect = seasonMultiplier(input.seasonalFactor) * base * hFactor;
  const climateEffect = input.applyClimateRisk ? (0.015 + rand() * 0.03) * base : 0;
  const stockEffect = input.useCoopStockLevels ? -(0.01 + rand() * 0.02) * base : 0;

  const midRaw = base + importEffect + fxEffect + freightEffect + policyEffect + seasonEffect + climateEffect + stockEffect;
  const volatilityRaw = 0.11 + input.importPressure / 280 + Math.abs(input.fxShock) / 120 + input.freightPressure / 400 + (input.applyClimateRisk ? 0.05 : 0);
  const volatility = clamp(volatilityRaw, 0.1, 0.45);

  const mid = localPrice ? round2(Math.max(1, midRaw)) : null;
  const min = mid ? round2(mid * (1 - volatility)) : null;
  const max = mid ? round2(mid * (1 + volatility)) : null;

  const confidence: "Low" | "Medium" | "High" = !localPrice ? "Low" : volatility > 0.32 ? "Low" : volatility > 0.2 ? "Medium" : "High";
  const adjustedConfidence: "Low" | "Medium" | "High" = !localPrice ? "Low" : confidence;
  const confidenceReason = !localPrice
    ? "Missing current local market price."
    : adjustedConfidence === "High"
      ? "Strong local price signal and stable scenario."
      : adjustedConfidence === "Medium"
        ? "Local price exists but scenario has moderate uncertainty."
        : "Scenario volatility is high.";

  const seriesLabels =
    input.horizonDays === 7 ? ["Day 0", "Day 3", "Day 7"] :
      input.horizonDays === 14 ? ["Day 0", "Day 7", "Day 14"] :
        input.horizonDays === 30 ? ["Day 0", "Day 14", "Day 30"] : ["Day 0", "Day 30", "Day 90"];
  const series = localPrice && min && max && mid
    ? seriesLabels.map((label, idx) => {
      const progress = idx / (seriesLabels.length - 1 || 1);
      const stepMid = round2(base + (mid - base) * progress);
      const stepVol = volatility * (0.75 + progress * 0.25);
      return {
        label,
        mid: stepMid,
        min: round2(stepMid * (1 - stepVol)),
        max: round2(stepMid * (1 + stepVol)),
      };
    })
    : [];

  const drivers: string[] = [];
  if (input.importPressure >= 60) drivers.push("High import pressure is pushing local prices downward.");
  if (input.fxShock >= 2) drivers.push("Currency weakening increases landed import costs.");
  if (input.fxShock <= -2) drivers.push("Currency strengthening eases import cost pressure.");
  if (input.freightPressure >= 60) drivers.push("Freight and logistics constraints are lifting delivered costs.");
  if (input.policyShock === "tariff_increase") drivers.push("Tariff increase supports local producer pricing.");
  if (input.policyShock === "tariff_removal") drivers.push("Tariff removal adds lower-cost import competition.");
  if (input.policyShock === "border_delays") drivers.push("Border delays reduce short-term import supply.");
  if (input.policyShock === "export_ban") drivers.push("Export ban redirects supply into local markets.");
  if (input.seasonalFactor === "glut") drivers.push("Harvest glut increases local supply and softens prices.");
  if (input.seasonalFactor === "lean") drivers.push("Lean season tightens supply and supports higher prices.");
  if (!drivers.length) drivers.push("No dominant external shock detected; baseline trend remains stable.");

  const recommendations: InternationalRecommendation[] = [];
  if (localPrice && mid) {
    if (mid < localPrice * 0.95) {
      recommendations.push({ title: "Hold stock where possible", reason: "Projected price is below current market level." });
      recommendations.push({ title: "Stagger deliveries", reason: "Reduce downside exposure by splitting lots." });
      recommendations.push({ title: "Offer contract floor price", reason: "Lock downside protection before volatility expands." });
    } else if (mid > localPrice * 1.05) {
      recommendations.push({ title: "List now", reason: "Projected mid-price exceeds current market by >5%." });
      recommendations.push({ title: "Increase collection planning", reason: "Capture expected demand while window is open." });
      recommendations.push({ title: "Target premium buyers", reason: "Higher ceiling supports quality-segment sales." });
    } else {
      recommendations.push({ title: "Monitor weekly", reason: "No strong directional edge in current scenario." });
      recommendations.push({ title: "Sell in small batches", reason: "Maintain flexibility while trend confirms." });
      recommendations.push({ title: "Set modest floor offers", reason: "Protect margin without overpricing." });
    }
  } else {
    recommendations.push({ title: "Load local market price first", reason: "Simulation confidence depends on current local benchmark." });
  }

  const insightsFeed: InternationalInsightItem[] = [
    {
      id: "intl_1",
      title: "Regional import flow update",
      description: input.importPressure >= 60 ? "Imports are projected to increase and pressure local spot prices." : "Import pressure remains moderate.",
      severity: input.importPressure >= 60 ? "high" : "medium",
    },
    {
      id: "intl_2",
      title: "Logistics and fuel signal",
      description: input.freightPressure >= 50 ? "Freight costs are elevated; expect wider price spread by location." : "Freight costs remain manageable.",
      severity: input.freightPressure >= 70 ? "high" : "low",
    },
    {
      id: "intl_3",
      title: "Demand signal",
      description: input.policyShock === "export_ban" ? "Export restriction likely increases domestic supply pressure." : "External demand remains scenario-dependent.",
      severity: "medium",
    },
  ];

  const policyRiskIndex = clamp(
    (Math.abs(policyMultiplier(input.policyShock)) * 100) + (input.policyShock === "none" ? 15 : 35),
    0,
    100
  );

  const suggestedFloorPrice = mid ? round2(mid * 0.96) : null;

  const assumptions = [
    "Simulation uses deterministic pseudo-random noise for repeatable demo outcomes.",
    "No live international feed is connected in this version.",
    "Model weights are illustrative and should be calibrated with real trade data.",
  ];

  return {
    kpis: {
      localPriceKESPerKg: localPrice,
      importPressureIndex: input.importPressure,
      importPressureLabel: labelForPressure(input.importPressure),
      fxShockPercent: input.fxShock,
      freightPressureIndex: input.freightPressure,
      policyRiskIndex: round2(policyRiskIndex),
      projectedMinKESPerKg: min,
      projectedMidKESPerKg: mid,
      projectedMaxKESPerKg: max,
      confidence: adjustedConfidence,
      confidenceReason,
    },
    priceBand: { min, mid, max },
    series,
    drivers,
    recommendedActions: recommendations,
    insightsFeed,
    confidence: adjustedConfidence,
    assumptions,
    suggestedFloorPrice,
  };
}
