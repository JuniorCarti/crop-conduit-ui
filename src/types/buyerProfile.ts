export type BuyerProfileTabKey =
  | "overview"
  | "company"
  | "preferences"
  | "suppliers"
  | "orders"
  | "contracts"
  | "alerts"
  | "messages";

export interface BuyerProfileMetrics {
  totalPurchasesKes: number;
  totalVolumeKg: number;
  activeOrders: number;
  activeContracts: number;
  onTimePaymentRate?: number;
  reliabilityScore?: number;
}

export interface BuyerRecentActivity {
  id: string;
  title: string;
  detail: string;
  createdAt: string;
}

export interface BuyerSmartAlert {
  id: string;
  severity: "low" | "medium" | "high";
  title: string;
  detail: string;
  createdAt: string;
}

export interface BuyerSupplierSummary {
  id: string;
  supplierName: string;
  cooperativeName?: string;
  crops: string[];
  location: string;
  reliabilityScore?: number;
  lastOrderDate?: string;
  rating?: number;
  favorite?: boolean;
}

export interface BuyerOrderSummary {
  id: string;
  crop: string;
  quantity: string;
  priceKes: number;
  supplier: string;
  status: string;
  eta?: string;
  createdAt: string;
}

export interface BuyerContractSummary {
  id: string;
  name: string;
  supplier: string;
  crop: string;
  volume: string;
  priceType: "fixed" | "market-linked";
  startDate: string;
  endDate: string;
  status: string;
}

export interface BuyerMessageShortcut {
  id: string;
  participant: string;
  lastMessage: string;
  updatedAt: string;
}

export interface BuyerProfileViewModel {
  buyerId: string;
  displayName: string;
  companyName?: string;
  buyerMode: "LOCAL" | "INTERNATIONAL";
  verificationStatus: "verified" | "pending" | "unverified";
  metrics: BuyerProfileMetrics;
  sourcingFocus: {
    crops: string[];
    preferredMarkets: string[];
    preferredRegions: string[];
  };
  recentActivity: BuyerRecentActivity[];
  smartAlerts: BuyerSmartAlert[];
  company: {
    companyName: string;
    country?: string | null;
    cityOrRegion?: string | null;
    address?: string | null;
    phone?: string | null;
    whatsapp?: string | null;
    email?: string | null;
    website?: string | null;
    destinations?: string[];
  };
  preferences: {
    monthlyVolume?: string;
    crops: string[];
    preferredMarkets: string[];
    deliveryRegions: string[];
    qualityPreferences: string[];
    paymentPreferences: string[];
    notifications: {
      priceAlerts: boolean;
      contractUpdates: boolean;
      supplierMessages: boolean;
    };
  };
  suppliers: BuyerSupplierSummary[];
  orders: BuyerOrderSummary[];
  contracts: BuyerContractSummary[];
  messages: BuyerMessageShortcut[];
}
