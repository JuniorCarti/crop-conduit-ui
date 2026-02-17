import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getBuyerMe } from "@/services/buyerAccountService";
import type {
  BuyerActivityItem,
  BuyerAlertItem,
  BuyerDashboardViewModel,
  BuyerKpiCard,
  RecommendedLotItem,
  SupplierSnapshotItem,
} from "@/types/buyerDashboard";

const formatDateLabel = (value: unknown) => {
  if (!value) return "--";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
};

const mapActivity = (rows: any[] | undefined, type: BuyerActivityItem["type"], fallbackRoute: string): BuyerActivityItem[] => {
  if (!Array.isArray(rows)) return [];
  return rows.slice(0, 6).map((row, index) => ({
    id: String(row?.id || `${type}-${index}`),
    type,
    title: String(row?.title || row?.name || row?.crop || "Activity"),
    status: String(row?.status || "pending"),
    dateLabel: formatDateLabel(row?.createdAt || row?.updatedAt || row?.date),
    ctaLabel: "View",
    ctaRoute: String(row?.ctaRoute || fallbackRoute),
  }));
};

const mapAlerts = (rows: any[] | undefined): BuyerAlertItem[] => {
  if (!Array.isArray(rows)) return [];
  return rows.slice(0, 8).map((row, index) => ({
    id: String(row?.id || `alert-${index}`),
    severity: ["low", "medium", "high"].includes(String(row?.severity))
      ? (row.severity as BuyerAlertItem["severity"])
      : "low",
    title: String(row?.title || "Alert"),
    detail: String(row?.detail || row?.description || ""),
    dateLabel: formatDateLabel(row?.createdAt || row?.date),
    ctaLabel: row?.ctaRoute ? "Open" : "Manage alerts",
    ctaRoute: row?.ctaRoute || "/buyer/profile?tab=alerts",
  }));
};

const mapSuppliers = (rows: any[] | undefined): SupplierSnapshotItem[] => {
  if (!Array.isArray(rows)) return [];
  return rows.slice(0, 6).map((row, index) => ({
    id: String(row?.id || `supplier-${index}`),
    supplierName: String(row?.supplierName || row?.name || "Supplier"),
    cooperativeName: row?.cooperativeName ? String(row.cooperativeName) : undefined,
    location: String(row?.location || "--"),
    crops: Array.isArray(row?.crops) ? row.crops.map((crop: unknown) => String(crop)) : [],
    reliabilityScore: Number.isFinite(Number(row?.reliabilityScore)) ? Number(row.reliabilityScore) : undefined,
    lastOrderDate: row?.lastOrderDate ? String(row.lastOrderDate) : undefined,
  }));
};

const mapRecommended = (rows: any[] | undefined): RecommendedLotItem[] => {
  if (!Array.isArray(rows)) return [];
  return rows.slice(0, 6).map((row, index) => ({
    id: String(row?.id || `recommended-${index}`),
    title: String(row?.title || row?.name || "Marketplace lot"),
    crop: String(row?.crop || "Produce"),
    location: String(row?.location || "--"),
    priceKes: Number(row?.priceKes ?? row?.price ?? 0),
    quantityLabel: String(row?.quantityLabel || row?.quantity || "--"),
  }));
};

const mapVerification = (approvalStatus?: string): BuyerDashboardViewModel["verificationStatus"] => {
  const approval = String(approvalStatus || "PENDING").toUpperCase();
  if (approval === "APPROVED") return "verified";
  if (approval === "REJECTED") return "rejected";
  if (approval === "NEEDS_MORE_INFO") return "needs_more_info";
  return "pending";
};

