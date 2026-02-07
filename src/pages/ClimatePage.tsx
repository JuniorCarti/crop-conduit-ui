import { useEffect, useMemo, useState } from "react";
import type { KeyboardEvent } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  Bell,
  ChevronDown,
  CloudRain,
  CloudSun,
  Droplet,
  Leaf,
  MapPin,
  Sprout,
  Snowflake,
  Sun,
  Thermometer,
  Truck,
  WifiOff,
  Wind,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
import { getAdvisoryContext } from "@/services/advisoryContextService";
import { getSupportedCommodities } from "@/services/marketOracleService";
import { useCropPrices } from "@/hooks/useApi";
import {
  buildDecisionSupport,
  type DecisionSupportForecastDay,
  type DecisionSupportOutput,
} from "@/services/decisionSupportService";
import { useClimateStore } from "@/store/climateStore";
import { usePremiumModalStore } from "@/store/premiumStore";
import type { AdvisoryGenerateResponse } from "@/types/advisory";
import type { UserFeatureFlags } from "@/types/climate";
import { computeClimateInsights, type ClimateSignal } from "@/lib/climateInsights";
import { getConstituencies, getCounties, getWards } from "@/utils/kenyaAdminData";
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
const LAST_FARM_LAT_KEY = "agrismart:lastFarmLat";
const LAST_FARM_LON_KEY = "agrismart:lastFarmLon";
const LAST_FARM_NAME_KEY = "agrismart:lastFarmName";

const signalTone: Record<ClimateSignal["level"], string> = {
  low: "bg-success/10 text-success",
  medium: "bg-warning/10 text-warning",
  high: "bg-destructive/10 text-destructive",
  good: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  critical: "bg-destructive/10 text-destructive",
};

const signalIconTone: Record<ClimateSignal["level"], string> = {
  low: "text-success",
  medium: "text-warning",
  high: "text-destructive",
  good: "text-success",
  warning: "text-warning",
  critical: "text-destructive",
};

