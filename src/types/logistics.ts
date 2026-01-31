export type RiskLevel = "Low" | "Medium" | "High" | "Unknown";

export type LogisticsRoute = {
  id: string;
  crop: string;
  origin: string;
  destination: string;
  distanceKm: number | null;
  recommendedVehicle: string | null;
  estimatedCostKes: number | null;
  riskLevel: RiskLevel | null;
  departureWindow: string | null;
  notes: string | null;
};

export type LogisticsRouteResponse = {
  ok: boolean;
  data: LogisticsRoute | null;
  error?: string;
};
