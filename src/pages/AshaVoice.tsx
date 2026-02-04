import { useCallback, useEffect, useState } from "react";
import { Mic, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useAshaChat } from "@/hooks/useAshaChat";
import { useVoice } from "@/hooks/useVoice";
import { ChatThread } from "@/components/asha/ChatThread";
import { ChatComposer } from "@/components/asha/ChatComposer";
import { ContextPanel } from "@/components/asha/ContextPanel";
import { SuggestionChips } from "@/components/asha/SuggestionChips";
import { fetchForecast } from "@/services/weatherProxyService";
import type { WeatherApiForecast } from "@/services/weatherProxyService";
import { cn } from "@/lib/utils";

const LANGUAGE_KEY = "asha_language";
const AUTO_READ_KEY = "asha_auto_read";
const FARM_CONTEXT_KEY = "asha_farm_context";

const defaultSuggestions = [
  "Show me tomato prices",
  "Will it rain this week?",
  "Add kale to cart",
  "Help me checkout",
  "Create a maize listing",
];

const loadStoredFarm = () => {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(FARM_CONTEXT_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const storeFarm = (value: Record<string, any>) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(FARM_CONTEXT_KEY, JSON.stringify(value));
  } catch {
    // ignore
  }
};

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

export default function AshaVoice() {
  const { currentUser } = useAuth();
  const { cartItems } = useCart();
  const { sessionId, messages, isLoading, error, sendMessage, resetSession, hasMessages } = useAshaChat();

  const [input, setInput] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<"auto" | "en" | "sw">(loadLanguage());
  const [autoRead, setAutoRead] = useState(loadToggle(AUTO_READ_KEY));
  const [farmContext, setFarmContext] = useState<Record<string, any>>(loadStoredFarm());
  const [weatherSummary, setWeatherSummary] = useState<any | null>(null);
  const [showContext, setShowContext] = useState(false);

  const getVoiceAuthToken = useCallback(async () => {
    if (!currentUser) return undefined;
    return currentUser.getIdToken();
  }, [currentUser]);

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
  } = useVoice({ language: selectedLanguage, getAuthToken: getVoiceAuthToken });

  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  useEffect(() => {
    storeFarm(farmContext);
  }, [farmContext]);

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
    const lat = Number(farmContext.lat);
    const lon = Number(farmContext.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      setWeatherSummary(null);
      return;
    }

    let cancelled = false;
    fetchForecast({ lat, lon, days: 3 })
      .then((forecast) => {
        if (!cancelled) {
          setWeatherSummary(extractWeatherSummary(forecast));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setWeatherSummary(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [farmContext.lat, farmContext.lon]);

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
    await sendMessage(
      trimmed,
      {
        language: languageForChat,
        farm: {
          lat: farmContext.lat,
          lon: farmContext.lon,
          county: farmContext.county,
          ward: farmContext.ward,
          crops: farmContext.crops,
        },
        context: {
          userId: currentUser?.uid,
          displayName: currentUser?.displayName || "",
          email: currentUser?.email || "",
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
              farm={farmContext}
              onFarmChange={setFarmContext}
              onNewSession={resetSession}
              weather={weatherSummary}
            />
          </div>

          <div className="space-y-4">
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
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Transcript preview
                </p>
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