const signalIcons: Record<string, LucideIcon> = {
  "heat-stress": Thermometer,
  "cold-stress": Snowflake,
  "rainfall-trend": CloudRain,
  "planting-window": Leaf,
  "irrigation-pressure": Droplet,
  "soil-waterlogging": CloudRain,
  "disease-pressure": Activity,
  "wind-exposure": Wind,
  "spray-suitability": Wind,
  "harvest-disruption": AlertTriangle,
  "market-transport": Truck,
};

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
  const { data: oraclePrices, error: oracleError } = useCropPrices();

  useEffect(() => {
    if (profile) {
      setUserPlan(profile.plan, profile.features || defaultFeatures);
    }
  }, [profile, setUserPlan]);

  const [addOpen, setAddOpen] = useState(false);
  const [aiLanguage, setAiLanguage] = useState<"en" | "sw">("en");
  const [aiCrop, setAiCrop] = useState<string>("tomatoes");
  const [aiStage, setAiStage] = useState<string>("vegetative");
  const [advisoryProgress, setAdvisoryProgress] = useState<string | null>(null);
  const [advisoryError, setAdvisoryError] = useState<string | null>(null);
  const [advisoryBusy, setAdvisoryBusy] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
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
    subCounty: "",
    ward: "",
    lat: "",
    lon: "",
    elevation: "",
    crops: [] as string[],
  });
  const [cropInput, setCropInput] = useState("");
  const [snapshotOpen, setSnapshotOpen] = useState(false);

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

  const countyOptions = useMemo(() => getCounties(), []);
  const constituencyOptions = useMemo(
    () => (formState.county ? getConstituencies(formState.county) : []),
    [formState.county]
  );
  const wardOptions = useMemo(
    () =>
      formState.county && formState.subCounty
        ? getWards(formState.county, formState.subCounty)
        : [],
    [formState.county, formState.subCounty]
  );

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
  const climateSignals = useMemo(() => {
    if (!selectedFarm || !climateData?.forecast) return [];
    return computeClimateInsights(
      {
        lat: selectedFarm.lat,
        lon: selectedFarm.lon,
        county: selectedFarm.county,
        ward: selectedFarm.ward,
        crops: selectedFarm.crops ?? [],
      },
      climateData.forecast
    );
  }, [climateData?.forecast, selectedFarm]);

  const snapshotRows = useMemo(() => {
    const days = climateData?.forecast?.forecast?.forecastday ?? [];
    return days.slice(0, 7).map((day) => {
      const rainChance = day.day.daily_chance_of_rain ?? 0;
      const precip = day.day.totalprecip_mm ?? 0;
      const condition =
        rainChance >= 70 || precip >= 10
          ? "Wet"
          : rainChance >= 40 || precip >= 2
          ? "Mixed"
          : "Dry";
      return {
        date: day.date,
        min: Math.round(day.day.mintemp_c),
        max: Math.round(day.day.maxtemp_c),
        rainChance: Math.round(rainChance),
        condition,
      };
    });
  }, [climateData?.forecast?.forecast?.forecastday]);

  const snapshotRange = useMemo(() => {
    if (snapshotRows.length === 0) {
      return { min: 0, max: 0, range: 1 };
    }
    const min = Math.min(...snapshotRows.map((row) => row.min));
    const max = Math.max(...snapshotRows.map((row) => row.max));
    return { min, max, range: Math.max(max - min, 1) };
  }, [snapshotRows]);

  const decisionForecast = useMemo<DecisionSupportForecastDay[]>(() => {
    const days = climateData?.forecast?.forecast?.forecastday ?? [];
    return days.map((day) => ({
      date: day.date,
      chanceOfRain: day.day.daily_chance_of_rain ?? 0,
      totalPrecipMm: day.day.totalprecip_mm ?? 0,
      maxTempC: day.day.maxtemp_c ?? 0,
      minTempC: day.day.mintemp_c ?? 0,
      maxWindKph: day.day.maxwind_kph ?? 0,
    }));
  }, [climateData?.forecast?.forecast?.forecastday]);

  const keyAlertSignals = useMemo(() => {
    const candidates = climateSignals.filter((signal) =>
      ["heat-stress", "cold-stress", "rainfall-trend"].includes(signal.id)
    );
    return candidates
      .filter((signal) => !["good", "low"].includes(signal.level))
      .slice(0, 3);
  }, [climateSignals]);

  const signalGroups = useMemo(() => {
    const byId = new Map(climateSignals.map((signal) => [signal.id, signal]));
    const groups = [
      {
        id: "temp-moisture",
        title: "Temperature & Moisture",
        items: ["heat-stress", "cold-stress", "irrigation-pressure", "soil-waterlogging"],
      },
      {
        id: "rain-disease",
        title: "Rain & Disease",
        items: ["rainfall-trend", "disease-pressure", "planting-window"],
      },
      {
        id: "operations-transport",
        title: "Operations & Transport",
        items: ["wind-exposure", "spray-suitability", "harvest-disruption", "market-transport"],
      },
    ];
    return groups
      .map((group) => ({
        ...group,
        signals: group.items.map((id) => byId.get(id)).filter(Boolean) as ClimateSignal[],
      }))
      .filter((group) => group.signals.length > 0);
  }, [climateSignals]);

  const headerSummary = useMemo(() => {
    const days = climateData?.forecast?.forecast?.forecastday ?? [];
    if (!days.length) {
      return {
        days: 0,
        avgMax: null,
        totalRain: null,
        avgChance: null,
      };
    }
    const avgMax =
      days.reduce((sum, day) => sum + (day.day.maxtemp_c ?? 0), 0) / days.length;
    const totalRain = days.reduce((sum, day) => sum + (day.day.totalprecip_mm ?? 0), 0);
    const avgChance =
      days.reduce((sum, day) => sum + (day.day.daily_chance_of_rain ?? 0), 0) /
      days.length;
    return {
      days: days.length,
      avgMax: Math.round(avgMax),
      totalRain: Math.round(totalRain),
      avgChance: Math.round(avgChance),
    };
  }, [climateData?.forecast?.forecast?.forecastday]);
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
        weatherSource: "Weather proxy",
        weatherTimestamp: climateData?.forecast?.location?.localtime ?? null,
      };

  const decisionSupport = useMemo<DecisionSupportOutput>(() => {
    return buildDecisionSupport({
      crop: aiCrop,
      location: {
        county: selectedFarm?.county,
        ward: selectedFarm?.ward,
        name: selectedFarm?.name,
      },
      forecastDaily: decisionForecast,
      marketOracleData: oraclePrices ?? [],
    });
  }, [aiCrop, decisionForecast, oraclePrices, selectedFarm?.county, selectedFarm?.name, selectedFarm?.ward]);

  const decisionSupportError = oracleError
    ? "Market Oracle unavailable - using weather-only guidance."
    : null;

  const cropLabel = useMemo(() => {
    return cropOptions.find((option) => option.value === aiCrop)?.label ?? aiCrop;
  }, [aiCrop, cropOptions]);

  const weekSummary = useMemo(() => {
    if (!headerSummary.days) {
      return "Add a farm to see this week's summary.";
    }
    const rain =
      headerSummary.avgChance != null && headerSummary.avgChance >= 60
        ? "Good rains expected"
        : headerSummary.avgChance != null && headerSummary.avgChance >= 30
        ? "Light showers likely"
        : "Dry week expected";
    const temp =
      headerSummary.avgMax != null && headerSummary.avgMax >= 32
        ? "hot afternoons"
        : headerSummary.avgMax != null && headerSummary.avgMax <= 20
        ? "cool days"
        : "mild temperatures";
    return `This week: ${rain}, ${temp} good for ${cropLabel}.`;
  }, [cropLabel, headerSummary.avgChance, headerSummary.avgMax, headerSummary.days]);

  const actionCards = useMemo(() => {
    const cards: Array<{
      title: string;
      reason: string;
      tone: "good" | "warn" | "risk";
    }> = [];

    if (decisionSupport.plantingAdvice.window.toLowerCase().includes("delay")) {
      cards.push({
        title: "Delay planting this week",
        reason: decisionSupport.plantingAdvice.reasons[0] ?? "Dry spell expected.",
        tone: "risk",
      });
    } else {
      cards.push({
        title: "Planting is favorable this week",
        reason: decisionSupport.plantingAdvice.reasons[0] ?? "Soil moisture improving.",
        tone: decisionSupport.plantingAdvice.confidence === "High" ? "good" : "warn",
      });
    }

    if (decisionSupport.harvestAdvice.weatherRisk === "Rain") {
      cards.push({
        title: "Harvest before heavy rain",
        reason: decisionSupport.harvestAdvice.reasons[0] ?? "Heavy rain risk soon.",
        tone: "risk",
      });
    } else if (decisionSupport.harvestAdvice.weatherRisk === "Heat") {
      cards.push({
        title: "Harvest early mornings",
        reason: decisionSupport.harvestAdvice.reasons[0] ?? "Heat stress expected.",
        tone: "warn",
      });
    } else {
      cards.push({
        title: "Harvest on schedule",
        reason: decisionSupport.harvestAdvice.reasons[0] ?? "Weather is stable.",
        tone: "good",
      });
    }

    cards.push({
      title: decisionSupport.riskAlert.title,
      reason: decisionSupport.riskAlert.tips[0] ?? "Monitor fields closely.",
      tone:
        decisionSupport.riskAlert.level === "Red"
          ? "risk"
          : decisionSupport.riskAlert.level === "Orange"
          ? "warn"
          : "good",
    });

    return cards.slice(0, 3);
  }, [decisionSupport]);

  const marketMessage = useMemo(() => {
    const change = decisionSupport.marketSignal.changePct;
    if (decisionSupport.marketSignal.price == null) {
      return "No live prices — forecast-only mode.";
    }
    const trend =
      change != null && change > 0
        ? "rising"
        : change != null && change < 0
        ? "softening"
        : "steady";
    return `${cropLabel} prices are ${trend} this week. Good time to plan sales.`;
  }, [cropLabel, decisionSupport.marketSignal.changePct, decisionSupport.marketSignal.price]);

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
    if (!formState.name || !formState.county || !formState.subCounty || !formState.ward) {
      toast.error(t("climate.form.errorRequired"));
      return;
    }
    if (formState.lat.trim() === "" || formState.lon.trim() === "") {
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
      const normalizedCrops = formState.crops
        .map((crop) => crop.trim())
        .filter((crop) => crop.length > 0)
        .filter(
          (crop, index, arr) =>
            arr.findIndex((item) => item.toLowerCase() === crop.toLowerCase()) === index
        );
      const farmId = await createFarm.mutateAsync({
        name: formState.name.trim(),
        county: formState.county.trim(),
        subCounty: formState.subCounty.trim(),
        ward: formState.ward.trim(),
        lat,
        lon,
        elevation: formState.elevation ? Number(formState.elevation) : undefined,
        crops: normalizedCrops,
      });
      toast.success(t("climate.form.success"));
      setAddOpen(false);
      setFormState({
        name: "",
        county: "",
        subCounty: "",
        ward: "",
        lat: "",
        lon: "",
        elevation: "",
        crops: [],
      });
      setCropInput("");
      setSelectedFarmId(farmId);
    } catch (err: any) {
      toast.error(err?.message || t("climate.form.error"));
    }
  };

  const handleAddCrops = (value: string) => {
    const parts = value
      .split(",")
      .map((part) => part.trim())
      .filter((part) => part.length > 0);

    if (!parts.length) return;

    setFormState((prev) => {
      const existing = prev.crops.map((crop) => crop.toLowerCase());
      const next = [...prev.crops];
      parts.forEach((part) => {
        const key = part.toLowerCase();
        if (!existing.includes(key)) {
          existing.push(key);
          next.push(part);
        }
      });
      return { ...prev, crops: next };
    });
  };

  const handleCropKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      handleAddCrops(cropInput);
      setCropInput("");
    }
  };

  const handleRemoveCrop = (crop: string) => {
    setFormState((prev) => ({
      ...prev,
      crops: prev.crops.filter((item) => item !== crop),
    }));
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
      setAdvisoryError(null);
      advisoryMutation.reset();
      setAdvisoryBusy(true);
      setAdvisoryProgress(t("climate.aiAdvisory.progress.weather", "Fetching weather..."));

      const { context, meta } = await getAdvisoryContext(
        {
          name: aiCrop,
          stage: aiStage,
        },
        {
          county: selectedFarm?.county || "",
          ward: selectedFarm?.ward || "",
          lat: advisoryLat,
          lng: advisoryLon,
        },
        aiLanguage,
        {
          signals: climateSignals,
          onProgress: (step) => {
            setAdvisoryProgress(
              step === "weather"
                ? t("climate.aiAdvisory.progress.weather", "Fetching weather...")
                : t("climate.aiAdvisory.progress.market", "Fetching market...")
            );
          },
        }
      );

      setAdvisoryProgress(t("climate.aiAdvisory.progress.generate", "Generating advisory..."));
      const result = await advisoryMutation.mutateAsync(context);
      const enriched = {
        ...result,
        dataUsed: {
          ...meta,
          locationName: advisoryLocationName,
        },
      };
      setCachedAdvisory(enriched);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(ADVISORY_STORAGE_KEY, JSON.stringify(enriched));
      }
    } catch (error: any) {
      setAdvisoryError(
        error?.message || t("climate.aiAdvisory.error", "Unable to generate advisory.")
      );
      toast.error(
        error?.message || t("climate.aiAdvisory.error", "Unable to generate advisory.")
      );
    } finally {
      setAdvisoryBusy(false);
      setAdvisoryProgress(null);
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
          <>
            <div className="space-y-6">
              <Card className="border-border/60">
                <CardContent className="space-y-4 p-5 md:p-6">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Farm snapshot</p>
                      <h2 className="text-2xl font-semibold text-foreground">
                        {selectedFarm?.name || t("climate.farmSelector.placeholder")}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {selectedFarm
                          ? [selectedFarm.county, selectedFarm.subCounty, selectedFarm.ward]
                              .filter(Boolean)
                              .join(" / ")
                          : t("climate.signals.selectFarm")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 rounded-full bg-muted/60 px-3 py-1 text-xs text-muted-foreground">
                      <Leaf className="h-4 w-4 text-success" />
                      <span>Crop: {cropLabel}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2">
                      <CloudRain className="h-4 w-4 text-info" />
                      <span>{headerSummary.avgChance != null ? `${headerSummary.avgChance}% rain` : "--"}</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2">
                      <Thermometer className="h-4 w-4 text-warning" />
                      <span>{headerSummary.avgMax != null ? `${headerSummary.avgMax}C avg max` : "--"}</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2">
                      <Sprout className="h-4 w-4 text-success" />
                      <span>Next 7 days</span>
                    </div>
                  </div>
                  <p className="text-base font-medium text-foreground">{weekSummary}</p>
                </CardContent>
              </Card>

              <div className="space-y-3">
                <h2 className="text-lg font-semibold">What you should do this week</h2>
                <div className="grid gap-3 md:grid-cols-3">
                  {actionCards.map((action) => (
                    <Card
                      key={action.title}
                      className={`border-border/60 ${
                        action.tone === "good"
                          ? "bg-success/5"
                          : action.tone === "warn"
                          ? "bg-warning/5"
                          : "bg-destructive/5"
                      }`}
                    >
                      <CardContent className="space-y-2 p-4">
                        <p className="text-sm font-semibold text-foreground">{action.title}</p>
                        <p className="text-xs text-muted-foreground">{action.reason}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-border/60">
                  <CardHeader>
                    <CardTitle className="text-base">Risk alerts</CardTitle>
                    <p className="text-sm text-muted-foreground">Simple warnings to avoid losses.</p>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-warning" />
                      <p className="text-sm font-semibold">{decisionSupport.riskAlert.title}</p>
                    </div>
                    {decisionSupport.riskAlert.tips.map((tip) => (
                      <p key={tip} className="text-xs text-muted-foreground">
                        {tip}
                      </p>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-border/60">
                  <CardHeader>
                    <CardTitle className="text-base">Market opportunity</CardTitle>
                    <p className="text-sm text-muted-foreground">Use Market Oracle signals.</p>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm font-semibold">{marketMessage}</p>
                    <p className="text-xs text-muted-foreground">
                      {decisionSupport.marketSignal.transportTip ??
                        decisionSupport.marketSignal.fallback ??
                        "Consider group transport to reduce costs."}
                    </p>
                    {decisionSupportError && (
                      <p className="text-xs text-warning">{decisionSupportError}</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card className="border-border/60 bg-success/5">
                <CardContent className="p-4">
                  <p className="text-sm font-semibold">Weekly tip</p>
                  <p className="text-sm text-muted-foreground">{decisionSupport.profitTip.tip}</p>
                </CardContent>
              </Card>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">View details</p>
                  <p className="text-xs text-muted-foreground">
                    Forecasts, AI advisory, and full alerts.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDetailsOpen((prev) => !prev)}
                >
                  {detailsOpen ? "Hide details" : "View details"}
                </Button>
              </div>
            </div>

            <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
              <CollapsibleContent className="space-y-4 pt-4">
            <div className="sticky top-0 z-20 -mx-4 border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {selectedFarm
                        ? [
                            selectedFarm.county,
                            selectedFarm.subCounty,
                            selectedFarm.ward,
                          ]
                            .filter(Boolean)
                            .join(" / ")
                        : t("climate.signals.selectFarm")}
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold">
                    {selectedFarm?.name || t("climate.farmSelector.placeholder")}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {t("climate.form.cropsLabel")}:
                    </span>
                    {selectedFarm?.crops?.length ? (
                      selectedFarm.crops.slice(0, 4).map((crop) => (
                        <Badge key={crop} variant="secondary" className="text-xs">
                          {crop}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {t("climate.locationHeader.cropsEmpty")}
                      </span>
                    )}
                    {selectedFarm?.crops && selectedFarm.crops.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{selectedFarm.crops.length - 4}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <div className="flex items-center gap-2 rounded-full border border-border/60 px-3 py-1">
                    <Sun className="h-4 w-4 text-warning" />
                    <span>
                      {t("climate.locationHeader.range", {
                        days: headerSummary.days || 0,
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-muted/60 px-3 py-1">
                    <Thermometer className="h-4 w-4 text-primary" />
                    <span>
                      {headerSummary.avgMax != null
                        ? `${headerSummary.avgMax}C avg max`
                        : "--"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-muted/60 px-3 py-1">
                    <CloudRain className="h-4 w-4 text-info" />
                    <span>
                      {headerSummary.totalRain != null
                        ? `${headerSummary.totalRain} mm total`
                        : "--"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-muted/60 px-3 py-1">
                    <Droplet className="h-4 w-4 text-success" />
                    <span>
                      {headerSummary.avgChance != null
                        ? `${headerSummary.avgChance}% rain`
                        : "--"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {keyAlertSignals.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <h2 className="text-base font-semibold">{t("climate.keyAlerts.title")}</h2>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  {keyAlertSignals.map((signal) => {
                    const Icon = signalIcons[signal.id] || AlertTriangle;
                    return (
                      <Card key={signal.id} className="border-border/60">
                        <CardContent className="flex items-center gap-3 p-4">
                          <div className="rounded-lg bg-muted/60 p-2">
                            <Icon className={`h-5 w-5 ${signalIconTone[signal.level]}`} />
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-semibold">{signal.title}</p>
                            {signal.observations[0] && (
                              <p className="text-xs text-muted-foreground">
                                {signal.observations[0]}
                              </p>
                            )}
                          </div>
                          <Badge className={signalTone[signal.level]}>{signal.badgeText}</Badge>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

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

            <div className="space-y-3">
              <div>
                <h2 className="text-base font-semibold">{t("climate.signals.title")}</h2>
                <p className="text-sm text-muted-foreground">
                  {t("climate.signals.subtitle")}
                </p>
              </div>

              {!selectedFarm ? (
                <Alert>
                  <AlertTitle>{t("climate.signals.title")}</AlertTitle>
                  <AlertDescription>{t("climate.signals.selectFarm")}</AlertDescription>
                </Alert>
              ) : forecastLoading ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <Skeleton className="h-44 rounded-xl" />
                  <Skeleton className="h-44 rounded-xl" />
                </div>
              ) : !climateData?.forecast ? (
                <Alert variant="destructive">
                  <AlertTitle>{t("climate.signals.title")}</AlertTitle>
                  <AlertDescription>{t("climate.signals.noData")}</AlertDescription>
                </Alert>
              ) : climateSignals.length === 0 ? (
                <Alert>
                  <AlertTitle>{t("climate.signals.title")}</AlertTitle>
                  <AlertDescription>{t("climate.signals.empty")}</AlertDescription>
                </Alert>
              ) : (
                <Accordion
                  type="multiple"
                  defaultValue={signalGroups.map((group) => group.id)}
                  className="rounded-xl border border-border/60 bg-card"
                >
                  {signalGroups.map((group) => (
                    <AccordionItem
                      key={group.id}
                      value={group.id}
                      className="border-b last:border-none"
                    >
                      <AccordionTrigger className="px-4 py-3 text-sm font-semibold">
                        <span className="flex items-center gap-2">
                          {group.title}
                          <Badge variant="outline" className="text-xs">
                            {group.signals.length}
                          </Badge>
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="grid gap-3 md:grid-cols-2">
                          {group.signals.map((signal) => {
                            const Icon = signalIcons[signal.id] || Activity;
                            return (
                              <Collapsible
                                key={signal.id}
                                className="rounded-lg border border-border/60 bg-background"
                              >
                                <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left">
                                  <div className="flex items-center gap-3">
                                    <div className="rounded-md bg-muted/60 p-2">
                                      <Icon
                                        className={`h-4 w-4 ${signalIconTone[signal.level]}`}
                                      />
                                    </div>
                                    <div>
                                      <p className="text-sm font-semibold">{signal.title}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge className={signalTone[signal.level]}>
                                      {signal.badgeText}
                                    </Badge>
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="px-3 pb-3 text-sm">
                                  <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
                                    {signal.observations.map((observation, index) => (
                                      <li key={`${signal.id}-obs-${index}`}>{observation}</li>
                                    ))}
                                  </ul>
                                  <p className="mt-2 text-xs text-muted-foreground">
                                    <span className="font-semibold text-foreground">Why:</span>{" "}
                                    {signal.why}
                                  </p>
                                </CollapsibleContent>
                              </Collapsible>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold">{t("climate.snapshot.title")}</h2>
                  <p className="text-sm text-muted-foreground">{t("climate.snapshot.subtitle")}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSnapshotOpen((prev) => !prev)}
                >
                  {snapshotOpen
                    ? t("climate.snapshot.hideTable")
                    : t("climate.snapshot.viewTable")}
                </Button>
              </div>
              <Card className="border-border/60">
                <CardContent className="space-y-3 p-4">
                  {snapshotRows.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t("climate.signals.noData")}</p>
                  ) : (
                    <div className="space-y-3">
                      {snapshotRows.length < 7 && (
                        <p className="text-xs text-muted-foreground">
                          Only {snapshotRows.length} days available from forecast source.
                        </p>
                      )}
                      {snapshotRows.map((row) => {
                        const left = ((row.min - snapshotRange.min) / snapshotRange.range) * 100;
                        const width = ((row.max - row.min) / snapshotRange.range) * 100;
                        const RainIcon = row.rainChance >= 60 ? CloudRain : Sun;
                        return (
                          <div key={row.date} className="flex items-center gap-3">
                            <span className="w-16 text-xs text-muted-foreground">{row.date}</span>
                            <div className="flex-1">
                              <div className="relative h-2 rounded-full bg-muted">
                                <div
                                  className="absolute h-2 rounded-full bg-primary/60"
                                  style={{ left: `${left}%`, width: `${Math.max(width, 6)}%` }}
                                />
                              </div>
                              <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                                <span>{`${row.min}C`}</span>
                                <span>{`${row.max}C`}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <RainIcon className="h-4 w-4" />
                              <span>{`${row.rainChance}%`}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <Collapsible open={snapshotOpen} onOpenChange={setSnapshotOpen}>
                    <CollapsibleContent>
                      <div className="overflow-x-auto rounded-md border border-border/60">
                        <table className="w-full text-xs">
                          <thead className="bg-muted/60 text-muted-foreground">
                            <tr>
                              <th className="px-2 py-1 text-left">
                                {t("climate.signals.table.date")}
                              </th>
                              <th className="px-2 py-1 text-left">
                                {t("climate.signals.table.min")}
                              </th>
                              <th className="px-2 py-1 text-left">
                                {t("climate.signals.table.max")}
                              </th>
                              <th className="px-2 py-1 text-left">
                                {t("climate.signals.table.rainChance")}
                              </th>
                              <th className="px-2 py-1 text-left">
                                {t("climate.signals.table.condition")}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {snapshotRows.map((row) => (
                              <tr key={row.date} className="border-t border-border/60">
                                <td className="px-2 py-1">{row.date}</td>
                                <td className="px-2 py-1">{`${row.min}C`}</td>
                                <td className="px-2 py-1">{`${row.max}C`}</td>
                                <td className="px-2 py-1">{`${row.rainChance}%`}</td>
                                <td className="px-2 py-1">{row.condition}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </CardContent>
              </Card>
            </div>

            <div className="rounded-2xl border border-border/60 bg-muted/40 p-4 md:p-6">
              <div className="mb-4">
                <h2 className="text-base font-semibold">{t("climate.aiAdvisory.title")}</h2>
                <Badge variant="outline" className="mt-2 text-xs">
                  {t("climate.aiAdvisory.sectionLabel")}
                </Badge>
              </div>
              <AdvisoryCard
                aiData={advisoryResult ?? null}
                aiLoading={advisoryBusy}
                aiError={advisoryError ?? advisoryMutation.error?.message ?? null}
                aiProgress={advisoryProgress}
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
                t={t}
                onUpgrade={handleUpgrade}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                <h2 className="text-base font-semibold">{t("climate.alertsSection.title")}</h2>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
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
                            {subscribeEmailAlerts.error.message ||
                              t("climate.weatherAlerts.errorGeneric")}
                          </p>
                        )}
                        {subscribeEmailAlerts.isSuccess && (
                          <p className="text-xs text-success">
                            {t("climate.weatherAlerts.enabled")}
                          </p>
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
                          <Label htmlFor="alerts-whatsapp">{t("climate.weatherAlerts.whatsappLabel")}</Label>
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
                          <p className="text-xs text-success">
                            {t("climate.weatherAlerts.enabled")}
                          </p>
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

                <Card className="border-border/60">
                  <CardHeader>
                    <CardTitle className="text-base">{t("climate.alertsSection.notifications")}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {t("climate.alertsSection.notificationsHint")}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-md border border-border/60 p-3">
                      <div>
                        <p className="text-sm font-semibold">{t("climate.sms.title")}</p>
                        <p className="text-xs text-muted-foreground">
                          {isOffline ? t("climate.sms.offlineHint") : t("climate.sms.helper")}
                        </p>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <Switch
                              checked={smsEnabled}
                              disabled={!hasPhoneNumber || !smsAccess}
                              onCheckedChange={handleToggleSms}
                            />
                          </div>
                        </TooltipTrigger>
                        {!hasPhoneNumber && (
                          <TooltipContent>
                            <p>{t("climate.sms.needsPhone")}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">{t("climate.alertsSection.recent")}</p>
                        <Badge variant="outline">{t("climate.frostRisk.title")}</Badge>
                      </div>
                      {alerts.length === 0 ? (
                        <p className="text-xs text-muted-foreground">{t("climate.advisory.noAlerts")}</p>
                      ) : (
                        <div className="space-y-3 border-l border-border/60 pl-3">
                          {alerts.slice(0, 4).map((alert) => (
                            <div key={alert.id} className="relative space-y-1">
                              <span className="absolute -left-4 top-1 h-2 w-2 rounded-full bg-primary" />
                              <div className="flex items-center gap-2">
                                <Badge className="text-xs" variant="outline">
                                  {t(`climate.alerts.${alert.type}`)}
                                </Badge>
                                <Badge className="text-xs" variant="outline">
                                  {t(`climate.risk.${alert.severity.toLowerCase()}`)}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {activeLanguage === "sw"
                                  ? alert.messageSw || alert.messageEn
                                  : alert.messageEn || alert.messageSw}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
              </CollapsibleContent>
            </Collapsible>
          </>
        )}

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
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <Label htmlFor="farm-county">{t("climate.form.county")}</Label>
                <Select
                  value={formState.county}
                  onValueChange={(value) =>
                    setFormState((prev) => ({
                      ...prev,
                      county: value,
                      subCounty: "",
                      ward: "",
                    }))
                  }
                >
                  <SelectTrigger id="farm-county">
                    <SelectValue placeholder={t("climate.form.countyPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {countyOptions.map((county) => (
                      <SelectItem key={county} value={county}>
                        {county}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="farm-subcounty">{t("climate.form.subCounty")}</Label>
                <Select
                  value={formState.subCounty}
                  onValueChange={(value) =>
                    setFormState((prev) => ({ ...prev, subCounty: value, ward: "" }))
                  }
                  disabled={!formState.county}
                >
                  <SelectTrigger id="farm-subcounty" disabled={!formState.county}>
                    <SelectValue placeholder={t("climate.form.subCountyPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {constituencyOptions.map((constituency) => (
                      <SelectItem key={constituency} value={constituency}>
                        {constituency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="farm-ward">{t("climate.form.ward")}</Label>
                <Select
                  value={formState.ward}
                  onValueChange={(value) => setFormState((prev) => ({ ...prev, ward: value }))}
                  disabled={!formState.subCounty}
                >
                  <SelectTrigger id="farm-ward" disabled={!formState.subCounty}>
                    <SelectValue placeholder={t("climate.form.wardPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {wardOptions.map((ward) => (
                      <SelectItem key={ward} value={ward}>
                        {ward}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="farm-crops">{t("climate.form.cropsLabel")}</Label>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  id="farm-crops"
                  value={cropInput}
                  placeholder={t("climate.form.cropsPlaceholder")}
                  onChange={(e) => setCropInput(e.target.value)}
                  onKeyDown={handleCropKeyDown}
                  onBlur={() => {
                    if (cropInput.trim()) {
                      handleAddCrops(cropInput);
                      setCropInput("");
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0"
                  onClick={() => {
                    handleAddCrops(cropInput);
                    setCropInput("");
                  }}
                  disabled={!cropInput.trim()}
                >
                  {t("climate.form.cropsAdd")}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">{t("climate.form.cropsHint")}</p>
              {formState.crops.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formState.crops.map((crop) => (
                    <Badge key={crop} variant="secondary" className="gap-1">
                      {crop}
                      <button
                        type="button"
                        className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full hover:text-foreground"
                        onClick={() => handleRemoveCrop(crop)}
                        aria-label={t("climate.form.cropsRemove")}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
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