async function firestoreFallback(uid: string): Promise<BuyerDashboardViewModel> {
  const safeGet = async (path: [string, ...string[]]) => {
    try {
      const snap = await getDoc(doc(db, ...path));
      return snap.exists() ? (snap.data() as any) : {};
    } catch (error) {
      console.warn("buyer dashboard fallback read skipped", path.join("/"), error);
      return {};
    }
  };

  const [userSnap, buyerProfileSnap, dashboardSnap, profileSnap] = await Promise.all([
    safeGet(["users", uid]),
    safeGet(["buyerProfiles", uid]),
    safeGet(["buyers", uid, "dashboard", "v1"]),
    safeGet(["buyers", uid, "profile", "v1"]),
  ]);

  const user = userSnap || {};
  const buyer = buyerProfileSnap || {};
  const dashboard = dashboardSnap || {};
  const profile = profileSnap || {};

  const kpis: BuyerKpiCard[] = [
    { id: "activeOrders", label: "Active Orders", value: String(Number(profile.activeOrders || 0)) },
    { id: "pendingDeliveries", label: "Pending Deliveries", value: String(Number(profile.pendingDeliveries || 0)) },
    { id: "pendingPayments", label: "Pending Payments", value: String(Number(profile.pendingPayments || 0)) },
    { id: "activeContracts", label: "Active Contracts", value: String(Number(profile.activeContracts || 0)) },
    { id: "openBids", label: "Open Bids", value: String(Number(profile.openBids || 0)) },
    { id: "reliability", label: "Reliability Score", value: profile.reliabilityScore != null ? `${profile.reliabilityScore}%` : "--" },
  ];

  return {
    buyerId: uid,
    buyerName: user.displayName || buyer.fullName || "Buyer",
    companyName: profile.companyName || buyer.internationalProfile?.companyName || "Buyer",
    verificationStatus: mapVerification(profile.approvalStatus || profile.verificationStatus),
    verifiedAt: profile.verifiedAt || null,
    verifiedBy: profile.verifiedBy || null,
    buyerType: String(buyer.buyerRegistrationType || user.buyerRegistrationType || "LOCAL").toUpperCase() === "INTERNATIONAL" ? "INTERNATIONAL" : "LOCAL",
    kpis,
    activity: {
      recentOrders: mapActivity(dashboard.recentOrders || profile.orders, "order", "/buyer/profile?tab=orders"),
      recentBids: mapActivity(dashboard.recentBids, "bid", "/buyer/trade/bids"),
      recentMessages: mapActivity(dashboard.recentMessages || profile.messages, "message", "/community/inbox"),
      recentContractUpdates: mapActivity(dashboard.recentContractUpdates || profile.contracts, "contract", "/buyer/trade/contracts"),
    },
    alerts: mapAlerts(dashboard.alerts || profile.smartAlerts),
    recommendedLots: mapRecommended(dashboard.recommendedLots || profile.recommendedLots),
    suppliers: mapSuppliers(dashboard.suppliers || profile.suppliers),
  };
}

export async function getBuyerDashboardView(uid: string): Promise<BuyerDashboardViewModel> {
  try {
    const buyer = await getBuyerMe();

    const kpis: BuyerKpiCard[] = [
      { id: "activeOrders", label: "Active Orders", value: String(Number(buyer.metrics?.activeOrders || 0)) },
      { id: "pendingDeliveries", label: "Pending Deliveries", value: String(Number(buyer.metrics?.pendingDeliveries || 0)) },
      { id: "pendingPayments", label: "Pending Payments", value: String(Number(buyer.metrics?.pendingPayments || 0)) },
      { id: "activeContracts", label: "Active Contracts", value: String(Number(buyer.metrics?.activeContracts || 0)) },
      { id: "openBids", label: "Open Bids", value: String(Number(buyer.metrics?.openBids || 0)) },
      {
        id: "reliability",
        label: "Reliability Score",
        value: buyer.metrics?.reliabilityScore != null ? `${Number(buyer.metrics.reliabilityScore)}%` : "--",
      },
    ];

    return {
      buyerId: uid,
      buyerName: buyer.displayName || "Buyer",
      companyName: buyer.companyName || buyer.displayName || "Buyer",
      verificationStatus: mapVerification(buyer.approvalStatus),
      verifiedAt: buyer.verification?.verifiedAt || null,
      verifiedBy: buyer.verification?.verifiedBy || null,
      buyerType: buyer.buyerType || "LOCAL",
      kpis,
      activity: {
        recentOrders: mapActivity((buyer.activity as any)?.recentOrders, "order", "/buyer/profile?tab=orders"),
        recentBids: mapActivity((buyer.activity as any)?.recentBids, "bid", "/buyer/trade/bids"),
        recentMessages: mapActivity((buyer.activity as any)?.recentMessages, "message", "/community/inbox"),
        recentContractUpdates: mapActivity((buyer.activity as any)?.recentContractUpdates, "contract", "/buyer/trade/contracts"),
      },
      alerts: mapAlerts(buyer.alerts),
      recommendedLots: mapRecommended(buyer.recommendedLots),
      suppliers: mapSuppliers(buyer.suppliers),
    };
  } catch (error) {
    console.warn("getBuyerDashboardView backend failed, using firestore fallback", error);
    return firestoreFallback(uid);
  }
}
