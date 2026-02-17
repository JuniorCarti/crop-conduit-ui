import { useEffect, useMemo, useRef, useState } from "react";
import { Mic, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
    if (transcript) {
      setInput(transcript);
    }
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
      selectedLanguage === "sw"
        ? "sw"
        : selectedLanguage === "en"
        ? "en"
        : detectedLanguage || "en";

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
        const forecast = await fetchForecast({
          lat: Number(selectedFarm.lat),
          lon: Number(selectedFarm.lon),
          days: 3,
        });
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
          const marketPrices = await getMarketPrices({
            commodity: crop,
            county: selectedFarm?.county,
            limitCount: 1,
          });
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
      contextCacheRef.current[cacheKey] = {
        weather: weatherContext,
        market: marketContext,
        updatedAt: Date.now(),
      };
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

  const handleSuggestion = (value: string) => {
    setInput(value);
  };

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        className="lg:hidden"
        onClick={() => setShowContext((prev) => !prev)}
      >
        {showContext ? "Hide context" : "Show context"}
      </Button>
      <Button variant="outline" size="sm" onClick={resetSession}>
        New chat
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Asha"
        subtitle="Your farming copilot for market, climate, and orders"
        icon={Mic}
      >
        {headerActions}
      </PageHeader>

      <div className="p-4 md:p-6">
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className={cn(showContext ? "block" : "hidden", "lg:block")}>
            <ContextPanel
              sessionId={sessionId}
              language={selectedLanguage}
              onLanguageChange={setSelectedLanguage}
              autoRead={autoRead}
              onAutoReadChange={setAutoRead}
              farm={
                selectedFarm
                  ? {
                      lat: selectedFarm.lat,
                      lon: selectedFarm.lon,
                      county: selectedFarm.county,
                      ward: selectedFarm.ward,
                      crops: selectedFarm.crops,
                    }
                  : {}
              }
              onNewSession={resetSession}
              weather={weatherSummary}
            />
          </div>

          <div className="space-y-4">
            {!farmsLoading && !selectedFarm && (
              <Alert>
                <AlertDescription>
                  Looks like you haven&apos;t added a farm yet. Please add a farm in Climate - Add Farm, then come back.
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
              <div className="rounded-2xl border border-border bg-muted/20 p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="h-4 w-4" />
                  Try one of these starters
                </div>
                <div className="mt-3">
                  <SuggestionChips suggestions={defaultSuggestions} onSelect={handleSuggestion} />
                </div>
              </div>
            )}

            <ChatThread messages={messages} isLoading={isLoading} />

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
              <div className="rounded-2xl border border-border bg-muted/10 px-4 py-3 text-sm text-muted-foreground">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Transcript preview</p>
                <p className="mt-1 text-base text-foreground break-words">{transcript}</p>
                <p className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                  Detected language: {detectedLanguage === "sw" ? "Kiswahili" : "English"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
