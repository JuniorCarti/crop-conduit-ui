import { useEffect, useMemo, useState } from "react";
import { CloudSun, WifiOff } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ForecastOverviewCard } from "@/components/climate/ForecastOverviewCard";
import { FrostRiskCard } from "@/components/climate/FrostRiskCard";
import { RainOutlookCard } from "@/components/climate/RainOutlookCard";
import { AdvisoryCard } from "@/components/climate/AdvisoryCard";
import { FarmSelector } from "@/components/climate/FarmSelector";
import { useAlertSubscription, useCreateFarm, useFarms, useRecentAlerts, useUserProfile, useUpdateAlertSubscription } from "@/hooks/useClimate";
import { useClimateForecast } from "@/hooks/useClimateForecast";
import { useAdvisory } from "@/hooks/useAdvisory";
import { useSubscribeEmailAlerts, useSubscribeWhatsAppAlerts } from "@/hooks/useAlerts";
import { isAlertsWorkerConfigured } from "@/services/alertsService";
import { getSupportedCommodities } from "@/services/marketOracleService";
import { useClimateStore } from "@/store/climateStore";
import { usePremiumModalStore } from "@/store/premiumStore";
import type { AdvisoryGenerateResponse } from "@/types/advisory";
import type { UserFeatureFlags } from "@/types/climate";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const defaultFeatures: UserFeatureFlags = {
  climateBasic: true,
  climatePremium: false,
  frostAlerts: false,
  rain14: false,
  smsAlerts: false,
};

const FALLBACK_CROPS = ["tomatoes", "cabbage", "potatoes", "onion", "kale"];
const ADVISORY_STORAGE_KEY = "agrismart:lastAdvisory";
const MARKET_SIGNAL_STORAGE_KEY = "agrismart:lastMarketPrediction";
const LAST_FARM_LAT_KEY = "agrismart:lastFarmLat";
const LAST_FARM_LON_KEY = "agrismart:lastFarmLon";
const LAST_FARM_NAME_KEY = "agrismart:lastFarmName";

