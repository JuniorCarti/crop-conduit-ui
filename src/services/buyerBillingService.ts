import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getBuyerMe } from "@/services/buyerAccountService";
import type {
  BuyerBillingViewModel,
  InvoiceRow,
  PaymentMethodRow,
  TransactionRow,
  UsageFeeRow,
} from "@/types/buyerDashboard";

const mapInvoices = (rows: any[] | undefined): InvoiceRow[] => {
  if (!Array.isArray(rows)) return [];
  return rows.map((row, index) => ({
    id: String(row?.id || `inv-${index}`),
    invoiceNumber: String(row?.invoiceNumber || row?.invoice || `INV-${index + 1}`),
    dateLabel: String(row?.dateLabel || row?.date || row?.createdAt || "--"),
    amountKes: Number(row?.amountKes ?? row?.amount ?? 0),
    status: ["paid", "pending", "failed", "draft"].includes(String(row?.status))
      ? (row.status as InvoiceRow["status"])
      : "draft",
    downloadUrl: row?.downloadUrl ? String(row.downloadUrl) : undefined,
  }));
};

const mapTransactions = (rows: any[] | undefined): TransactionRow[] => {
  if (!Array.isArray(rows)) return [];
  return rows.map((row, index) => ({
    id: String(row?.id || `tx-${index}`),
    reference: String(row?.reference || row?.paymentRef || `TX-${index + 1}`),
    dateLabel: String(row?.dateLabel || row?.date || row?.createdAt || "--"),
    type: ["subscription", "fee", "wallet"].includes(String(row?.type))
      ? (row.type as TransactionRow["type"])
      : "fee",
    amountKes: Number(row?.amountKes ?? row?.amount ?? 0),
    method: ["mpesa", "card", "bank", "other"].includes(String(row?.method))
      ? (row.method as TransactionRow["method"])
      : "other",
    status: ["success", "pending", "failed"].includes(String(row?.status))
      ? (row.status as TransactionRow["status"])
      : "pending",
    mpesaReceipt: row?.mpesaReceipt ? String(row.mpesaReceipt) : undefined,
  }));
};

const mapUsage = (rows: any[] | undefined): UsageFeeRow[] => {
  if (!Array.isArray(rows) || !rows.length) {
    return [
      { id: "usage-trade-fees", label: "Trade fees", amountKes: 0 },
      { id: "usage-verification", label: "Verification fees", amountKes: 0 },
      { id: "usage-premium", label: "Premium usage", amountKes: 0 },
    ];
  }
  return rows.map((row, index) => ({
    id: String(row?.id || `usage-${index}`),
    label: String(row?.label || "Usage"),
    amountKes: Number(row?.amountKes ?? row?.amount ?? 0),
    hint: row?.hint ? String(row.hint) : undefined,
  }));
};

const mapMethods = (rows: any[] | undefined): PaymentMethodRow[] => {
  if (!Array.isArray(rows) || !rows.length) {
    return [
      { id: "pm-mpesa", type: "mpesa", label: "M-Pesa not set", status: "inactive" },
      { id: "pm-card", type: "card", label: "Card not set", status: "inactive" },
    ];
  }

  return rows.map((row, index) => ({
    id: String(row?.id || `pm-${index}`),
    type: ["mpesa", "card", "bank"].includes(String(row?.type))
      ? (row.type as PaymentMethodRow["type"])
      : "bank",
    label: String(row?.label || row?.masked || "Payment method"),
    isDefault: Boolean(row?.isDefault),
    status: String(row?.status) === "active" ? "active" : "inactive",
  }));
};

async function firestoreFallback(uid: string): Promise<BuyerBillingViewModel> {
  const safeGet = async (path: [string, ...string[]]) => {
    try {
      const snap = await getDoc(doc(db, ...path));
      return snap.exists() ? (snap.data() as any) : {};
    } catch (error) {
      console.warn("buyer billing fallback read skipped", path.join("/"), error);
      return {};
    }
  };

  const [billingSnap, profileSnap] = await Promise.all([
    safeGet(["buyers", uid, "billing", "v1"]),
    safeGet(["buyers", uid, "profile", "v1"]),
  ]);

  const billing = billingSnap || {};
  const profile = profileSnap || {};

  return {
    buyerId: uid,
    currentPlan: {
      name:
        String(profile.premiumPlan || "NONE") === "GOLD_ADDON"
          ? "Pro"
          : String(profile.premiumPlan || "NONE") === "ENTERPRISE"
            ? "Enterprise"
            : "Free",
      renewalDate: billing.nextBillingDate || undefined,
      trialEndsAt: profile.trialEndAt || undefined,
      paymentSummary: billing.currency === "KES"
        ? `KES ${Number(billing.monthlyPriceKes || 0).toLocaleString()} / month`
        : "No active plan",
    },
    invoices: mapInvoices(billing.invoices),
    transactions: mapTransactions(billing.transactions),
    usageFees: mapUsage(billing.usageFees),
    paymentMethods: mapMethods(billing.paymentMethods),
    teamBilling: {
      seatCount: Number(billing.teamBilling?.seatCount || 1),
      canManageSeats: Boolean(billing.teamBilling?.canManageSeats),
    },
  };
}

export async function getBuyerBillingView(uid: string): Promise<BuyerBillingViewModel> {
  try {
    const buyer = await getBuyerMe();

    const nextBillingDate = buyer.billing?.nextBillingDate || undefined;
    return {
      buyerId: uid,
      currentPlan: {
        name:
          buyer.premiumPlan === "GOLD_ADDON"
            ? "Pro"
            : buyer.premiumPlan === "ENTERPRISE"
              ? "Enterprise"
              : "Free",
        renewalDate: nextBillingDate || undefined,
        trialEndsAt: buyer.trialEndAt || undefined,
        paymentSummary:
          buyer.billing?.currency === "KES"
            ? `KES ${Number(buyer.billing?.monthlyPriceKes || 0).toLocaleString()} / month`
            : "No active plan",
      },
      invoices: mapInvoices(buyer.invoices),
      transactions: mapTransactions(buyer.transactions),
      usageFees: mapUsage(buyer.usageFees),
      paymentMethods: mapMethods(buyer.paymentMethods),
      teamBilling: {
        seatCount: Number(buyer.teamBilling?.seatCount || 1),
        canManageSeats: Boolean(buyer.teamBilling?.canManageSeats),
      },
    };
  } catch (error) {
    console.warn("getBuyerBillingView backend failed, using firestore fallback", error);
    return firestoreFallback(uid);
  }
}
