import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, CloudSun, Mic, RotateCcw, Sparkles, TrendingUp, Wheat } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useUserAccount } from "@/hooks/useUserAccount";
import { useAshaChat } from "@/hooks/useAshaChat";
import { useVoice } from "@/hooks/useVoice";
import { useFarms } from "@/hooks/useClimate";
import { useClimateStore } from "@/store/climateStore";
import { ChatThread } from "@/components/asha/ChatThread";
import { ChatComposer } from "@/components/asha/ChatComposer";
import { ContextPanel } from "@/components/asha/ContextPanel";
import { SuggestionChips } from "@/components/asha/SuggestionChips";
import { fetchForecast } from "@/services/weatherProxyService";
import type { WeatherApiForecast } from "@/services/weatherProxyService";
import { cn } from "@/lib/utils";

const LANGUAGE_KEY = "asha_language";
const AUTO_READ_KEY = "asha_auto_read";

const defaultSuggestions = [
  "Show me tomato prices",
  "Will it rain this week?",
  "Add kale to cart",
  "Help me checkout",
  "Create a maize listing",
];

const loadToggle = (key: string, fallback = false) => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw == null) return fallback;
    return raw === "true";
  } catch {
    return fallback;
  }
};

const loadLanguage = (): "auto" | "en" | "sw" => {
  if (typeof window === "undefined") return "auto";
  const raw = window.localStorage.getItem(LANGUAGE_KEY);
  if (raw === "sw") return "sw";
  if (raw === "en") return "en";
  return "auto";
};

const extractWeatherSummary = (forecast: WeatherApiForecast | null) => {
  if (!forecast) return null;
  const days = forecast.forecast.forecastday || [];
  if (!days.length) return null;
  const minTemp = Math.min(...days.map((day) => day.day.mintemp_c));
  const maxTemp = Math.max(...days.map((day) => day.day.maxtemp_c));
  const rainChance = Math.max(...days.map((day) => day.day.daily_chance_of_rain ?? 0));
  return {
    locationName: forecast.location?.name,
    minTemp: Math.round(minTemp),
    maxTemp: Math.round(maxTemp),
    rainChance: Math.round(rainChance),
  };
};

type ContextCacheEntry = {
  weather?: {
    locationName?: string;
    minTemp?: number;
    maxTemp?: number;
    rainChance?: number;
  };
  market?: {
    commodity?: string;
    county?: string;
    market?: string;
    retail?: number;
    wholesale?: number;
    asOf?: string | null;
  };
  updatedAt: number;
};

