export type AdvisoryContext = {
  language: "en" | "sw";
  farm: {
    county: string;
    ward: string;
    lat: number;
    lng: number;
  };
  crop: {
    name: string;
    stage: string;
  };
  weather: {
    summary: string;
    daily: Array<{
      date: string;
      minTempC: number | null;
      maxTempC: number | null;
      rainChancePct: number | null;
      rainMm: number | null;
      windKph?: number | null;
    }>;
    alerts: Array<{
      type: "frost" | "rain" | "heat" | "wind" | "spray";
      level: "low" | "medium" | "high";
      message: string;
    }>;
  };
  market: {
    topMarkets: Array<{
      market: string;
      admin1: string;
      retail: number | null;
      wholesale: number | null;
      lastUpdated?: string | null;
      trend7d?: "up" | "down" | "flat" | "unknown";
    }>;
    bestMarket: {
      market: string;
      admin1: string;
      netPrice: number | null;
      pricetype: "retail" | "wholesale";
    } | null;
    notes: string;
  };
  dataQuality: {
    weatherOk: boolean;
    marketOk: boolean;
    messages: string[];
  };
};

export type AdvisoryContextMeta = {
  locationName: string;
  weatherHighlights: string[];
  weatherSource: string;
  weatherTimestamp: string | null;
  marketHighlights: string[];
  marketTimestamp: string | null;
  dataQualityMessages: string[];
};
