import {
  TrendingUp,
  Leaf,
  DollarSign,
  Calendar,
  AlertTriangle,
  Sprout,
  Bell,
  Loader2,
  Lock,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { AlertCard } from "@/components/shared/AlertCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useCropPrices, useFieldData, useCashflow, useAlerts, useHarvestSchedule } from "@/hooks/useApi";
import { useFieldHealth } from "@/hooks/useFieldHealth";
import { useNextHarvest } from "@/hooks/useNextHarvest";
import { FEATURES } from "@/config/featureAccess";
import { getRandomUnsplashImages } from "@/assets/unsplash";
import { formatKsh } from "@/lib/currency";
import { usePremiumModalStore } from "@/store/premiumStore";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

const quickActions = [
  { icon: TrendingUp, labelKey: "dashboard.quickActions.checkPrices", route: "/market", color: "text-primary" },
  { icon: Leaf, labelKey: "dashboard.quickActions.fieldStatus", route: "/crops", color: "text-success" },
  { icon: Calendar, labelKey: "dashboard.quickActions.schedule", route: "/harvest", color: "text-info" },
  { icon: DollarSign, labelKey: "dashboard.quickActions.finance", route: "/finance", color: "text-warning" },
];

export default function Index() {
  const [showAlerts, setShowAlerts] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { open: openPremiumModal } = usePremiumModalStore();

  const { data: cropPrices, isLoading: pricesLoading, error: pricesError } = useCropPrices();
  const { data: fieldData, isLoading: fieldsLoading, error: fieldsError } = useFieldData();
  const { data: cashflowData, isLoading: cashflowLoading, error: cashflowError } = useCashflow();
  const { data: alerts, isLoading: alertsLoading } = useAlerts();
  const { data: harvestSchedule, isLoading: harvestLoading } = useHarvestSchedule();

  const { health: fieldHealthData } = useFieldHealth();
  const { harvests: nextHarvestData } = useNextHarvest();

  const enhancedFieldData = useMemo(() => {
    if (fieldData && fieldData.length > 0) return fieldData;
    return fieldHealthData.map((h) => ({
      id: h.fieldId,
      name: h.fieldName,
      crop: h.cropName || t("dashboard.unknownCrop"),
      area: t("common.na"),
      ndvi: h.ndvi || 0.7,
      moisture: h.moisture || 60,
      health: h.health,
      lastUpdated: h.lastChecked instanceof Date
        ? h.lastChecked.toISOString()
        : new Date(h.lastChecked).toISOString(),
    }));
  }, [fieldData, fieldHealthData, t]);

  const enhancedHarvestSchedule = useMemo(() => {
    if (harvestSchedule && harvestSchedule.length > 0) return harvestSchedule;
    return nextHarvestData.map((h) => ({
      id: h.id || h.fieldId,
      field: h.fieldName,
      crop: h.cropName,
      optimalDate: h.optimalDate instanceof Date
        ? format(h.optimalDate, "MMM dd, yyyy")
        : format(new Date(h.optimalDate), "MMM dd, yyyy"),
      workers: h.workers || 0,
      status: h.status,
    }));
  }, [harvestSchedule, nextHarvestData]);

  const totalRevenue = cashflowData?.reduce((sum, m) => sum + m.income, 0) || 0;
  const healthyFields =
    enhancedFieldData?.filter((f) => f.health === "Good" || f.health === "Excellent").length || 0;

  const isLoading = pricesLoading || fieldsLoading || cashflowLoading || harvestLoading;
  const freeFeatures = FEATURES.filter(
    (feature) => feature.tier === "free" && feature.id !== "dashboard"
  );
  const premiumFeatures = FEATURES.filter((feature) => feature.tier === "premium");
  const backgroundImages = useMemo(() => getRandomUnsplashImages(3), []);
  const fallbackGradient =
    "linear-gradient(135deg, rgb(244, 250, 244), rgb(255, 255, 255) 50%, rgb(255, 248, 236))";
  const overlayGradient =
    "linear-gradient(180deg, rgba(255, 255, 255, 0.65), rgba(255, 255, 255, 0.85))";
  const resolveBackground = (index: number) => {
    const image = backgroundImages[index];
    return image ? `url(${image})` : fallbackGradient;
  };
  const handlePreview = (route: string, featureId: string) => {
    openPremiumModal({ route, featureId });
  };

  const formatHealthLabel = (value: string) => {
    switch (value) {
      case "Excellent":
        return t("dashboard.health.excellent");
      case "Good":
        return t("dashboard.health.good");
      case "Moderate":
        return t("dashboard.health.moderate");
      case "Poor":
        return t("dashboard.health.poor");
      default:
        return value;
    }
  };

  const formatHarvestStatus = (value: string) => {
    switch (value) {
      case "Ready":
        return t("dashboard.harvest.ready");
      case "Pending":
        return t("dashboard.harvest.pending");
      case "InProgress":
        return t("dashboard.harvest.inProgress");
      default:
        return value;
    }
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ backgroundImage: fallbackGradient }}
    >
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -top-16 -right-20 h-64 w-64 rounded-full bg-cover bg-center opacity-35 blur-2xl"
          style={{
            backgroundImage: resolveBackground(0),
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />
        <div
          className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-cover bg-center opacity-25 blur-2xl"
          style={{
            backgroundImage: resolveBackground(1),
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />
        <div
          className="absolute top-1/3 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-cover bg-center opacity-20 blur-3xl"
          style={{
            backgroundImage: resolveBackground(2),
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: overlayGradient,
          }}
        />
      </div>
      <div className="relative">
        <PageHeader
        title={t("dashboard.greeting")}
        subtitle={t("dashboard.subtitle")}
        icon={Sprout}
      >
        <Button
          variant="outline"
          size="icon"
          className="relative"
          onClick={() => setShowAlerts(true)}
          aria-label={t("dashboard.notifications")}
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
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {t("premium.sections.availableTitle")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("premium.sections.availableSubtitle")}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {freeFeatures.map((feature) => (
              <Card key={feature.id} className="border-border/60 shadow-card">
                <CardHeader className="space-y-2">
                  <div className="flex items-center gap-2">
                    <feature.icon className="h-4 w-4 text-primary" />
                    <CardTitle className="text-base">{t(feature.labelKey)}</CardTitle>
                  </div>
                  <Badge variant="outline" className="w-fit text-[10px] px-2 py-0.5">
                    {t(feature.taglineKey, feature.tagline)}
                  </Badge>
                  <CardDescription>{t(feature.descriptionKey, feature.description)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button size="sm" onClick={() => navigate(feature.route)}>
                    {t("premium.actions.open")}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {t("premium.sections.premiumTitle")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("premium.sections.premiumSubtitle")}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {premiumFeatures.map((feature) => (
              <Card key={feature.id} className="border-border/60 shadow-card">
                <CardHeader className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <feature.icon className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-base">{t(feature.labelKey)}</CardTitle>
                    </div>
                    <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                      {t("premium.badge")}
                    </Badge>
                  </div>
                  <Badge variant="outline" className="w-fit text-[10px] px-2 py-0.5">
                    {t(feature.taglineKey, feature.tagline)}
                  </Badge>
                  <CardDescription>{t(feature.descriptionKey, feature.description)}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Lock className="h-3.5 w-3.5" />
                    <span>{t("premium.lockedLabel")}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePreview(feature.route, feature.id)}
                  >
                    {t("premium.actions.unlock")}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="animate-fade-up">
          <div className="grid grid-cols-4 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.labelKey}
                onClick={() => {
                  const feature = FEATURES.find((item) => item.route === action.route);
                  if (feature?.tier === "premium") {
                    handlePreview(feature.route, feature.id);
                    return;
                  }
                  navigate(action.route);
                }}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-200"
              >
                <div className={`h-10 w-10 rounded-lg bg-secondary flex items-center justify-center ${action.color}`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-foreground">{t(action.labelKey)}</span>
              </button>
            ))}
          </div>
        </section>

        {isLoading && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          </div>
        )}

        {(pricesError || fieldsError || cashflowError) && (
          <AlertCard
            type="danger"
            title={t("dashboard.errorTitle")}
            message={t("dashboard.errorMessage")}
          />
        )}

        {!isLoading && (
          <section className="animate-fade-up" style={{ animationDelay: "0.1s" }}>
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                title={t("dashboard.stats.bestPrice")}
                value={
                  cropPrices && cropPrices.length > 0
                    ? formatKsh(cropPrices[0]?.price || 0)
                    : t("common.na")
                }
                change={
                  cropPrices && cropPrices.length > 0
                    ? `${cropPrices[0]?.name || ""} ${
                        cropPrices[0]?.change
                          ? `${cropPrices[0].change > 0 ? "+" : ""}${cropPrices[0].change}%`
                          : ""
                      }`
                    : cropPrices && cropPrices.length === 0
                    ? t("dashboard.syncPrices")
                    : t("dashboard.noData")
                }
                changeType={
                  cropPrices && cropPrices.length > 0 && cropPrices[0]?.trend === "up"
                    ? "positive"
                    : "neutral"
                }
                icon={TrendingUp}
                iconColor="text-primary"
              />
              <StatCard
                title={t("dashboard.stats.fieldHealth")}
                value={
                  enhancedFieldData && enhancedFieldData.length > 0
                    ? `${healthyFields}/${enhancedFieldData.length}`
                    : "0/0"
                }
                change={t("dashboard.stats.fieldsHealthy")}
                changeType="positive"
                icon={Leaf}
                iconColor="text-success"
              />
              <StatCard
                title={t("dashboard.stats.revenue")}
                value={
                  cashflowData && cashflowData.length > 0
                    ? `${formatKsh(totalRevenue / 1000000)}M`
                    : t("common.na")
                }
                change={
                  cashflowData && cashflowData.length > 0
                    ? t("dashboard.stats.revenueChange")
                    : t("dashboard.noData")
                }
                changeType="positive"
                icon={DollarSign}
                iconColor="text-warning"
              />
              <StatCard
                title={t("dashboard.stats.nextHarvest")}
                value={
                  enhancedHarvestSchedule && enhancedHarvestSchedule.length > 0
                    ? enhancedHarvestSchedule[0]?.optimalDate.split(",")[0] || t("common.na")
                    : t("common.na")
                }
                change={
                  enhancedHarvestSchedule && enhancedHarvestSchedule.length > 0
                    ? enhancedHarvestSchedule[0]?.field || ""
                    : ""
                }
                changeType="neutral"
                icon={Calendar}
                iconColor="text-info"
              />
            </div>
          </section>
        )}

        {alerts && alerts.length > 0 && (
          <section className="animate-fade-up" style={{ animationDelay: "0.15s" }}>
            <AlertCard
              type={
                alerts[0].type === "warning"
                  ? "warning"
                  : alerts[0].type === "success"
                  ? "success"
                  : "info"
              }
              title={alerts[0].title}
              message={alerts[0].message}
              action={alerts[0].actionUrl ? t("dashboard.viewDetails") : undefined}
              onAction={alerts[0].actionUrl ? () => navigate(alerts[0].actionUrl || "/") : undefined}
            />
          </section>
        )}

        {cashflowData && (
          <section className="animate-fade-up" style={{ animationDelay: "0.2s" }}>
            <div className="bg-card rounded-xl p-4 shadow-card border border-border/50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-foreground">{t("dashboard.revenue.title")}</h3>
                  <p className="text-xs text-muted-foreground">{t("dashboard.revenue.subtitle")}</p>
                </div>
                <span className="text-xs font-medium text-success bg-success/10 px-2 py-1 rounded-full">
                  {t("dashboard.revenue.change")}
                </span>
              </div>
              {cashflowLoading ? (
                <div className="h-48 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={cashflowData}>
                        <XAxis
                          dataKey="month"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        />
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
                          activeDot={{ r: 4, fill: "hsl(var(--primary))" }}
                        />
                        <Line
                          type="monotone"
                          dataKey="expenses"
                          stroke="hsl(var(--muted-foreground))"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span className="text-xs text-muted-foreground">{t("dashboard.revenue.income")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{t("dashboard.revenue.expenses")}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {enhancedFieldData && enhancedFieldData.length > 0 && (
          <section className="animate-fade-up" style={{ animationDelay: "0.25s" }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground">{t("dashboard.fieldStatus.title")}</h3>
              <Button variant="ghost" size="sm" className="text-primary h-8" onClick={() => navigate("/crops")}>
                {t("dashboard.viewAll")}
              </Button>
            </div>
            {fieldsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {enhancedFieldData.slice(0, 3).map((field) => (
                  <div
                    key={field.id}
                    className="bg-card rounded-xl p-4 border border-border/50 flex items-center justify-between hover:shadow-md transition-all duration-200 cursor-pointer"
                    onClick={() => navigate("/crops")}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                          field.health === "Excellent" || field.health === "Good"
                            ? "bg-success/10 text-success"
                            : field.health === "Moderate"
                            ? "bg-warning/10 text-warning"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        <Leaf className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{field.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {field.crop} - {field.area}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-medium ${
                          field.health === "Excellent" || field.health === "Good"
                            ? "text-success"
                            : field.health === "Moderate"
                            ? "text-warning"
                            : "text-destructive"
                        }`}
                      >
                        {formatHealthLabel(field.health)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("dashboard.fieldStatus.ndvi")}: {field.ndvi}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {enhancedHarvestSchedule && enhancedHarvestSchedule.length > 0 && (
          <section className="animate-fade-up" style={{ animationDelay: "0.3s" }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground">{t("dashboard.upcomingHarvests.title")}</h3>
              <Button variant="ghost" size="sm" className="text-primary h-8" onClick={() => navigate("/harvest")}>
                {t("dashboard.upcomingHarvests.viewSchedule")}
              </Button>
            </div>
            {harvestLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {enhancedHarvestSchedule.map((harvest) => (
                  <div
                    key={harvest.id}
                    className="bg-card rounded-xl p-4 border border-border/50 flex items-center justify-between cursor-pointer hover:shadow-md transition-all duration-200"
                    onClick={() => navigate("/harvest")}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                          harvest.status === "Ready"
                            ? "bg-success/10 text-success"
                            : harvest.status === "Pending"
                            ? "bg-warning/10 text-warning"
                            : "bg-info/10 text-info"
                        }`}
                      >
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{harvest.field}</p>
                        <p className="text-xs text-muted-foreground">
                          {harvest.crop} - {t("dashboard.upcomingHarvests.workers", { count: harvest.workers })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">{harvest.optimalDate}</p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          harvest.status === "Ready"
                            ? "bg-success/10 text-success"
                            : harvest.status === "Pending"
                            ? "bg-warning/10 text-warning"
                            : "bg-info/10 text-info"
                        }`}
                      >
                        {formatHarvestStatus(harvest.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

        <Dialog open={showAlerts} onOpenChange={setShowAlerts}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              {t("dashboard.notifications")}
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
              <p className="text-sm text-muted-foreground text-center py-4">{t("dashboard.noAlerts")}</p>
            )}
          </div>
        </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