export default function AshaVoice() {
  const { currentUser } = useAuth();
  const { cartItems } = useCart();
  const accountQuery = useUserAccount();
  const { farms, isLoading: farmsLoading } = useFarms();
  const { selectedFarmId, setSelectedFarmId } = useClimateStore();
  const { sessionId, messages, isLoading, error, sendMessage, resetSession, hasMessages } = useAshaChat();

  const [input, setInput] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<"auto" | "en" | "sw">(loadLanguage());
  const [autoRead, setAutoRead] = useState(loadToggle(AUTO_READ_KEY));
  const [weatherSummary, setWeatherSummary] = useState<any | null>(null);
  const [showContext, setShowContext] = useState(false);
  const contextCacheRef = useRef<Record<string, ContextCacheEntry>>({});

  const selectedFarm = useMemo(() => {
    if (!farms.length) return null;
    if (selectedFarmId) {
      const byId = farms.find((farm) => farm.id === selectedFarmId);
      if (byId) return byId;
    }
    return farms[0] ?? null;
  }, [farms, selectedFarmId]);

  useEffect(() => {
    if (!selectedFarmId && farms.length) {
      setSelectedFarmId(farms[0].id);
    }
  }, [farms, selectedFarmId, setSelectedFarmId]);

  const {
    isRecording,
    isTranscribing,
    transcript,
    setTranscript,
    detectedLanguage,
    error: voiceError,
    isSupported,
    startRecording,
    stopRecording,
  } = useVoice({ language: selectedLanguage });

  useEffect(() => {
    if (transcript) setInput(transcript);
  }, [transcript]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LANGUAGE_KEY, selectedLanguage);
    }
  }, [selectedLanguage]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(AUTO_READ_KEY, String(autoRead));
    }
  }, [autoRead]);

  useEffect(() => {
    if (!selectedFarm?.id) {
      setWeatherSummary(null);
      return;
    }
    const cacheKey = `${sessionId}:${selectedFarm.id}`;
    const cached = contextCacheRef.current[cacheKey];
    setWeatherSummary(cached?.weather ?? null);
  }, [selectedFarm?.id, sessionId]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const languageForChat =
      selectedLanguage === "sw" ? "sw" : selectedLanguage === "en" ? "en" : detectedLanguage || "en";

    setInput("");
    setTranscript("");

    const farmPayload = selectedFarm
      ? {
          farmId: selectedFarm.id,
          lat: selectedFarm.lat,
          lon: selectedFarm.lon,
          county: selectedFarm.county,
          ward: selectedFarm.ward,
          crops: selectedFarm.crops ?? [],
        }
      : {};

    const cacheKey = selectedFarm?.id ? `${sessionId}:${selectedFarm.id}` : "";
    const cached = cacheKey ? contextCacheRef.current[cacheKey] : undefined;
    let weatherContext = cached?.weather;
    let marketContext = cached?.market;

    if (selectedFarm?.lat != null && selectedFarm?.lon != null && !weatherContext) {
      try {
        const forecast = await fetchForecast({ lat: Number(selectedFarm.lat), lon: Number(selectedFarm.lon), days: 3 });
        weatherContext = extractWeatherSummary(forecast) ?? undefined;
      } catch {
        weatherContext = undefined;
      }
    }

    if (!marketContext) {
      try {
        const crop = selectedFarm?.crops?.[0];
        if (crop) {
          const { getMarketPrices } = await import("@/services/marketPriceService");
          const marketPrices = await getMarketPrices({ commodity: crop, county: selectedFarm?.county, limitCount: 1 });
          if (marketPrices.length) {
            const price = marketPrices[0];
            marketContext = {
              commodity: crop,
              county: selectedFarm?.county,
              market: price.market,
              retail: price.retail,
              wholesale: price.wholesale,
              asOf: price.date?.toISOString?.() ?? null,
            };
          }
        }
      } catch {
        marketContext = undefined;
      }
    }

    if (cacheKey) {
      contextCacheRef.current[cacheKey] = { weather: weatherContext, market: marketContext, updatedAt: Date.now() };
    }
    setWeatherSummary(weatherContext ?? null);

    await sendMessage(
      trimmed,
      {
        language: languageForChat,
        farm: farmPayload,
        context: {
          userId: currentUser?.uid,
          displayName: currentUser?.displayName || "",
          email: currentUser?.email || "",
          role: accountQuery.data?.role || "farmer",
          market: marketContext,
          climate: weatherContext,
        },
        clientContext: {
          activeTab: "asha",
          cartCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
        },
      },
      { autoPlay: autoRead }
    );
  };

  const handleSuggestion = (value: string) => setInput(value);

  const farmName = selectedFarm
    ? [selectedFarm.county, selectedFarm.ward].filter(Boolean).join(", ") || "Your Farm"
    : "No farm selected";

  const statCards = [
    {
      label: "Farm",
      value: selectedFarm ? (selectedFarm.county || "Active") : "None",
      icon: Wheat,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Weather",
      value: weatherSummary ? `${weatherSummary.rainChance}% rain` : "Fetching...",
      icon: CloudSun,
      color: "text-info",
      bg: "bg-info/10",
    },
    {
      label: "Messages",
      value: String(messages.length),
      icon: Bot,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      label: "Language",
      value: selectedLanguage === "sw" ? "Kiswahili" : selectedLanguage === "en" ? "English" : "Auto",
      icon: Sparkles,
      color: "text-warning",
      bg: "bg-warning/10",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-4 py-5 md:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Mic className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Asha</h1>
              <p className="text-sm text-muted-foreground">Your farming copilot · {farmName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden"
              onClick={() => setShowContext((prev) => !prev)}
            >
              {showContext ? "Hide context" : "Context"}
            </Button>
            <Button variant="outline" size="sm" onClick={resetSession}>
              <RotateCcw className="mr-2 h-3 w-3" />
              New chat
            </Button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {statCards.map((stat) => (
            <div key={stat.label} className="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
              <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", stat.bg)}>
                <stat.icon className={cn("h-4 w-4", stat.color)} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 md:p-6">
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* Context panel */}
          <div className={cn(showContext ? "block" : "hidden", "lg:block")}>
            <ContextPanel
              sessionId={sessionId}
              language={selectedLanguage}
              onLanguageChange={setSelectedLanguage}
              autoRead={autoRead}
              onAutoReadChange={setAutoRead}
              farm={
                selectedFarm
                  ? { lat: selectedFarm.lat, lon: selectedFarm.lon, county: selectedFarm.county, ward: selectedFarm.ward, crops: selectedFarm.crops }
                  : {}
              }
              onNewSession={resetSession}
              weather={weatherSummary}
            />
          </div>

          {/* Chat area */}
          <div className="flex flex-col gap-4">
            {!farmsLoading && !selectedFarm && (
              <Alert>
                <AlertDescription>
                  No farm added yet. Go to Climate → Add Farm, then come back.
                </AlertDescription>
              </Alert>
            )}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {voiceError && (
              <Alert variant="destructive">
                <AlertDescription>{voiceError}</AlertDescription>
              </Alert>
            )}

            {!hasMessages && (
              <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-card to-card p-5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">Try asking Asha</p>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  Get instant insights on weather, prices, and farm decisions.
                </p>
                <SuggestionChips suggestions={defaultSuggestions} onSelect={handleSuggestion} />
              </div>
            )}

            <div className="rounded-2xl border border-border bg-card min-h-[300px]">
              <ChatThread messages={messages} isLoading={isLoading} />
            </div>

            <ChatComposer
              value={input}
              onChange={setInput}
              onSend={handleSend}
              onMic={startRecording}
              onStop={stopRecording}
              disabled={isLoading}
              isRecording={isRecording}
              isTranscribing={isTranscribing}
              isVoiceSupported={isSupported}
            />

            {transcript && (
              <div className="rounded-2xl border border-border bg-muted/10 px-4 py-3">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Transcript preview</p>
                <p className="mt-1 text-base text-foreground break-words">{transcript}</p>
                <Badge variant="secondary" className="mt-2 text-[10px]">
                  {detectedLanguage === "sw" ? "Kiswahili" : "English"} detected
                </Badge>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
