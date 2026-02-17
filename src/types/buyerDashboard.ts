export interface BuyerKpiCard {
  id: string;
  label: string;
  value: string;
  hint?: string;
}

export interface BuyerActivityItem {
  id: string;
  type: "order" | "bid" | "message" | "contract";
  title: string;
  status: string;
  dateLabel: string;
  ctaLabel?: string;
  ctaRoute?: string;
}

export interface BuyerAlertItem {
  id: string;
  severity: "low" | "medium" | "high";
  title: string;
  detail: string;
  dateLabel: string;
  ctaLabel?: string;
  ctaRoute?: string;
}

export interface SupplierSnapshotItem {
  id: string;
  supplierName: string;
  cooperativeName?: string;
  location: string;
  crops: string[];
  reliabilityScore?: number;
  lastOrderDate?: string;
}

export interface RecommendedLotItem {
  id: string;
  title: string;
  crop: string;
  location: string;
  priceKes: number;
  quantityLabel: string;
}

export interface BuyerDashboardViewModel {
  buyerId: string;
  buyerName: string;
  companyName?: string;
  verificationStatus: "pending" | "verified" | "rejected" | "needs_more_info" | "unverified";
  verifiedAt?: string | null;
  verifiedBy?: string | null;
  buyerType: "LOCAL" | "INTERNATIONAL";
  kpis: BuyerKpiCard[];
  activity: {
    recentOrders: BuyerActivityItem[];
    recentBids: BuyerActivityItem[];
    recentMessages: BuyerActivityItem[];
    recentContractUpdates: BuyerActivityItem[];
  };
  alerts: BuyerAlertItem[];
  recommendedLots: RecommendedLotItem[];
  suppliers: SupplierSnapshotItem[];
}

export interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  dateLabel: string;
  amountKes: number;
  status: "paid" | "pending" | "failed" | "draft";
  downloadUrl?: string;
}

export interface TransactionRow {
  id: string;
  reference: string;
  dateLabel: string;
  type: "subscription" | "fee" | "wallet";
  amountKes: number;
  method: "mpesa" | "card" | "bank" | "other";
  status: "success" | "pending" | "failed";
  mpesaReceipt?: string;
}

export interface UsageFeeRow {
  id: string;
  label: string;
  amountKes: number;
  hint?: string;
}

export interface PaymentMethodRow {
  id: string;
  type: "mpesa" | "card" | "bank";
  label: string;
  isDefault?: boolean;
  status: "active" | "inactive";
}

export interface BuyerBillingViewModel {
  buyerId: string;
  currentPlan: {
    name: "Free" | "Pro" | "Enterprise";
    renewalDate?: string;
    trialEndsAt?: string;
    paymentSummary?: string;
  };
  invoices: InvoiceRow[];
  transactions: TransactionRow[];
  usageFees: UsageFeeRow[];
  paymentMethods: PaymentMethodRow[];
  teamBilling: {
    seatCount: number;
    canManageSeats: boolean;
  };
}
