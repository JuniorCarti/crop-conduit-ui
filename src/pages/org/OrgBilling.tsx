import { useEffect, useMemo, useState } from "react";
import { Lock, PlusCircle, ReceiptText, Settings2, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { toast } from "sonner";
import { useUserAccount } from "@/hooks/useUserAccount";
import {
  applyAutoUnassignOnSuspended,
  applyPlanTemplate,
  addPaidSeats,
  addSponsoredSeats,
  assignSeat,
  bootstrapOrgBilling,
  computeSeatUsage,
  confirmPayment,
  getOrgRole,
  getBillingSettings,
  getOrgSubscription,
  loadPlanTemplates,
  listBillingDocs,
  recreateSubscriptionFromFreeTemplate,
  unassignSeat,
  updateFeatureFlags,
  updatePlan,
  type BillingPlanTemplate,
  type BillingActor,
  type OrgBillingRole,
  type PlanId,
  type PlanTemplateId,
  type SeatType,
  type SubscriptionCurrent,
} from "@/services/billingService";
import { checkCreatorNeedsAdminMembershipFix, fixCreatorAdminMembership } from "@/services/orgService";

const USD_RATE = 150;

const planLabels: Record<PlanId, string> = {
  trial: "60-day Trial",
  coop_trial: "60-day Trial",
  free: "Free",
  coop_basic: "Coop Basic",
  coop_premium: "Coop Premium",
  enterprise: "Enterprise",
};

const lockByPlan: Record<string, PlanId> = {
  certificates: "coop_premium",
  targetsRewards: "coop_premium",
  csvOnboarding: "coop_premium",
};

const parseDate = (value: any) => {
  if (!value) return "--";
  const date = value?.toDate?.() ?? new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString();
};

export default function OrgBilling() {
  const accountQuery = useUserAccount();
  const orgId = accountQuery.data?.orgId ?? "";
  const role = accountQuery.data?.role ?? "";
  const actor: BillingActor = {
    uid: accountQuery.data?.uid ?? "unknown",
    name: accountQuery.data?.displayName ?? accountQuery.data?.email ?? "User",
  };

  const [loading, setLoading] = useState(true);
  const [provisioning, setProvisioning] = useState(false);
  const [provisionError, setProvisionError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionCurrent | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [usage, setUsage] = useState({
    paidUsed: 0,
    sponsoredUsed: 0,
    paidTotal: 0,
    sponsoredTotal: 0,
    paidRemaining: 0,
    sponsoredRemaining: 0,
    activeMembers: 0,
    premiumEnabledMembers: 0,
  });
  const [members, setMembers] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [ledger, setLedger] = useState<any[]>([]);

  const [featureDraft, setFeatureDraft] = useState<Record<string, boolean>>({});
  const [tab, setTab] = useState("overview");
  const [templates, setTemplates] = useState<BillingPlanTemplate[]>([]);
  const [planOpen, setPlanOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<PlanTemplateId>("free");
  const [selectedCycle, setSelectedCycle] = useState<"monthly" | "annual">("monthly");
  const [selectedPaidSeats, setSelectedPaidSeats] = useState("0");
  const [selectedSponsoredSeats, setSelectedSponsoredSeats] = useState("0");
  const [planPaymentMethod, setPlanPaymentMethod] = useState<"mpesa" | "bank_transfer">("mpesa");
  const [resetToTemplateDefaults, setResetToTemplateDefaults] = useState(false);

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentMode, setPaymentMode] = useState<"paid" | "sponsored">("paid");
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "bank_transfer">("mpesa");
  const [qty, setQty] = useState("1");
  const [pendingPurchase, setPendingPurchase] = useState<{ invoiceId: string; paymentId: string; amount: number } | null>(null);
  const [paymentReference, setPaymentReference] = useState("");
  const [canFixAdminAccess, setCanFixAdminAccess] = useState(false);
  const [fixingAdminAccess, setFixingAdminAccess] = useState(false);
  const [resolvedOrgRole, setResolvedOrgRole] = useState<OrgBillingRole>(null);

  const isPlatformAdmin = role === "admin" || role === "superadmin";
  const canAdmin = resolvedOrgRole === "org_admin" || isPlatformAdmin;
  const canStaffManage = resolvedOrgRole === "org_staff" && Boolean(settings?.staffCanManageBilling);
  const canManageBilling = canAdmin || canStaffManage;
  const canViewBilling = isPlatformAdmin || resolvedOrgRole === "org_admin" || resolvedOrgRole === "org_staff";

  const loadAll = async (): Promise<{ ok: boolean; isPermission: boolean }> => {
    const uid = accountQuery.data?.uid;
    if (!orgId || !uid) {
      setLoading(false);
      setProvisioning(false);
      setProvisionError("No organization context found.");
      return { ok: false, isPermission: false };
    }
    setLoading(true);
    setProvisionError(null);
    setCanFixAdminAccess(false);
    setResolvedOrgRole(null);
    try {
      const orgRoleResolved = await getOrgRole(orgId, uid);
      const fallbackRole =
        accountQuery.data?.orgId === orgId && (role === "org_admin" || role === "org_staff")
          ? (role as OrgBillingRole)
          : null;
      const orgRole = orgRoleResolved ?? fallbackRole;
      setResolvedOrgRole(orgRole);
      if (import.meta.env.DEV) {
        console.debug("[Billing] orgId", orgId, "uid", uid, "membershipRole", orgRoleResolved, "fallbackRole", fallbackRole, "userRole", role);
      }

      if (!isPlatformAdmin && !orgRole) {
        setProvisionError("No org membership found");
        setSubscription(null);
        setSettings(null);
        return { ok: false, isPermission: false };
      }

      let billingSettings: any = null;
      try {
        billingSettings = await getBillingSettings(orgId);
      } catch {
        billingSettings = {
          staffCanManageBilling: false,
          autoUnassignOnSuspension: false,
          autoUnassignSeatsOnSuspension: false,
        };
      }

      let sub: SubscriptionCurrent | null = null;
      try {
        sub = await getOrgSubscription(orgId);
      } catch (subError: any) {
        if (String(subError?.message || "").toLowerCase().includes("subscription not configured")) {
          sub = null;
        } else {
          throw subError;
        }
      }

      let memberRows: any[] = [];
      try {
        const memberSnap = await getDocs(collection(db, "orgs", orgId, "members"));
        memberRows = memberSnap.docs.map((snap) => ({ id: snap.id, ...(snap.data() as any) }));
      } catch {
        memberRows = [];
      }

      const docsResult = await listBillingDocs(orgId).catch(() => ({ invoices: [], payments: [], ledger: [] }));
      const templatesData = await loadPlanTemplates().catch(() => []);
      if (billingSettings?.autoUnassignSeatsOnSuspension || billingSettings?.autoUnassignOnSuspension) {
        await applyAutoUnassignOnSuspended(orgId, actor).catch(() => undefined);
      }
      setSubscription(sub);
      if (sub) {
        try {
          const usageData = await computeSeatUsage(orgId);
          setUsage(usageData);
        } catch {
          const paidTotal = Number((sub as any)?.seats?.paidTotal ?? 0);
          const sponsoredTotal = Number((sub as any)?.seats?.sponsoredTotal ?? 0);
          setUsage({
            paidUsed: 0,
            sponsoredUsed: 0,
            paidTotal,
            sponsoredTotal,
            paidRemaining: paidTotal,
            sponsoredRemaining: sponsoredTotal,
            activeMembers: 0,
            premiumEnabledMembers: 0,
          });
        }
      } else {
        setUsage({
          paidUsed: 0,
          sponsoredUsed: 0,
          paidTotal: 0,
          sponsoredTotal: 0,
          paidRemaining: 0,
          sponsoredRemaining: 0,
          activeMembers: 0,
          premiumEnabledMembers: 0,
        });
      }
      setSettings(billingSettings);
      setFeatureDraft(sub?.featureFlags ?? {});
      setTemplates(templatesData);
      setMembers(memberRows);
      setInvoices(docsResult.invoices);
      setPayments(docsResult.payments);
      setLedger(docsResult.ledger);
      return { ok: true, isPermission: false };
    } catch (error: any) {
      setProvisioning(false);
      const code = typeof error?.code === "string" ? error.code : "";
      const message = typeof error?.message === "string" ? error.message : "Failed to load billing data.";
      if (import.meta.env.DEV) {
        console.error("[Billing] load failed", {
          uid,
          orgId,
          role,
          orgRole: resolvedOrgRole,
          errorCode: code,
          errorMessage: message,
        });
      }
      const isPermission = code.includes("permission-denied") || /insufficient permissions/i.test(message);
      setProvisionError(isPermission ? "Permissions blocked by Firestore rules" : "Failed to load billing data");
      toast.error(
        isPermission
          ? `Billing data blocked by Firestore rules. Confirm your member role is org_admin in orgs/${orgId}/members/${uid}.`
          : "Failed to load billing data."
      );
      if (isPermission && accountQuery.data?.uid && orgId) {
        try {
          const needsFix = await checkCreatorNeedsAdminMembershipFix(orgId, accountQuery.data.uid);
          setCanFixAdminAccess(needsFix);
        } catch {
          setCanFixAdminAccess(false);
        }
      }
      return { ok: false, isPermission };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll().catch(() => undefined);
  }, [orgId, accountQuery.data?.uid]);

  const retrySetup = async () => {
    const result = await loadAll();
    if (result.ok) {
      toast.success("Billing setup checked successfully.");
    }
  };

  const setupTrial = async () => {
    if (!canAdmin) {
      toast.error("You are not org_admin or allowed staff");
      return;
    }
    if (!orgId) return;
    setProvisioning(true);
    try {
      const provisioned = await bootstrapOrgBilling(orgId, actor);
      if (provisioned.createdSubscription || provisioned.createdSettings) {
        toast.success("60-day trial setup completed.");
      } else {
        toast.success("Subscription already configured.");
      }
      await loadAll();
    } catch (error: any) {
      const code = typeof error?.code === "string" ? error.code : "";
      const isPermission = code.includes("permission-denied");
      toast.error(
        isPermission
          ? "Access denied: ensure you are org_admin and user profile has orgId/role."
          : "Failed to setup trial."
      );
    } finally {
      setProvisioning(false);
    }
  };

  const handleFixAdminAccess = async () => {
    if (!orgId || !accountQuery.data?.uid) return;
    setFixingAdminAccess(true);
    try {
      await fixCreatorAdminMembership({
        orgId,
        uid: accountQuery.data.uid,
        name: accountQuery.data.displayName ?? null,
        email: accountQuery.data.email ?? null,
      });
      toast.success("Admin access fixed.");
      await loadAll();
    } catch (error: any) {
      toast.error(error?.message || "Failed to fix admin access.");
    } finally {
      setFixingAdminAccess(false);
    }
  };

  const monthlyEstimate = useMemo(() => {
    if (!subscription) return 0;
    const paid = Number(subscription.seats?.paidTotal ?? 0) * Number(subscription.seatPricing?.perSeat ?? 0);
    const sponsored = Number(subscription.seats?.sponsoredTotal ?? 0) * Number(subscription.seatPricing?.sponsoredPerSeat ?? 0);
    return paid + sponsored;
  }, [subscription]);

  const usdEstimate = useMemo(() => monthlyEstimate / USD_RATE, [monthlyEstimate]);
  const trialEndsAt = useMemo(() => {
    if (!subscription?.trialEndsAt) return null;
    const date = subscription.trialEndsAt?.toDate?.() ?? new Date(subscription.trialEndsAt);
    return Number.isNaN(date.getTime()) ? null : date;
  }, [subscription?.trialEndsAt]);
  const trialDaysLeft = useMemo(() => {
    if (!trialEndsAt) return null;
    return Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }, [trialEndsAt]);

  const activeMembers = useMemo(
    () => members.filter((member) => (member.status ?? member.verificationStatus) === "active"),
    [members]
  );

  const sponsoredMembers = useMemo(
    () => activeMembers.filter((member) => (member.seatType ?? member.seatStatus ?? member.premiumSeatType ?? "none") === "sponsored"),
    [activeMembers]
  );

  const changeSeat = async (memberId: string, seatType: SeatType) => {
    if (!canManageBilling) return;
    try {
      if (seatType === "none") {
        await unassignSeat(orgId, memberId, actor);
      } else {
        await assignSeat(orgId, memberId, seatType, actor);
      }
      toast.success("Seat assignment updated.");
      await loadAll();
    } catch (error: any) {
      toast.error(error?.message || "Failed to update seat assignment.");
    }
  };

  const saveFeatureFlags = async () => {
    if (!canAdmin) return;
    try {
      await updateFeatureFlags(orgId, featureDraft);
      toast.success("Feature flags updated.");
      await loadAll();
    } catch (error) {
      toast.error("Failed to update feature flags.");
    }
  };

  const submitSeatPurchase = async () => {
    const parsedQty = Number(qty);
    if (!Number.isFinite(parsedQty) || parsedQty <= 0) {
      toast.error("Enter a valid quantity.");
      return;
    }

    try {
      const result =
        paymentMode === "paid"
          ? await addPaidSeats(orgId, parsedQty, actor, paymentMethod)
          : await addSponsoredSeats(orgId, parsedQty, actor, paymentMethod);
      setPendingPurchase(result);
      setPaymentReference("");
      toast.success("Invoice created. Confirm payment to activate seats.");
    } catch (error: any) {
      toast.error(error?.message || "Failed to create invoice.");
    }
  };

  const confirmPendingPayment = async () => {
    if (!pendingPurchase) return;
    if (!paymentReference.trim()) {
      toast.error("Enter payment reference.");
      return;
    }
    try {
      await confirmPayment({
        orgId,
        invoiceId: pendingPurchase.invoiceId,
        paymentId: pendingPurchase.paymentId,
        reference: paymentReference.trim(),
        actor,
      });
      toast.success("Payment confirmed and seats added.");
      setPendingPurchase(null);
      setPaymentOpen(false);
      await loadAll();
    } catch (error: any) {
      toast.error(error?.message || "Failed to confirm payment.");
    }
  };

  const setPlan = async (planId: PlanId) => {
    if (!canAdmin) return;
    try {
      await updatePlan(orgId, planId, actor);
      toast.success(`Plan updated to ${planLabels[planId]}.`);
      await loadAll();
    } catch (error) {
      toast.error("Failed to update plan.");
    }
  };

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.planId === selectedTemplateId) ?? null,
    [templates, selectedTemplateId]
  );

  useEffect(() => {
    if (!selectedTemplate) return;
    setSelectedPaidSeats(String(selectedTemplate.defaultSeats.paidTotal));
    setSelectedSponsoredSeats(String(selectedTemplate.defaultSeats.sponsoredTotal));
  }, [selectedTemplate?.planId]);

  const applySelectedTemplate = async () => {
    if (!canAdmin) return;
    const seats = {
      paidTotal: Number(selectedPaidSeats || 0),
      sponsoredTotal: Number(selectedSponsoredSeats || 0),
    };
    if (!Number.isFinite(seats.paidTotal) || !Number.isFinite(seats.sponsoredTotal) || seats.paidTotal < 0 || seats.sponsoredTotal < 0) {
      toast.error("Enter valid seat totals.");
      return;
    }
    try {
      const result = await applyPlanTemplate({
        orgId,
        planId: selectedTemplateId,
        billingCycle: selectedCycle,
        actor,
        paymentMethod: planPaymentMethod,
        seats,
        resetToTemplateDefaults,
      });
      if (result.requiresPayment) {
        setPendingPurchase({ invoiceId: result.invoiceId, paymentId: result.paymentId, amount: result.amount });
        setPaymentReference("");
        setPlanOpen(false);
        setPaymentOpen(true);
        toast.success("Plan invoice created. Confirm payment to activate.");
      } else {
        setPlanOpen(false);
        toast.success("Plan applied successfully.");
      }
      await loadAll();
    } catch (error: any) {
      toast.error(error?.message || "Failed to apply template.");
    }
  };

  const recreateFromFree = async () => {
    if (!canAdmin) return;
    try {
      await recreateSubscriptionFromFreeTemplate(orgId, actor);
      toast.success("Subscription recreated from free template.");
      await loadAll();
    } catch (error: any) {
      toast.error(error?.message || "Failed to recreate subscription.");
    }
  };

  if (loading) {
    return (
      <Card className="border-border/60">
        <CardContent className="p-6 text-sm text-muted-foreground">
          {provisioning ? "Setting up billing..." : "Loading billing..."}
        </CardContent>
      </Card>
    );
  }

  if (provisionError) {
    const errorTitle =
      provisionError === "No org membership found"
        ? "No org membership found"
        : provisionError === "Permissions blocked by Firestore rules"
        ? "Permissions blocked by Firestore rules"
        : "Failed to load billing data";
    return (
      <Card className="border-border/60">
        <CardHeader><CardTitle className="text-base">{errorTitle}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{provisionError}</p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={retrySetup}>Retry setup</Button>
            {canAdmin && <Button variant="outline" onClick={setupTrial} disabled={provisioning}>Setup trial</Button>}
            {canFixAdminAccess && (
              <Button variant="outline" onClick={handleFixAdminAccess} disabled={fixingAdminAccess}>
                {fixingAdminAccess ? "Fixing..." : "Fix Admin Access"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card className="border-border/60">
        <CardHeader><CardTitle className="text-base">Subscription not configured</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>No subscription document found for this organization.</p>
          <div className="flex flex-wrap gap-2">
            {canAdmin && (
              <Button onClick={setupTrial} disabled={provisioning}>
                {provisioning ? "Setting up..." : "Setup 60-day trial"}
              </Button>
            )}
            <Button variant="outline" onClick={retrySetup}>Refresh</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!canViewBilling) {
    return (
      <Card className="border-border/60">
        <CardHeader><CardTitle className="text-base">Access restricted</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Only organization admin or staff can view billing.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {(subscription.planId === "trial" || subscription.planId === "coop_trial") && (
        <Card className={`border ${trialDaysLeft !== null && trialDaysLeft <= 0 ? "border-destructive/40 bg-destructive/5" : "border-primary/40 bg-primary/5"}`}>
          <CardContent className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm">
              <p className="font-semibold">60-day trial</p>
              <p className="text-muted-foreground">
                {trialDaysLeft !== null && trialDaysLeft > 0
                  ? `${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} remaining • Ends ${parseDate(subscription.trialEndsAt)}`
                  : "Trial expired - upgrade to continue."}
              </p>
            </div>
            <Button onClick={() => setPlanOpen(true)} disabled={!canAdmin}>Upgrade plan</Button>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/60">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle className="text-base">Subscription & Settings</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={retrySetup}>Refresh</Button>
            {canAdmin && <Button size="sm" onClick={setupTrial} disabled={provisioning}>Open Setup</Button>}
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Plan</p>
            <p className="font-semibold">{subscription.planId}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <Badge variant="secondary">{subscription.status}</Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Billing cycle</p>
            <p className="font-semibold">{subscription.billingCycle}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Start</p>
            <p className="font-semibold">{parseDate(subscription.startAt)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Trial ends</p>
            <p className="font-semibold">{parseDate(subscription.trialEndsAt)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Renews</p>
            <p className="font-semibold">{parseDate(subscription.renewAt)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Seats</p>
            <p className="font-semibold">Paid {subscription.seats?.paidTotal ?? 0} / Sponsored {subscription.seats?.sponsoredTotal ?? 0}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Pricing (KES)</p>
            <p className="font-semibold">Paid {Number(subscription.seatPricing?.perSeat ?? 0)} / Sponsored {Number(subscription.seatPricing?.sponsoredPerSeat ?? 0)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Settings</p>
            <p className="font-semibold">
              staffCanManageBilling: {settings?.staffCanManageBilling ? "true" : "false"} • autoUnassign: {settings?.autoUnassignOnSuspension ?? settings?.autoUnassignSeatsOnSuspension ? "true" : "false"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-lg">Group Subscription & Billing</CardTitle>
            <p className="text-sm text-muted-foreground">
              Plan {planLabels[subscription.planId] ?? subscription.planId} • {subscription.status} • Renews {parseDate(subscription.renewAt)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setPlanOpen(true)} disabled={!canAdmin}>Change plan</Button>
            <Select value={subscription.planId} onValueChange={(value) => setPlan(value as PlanId)} disabled={!canAdmin}>
              <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="coop_basic">Coop Basic</SelectItem>
                <SelectItem value="coop_premium">Coop Premium</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => { setPaymentMode("paid"); setPaymentOpen(true); }} disabled={!canManageBilling}>Add seats</Button>
            <Button variant="outline" onClick={() => { setPaymentMode("sponsored"); setPaymentOpen(true); }} disabled={!canManageBilling}>Add sponsored seats</Button>
            <Button variant="outline" onClick={() => setTab("invoices")}><ReceiptText className="h-4 w-4 mr-1"/>View invoices</Button>
            <Button variant="ghost" onClick={recreateFromFree} disabled={!canAdmin}>Fix missing subscription</Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/60"><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Paid seats</p><p className="text-xl font-semibold">{usage.paidUsed}/{usage.paidTotal}</p><p className="text-xs text-muted-foreground">Remaining {usage.paidRemaining}</p></CardContent></Card>
        <Card className="border-border/60"><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Sponsored seats</p><p className="text-xl font-semibold">{usage.sponsoredUsed}/{usage.sponsoredTotal}</p><p className="text-xs text-muted-foreground">Remaining {usage.sponsoredRemaining}</p></CardContent></Card>
        <Card className="border-border/60"><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Active members</p><p className="text-xl font-semibold">{usage.activeMembers}</p><p className="text-xs text-muted-foreground">Premium enabled {usage.premiumEnabledMembers}</p></CardContent></Card>
        <Card className="border-border/60"><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Monthly estimate</p><p className="text-xl font-semibold">KES {monthlyEstimate.toLocaleString()}</p><p className="text-xs text-muted-foreground">~ USD {usdEstimate.toFixed(2)}</p></CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="features">Feature unlocks</TabsTrigger>
          <TabsTrigger value="seats">Seat manager</TabsTrigger>
          <TabsTrigger value="sponsored">Sponsored farmers</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card className="border-border/60">
            <CardHeader><CardTitle className="text-base">Cost summary</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>Per paid seat: KES {Number(subscription.seatPricing.perSeat ?? 0).toLocaleString()}</p>
              <p>Per sponsored seat: KES {Number(subscription.seatPricing.sponsoredPerSeat ?? 0).toLocaleString()}</p>
              <p>Billing cycle: {subscription.billingCycle}</p>
              <p>Next invoice estimate: KES {monthlyEstimate.toLocaleString()}</p>
              <p>Last payment: {payments[0] ? `KES ${Number(payments[0].amount ?? 0).toLocaleString()} (${payments[0].status})` : "--"}</p>
              {resolvedOrgRole === "org_staff" && !settings?.staffCanManageBilling && (
                <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800 text-xs flex items-center gap-2"><Lock className="h-3 w-3"/>Read-only mode: staff billing controls disabled.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <Card className="border-border/60">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Feature unlocks</CardTitle>
              <Button size="sm" onClick={saveFeatureFlags} disabled={!canAdmin}>Save feature flags</Button>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {Object.entries(featureDraft).map(([flag, enabled]) => {
                const lockPlan = lockByPlan[flag];
                const locked = lockPlan
                  ? (subscription.planId === "free"
                    || (lockPlan === "coop_premium"
                      && subscription.planId !== "coop_premium"
                      && subscription.planId !== "enterprise"
                      && subscription.planId !== "trial"
                      && subscription.planId !== "coop_trial"))
                  : false;
                return (
                  <div key={flag} className="flex items-center justify-between rounded border border-border/60 p-3">
                    <div>
                      <p className="text-sm font-medium">{flag}</p>
                      {locked && <p className="text-xs text-muted-foreground">Upgrade required</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      {locked && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                      <Switch
                        checked={enabled}
                        disabled={!canAdmin || locked}
                        onCheckedChange={(checked) => setFeatureDraft((prev) => ({ ...prev, [flag]: checked }))}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seats" className="space-y-4">
          <Card className="border-border/60">
            <CardHeader><CardTitle className="text-base">Seat assignment manager</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Seat type</TableHead>
                    <TableHead>Assigned by</TableHead>
                    <TableHead>Assigned at</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeMembers.length === 0 ? (
                    <TableRow><TableCell colSpan={6}>No active members.</TableCell></TableRow>
                  ) : (
                    activeMembers.map((member) => {
                      const seatType = (member.seatType ?? member.seatStatus ?? member.premiumSeatType ?? "none") as SeatType;
                      return (
                        <TableRow key={member.id}>
                          <TableCell>
                            <p className="font-medium">{member.fullName || member.memberUniqueId || member.id}</p>
                            <p className="text-xs text-muted-foreground">{member.memberUniqueId || member.memberId || "No ID"}</p>
                          </TableCell>
                          <TableCell><Badge variant="secondary">{member.status ?? member.verificationStatus}</Badge></TableCell>
                          <TableCell>
                            <Select value={seatType} onValueChange={(value) => changeSeat(member.id, value as SeatType)} disabled={!canManageBilling}>
                              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">none</SelectItem>
                                <SelectItem value="paid" disabled={usage.paidRemaining <= 0 && seatType !== "paid"}>paid</SelectItem>
                                <SelectItem value="sponsored" disabled={usage.sponsoredRemaining <= 0 && seatType !== "sponsored"}>sponsored</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>{member.seatAssignedByName ?? "--"}</TableCell>
                          <TableCell>{parseDate(member.seatAssignedAt)}</TableCell>
                          <TableCell className="text-right">
                            {seatType !== "none" && (
                              <Button variant="outline" size="sm" onClick={() => changeSeat(member.id, "none")} disabled={!canManageBilling}>Unassign</Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
              <p className="text-xs text-muted-foreground mt-3">Premium access is enabled only when a seat is assigned.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sponsored">
          <Card className="border-border/60">
            <CardHeader><CardTitle className="text-base">Sponsored farmers</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {sponsoredMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No sponsored members currently.</p>
              ) : (
                sponsoredMembers.map((member) => (
                  <div key={member.id} className="rounded border border-border/60 p-3 text-sm">
                    <p className="font-medium">{member.fullName || member.memberUniqueId || member.id}</p>
                    <p className="text-xs text-muted-foreground">Seat assigned: {parseDate(member.seatAssignedAt)}</p>
                  </div>
                ))
              )}
              {usage.sponsoredRemaining <= 0 && <p className="text-xs text-amber-700">Sponsored seats exhausted. Add more seats to sponsor additional farmers.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card className="border-border/60">
            <CardHeader><CardTitle className="text-base">Subscription timeline</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {ledger.length === 0 ? (
                <p className="text-sm text-muted-foreground">No billing events yet.</p>
              ) : (
                ledger.slice(0, 30).map((event) => (
                  <div key={event.id} className="rounded border border-border/60 p-3 text-sm">
                    <p className="font-medium">{event.type}</p>
                    <p className="text-xs text-muted-foreground">{event.actorName} • {parseDate(event.createdAt)}</p>
                    {event.note && <p className="text-xs mt-1">{event.note}</p>}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card className="border-border/60">
            <CardHeader><CardTitle className="text-base">Invoices</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.length === 0 ? (
                    <TableRow><TableCell colSpan={5}>No invoices yet.</TableCell></TableRow>
                  ) : (
                    invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell><Badge variant={invoice.status === "paid" ? "default" : "secondary"}>{invoice.status}</Badge></TableCell>
                        <TableCell>KES {Number(invoice.amount ?? 0).toLocaleString()}</TableCell>
                        <TableCell>{parseDate(invoice.periodStart)} - {parseDate(invoice.periodEnd)}</TableCell>
                        <TableCell>{invoice.paymentMethod ?? "--"}</TableCell>
                        <TableCell>{invoice.reference ?? "--"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card className="border-border/60">
            <CardHeader><CardTitle className="text-base">Payments</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.length === 0 ? (
                    <TableRow><TableCell colSpan={5}>No payments yet.</TableCell></TableRow>
                  ) : (
                    payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>KES {Number(payment.amount ?? 0).toLocaleString()}</TableCell>
                        <TableCell>{payment.method}</TableCell>
                        <TableCell><Badge variant={payment.status === "confirmed" ? "default" : "secondary"}>{payment.status}</Badge></TableCell>
                        <TableCell>{payment.reference ?? "--"}</TableCell>
                        <TableCell>{parseDate(payment.createdAt)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={paymentOpen} onOpenChange={(open) => { setPaymentOpen(open); if (!open) setPendingPurchase(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{paymentMode === "paid" ? "Add paid seats" : "Add sponsored seats"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Quantity</Label>
                <Input value={qty} onChange={(event) => setQty(event.target.value)} />
              </div>
              <div>
                <Label>Payment method</Label>
                <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as "mpesa" | "bank_transfer")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mpesa">MPESA Paybill (simulated)</SelectItem>
                    <SelectItem value="bank_transfer">Bank transfer (simulated)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {!pendingPurchase ? (
              <Button onClick={submitSeatPurchase} disabled={!canManageBilling}>
                <PlusCircle className="h-4 w-4 mr-2" />Create invoice
              </Button>
            ) : (
              <div className="space-y-3 rounded border border-border/60 p-3 text-sm">
                <p className="font-medium">Invoice created: {pendingPurchase.invoiceId}</p>
                <p>Amount: KES {pendingPurchase.amount.toLocaleString()}</p>
                {paymentMethod === "mpesa" ? (
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Paybill: 222222</p>
                    <p>Account: AGRI-{orgId}-{pendingPurchase.invoiceId}</p>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Bank: AgriSmart Demo Bank</p>
                    <p>Account: AgriSmart Ltd (0101010101)</p>
                    <p>Reference: AGRI-{orgId}-{pendingPurchase.invoiceId}</p>
                  </div>
                )}
                <div>
                  <Label>Payment reference</Label>
                  <Input value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} placeholder="QWE123XYZ" />
                </div>
                <Button onClick={confirmPendingPayment}>Confirm payment</Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={planOpen} onOpenChange={setPlanOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>Change plan using templates</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              {templates.map((template) => (
                <button
                  key={template.planId}
                  type="button"
                  className={`rounded-lg border p-3 text-left ${selectedTemplateId === template.planId ? "border-primary" : "border-border/60"}`}
                  onClick={() => setSelectedTemplateId(template.planId)}
                >
                  <p className="font-semibold">{template.name}</p>
                  <p className="text-xs text-muted-foreground">{template.description}</p>
                </button>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Billing cycle</Label>
                <Select value={selectedCycle} onValueChange={(value) => setSelectedCycle(value as "monthly" | "annual")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">monthly</SelectItem>
                    <SelectItem value="annual">annual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Payment method</Label>
                <Select value={planPaymentMethod} onValueChange={(value) => setPlanPaymentMethod(value as "mpesa" | "bank_transfer")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mpesa">MPESA (simulated)</SelectItem>
                    <SelectItem value="bank_transfer">Bank transfer (simulated)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Paid seats</Label>
                <Input value={selectedPaidSeats} onChange={(event) => setSelectedPaidSeats(event.target.value)} />
              </div>
              <div>
                <Label>Sponsored seats</Label>
                <Input value={selectedSponsoredSeats} onChange={(event) => setSelectedSponsoredSeats(event.target.value)} />
              </div>
            </div>
            {selectedTemplate && (
              <div className="rounded-lg border border-border/60 p-3 text-sm">
                <p>
                  Cost estimate: KES{" "}
                  {(
                    Number(selectedPaidSeats || 0) * Number((selectedCycle === "annual" ? selectedTemplate.seatPricing.annual.perSeat : selectedTemplate.seatPricing.monthly.perSeat) || 0) +
                    Number(selectedSponsoredSeats || 0) * Number((selectedCycle === "annual" ? selectedTemplate.seatPricing.annual.sponsoredPerSeat : selectedTemplate.seatPricing.monthly.sponsoredPerSeat) || 0)
                  ).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  ~ USD{" "}
                  {(
                    (
                      Number(selectedPaidSeats || 0) * Number((selectedCycle === "annual" ? selectedTemplate.seatPricing.annual.perSeat : selectedTemplate.seatPricing.monthly.perSeat) || 0) +
                      Number(selectedSponsoredSeats || 0) * Number((selectedCycle === "annual" ? selectedTemplate.seatPricing.annual.sponsoredPerSeat : selectedTemplate.seatPricing.monthly.sponsoredPerSeat) || 0)
                    ) / USD_RATE
                  ).toFixed(2)}
                </p>
              </div>
            )}
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={resetToTemplateDefaults} onCheckedChange={setResetToTemplateDefaults} />
              Reset to template defaults (discard feature overrides)
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPlanOpen(false)}>Cancel</Button>
              <Button onClick={applySelectedTemplate}>Apply template</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