export default function ClimatePage() {
  const { t, i18n } = useTranslation();
  const { data: profile } = useUserProfile();
  const { farms, isLoading: farmsLoading } = useFarms();
  const { alerts } = useRecentAlerts(3);
  const { data: subscription } = useAlertSubscription();
  const updateSubscription = useUpdateAlertSubscription();
  const createFarm = useCreateFarm();
  const subscribeEmailAlerts = useSubscribeEmailAlerts();
  const subscribeWhatsAppAlerts = useSubscribeWhatsAppAlerts();
  const advisoryMutation = useAdvisory();
  const {
    selectedFarmId,
    setSelectedFarmId,
    setUserPlan,
  } = useClimateStore();
  const { open: openPremiumModal } = usePremiumModalStore();

  useEffect(() => {
    if (profile) {
      setUserPlan(profile.plan, profile.features || defaultFeatures);
    }
  }, [profile, setUserPlan]);

  const [addOpen, setAddOpen] = useState(false);
  const [aiLanguage, setAiLanguage] = useState<"en" | "sw">("en");
  const [aiCrop, setAiCrop] = useState<string>("tomatoes");
  const [aiStage, setAiStage] = useState<string>("vegetative");
  const [cachedAdvisory, setCachedAdvisory] = useState<AdvisoryGenerateResponse | null>(() => {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(ADVISORY_STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AdvisoryGenerateResponse;
    } catch {
      return null;
    }
  });
  const [alertsForm, setAlertsForm] = useState({
    email: "",
    msisdn: "",
    wantsFrost: true,
    wantsRain: true,
  });
  const [formState, setFormState] = useState({
    name: "",
    county: "",
    ward: "",
    lat: "",
    lon: "",
    elevation: "",
  });

  const premiumPlan = true;
  const frostAccess = true;
  const rainAccess = true;
  const smsAccess = true;
  const activeLanguage = i18n.language === "sw" ? "sw" : "en";

  const cropOptions = useMemo(() => {
    const supported = getSupportedCommodities();
    const crops = supported.length ? supported : FALLBACK_CROPS;
    return crops.map((crop) => ({
      value: crop,
      label: t(`marketOracle.commodities.${crop}`, crop),
    }));
  }, [t]);

  const stageOptions = useMemo(
    () => [
      { value: "seedling", label: t("climate.aiAdvisory.stages.seedling") },
      { value: "vegetative", label: t("climate.aiAdvisory.stages.vegetative") },
      { value: "flowering", label: t("climate.aiAdvisory.stages.flowering") },
      { value: "fruiting", label: t("climate.aiAdvisory.stages.fruiting") },
      { value: "harvest", label: t("climate.aiAdvisory.stages.harvest") },
    ],
    [t]
  );

  useEffect(() => {
    if (!cropOptions.some((option) => option.value === aiCrop)) {
      setAiCrop(cropOptions[0]?.value ?? "tomatoes");
    }
  }, [aiCrop, cropOptions]);

  useEffect(() => {
    if (!stageOptions.some((option) => option.value === aiStage)) {
      setAiStage(stageOptions[0]?.value ?? "vegetative");
    }
  }, [aiStage, stageOptions]);

  const visibleFarms = farms;

  useEffect(() => {
    if (visibleFarms.length === 0) {
      return;
    }

    const hasSelection = selectedFarmId
      ? visibleFarms.some((farm) => farm.id === selectedFarmId)
      : false;

    if (!hasSelection) {
      setSelectedFarmId(visibleFarms[0].id);
    }
  }, [selectedFarmId, setSelectedFarmId, visibleFarms]);

  const selectedFarm = visibleFarms.find((farm) => farm.id === selectedFarmId) || null;
  useEffect(() => {
    if (!selectedFarm || typeof window === "undefined") return;
    window.localStorage.setItem(LAST_FARM_LAT_KEY, String(selectedFarm.lat));
    window.localStorage.setItem(LAST_FARM_LON_KEY, String(selectedFarm.lon));
    window.localStorage.setItem(
      LAST_FARM_NAME_KEY,
      `${selectedFarm.name} - ${selectedFarm.county}, ${selectedFarm.ward}`
    );
  }, [selectedFarm]);
  const {
    data: climateData,
    isLoading: forecastLoading,
    error,
    refetch,
  } = useClimateForecast({
    farmId: selectedFarmId,
    lat: selectedFarm?.lat ?? null,
    lon: selectedFarm?.lon ?? null,
    days: 7,
  });

  const subscriptionForFarm = subscription?.farms?.find((farm) => farm.farmId === selectedFarmId);
  const smsEnabled = subscriptionForFarm?.channels?.includes("sms") ?? false;
  const hasPhoneNumber = Boolean(profile?.phoneNumber);
  const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
  const canAddFarm = true;
  const alertsConfigured = isAlertsWorkerConfigured();
  const alertsLat = selectedFarm?.lat ?? null;
  const alertsLon = selectedFarm?.lon ?? null;
  const alertsLocationName =
    selectedFarm
      ? `${selectedFarm.name} - ${selectedFarm.county}, ${selectedFarm.ward}`
      : climateData?.forecast?.location?.name
      ? `${climateData.forecast.location.name}${climateData.forecast.location.region ? `, ${climateData.forecast.location.region}` : ""}`
      : t("climate.weatherAlerts.locationUnknown");
  const alertsCoordsLabel =
    alertsLat != null && alertsLon != null
      ? `${alertsLat.toFixed(4)}, ${alertsLon.toFixed(4)}`
      : t("climate.weatherAlerts.locationUnknown");
  const storedFarm = useMemo(() => {
    if (typeof window === "undefined") return null;
    const latRaw = window.localStorage.getItem(LAST_FARM_LAT_KEY);
    const lonRaw = window.localStorage.getItem(LAST_FARM_LON_KEY);
    const name = window.localStorage.getItem(LAST_FARM_NAME_KEY);
    if (!latRaw || !lonRaw) return null;
    const lat = Number(latRaw);
    const lon = Number(lonRaw);
    if (Number.isNaN(lat) || Number.isNaN(lon)) return null;
    return { lat, lon, name };
  }, []);
  const advisoryLat = selectedFarm?.lat ?? storedFarm?.lat ?? null;
  const advisoryLon = selectedFarm?.lon ?? storedFarm?.lon ?? null;
  const advisoryLocationName =
    selectedFarm
      ? `${selectedFarm.name} - ${selectedFarm.county}, ${selectedFarm.ward}`
      : storedFarm?.name || t("climate.aiAdvisory.locationUnknown");
  const marketSignals = useMemo(() => {
    if (typeof window === "undefined") return {};
    const raw = window.localStorage.getItem(MARKET_SIGNAL_STORAGE_KEY);
    if (!raw) return {};
    try {
      const parsed = JSON.parse(raw) as {
        predictedPrice?: number;
        marketUnreasonable?: boolean;
      };
      const predictedPrice =
        typeof parsed.predictedPrice === "number" ? parsed.predictedPrice : undefined;
      const marketUnreasonable =
        typeof parsed.marketUnreasonable === "boolean" ? parsed.marketUnreasonable : undefined;
      return { predictedPrice, marketUnreasonable };
    } catch {
      return {};
    }
  }, []);
  const weatherHighlights = useMemo(() => {
    const forecastDays = climateData?.forecast?.forecast?.forecastday ?? [];
    return forecastDays.slice(0, 3).map((day) =>
      t("climate.aiAdvisory.weatherHighlight", {
        date: day.date,
        min: Math.round(day.day.mintemp_c),
        max: Math.round(day.day.maxtemp_c),
        chance: Math.round(day.day.daily_chance_of_rain ?? 0),
        mm: Math.round(day.day.totalprecip_mm ?? 0),
      })
    );
  }, [climateData?.forecast, t]);
  const canGenerateAi = Boolean(advisoryLat != null && advisoryLon != null && aiCrop && aiStage);
  const aiDisabledReason = canGenerateAi ? null : t("climate.aiAdvisory.selectFarm");
  const advisoryResult = advisoryMutation.data ?? cachedAdvisory;
  const aiDataUsedFallback = advisoryResult?.dataUsed
    ? null
    : {
        locationName: advisoryLocationName,
        weatherHighlights,
      };

  const handleUpgrade = () => {
    openPremiumModal();
  };

  const handleToggleSms = (next: boolean) => {
    if (!selectedFarmId) return;
    updateSubscription.mutate({
      farmId: selectedFarmId,
      channels: next ? ["inApp", "sms"] : ["inApp"],
      frost: true,
      rain: true,
    });
  };

  const handleCreateFarm = async () => {
    if (!formState.name || !formState.county || !formState.ward) {
      toast.error(t("climate.form.errorRequired"));
      return;
    }
    const lat = Number(formState.lat);
    const lon = Number(formState.lon);
    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      toast.error(t("climate.form.errorCoords"));
      return;
    }

    try {
      const farmId = await createFarm.mutateAsync({
        name: formState.name.trim(),
        county: formState.county.trim(),
        ward: formState.ward.trim(),
        lat,
        lon,
        elevation: formState.elevation ? Number(formState.elevation) : undefined,
      });
      toast.success(t("climate.form.success"));
      setAddOpen(false);
      setFormState({
        name: "",
        county: "",
        ward: "",
        lat: "",
        lon: "",
        elevation: "",
      });
      setSelectedFarmId(farmId);
    } catch (err: any) {
      toast.error(err?.message || t("climate.form.error"));
    }
  };

  const handleUseLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error(t("climate.form.locationUnavailable"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormState((prev) => ({
          ...prev,
          lat: position.coords.latitude.toFixed(6),
          lon: position.coords.longitude.toFixed(6),
        }));
        toast.success(t("climate.form.locationSuccess"));
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          toast.error(t("climate.form.locationDenied"));
          return;
        }
        toast.error(t("climate.form.locationUnavailable"));
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const hasLocation = alertsLat != null && alertsLon != null;
  const sanitizedMsisdn = alertsForm.msisdn.replace(/\s+/g, "");
  const emailValid = alertsForm.email.includes("@");
  const whatsappValid = /^\+\d{10,}$/.test(sanitizedMsisdn);

  const handleSubscribeEmail = async () => {
    if (!alertsConfigured || !hasLocation || !emailValid) return;
    try {
      await subscribeEmailAlerts.mutateAsync({
        email: alertsForm.email.trim(),
        lat: alertsLat!,
        lon: alertsLon!,
        locationName: alertsLocationName,
        wantsFrost: alertsForm.wantsFrost,
        wantsRain: alertsForm.wantsRain,
      });
    } catch {
      // Error is surfaced in UI via mutation state.
    }
  };

  const handleSubscribeWhatsApp = async () => {
    if (!alertsConfigured || !hasLocation || !whatsappValid) return;
    try {
      await subscribeWhatsAppAlerts.mutateAsync({
        msisdn: sanitizedMsisdn,
        lat: alertsLat!,
        lon: alertsLon!,
        locationName: alertsLocationName,
        wantsFrost: alertsForm.wantsFrost,
        wantsRain: alertsForm.wantsRain,
      });
    } catch {
      // Error is surfaced in UI via mutation state.
    }
  };

  const handleGenerateAdvisory = async () => {
    if (!canGenerateAi || advisoryLat == null || advisoryLon == null) return;
    try {
      const result = await advisoryMutation.mutateAsync({
        language: aiLanguage,
        farm: {
          lat: advisoryLat,
          lon: advisoryLon,
          locationName: advisoryLocationName,
        },
        crop: {
          name: aiCrop,
          stage: aiStage,
        },
        signals: marketSignals,
      });
      const enriched = result.dataUsed
        ? result
        : {
            ...result,
            dataUsed: {
              locationName: advisoryLocationName,
              weatherHighlights,
            },
          };
      setCachedAdvisory(enriched);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(ADVISORY_STORAGE_KEY, JSON.stringify(enriched));
      }
    } catch {
      // Error is surfaced in UI via mutation state.
    }
  };

  if (farmsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title={t("climate.title")} subtitle={t("climate.subtitle")} icon={CloudSun} />
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title={t("climate.title")}
        subtitle={t("climate.subtitle")}
        icon={CloudSun}
      >
        <Button variant="outline" onClick={handleUpgrade}>
          {t("climate.premium.upgrade")}
        </Button>
      </PageHeader>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 space-y-4">
        {isOffline && (
          <Alert>
            <WifiOff className="h-4 w-4" />
            <AlertTitle>{t("climate.offline")}</AlertTitle>
            <AlertDescription>{t("climate.sms.offlineHint")}</AlertDescription>
          </Alert>
        )}

        {visibleFarms.length === 0 ? (
          <Alert>
            <AlertTitle>{t("climate.empty.title")}</AlertTitle>
            <AlertDescription className="flex items-center justify-between gap-4">
              <span>{t("climate.empty.message")}</span>
              <Button size="sm" onClick={() => setAddOpen(true)}>
                {t("climate.empty.cta")}
              </Button>
            </AlertDescription>
          </Alert>
        ) : error ? (
          <Alert variant="destructive">
            <AlertTitle>{t("climate.errors.title")}</AlertTitle>
            <AlertDescription className="flex items-center justify-between gap-4">
              <span>{t("climate.errors.message")}</span>
              <Button size="sm" variant="outline" onClick={() => refetch()}>
                {t("climate.actions.retry")}
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <ForecastOverviewCard
              forecast={climateData?.forecast ?? null}
              isLoading={forecastLoading}
              t={t}
            />
            <FrostRiskCard
              frostRisk={climateData?.frostRisk ?? null}
              isLoading={forecastLoading}
              isPremium={frostAccess}
              t={t}
              onUpgrade={handleUpgrade}
            />
            <RainOutlookCard
              rainfallOutlook={climateData?.rainfallOutlook ?? null}
              isLoading={forecastLoading}
              isPremium={rainAccess}
              t={t}
              onUpgrade={handleUpgrade}
            />
            <AdvisoryCard
              advisory={climateData?.advisory ?? []}
              frostRisk={climateData?.frostRisk ?? null}
              alerts={alerts}
              aiData={advisoryResult ?? null}
              aiLoading={advisoryMutation.isPending}
              aiError={advisoryMutation.error?.message ?? null}
              onGenerateAi={handleGenerateAdvisory}
              aiLanguage={aiLanguage}
              onChangeAiLanguage={setAiLanguage}
              aiCrop={aiCrop}
              onChangeAiCrop={setAiCrop}
              aiStage={aiStage}
              onChangeAiStage={setAiStage}
              cropOptions={cropOptions}
              stageOptions={stageOptions}
              aiDataUsed={aiDataUsedFallback}
              canGenerateAi={canGenerateAi}
              aiDisabledReason={aiDisabledReason}
              isLoading={forecastLoading}
              isPremium={smsAccess}
              smsEnabled={smsEnabled}
              hasPhoneNumber={hasPhoneNumber}
              isOffline={isOffline}
              language={activeLanguage}
              onToggleSms={handleToggleSms}
              t={t}
              onUpgrade={handleUpgrade}
            />
            <FarmSelector
              farms={visibleFarms}
              selectedFarmId={selectedFarmId}
              onSelect={setSelectedFarmId}
              isPremium={premiumPlan}
              canAdd={canAddFarm}
              onAddFarm={() => setAddOpen(true)}
              t={t}
            />
          </div>
        )}

        <Card className="border-border/60">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">{t("climate.weatherAlerts.title")}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {t("climate.weatherAlerts.subtitle")}
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!alertsConfigured && (
              <Alert variant="destructive">
                <AlertTitle>{t("climate.weatherAlerts.title")}</AlertTitle>
                <AlertDescription>{t("climate.weatherAlerts.configMissing")}</AlertDescription>
              </Alert>
            )}

            <div className="rounded-md border border-border/60 p-3 text-sm">
              <p className="text-muted-foreground">{t("climate.weatherAlerts.locationLabel")}</p>
              <p className="font-semibold">{alertsLocationName}</p>
              <p className="text-xs text-muted-foreground">
                {t("climate.weatherAlerts.coordsLabel")}: {alertsCoordsLabel}
              </p>
              {!hasLocation && (
                <p className="text-xs text-muted-foreground">
                  {t("climate.weatherAlerts.selectLocation")}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="alerts-frost"
                  checked={alertsForm.wantsFrost}
                  onCheckedChange={(value) =>
                    setAlertsForm((prev) => ({ ...prev, wantsFrost: value === true }))
                  }
                />
                <Label htmlFor="alerts-frost">{t("climate.weatherAlerts.frostLabel")}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="alerts-rain"
                  checked={alertsForm.wantsRain}
                  onCheckedChange={(value) =>
                    setAlertsForm((prev) => ({ ...prev, wantsRain: value === true }))
                  }
                />
                <Label htmlFor="alerts-rain">{t("climate.weatherAlerts.rainLabel")}</Label>
              </div>
            </div>

            <Separator />

            <Tabs defaultValue="email">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email">{t("climate.weatherAlerts.emailTab")}</TabsTrigger>
                <TabsTrigger value="whatsapp">{t("climate.weatherAlerts.whatsappTab")}</TabsTrigger>
              </TabsList>
              <TabsContent value="email" className="space-y-3">
                <div>
                  <Label htmlFor="alerts-email">{t("climate.weatherAlerts.emailLabel")}</Label>
                  <Input
                    id="alerts-email"
                    type="email"
                    placeholder={t("climate.weatherAlerts.emailPlaceholder")}
                    value={alertsForm.email}
                    onChange={(e) =>
                      setAlertsForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                  />
                </div>
                {!emailValid && alertsForm.email.length > 0 && (
                  <p className="text-xs text-destructive">
                    {t("climate.weatherAlerts.errorInvalidEmail")}
                  </p>
                )}
                {subscribeEmailAlerts.error && (
                  <p className="text-xs text-destructive">
                    {subscribeEmailAlerts.error.message || t("climate.weatherAlerts.errorGeneric")}
                  </p>
                )}
                {subscribeEmailAlerts.isSuccess && (
                  <p className="text-xs text-success">{t("climate.weatherAlerts.enabled")}</p>
                )}
                <Button
                  type="button"
                  onClick={handleSubscribeEmail}
                  disabled={
                    subscribeEmailAlerts.isPending ||
                    !alertsConfigured ||
                    !hasLocation ||
                    !emailValid
                  }
                >
                  {subscribeEmailAlerts.isPending
                    ? t("climate.weatherAlerts.enabling")
                    : t("climate.weatherAlerts.enableEmail")}
                </Button>
              </TabsContent>
              <TabsContent value="whatsapp" className="space-y-3">
                <div>
                  <Label htmlFor="alerts-whatsapp">
                    {t("climate.weatherAlerts.whatsappLabel")}
                  </Label>
                  <Input
                    id="alerts-whatsapp"
                    type="tel"
                    placeholder={t("climate.weatherAlerts.whatsappPlaceholder")}
                    value={alertsForm.msisdn}
                    onChange={(e) =>
                      setAlertsForm((prev) => ({ ...prev, msisdn: e.target.value }))
                    }
                  />
                </div>
                {!whatsappValid && alertsForm.msisdn.length > 0 && (
                  <p className="text-xs text-destructive">
                    {t("climate.weatherAlerts.errorInvalidWhatsApp")}
                  </p>
                )}
                {subscribeWhatsAppAlerts.error && (
                  <p className="text-xs text-destructive">
                    {subscribeWhatsAppAlerts.error.message ||
                      t("climate.weatherAlerts.errorGeneric")}
                  </p>
                )}
                {subscribeWhatsAppAlerts.isSuccess && (
                  <p className="text-xs text-success">{t("climate.weatherAlerts.enabled")}</p>
                )}
                <Button
                  type="button"
                  onClick={handleSubscribeWhatsApp}
                  disabled={
                    subscribeWhatsAppAlerts.isPending ||
                    !alertsConfigured ||
                    !hasLocation ||
                    !whatsappValid
                  }
                >
                  {subscribeWhatsAppAlerts.isPending
                    ? t("climate.weatherAlerts.enabling")
                    : t("climate.weatherAlerts.enableWhatsApp")}
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("climate.form.title")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label htmlFor="farm-name">{t("climate.form.name")}</Label>
              <Input
                id="farm-name"
                value={formState.name}
                onChange={(e) => setFormState((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="farm-county">{t("climate.form.county")}</Label>
                <Input
                  id="farm-county"
                  value={formState.county}
                  onChange={(e) => setFormState((prev) => ({ ...prev, county: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="farm-ward">{t("climate.form.ward")}</Label>
                <Input
                  id="farm-ward"
                  value={formState.ward}
                  onChange={(e) => setFormState((prev) => ({ ...prev, ward: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="farm-lat">{t("climate.form.lat")}</Label>
                <Input
                  id="farm-lat"
                  type="number"
                  value={formState.lat}
                  onChange={(e) => setFormState((prev) => ({ ...prev, lat: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="farm-lon">{t("climate.form.lon")}</Label>
                <Input
                  id="farm-lon"
                  type="number"
                  value={formState.lon}
                  onChange={(e) => setFormState((prev) => ({ ...prev, lon: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {t("climate.form.useLocation")}
              </p>
              <Button type="button" variant="outline" size="sm" onClick={handleUseLocation}>
                {t("climate.form.useLocation")}
              </Button>
            </div>
            <div>
              <Label htmlFor="farm-elevation">{t("climate.form.elevation")}</Label>
              <Input
                id="farm-elevation"
                type="number"
                value={formState.elevation}
                onChange={(e) => setFormState((prev) => ({ ...prev, elevation: e.target.value }))}
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleCreateFarm} disabled={createFarm.isPending}>
                {t("climate.form.save")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
