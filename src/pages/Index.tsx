import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  Calendar,
  CloudRain,
  CloudSun,
  Droplets,
  Leaf,
  Lock,
  Mic,
  Sprout,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { PageHeader } from "@/components/layout/PageHeader";
import { AlertCard } from "@/components/shared/AlertCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useFarms } from "@/hooks/useClimate";
import { getFarmerProfileWithMigration, type FarmerProfile } from "@/services/firestore-farmer";
import {
  useAlerts,
  useCashflow,
  useCropPrices,
  useFieldData,
  useHarvestSchedule,
} from "@/hooks/useApi";
import { FEATURES } from "@/config/featureAccess";
import { usePremiumModalStore } from "@/store/premiumStore";
import { formatKsh } from "@/lib/currency";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const quickActions = [
  {
    label: "Climate Insights",
    icon: CloudSun,
    route: "/climate",
    tone: "text-info",
    bg: "bg-info/10",
  },
  {
    label: "Market Prices",
    icon: TrendingUp,
    route: "/market",
    tone: "text-primary",
    bg: "bg-primary/10",
  },
  {
    label: "Harvest Planner",
    icon: Calendar,
    route: "/harvest",
    tone: "text-success",
    bg: "bg-success/10",
  },
  {
    label: "Talk to Asha",
    icon: Mic,
    route: "/asha",
    tone: "text-warning",
    bg: "bg-warning/10",
  },
];

const STATUS_STYLES: Record<string, string> = {
  good: "bg-success/10 text-success border-success/30",
  warning: "bg-warning/10 text-warning border-warning/30",
  critical: "bg-destructive/10 text-destructive border-destructive/30",
  neutral: "bg-secondary/70 text-muted-foreground border-border",
};
const STATUS_TEXT: Record<string, string> = {
  good: "text-success",
  warning: "text-warning",
  critical: "text-destructive",
  neutral: "text-muted-foreground",
};

const DASHBOARD_PROFILE_BANNER_KEY = "dashboard_profile_prompt_dismissed";

