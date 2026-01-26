export type AdvisoryForecastDay = {
  date: string;
  minTempC: number | null;
  maxTempC: number | null;
  rainMm: number | null;
  rainChancePct: number | null;
};

export type AdvisoryForecastSummary = {
  days: AdvisoryForecastDay[];
  totalRainMm: number | null;
  avgRainChancePct: number | null;
};

export type AdvisoryRiskSummary = {
  frostRiskLevel: "Low" | "Medium" | "High" | null;
  frostMinTempC: number | null;
  rainRiskLevel: "Low" | "Medium" | "High" | null;
  rainTotalMm: number | null;
  rainAvgChancePct: number | null;
};

export type AdvisoryMarketSummary = {
  available: boolean;
  commodity: string | null;
  market: string | null;
  admin1: string | null;
  predictedPricePerKg: number | null;
  confidencePct: number | null;
  unreasonable: boolean | null;
  note: string | null;
};

export type AdvisoryCropContext = {
  id: string | null;
  name: string | null;
  plantingDate: string | null;
  growthStage: string | null;
};

export type AdvisoryLocationContext = {
  farmId: string | null;
  name: string | null;
  county: string | null;
  ward: string | null;
  lat: number | null;
  lon: number | null;
};

export type AdvisoryContext = {
  language: "en" | "sw";
  location: AdvisoryLocationContext;
  crop: AdvisoryCropContext;
  forecast: AdvisoryForecastSummary;
  risks: AdvisoryRiskSummary;
  market: AdvisoryMarketSummary;
  contextNotes: string[];
};

export type AdvisoryAction = {
  title: string;
  detail: string;
  why: string;
};

export type AdvisoryRisk = {
  label: string;
  severity: "low" | "medium" | "high";
  why: string;
};

export type AdvisoryResponse = {
  summary: string;
  actions: AdvisoryAction[];
  risks: AdvisoryRisk[];
  marketAdvice: string;
  disclaimer: string;
};

export type AdvisoryGenerateFarm = {
  lat: number;
  lon: number;
  locationName: string;
};

export type AdvisoryGenerateCrop = {
  name: string;
  stage: string;
};

export type AdvisoryGenerateSignals = {
  predictedPrice?: number;
  marketUnreasonable?: boolean;
};

export type AdvisoryGenerateRequest = {
  language: "en" | "sw";
  farm: AdvisoryGenerateFarm;
  crop: AdvisoryGenerateCrop;
  signals?: AdvisoryGenerateSignals;
};

export type AdvisoryGenerateResponse = {
  title?: string;
  summary?: string;
  actions?: string[];
  risks?: string[];
  dataUsed?: {
    locationName?: string | null;
    weatherHighlights?: string[];
  };
};
