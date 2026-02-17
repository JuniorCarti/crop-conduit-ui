import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Building2, Users, UserCog, BarChart3, GraduationCap, FileText, Trophy, Award, Handshake, PackageCheck, Wallet, LineChart, FileSpreadsheet, Store, Globe2 } from "lucide-react";
import { useUserAccount } from "@/hooks/useUserAccount";
import { useEffect, useState } from "react";
import { getOrganization } from "@/services/orgService";
import type { OrganizationDoc } from "@/services/orgService";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { useOrgType } from "@/hooks/useOrgType";
import { hasOrgCapability } from "@/config/orgCapabilities";
import { AgriSmartLogo } from "@/components/Brand/AgriSmartLogo";
import { getOrgFeatureFlags } from "@/services/orgFeaturesService";
import { StatusPill } from "@/components/shared/StatusPill";
import { ProfileDropdown } from "@/components/shared/ProfileDropdown";

const navItems = [
  { to: "/org", label: "Dashboard", icon: Building2, capability: "members" as const, feature: null },
  { to: "/org/members", label: "Members", icon: Users, capability: "members" as const, feature: null },
  { to: "/org/staff", label: "Staff", icon: UserCog, capability: "members" as const, feature: null },
  { to: "/org/aggregation", label: "Aggregation", icon: BarChart3, capability: "aggregation" as const, feature: "harvestPlanner" },
  { to: "/org/group-prices", label: "Group Prices", icon: BarChart3, capability: "prices" as const, feature: "groupPrices" },
  { to: "/org/training", label: "Training", icon: GraduationCap, capability: "training" as const, feature: "training" },
  { to: "/org/certificates", label: "Certificates", icon: Award, capability: "certificates" as const, feature: "certificates" },
  { to: "/org/targets", label: "Targets & Rewards", icon: Trophy, capability: "targets" as const, feature: "targetsRewards" },
  { to: "/org/billing", label: "Billing", icon: FileText, capability: "billing" as const, feature: null, settingsFlag: null },
  { to: "/org/sponsorships", label: "Sponsorships", icon: Handshake, capability: "members" as const, feature: null, settingsFlag: "phase3Sponsorships" },
  { to: "/org/sales-batches", label: "Sales Batches", icon: PackageCheck, capability: "members" as const, feature: null, settingsFlag: "phase3SellOnBehalf" },
  { to: "/org/revenue-model", label: "Revenue Model", icon: Wallet, capability: "billing" as const, feature: null, settingsFlag: "phase3RevenueShare" },
  { to: "/org/impact", label: "Impact", icon: LineChart, capability: "members" as const, feature: null, settingsFlag: "phase3Impact" },
  { to: "/org/reports", label: "Reports", icon: FileSpreadsheet, capability: "members" as const, feature: null, settingsFlag: "phase3Reports" },
  { to: "/org/trade", label: "Trade / Exchange", icon: Store, capability: "members" as const, feature: null, settingsFlag: "coopTradeEnabled" },
  { to: "/org/international", label: "International Markets", icon: Globe2, capability: "members" as const, feature: null, settingsFlag: "coopTradeEnabled", envFlag: "intlSim" as const },
];

const envTradeEnabled = String((import.meta as any).env?.VITE_ENABLE_COOP_TRADE ?? "false").toLowerCase() === "true";
const envIntlEnabled = String((import.meta as any).env?.VITE_INTL_SIM_ENABLED ?? "false").toLowerCase() === "true";

export function OrgLayout() {
  const accountQuery = useUserAccount();
  const [org, setOrg] = useState<OrganizationDoc | null>(null);
  const [featureFlags, setFeatureFlags] = useState<Record<string, boolean>>({});
  const [orgSettingsFlags, setOrgSettingsFlags] = useState<Record<string, boolean>>({});
  const { orgType } = useOrgType();
  const navigate = useNavigate();

  useEffect(() => {
    const orgId = accountQuery.data?.orgId;
    if (!orgId) return;
    getOrganization(orgId).then(setOrg).catch(() => setOrg(null));
  }, [accountQuery.data?.orgId, accountQuery.isFetched]);

  useEffect(() => {
    const orgId = accountQuery.data?.orgId;
    if (!orgId) return;
    getOrgFeatureFlags(orgId)
      .then((flags) => setOrgSettingsFlags(flags as unknown as Record<string, boolean>))
      .catch(() => setOrgSettingsFlags({}));
  }, [accountQuery.data?.orgId, accountQuery.isFetched]);

  useEffect(() => {
    const orgId = accountQuery.data?.orgId;
    if (!orgId) return;
    getDoc(doc(db, "orgs", orgId, "subscription", "current"))
      .then((snap) => {
        if (!snap.exists()) {
          setFeatureFlags({});
          return;
        }
        const data = snap.data() as any;
        setFeatureFlags(data.featureFlags ?? {});
      })
      .catch(() => setFeatureFlags({}));
  }, [accountQuery.data?.orgId, accountQuery.isFetched]);

  if (accountQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <p className="text-sm text-muted-foreground">Loading organization profile...</p>
        </div>
      </div>
    );
  }

  if (accountQuery.isFetched && !accountQuery.data?.orgId) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h1 className="text-lg font-semibold text-foreground">Organization setup incomplete</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We could not find an organization linked to your account. Please retry or contact support.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => accountQuery.refetch()} variant="default">
                Retry loading
              </Button>
              <Button onClick={() => window.location.reload()} variant="ghost">
                Refresh page
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <AgriSmartLogo variant="inline" size="sm" showTagline={false} />
            <h1 className="text-xl font-semibold text-foreground">{org?.name ?? "Organization Portal"}</h1>
            <p className="text-sm text-muted-foreground">
              {org?.type ? `Type: ${org.type}` : "Organization overview and tools."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {org?.type && <StatusPill label={org.type} variant="none" />}
            <StatusPill
              label={(org as any)?.verificationStatus ?? org?.status ?? "active"}
              variant={((org as any)?.verificationStatus ?? org?.status ?? "active") === "approved" || ((org as any)?.verificationStatus ?? org?.status ?? "active") === "active" ? "active" : (((org as any)?.verificationStatus ?? org?.status ?? "active") === "pending" ? "pending" : "none")}
            />
            <Button size="sm" variant="outline" onClick={() => navigate("/org")}>
              Back to Dashboard
            </Button>
            <ProfileDropdown settingsPath="/org/profile" />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          <nav className="flex gap-2 overflow-x-auto lg:flex-col">
            {(navItems.filter((item) => hasOrgCapability(orgType, item.capability)
              && (item.feature ? featureFlags[item.feature] !== false : true)
              && (item.settingsFlag
                ? item.settingsFlag === "coopTradeEnabled"
                  ? envTradeEnabled || orgSettingsFlags[item.settingsFlag] === true
                  : orgSettingsFlags[item.settingsFlag] === true
                : true)
              && (item.envFlag === "intlSim" ? envIntlEnabled : true)).length
              ? navItems.filter((item) => hasOrgCapability(orgType, item.capability)
                && (item.feature ? featureFlags[item.feature] !== false : true)
                && (item.settingsFlag
                  ? item.settingsFlag === "coopTradeEnabled"
                    ? envTradeEnabled || orgSettingsFlags[item.settingsFlag] === true
                    : orgSettingsFlags[item.settingsFlag] === true
                  : true)
                && (item.envFlag === "intlSim" ? envIntlEnabled : true))
              : [{ to: "/org", label: "Dashboard", icon: Building2, capability: "members" as const, feature: null }]
            ).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                    isActive ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="space-y-4">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