export default function Index() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { open: openPremiumModal } = usePremiumModalStore();

  const { data: cropPrices, isLoading: pricesLoading } = useCropPrices();
  const { data: fieldData, isLoading: fieldLoading } = useFieldData();
  const { data: cashflowData, isLoading: cashflowLoading } = useCashflow();
  const { data: alerts, isLoading: alertsLoading } = useAlerts();
  const { data: harvestSchedule, isLoading: harvestLoading } = useHarvestSchedule();
  const { farms, isLoading: farmsLoading } = useFarms();

  const [showAlerts, setShowAlerts] = useState(false);
  const [profile, setProfile] = useState<FarmerProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [dismissedProfilePrompt, setDismissedProfilePrompt] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(DASHBOARD_PROFILE_BANNER_KEY) === "true";
  });

  const DEBUG_PROFILE = import.meta.env.DEV && import.meta.env.VITE_DEBUG_PROFILE === "true";

  useEffect(() => {
    if (!currentUser?.uid) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    getFarmerProfileWithMigration(currentUser.uid, currentUser.email ?? undefined, DEBUG_PROFILE)
      .then((data) => setProfile(data))
      .catch((error) => {
        console.error("Failed to load farmer profile:", error);
        setProfile(null);
      })
      .finally(() => setProfileLoading(false));
  }, [currentUser?.uid, currentUser?.email, DEBUG_PROFILE]);

  const activeFarm = farms?.[0];
  const farmName = activeFarm?.name || "Your Farm";
  const farmLocation =
    activeFarm?.county && activeFarm?.ward
      ? `${activeFarm.county} / ${activeFarm.ward}`
      : profile?.county && profile?.ward
      ? `${profile.county} / ${profile.ward}`
      : "Add your farm location";
  const crops = activeFarm?.crops?.length ? activeFarm.crops : profile?.crops ?? [];

  const hasProfile = Boolean(profile);
  const hasFarm = Boolean(activeFarm);
  const profilePending = profile?.pending?.status === "pending";

  const avgMoisture = useMemo(() => {
    if (!fieldData || fieldData.length === 0) return null;
    const total = fieldData.reduce((sum, field) => sum + (field.moisture || 0), 0);
    return total / fieldData.length;
  }, [fieldData]);

  const cropHealthStatus = useMemo(() => {
    if (!fieldData || fieldData.length === 0) {
      return { label: "Unknown", tone: "neutral", note: "Add crop data to see health." };
    }
    const hasRisk = fieldData.some((field) => field.health === "Needs Attention");
    const hasWarning = fieldData.some((field) => field.health === "Moderate");
    if (hasRisk) {
      return { label: "Warning", tone: "critical", note: "Some fields need attention." };
    }
    if (hasWarning) {
      return { label: "Watch", tone: "warning", note: "Mixed health across fields." };
    }
    return { label: "Good", tone: "good", note: "Fields are healthy." };
  }, [fieldData]);

  const soilMoistureStatus = useMemo(() => {
    if (avgMoisture === null) {
      return { label: "No data", tone: "neutral", note: "Connect soil data sources." };
    }
    if (avgMoisture < 40) {
      return { label: "Dry", tone: "critical", note: "Moisture levels are low." };
    }
    if (avgMoisture < 60) {
      return { label: "Monitor", tone: "warning", note: "Moisture trending down." };
    }
    return { label: "Optimal", tone: "good", note: "Soil moisture is stable." };
  }, [avgMoisture]);

  const rainAlert = alerts?.find((alert) =>
    `${alert.title} ${alert.message}`.toLowerCase().includes("rain")
  );
  const frostAlert = alerts?.find((alert) =>
    `${alert.title} ${alert.message}`.toLowerCase().includes("frost")
  );

  const rainOutlook = rainAlert
    ? { label: "Heavy", tone: "warning", note: "Rain alert active." }
    : { label: "Low", tone: "good", note: "No rain alerts." };

  const diseaseRisk = rainAlert
    ? { label: "High", tone: "warning", note: "Wet conditions raise risk." }
    : { label: "Low", tone: "good", note: "Low disease pressure." };

  const statusChips = useMemo(() => {
    const weatherChip = rainAlert
      ? { label: "Weather", value: "Rain expected soon", tone: "warning" }
      : { label: "Weather", value: "Stable today", tone: "good" };
    const frostChip = frostAlert
      ? { label: "Frost", value: "Elevated risk", tone: "warning" }
      : { label: "Frost", value: "Low", tone: "good" };
    const waterChip =
      soilMoistureStatus.label === "No data"
        ? { label: "Water", value: "No data", tone: "neutral" }
        : soilMoistureStatus.label === "Dry"
        ? { label: "Water", value: "Needs irrigation", tone: "critical" }
        : soilMoistureStatus.label === "Monitor"
        ? { label: "Water", value: "Monitor", tone: "warning" }
        : { label: "Water", value: "Optimal", tone: "good" };
    const profileChip = profilePending
      ? { label: "Profile", value: "Pending", tone: "warning" }
      : hasProfile
      ? { label: "Profile", value: "Verified", tone: "good" }
      : { label: "Profile", value: "Incomplete", tone: "warning" };
    return [weatherChip, frostChip, waterChip, profileChip];
  }, [rainAlert, frostAlert, soilMoistureStatus, profilePending, hasProfile]);

  const priorityCard = useMemo(() => {
    if (rainAlert) {
      return {
        title: "Action needed today",
        severity: "High",
        message: "Heavy rain expected soon — protect sensitive crops.",
        actions: ["Review Climate Insights", "Prepare drainage paths"],
      };
    }
    if (frostAlert) {
      return {
        title: "Action needed today",
        severity: "Medium",
        message: "Frost risk elevated — keep crops warm overnight.",
        actions: ["Check frost alert details", "Prepare covers"],
      };
    }
    if (cropPrices && cropPrices.length > 0) {
      return {
        title: "Market opportunity",
        severity: "Low",
        message: `${cropPrices[0].name} prices are trending up.`,
        actions: ["Check market prices", "Review delivery plan"],
      };
    }
    return {
      title: "All clear today",
      severity: "Low",
      message: "No urgent risks detected — keep routine checks.",
      actions: ["Review farm health", "Update harvest plan"],
    };
  }, [rainAlert, frostAlert, cropPrices]);

  const healthCards = [
    {
      title: "Crop Health",
      icon: Leaf,
      status: cropHealthStatus.label,
      note: cropHealthStatus.note,
      tone: cropHealthStatus.tone,
    },
    {
      title: "Soil Moisture",
      icon: Droplets,
      status: soilMoistureStatus.label,
      note: soilMoistureStatus.note,
      tone: soilMoistureStatus.tone,
    },
    {
      title: "Rain Outlook",
      icon: CloudRain,
      status: rainOutlook.label,
      note: rainOutlook.note,
      tone: rainOutlook.tone,
    },
    {
      title: "Disease Risk",
      icon: AlertTriangle,
      status: diseaseRisk.label,
      note: diseaseRisk.note,
      tone: diseaseRisk.tone,
    },
  ];

  const timelineItems = useMemo(() => {
    const items: Array<{
      label: string;
      date: string;
      icon: LucideIcon;
      tone: string;
    }> = [];

    if (harvestSchedule && harvestSchedule.length > 0) {
      const nextHarvest = harvestSchedule[0];
      items.push({
        label: `Next harvest: ${nextHarvest.crop}`,
        date: nextHarvest.optimalDate,
        icon: Calendar,
        tone: "good",
      });
    }

    if (rainAlert) {
      items.push({
        label: "Heavy rain day",
        date: format(new Date(rainAlert.timestamp), "MMM dd"),
        icon: CloudRain,
        tone: "warning",
      });
    }

    items.push({
      label: "Spray window",
      date: format(new Date(Date.now() + 24 * 60 * 60 * 1000), "MMM dd"),
      icon: CloudSun,
      tone: "good",
    });

    items.push({
      label: "Best market delivery day",
      date: format(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), "MMM dd"),
      icon: TrendingUp,
      tone: "good",
    });

    return items.slice(0, 4);
  }, [harvestSchedule, rainAlert]);

  const totalRevenue = cashflowData?.reduce((sum, entry) => sum + entry.income, 0) ?? 0;
  const bestPrice = cropPrices && cropPrices.length > 0 ? cropPrices[0] : null;
  const premiumFeatures = FEATURES.filter((feature) => feature.tier === "premium");

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title={farmName} subtitle={farmLocation} icon={Sprout}>
        <Button
          variant="outline"
          size="icon"
          className="relative"
          onClick={() => setShowAlerts(true)}
          aria-label="Alerts"
        >
          <Bell className="h-5 w-5" />
          {alerts && alerts.length > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] text-destructive-foreground flex items-center justify-center font-bold">
              {alerts.length}
            </span>
          )}
        </Button>
      </PageHeader>

      <div className="p-4 md:p-6 space-y-6">
        {!hasProfile && !profileLoading && !dismissedProfilePrompt && (
          <AlertCard
            type="info"
            title="Complete your farmer profile"
            message="Add your farm details to unlock tailored insights."
            action="Complete registration"
            onAction={() => navigate("/registration")}
            onDismiss={() => {
              setDismissedProfilePrompt(true);
              if (typeof window !== "undefined") {
                window.localStorage.setItem(DASHBOARD_PROFILE_BANNER_KEY, "true");
              }
            }}
          />
        )}

        <Card className="border-border/60 shadow-card">
          <CardContent className="p-5 md:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Farm snapshot</p>
                <h2 className="text-2xl font-semibold text-foreground">{farmName}</h2>
                <p className="text-sm text-muted-foreground">{farmLocation}</p>
                <div className="flex flex-wrap gap-2 pt-2">
                  {crops.length > 0 ? (
                    crops.map((crop) => (
                      <Badge key={crop} variant="secondary" className="text-xs">
                        {crop}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      Add crops to personalize insights
                    </Badge>
                  )}
                </div>
                {!hasFarm && !farmsLoading && (
                  <p className="text-xs text-muted-foreground">
                    Add a farm location to unlock weather insights.
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {statusChips.map((chip) => (
                  <Badge
                    key={chip.label}
                    className={cn(
                      "border px-3 py-1 text-xs font-medium",
                      STATUS_STYLES[chip.tone] ?? STATUS_STYLES.neutral
                    )}
                  >
                    {chip.label}: {chip.value}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">Quick actions</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.route)}
                className="group flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 text-left shadow-sm transition hover:shadow-md"
              >
                <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", action.bg)}>
                  <action.icon className={cn("h-6 w-6", action.tone)} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Go to</p>
                  <p className="text-base font-semibold text-foreground">{action.label}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section>
          <Card className="border-border/60 bg-gradient-to-br from-warning/10 via-card to-card shadow-card">
            <CardContent className="p-5 md:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-warning">Today&apos;s priority</p>
                  <h3 className="text-xl font-semibold text-foreground">
                    {priorityCard.title}
                  </h3>
                </div>
                <Badge
                  className={cn(
                    "border px-3 py-1 text-xs font-semibold",
                    priorityCard.severity === "High"
                      ? STATUS_STYLES.critical
                      : priorityCard.severity === "Medium"
                      ? STATUS_STYLES.warning
                      : STATUS_STYLES.good
                  )}
                >
                  {priorityCard.severity}
                </Badge>
              </div>
              <p className="text-sm text-foreground/80">{priorityCard.message}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {priorityCard.actions.map((action) => (
                  <div key={action} className="flex items-center gap-2 text-sm text-foreground">
                    <span className="h-2 w-2 rounded-full bg-warning" />
                    {action}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">Farm health overview</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {healthCards.map((card) => (
              <Card key={card.title} className="border-border/60 shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <card.icon className={cn("h-5 w-5", STATUS_TEXT[card.tone] ?? STATUS_TEXT.neutral)} />
                    <Badge
                      className={cn(
                        "border px-2 py-0.5 text-[10px] font-semibold",
                        STATUS_STYLES[card.tone] ?? STATUS_STYLES.neutral
                      )}
                    >
                      {card.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{card.title}</p>
                    <p className="text-xs text-muted-foreground">{card.note}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Upcoming events</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate("/harvest")}>
              View schedule
            </Button>
          </div>
          {harvestLoading && (
            <div className="space-y-2">
              {[1, 2, 3].map((item) => (
                <Skeleton key={item} className="h-14 rounded-xl" />
              ))}
            </div>
          )}
          {!harvestLoading && timelineItems.length === 0 && (
            <Card className="border-border/60">
              <CardContent className="p-4 text-sm text-muted-foreground">
                No upcoming events yet. Add a harvest plan to get a timeline.
              </CardContent>
            </Card>
          )}
          {!harvestLoading && timelineItems.length > 0 && (
            <div className="space-y-3">
              {timelineItems.map((item) => (
                <div
                  key={`${item.label}-${item.date}`}
                  className="flex items-center gap-4 rounded-xl border border-border/60 bg-card p-4 shadow-sm"
                >
                  <div
                    className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center",
                      STATUS_STYLES[item.tone] ?? STATUS_STYLES.neutral
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">Market & income snapshot</h3>
          <div className="grid gap-3 lg:grid-cols-2">
            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Best price today</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {pricesLoading ? (
                  <Skeleton className="h-16 w-full rounded-xl" />
                ) : bestPrice ? (
                  <>
                    <p className="text-2xl font-semibold text-foreground">
                      {formatKsh(bestPrice.price)} / {bestPrice.unit}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {bestPrice.name} {bestPrice.change >= 0 ? "+" : ""}
                      {bestPrice.change}% today
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Start selling to see price insights.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Revenue trend (6 months)</CardTitle>
              </CardHeader>
              <CardContent>
                {cashflowLoading ? (
                  <Skeleton className="h-24 w-full rounded-xl" />
                ) : cashflowData && cashflowData.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-2xl font-semibold text-foreground">
                      {formatKsh(totalRevenue)}
                    </p>
                    <div className="h-24">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={cashflowData}>
                          <XAxis dataKey="month" hide />
                          <YAxis hide />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                              fontSize: "12px",
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="income"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Start selling to see revenue trends.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground">Unlock more tools</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {premiumFeatures.map((feature) => (
              <Card key={feature.id} className="border-border/60 bg-muted/40 text-muted-foreground">
                <CardHeader className="space-y-2">
                  <div className="flex items-center gap-2">
                    <feature.icon className="h-4 w-4" />
                    <CardTitle className="text-sm">{feature.tagline}</CardTitle>
                  </div>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </CardHeader>
                <CardContent>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openPremiumModal({ route: feature.route, featureId: feature.id })}
                  >
                    Learn more
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>

      <Dialog open={showAlerts} onOpenChange={setShowAlerts}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Alerts
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {alertsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-20 rounded-xl" />
                <Skeleton className="h-20 rounded-xl" />
              </div>
            ) : alerts && alerts.length > 0 ? (
              alerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  type={alert.type === "error" ? "danger" : (alert.type as "warning" | "info" | "success")}
                  title={alert.title}
                  message={alert.message}
                />
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No alerts right now.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
