export type Plan = "free" | "premium";

export interface UserFeatureFlags {
  climateBasic: boolean;
  climatePremium?: boolean;
  frostAlerts: boolean;
  rain14: boolean;
  smsAlerts: boolean;
}

export interface UserProfile {
  uid: string;
  plan: Plan;
  language: "sw" | "en";
  phoneNumber?: string;
  features: UserFeatureFlags;
  createdAt?: Date | string;
}

export interface FarmLocation {
  id: string;
  uid: string;
  name: string;
  county: string;
  subCounty?: string;
  ward: string;
  lat: number;
  lon: number;
  elevation?: number;
  crops?: string[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface ClimateDailyForecast {
  date: string;
  minTempC: number;
  maxTempC: number;
  humidity: number;
  windSpeed: number;
  rainMm: number;
  rainChance: number;
}

export type FrostSeverity = "Low" | "Medium" | "High";

export interface FrostRiskSummary {
  severity: FrostSeverity;
  tonight: {
    minTempC: number;
    windSpeed: number;
    humidity: number;
  };
  next72h: Array<{
    date: string;
    minTempC: number;
    severity: FrostSeverity;
  }>;
  tips: string[];
  reasons?: string[];
}

export interface RainDailySummary {
  date: string;
  rainMm: number;
  probability: number;
}

export interface ClimateForecast {
  farmId: string;
  updatedAt?: string;
  dailyForecast: ClimateDailyForecast[];
  frostRisk: FrostRiskSummary;
  rainSummary: {
    next7Days: RainDailySummary[];
    next14Days?: RainDailySummary[];
    plantingWindow?: {
      start: string;
      end: string;
      label?: string;
    };
  };
}

export interface AlertSubscriptionFarm {
  farmId: string;
  channels: Array<"inApp" | "sms">;
  frost: boolean;
  rain: boolean;
}

export interface AlertSubscription {
  uid: string;
  farms: AlertSubscriptionFarm[];
  updatedAt?: Date | string;
}

export interface AlertItem {
  id: string;
  type: "frost" | "rain";
  farmId: string;
  severity: FrostSeverity;
  messageSw: string;
  messageEn: string;
  scheduledFor?: Date | string;
  sentAt?: Date | string;
  status: "scheduled" | "sent" | "failed";
}
