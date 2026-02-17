import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getBuyerMe } from "@/services/buyerAccountService";
import type { BuyerProfileViewModel } from "@/types/buyerProfile";

const toNumber = (value: unknown, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const nowIso = () => new Date().toISOString();

const mapVerificationStatus = (approvalStatus?: string): BuyerProfileViewModel["verificationStatus"] => {
  const normalized = String(approvalStatus || "PENDING").toUpperCase();
  if (normalized === "APPROVED") return "verified";
  if (normalized === "REJECTED") return "unverified";
  return "pending";
};

const createMock = (uid: string): BuyerProfileViewModel => ({
  buyerId: uid,
  displayName: "Buyer Account",
  companyName: "AgriSmart Buyer",
  buyerMode: "LOCAL",
  verificationStatus: "pending",
  metrics: {
    totalPurchasesKes: 0,
    totalVolumeKg: 0,
    activeOrders: 0,
    activeContracts: 0,
    onTimePaymentRate: 0,
    reliabilityScore: 0,
  },
  sourcingFocus: {
    crops: [],
    preferredMarkets: [],
    preferredRegions: [],
  },
  recentActivity: [],
  smartAlerts: [],
  company: {
    companyName: "AgriSmart Buyer",
    country: "Kenya",
    cityOrRegion: null,
    address: null,
    phone: null,
    whatsapp: null,
    email: null,
    website: null,
    destinations: [],
  },
  preferences: {
    monthlyVolume: "",
    crops: [],
    preferredMarkets: [],
    deliveryRegions: [],
    qualityPreferences: [],
    paymentPreferences: [],
    notifications: {
      priceAlerts: true,
      contractUpdates: true,
      supplierMessages: true,
    },
  },
  suppliers: [],
  orders: [],
  contracts: [],
  messages: [],
});

async function getFirestoreFallback(uid: string): Promise<BuyerProfileViewModel> {
  const fallback = createMock(uid);
  try {
    const [userSnap, legacyBuyerSnap, namespacedProfileSnap, namespacedPrefsSnap] = await Promise.all([
      getDoc(doc(db, "users", uid)),
      getDoc(doc(db, "buyerProfiles", uid)),
      getDoc(doc(db, "buyers", uid, "profile", "v1")),
      getDoc(doc(db, "buyers", uid, "preferences", "v1")),
    ]);

    const user = userSnap.exists() ? (userSnap.data() as any) : {};
    const buyer = legacyBuyerSnap.exists() ? (legacyBuyerSnap.data() as any) : {};
    const namespacedProfile = namespacedProfileSnap.exists() ? (namespacedProfileSnap.data() as any) : {};
    const namespacedPrefs = namespacedPrefsSnap.exists() ? (namespacedPrefsSnap.data() as any) : {};

    const mode =
      (buyer.buyerRegistrationType as "LOCAL" | "INTERNATIONAL" | undefined) ||
      (user.buyerRegistrationType as "LOCAL" | "INTERNATIONAL" | undefined) ||
      "LOCAL";
    const internationalLocation =
      buyer.internationalLocation ?? user.internationalLocation ?? buyer.internationalProfile?.internationalLocation ?? {};

    return {
      ...fallback,
      displayName: user.displayName || buyer.fullName || fallback.displayName,
      companyName:
        buyer.internationalProfile?.companyName ||
        namespacedProfile.companyName ||
        buyer.buyerTypeDetails?.companyName ||
        fallback.companyName,
      buyerMode: mode,
      verificationStatus: mapVerificationStatus(namespacedProfile.approvalStatus || namespacedProfile.verificationStatus),
      metrics: {
        totalPurchasesKes: toNumber(namespacedProfile.totalSpendKes ?? namespacedProfile.totalPurchasesKes, 0),
        totalVolumeKg: toNumber(namespacedProfile.totalVolumeKg, 0),
        activeOrders: toNumber(namespacedProfile.activeOrders, 0),
        activeContracts: toNumber(namespacedProfile.activeContracts, 0),
        onTimePaymentRate: toNumber(namespacedProfile.onTimePaymentRate, 0),
        reliabilityScore: toNumber(namespacedProfile.reliabilityScore, 0),
      },
      sourcingFocus: {
        crops: buyer.crops || user.interestedCrops || [],
        preferredMarkets: buyer.markets || user.preferredMarkets || [],
        preferredRegions:
          mode === "INTERNATIONAL"
            ? internationalLocation.destinations || []
            : [buyer.county, buyer.subCounty, buyer.ward].filter(Boolean),
      },
      recentActivity: namespacedProfile.recentActivity || [],
      smartAlerts: namespacedProfile.smartAlerts || [],
      company: {
        companyName:
          buyer.internationalProfile?.companyName ||
          buyer.buyerTypeDetails?.companyName ||
          namespacedProfile.companyName ||
          user.displayName ||
          "Buyer",
        country: internationalLocation.buyerCountry || (mode === "LOCAL" ? "Kenya" : null),
        cityOrRegion: internationalLocation.buyerRegion || buyer.location || null,
        address: namespacedProfile.address || null,
        phone: buyer.phone || user.phone || null,
        whatsapp: buyer.internationalProfile?.contacts?.activeWhatsapp || null,
        email: user.email || null,
        website: buyer.internationalProfile?.companyWebsite || null,
        destinations: internationalLocation.destinations || [],
      },
      preferences: {
        monthlyVolume:
          buyer.internationalProfile?.monthlyPurchaseVolume ||
          buyer.monthlyDemand ||
          namespacedPrefs.monthlyVolume ||
          "",
        crops: buyer.crops || [],
        preferredMarkets: buyer.markets || [],
        deliveryRegions:
          mode === "INTERNATIONAL"
            ? internationalLocation.destinations || []
            : [buyer.county, buyer.subCounty, buyer.ward].filter(Boolean),
        qualityPreferences: namespacedPrefs.qualityPreferences || [],
        paymentPreferences: namespacedPrefs.paymentPreferences || [],
        notifications: {
          priceAlerts: namespacedPrefs.notifications?.priceAlerts ?? true,
          contractUpdates: namespacedPrefs.notifications?.contractUpdates ?? true,
          supplierMessages: namespacedPrefs.notifications?.supplierMessages ?? true,
        },
      },
      suppliers: namespacedProfile.suppliers || [],
      orders: namespacedProfile.orders || [],
      contracts: namespacedProfile.contracts || [],
      messages: namespacedProfile.messages || [],
    };
  } catch (error) {
    console.warn("buyerProfileService fallback failed:", error);
    return {
      ...fallback,
      recentActivity: [
        {
          id: "profile-ready",
          title: "Profile ready",
          detail: "No recent activity yet.",
          createdAt: nowIso(),
        },
      ],
    };
  }
}

export async function getBuyerProfileView(uid: string): Promise<BuyerProfileViewModel> {
  try {
    const buyer = await getBuyerMe();

    return {
      buyerId: uid,
      displayName: buyer.displayName || "Buyer Account",
      companyName: buyer.companyName || "Buyer",
      buyerMode: buyer.buyerType || "LOCAL",
      verificationStatus: mapVerificationStatus(buyer.approvalStatus),
      metrics: {
        totalPurchasesKes: toNumber(buyer.metrics?.totalSpendKes, 0),
        totalVolumeKg: toNumber((buyer.metrics as any)?.totalVolumeKg, 0),
        activeOrders: toNumber(buyer.metrics?.activeOrders, 0),
        activeContracts: toNumber(buyer.metrics?.activeContracts, 0),
        onTimePaymentRate: toNumber(buyer.metrics?.onTimePaymentRate, 0),
        reliabilityScore: toNumber(buyer.metrics?.reliabilityScore, 0),
      },
      sourcingFocus: {
        crops: Array.isArray((buyer.preferences as any)?.crops) ? ((buyer.preferences as any).crops as string[]) : [],
        preferredMarkets: Array.isArray((buyer.preferences as any)?.preferredMarkets)
          ? (((buyer.preferences as any).preferredMarkets as string[]) || [])
          : [],
        preferredRegions: Array.isArray((buyer.preferences as any)?.preferredRegions)
          ? (((buyer.preferences as any).preferredRegions as string[]) || [])
          : [],
      },
      recentActivity: [
        ...(Array.isArray((buyer.activity as any)?.recentOrders) ? (buyer.activity as any).recentOrders : []),
        ...(Array.isArray((buyer.activity as any)?.recentBids) ? (buyer.activity as any).recentBids : []),
        ...(Array.isArray((buyer.activity as any)?.recentMessages) ? (buyer.activity as any).recentMessages : []),
        ...(Array.isArray((buyer.activity as any)?.recentContractUpdates) ? (buyer.activity as any).recentContractUpdates : []),
      ]
        .slice(0, 12)
        .map((row: any, index: number) => ({
          id: String(row?.id || `activity-${index}`),
          title: String(row?.title || row?.name || row?.crop || "Activity"),
          detail: String(row?.detail || row?.status || ""),
          createdAt: String(row?.createdAt || row?.updatedAt || row?.date || nowIso()),
        })),
      smartAlerts: Array.isArray(buyer.alerts)
        ? buyer.alerts.map((alert: any, index: number) => ({
            id: String(alert?.id || `alert-${index}`),
            severity: ["low", "medium", "high"].includes(String(alert?.severity)) ? alert.severity : "low",
            title: String(alert?.title || "Alert"),
            detail: String(alert?.detail || alert?.description || ""),
            createdAt: String(alert?.createdAt || alert?.date || nowIso()),
          }))
        : [],
      company: {
        companyName: String((buyer.company as any)?.companyName || buyer.companyName || buyer.displayName || "Buyer"),
        country: (buyer.company as any)?.country || null,
        cityOrRegion: (buyer.company as any)?.cityOrRegion || null,
        address: (buyer.company as any)?.address || null,
        phone: (buyer.company as any)?.phone || buyer.phone || null,
        whatsapp: (buyer.company as any)?.whatsapp || null,
        email: (buyer.company as any)?.email || buyer.email || null,
        website: (buyer.company as any)?.website || null,
        destinations: Array.isArray((buyer.company as any)?.destinations)
          ? ((buyer.company as any).destinations as string[])
          : [],
      },
      preferences: {
        monthlyVolume: String((buyer.preferences as any)?.monthlyVolume || ""),
        crops: Array.isArray((buyer.preferences as any)?.crops) ? ((buyer.preferences as any).crops as string[]) : [],
        preferredMarkets: Array.isArray((buyer.preferences as any)?.preferredMarkets)
          ? (((buyer.preferences as any).preferredMarkets as string[]) || [])
          : [],
        deliveryRegions: Array.isArray((buyer.preferences as any)?.preferredRegions)
          ? (((buyer.preferences as any).preferredRegions as string[]) || [])
          : [],
        qualityPreferences: Array.isArray((buyer.preferences as any)?.qualityPreferences)
          ? (((buyer.preferences as any).qualityPreferences as string[]) || [])
          : [],
        paymentPreferences: Array.isArray((buyer.preferences as any)?.paymentPreferences)
          ? (((buyer.preferences as any).paymentPreferences as string[]) || [])
          : [],
        notifications: {
          priceAlerts: (buyer.preferences as any)?.notifications?.priceAlerts ?? true,
          contractUpdates: (buyer.preferences as any)?.notifications?.contractUpdates ?? true,
          supplierMessages: (buyer.preferences as any)?.notifications?.supplierMessages ?? true,
        },
      },
      suppliers: Array.isArray(buyer.suppliers) ? (buyer.suppliers as any[]) : [],
      orders: Array.isArray(buyer.orders) ? (buyer.orders as any[]) : [],
      contracts: Array.isArray(buyer.contracts) ? (buyer.contracts as any[]) : [],
      messages: Array.isArray(buyer.messages) ? (buyer.messages as any[]) : [],
    };
  } catch (error) {
    console.warn("getBuyerMe failed, using firestore fallback", error);
    return getFirestoreFallback(uid);
  }
}
