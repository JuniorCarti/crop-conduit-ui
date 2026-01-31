
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Mic, Send, Square } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { dispatchAshaActions } from "@/services/ashaActionDispatcher";
import { generateAdvisory } from "@/services/advisoryService";
import { requestSpeechAudio } from "@/services/voiceAgentService";
import { toast } from "sonner";

type VoiceStatus = "idle" | "listening" | "thinking" | "speaking";

type Phase = "idle" | "collect_context" | "ready" | "thinking";

type ConversationContext = {
  language: "en" | "sw";
  farm: {
    lat?: number;
    lon?: number;
    locationName?: string;
  };
  crop: {
    name?: string;
    stage?: string;
  };
  signals: {
    predictedPrice?: number | null;
    marketUnreasonable?: boolean;
  };
};

type ChatLine = {
  type: "title" | "heading" | "bullet" | "text";
  text: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  kind: "text" | "advisory";
  text?: string;
  lines?: ChatLine[];
};

type SpeechRecognitionConstructor = new () => {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort?: () => void;
};

const SESSION_ID_KEY = "asha_session_id";
const LANGUAGE_KEY = "agrismart_lang";
const COORDS_KEY = "agrismart_coords";
const LAST_FARM_LAT_KEY = "agrismart:lastFarmLat";
const LAST_FARM_LON_KEY = "agrismart:lastFarmLon";
const LAST_FARM_NAME_KEY = "agrismart:lastFarmName";
const LAST_CROP_NAME_KEY = "agrismart:lastCropName";
const LAST_CROP_STAGE_KEY = "agrismart:lastCropStage";
const MARKET_SIGNAL_STORAGE_KEY = "agrismart:lastMarketPrediction";

const greetings = new Set([
  "hi",
  "hello",
  "habari",
  "niaje",
  "sasa",
  "mambo",
  "hujambo",
]);

const cropKeywordMap: Array<{ crop: string; keywords: string[] }> = [
  { crop: "cabbage", keywords: ["cabbage", "kabichi", "kabeji"] },
  { crop: "kale", keywords: ["kale", "sukuma", "sukuma wiki", "sukumawiki"] },
  { crop: "maize", keywords: ["maize", "mahindi", "corn"] },
  { crop: "tomato", keywords: ["tomato", "tomatoes", "nyanya"] },
  { crop: "onion", keywords: ["onion", "vitunguu", "kitunguu"] },
  { crop: "potato", keywords: ["potato", "potatoes", "viazi", "irish"] },
  { crop: "beans", keywords: ["beans", "maharagwe"] },
  { crop: "rice", keywords: ["rice", "mpunga"] },
  { crop: "sugarcane", keywords: ["sugarcane", "miwa"] },
];

const stageKeywordMap: Array<{ stage: string; keywords: string[] }> = [
  { stage: "seedling", keywords: ["seedling", "chipukizi", "nursery", "imeota"] },
  { stage: "vegetative", keywords: ["vegetative", "majani", "leaf"] },
  { stage: "flowering", keywords: ["flowering", "maua", "inachanua"] },
  { stage: "fruiting", keywords: ["fruiting", "matunda", "kutunga"] },
  { stage: "harvest", keywords: ["harvest", "mavuno", "kuvuna", "ready"] },
];

const uiCopy = {
  en: {
    title: "Asha - AgriSmart Voice Agent",
    subtitle: "Talk to ask a question... type to get an audio reply.",
    listening: "Listening...",
    voiceReply: "Voice Reply",
    locationOn: "Location: On",
    locationOff: "Location: Off",
    locationOffHint: "Enable location to get weather-based advice.",
    useLocation: "Use my location",
    send: "Send",
    mic: "Press to talk",
    greeting: "Hi! Which crop are you growing...",
    askCrop: "Which crop are you growing...",
    askLocation: "Where is your farm located...",
    confirm: "Thanks. I have your crop and location. Generating advice now...",
    howCanIHelp: "How can I help you today...",
    ready: "Asha is ready to help.",
    watchOuts: "Watch-outs",
    voicePlaying: "Voice reply playing",
    speak: "Speak",
    stopAudio: "Stop audio",
    askTypeLocation: "Please type your town or area so I can continue.",
  },
  sw: {
    title: "Asha - AgriSmart Voice Agent",
    subtitle: "Ongea kuuliza swali... andika upate jibu la sauti.",
    listening: "Inasikiliza...",
    voiceReply: "Jibu la Sauti",
    locationOn: "Eneo: Lipo",
    locationOff: "Eneo: Limezimwa",
    locationOffHint: "Washa eneo ili kupata ushauri wa hali ya hewa.",
    useLocation: "Tumia eneo langu",
    send: "Tuma",
    mic: "Bonyeza kuzungumza",
    greeting: "Habari! Unalima zao gani...",
    askCrop: "Unalima zao gani...",
    askLocation: "Shamba lako lipo wapi...",
    confirm: "Asante. Nimepata zao na eneo. Ninatengeneza ushauri sasa...",
    howCanIHelp: "Ninawezaje kukusaidia leo...",
    ready: "Asha iko tayari kukusaidia.",
    watchOuts: "Tahadhari",
    voicePlaying: "Jibu la sauti linaendelea",
    speak: "Sema",
    stopAudio: "Acha sauti",
    askTypeLocation: "Tafadhali andika eneo lako ili niendelee.",
  },
};

const resolveLanguage = (value?: string | null): "en" | "sw" =>
  value === "sw" ? "sw" : "en";

const safeGetItem = (key: string): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSetItem = (key: string, value: string) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore
  }
};

const getStoredLanguage = (): "en" | "sw" =>
  resolveLanguage(safeGetItem(LANGUAGE_KEY));

const setStoredLanguage = (value: "en" | "sw") => {
  safeSetItem(LANGUAGE_KEY, value);
};

const generateSessionId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
};

const getOrCreateSessionId = (): string => {
  const existing = safeGetItem(SESSION_ID_KEY);
  if (existing && existing.trim()) return existing;
  const created = generateSessionId();
  safeSetItem(SESSION_ID_KEY, created);
  return created;
};

const readStoredNumber = (key: string): number | undefined => {
  const raw = safeGetItem(key);
  if (!raw) return undefined;
  const parsed = Number(raw);
  if (Number.isFinite(parsed)) return parsed;
  return undefined;
};

const readFarmFromStorage = (): ConversationContext["farm"] => {
  let storedCoords: any;
  const coordsRaw = safeGetItem(COORDS_KEY);
  if (coordsRaw) {
    try {
      storedCoords = JSON.parse(coordsRaw);
    } catch {
      storedCoords = undefined;
    }
  }

  const lat =
    typeof storedCoords?.lat === "number"
      ? storedCoords.lat
      : readStoredNumber(LAST_FARM_LAT_KEY);
  const lon =
    typeof storedCoords?.lon === "number"
      ? storedCoords.lon
      : readStoredNumber(LAST_FARM_LON_KEY);
  const locationName =
    storedCoords?.locationName || safeGetItem(LAST_FARM_NAME_KEY) || undefined;

  return {
    lat: lat ?? undefined,
    lon: lon ?? undefined,
    locationName: locationName || undefined,
  };
};

const storeFarmToStorage = (farm: ConversationContext["farm"]) => {
  if (farm.locationName) {
    safeSetItem(LAST_FARM_NAME_KEY, farm.locationName);
  }
  if (typeof farm.lat === "number") {
    safeSetItem(LAST_FARM_LAT_KEY, farm.lat.toString());
  }
  if (typeof farm.lon === "number") {
    safeSetItem(LAST_FARM_LON_KEY, farm.lon.toString());
  }
  if (typeof farm.lat === "number" && typeof farm.lon === "number") {
    safeSetItem(
      COORDS_KEY,
      JSON.stringify({
        lat: farm.lat,
        lon: farm.lon,
        locationName: farm.locationName,
      })
    );
  }
};

const readSignalsFromStorage = (): ConversationContext["signals"] => {
  const raw = safeGetItem(MARKET_SIGNAL_STORAGE_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return {
      predictedPrice:
        typeof parsed?.predictedPrice === "number"
          ? parsed.predictedPrice
          : undefined,
      marketUnreasonable:
        typeof parsed?.marketUnreasonable === "boolean"
          ? parsed.marketUnreasonable
          : undefined,
    };
  } catch {
    return {};
  }
};

const readCropFromStorage = (): ConversationContext["crop"] => {
  const name = safeGetItem(LAST_CROP_NAME_KEY) || undefined;
  const stage = safeGetItem(LAST_CROP_STAGE_KEY) || undefined;
  return { name, stage };
};

const storeCropToStorage = (crop: ConversationContext["crop"]) => {
  if (crop.name) {
    safeSetItem(LAST_CROP_NAME_KEY, crop.name);
  }
  if (crop.stage) {
    safeSetItem(LAST_CROP_STAGE_KEY, crop.stage);
  }
};

const clearStoredCrop = () => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LAST_CROP_NAME_KEY);
    window.localStorage.removeItem(LAST_CROP_STAGE_KEY);
  } catch {
    // ignore
  }
};

const inferCropFromText = (text: string): string | undefined => {
  const lowered = text.toLowerCase();
  for (const entry of cropKeywordMap) {
    for (const keyword of entry.keywords) {
      if (lowered.includes(keyword)) {
        return entry.crop;
      }
    }
  }
  return undefined;
};

const inferStageFromText = (text: string): string | undefined => {
  const lowered = text.toLowerCase();
  for (const entry of stageKeywordMap) {
    for (const keyword of entry.keywords) {
      if (lowered.includes(keyword)) {
        return entry.stage;
      }
    }
  }
  return undefined;
};

const inferLocationName = (text: string): string | undefined => {
  const patterns = [
    /(?:niko|kwa|katika)\s+(.+?)(?=\.|\?|$|reply|jibu|is that correct|ni sahihi|sawa)/i,
    /(?:in|at)\s+(.+?)(?=\.|\?|$|reply|jibu|is that correct|ni sahihi|sawa)/i,
    /(?:you're|you are)\s+in\s+(.+?)(?=\.|\?|$|reply|jibu|is that correct|ni sahihi|sawa)/i,
    /(?:uko|upo)\s+(?:katika|kwa)?\s*(.+?)(?=\.|\?|$|reply|jibu|ni sahihi|sawa)/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const cleaned = match[1]
        .replace(/\s*(is that correct|reply.*|jibu.*|ni sahihi.*|sawa.*)$/i, "")
        .replace(/[.?!]+$/g, "")
        .trim();
      if (cleaned.length > 2) return cleaned;
    }
  }
  return undefined;
};

const isGreeting = (text: string): boolean => {
  const lowered = text.trim().toLowerCase();
  if (!lowered) return false;
  if (greetings.has(lowered)) return true;
  return false;
};

const isConfirmationPrompt = (text: string): boolean => {
  const lowered = text.toLowerCase();
  return (
    lowered.includes("reply yes or no") ||
    lowered.includes("yes or no") ||
    lowered.includes("yes/no") ||
    lowered.includes("ndio au hapana") ||
    lowered.includes("jibu ndio au hapana")
  );
};

const buildNeedsHash = (
  needs: Record<string, any> | undefined,
  language: "en" | "sw"
): string =>
  JSON.stringify({
    language,
    crop: Boolean(needs?.crop),
    location: Boolean(needs?.location),
    stage: Boolean(needs?.stage),
  });

const formatAdvisoryForChat = (
  advisory: any,
  copy: typeof uiCopy.en
): ChatLine[] => {
  const lines: ChatLine[] = [];
  if (!advisory) return lines;

  if (advisory.title) {
    lines.push({ type: "title", text: String(advisory.title) });
  }

  const bullets = Array.isArray(advisory.bullets) ? advisory.bullets : [];
  bullets.forEach((bullet: any) => {
    if (bullet?.heading) {
      lines.push({ type: "heading", text: String(bullet.heading) });
    }
    if (Array.isArray(bullet?.points)) {
      bullet.points.forEach((point: any) => {
        if (point) {
          lines.push({ type: "bullet", text: String(point) });
        }
      });
    }
  });

  if (Array.isArray(advisory.watchOuts) && advisory.watchOuts.length > 0) {
    lines.push({ type: "heading", text: copy.watchOuts });
    advisory.watchOuts.forEach((item: any) => {
      if (item) {
        lines.push({ type: "bullet", text: String(item) });
      }
    });
  }

  return lines;
};

const toSpeakText = (
  advisory: any,
  watchOutLabel = "Watch-outs",
  maxLength = 700
): string => {
  if (!advisory) return "";
  const parts: string[] = [];
  if (advisory.title) {
    parts.push(String(advisory.title));
  }
  const bullets = Array.isArray(advisory.bullets) ? advisory.bullets : [];
  bullets.forEach((bullet: any) => {
    const heading = bullet?.heading ? String(bullet.heading) : "";
    const points = Array.isArray(bullet?.points)
      ? bullet.points.map((point: any) => String(point)).join("; ")
      : "";
    const line = [heading, points].filter(Boolean).join(": ");
    if (line) parts.push(line);
  });
  if (Array.isArray(advisory.watchOuts) && advisory.watchOuts.length) {
    parts.push(`${watchOutLabel}: ${advisory.watchOuts.join("; ")}`);
  }
  const text = parts.join(". ").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}...`;
};

export function AshaVoiceAgent() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const cart = useCart();
  const [sessionId, setSessionId] = useState(() => getOrCreateSessionId());
  const [selectedLanguage, setSelectedLanguage] = useState<"en" | "sw">(
    getStoredLanguage()
  );
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [phase, setPhase] = useState<Phase>("idle");
  const [input, setInput] = useState("");
  const [transcript, setTranscript] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [voiceReplyEnabled, setVoiceReplyEnabled] = useState(true);
  const [lastNeedsHash, setLastNeedsHash] = useState<string | null>(null);
  const [lastAssistantText, setLastAssistantText] = useState("");
  const [isDispatchingActions, setIsDispatchingActions] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<
    {
      farm?: ConversationContext["farm"];
      crop?: ConversationContext["crop"];
      language: "en" | "sw";
    } | null
  >(null);
  const [context, setContext] = useState<ConversationContext>(() => ({
    language: getStoredLanguage(),
    farm: readFarmFromStorage(),
    crop: readCropFromStorage(),
    signals: readSignalsFromStorage(),
  }));

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<InstanceType<SpeechRecognitionConstructor> | null>(
    null
  );
  const transcriptRef = useRef("");
  const contextRef = useRef(context);
  const sessionRef = useRef(sessionId);
  const languageRef = useRef(selectedLanguage);
  const voiceReplyRef = useRef(voiceReplyEnabled);
  const phaseRef = useRef<Phase>(phase);
  const lastNeedsHashRef = useRef<string | null>(lastNeedsHash);
  const submitMessageRef = useRef<
    | ((
        message: string,
        source: "text" | "voice",
        options?: { skipUserBubble?: boolean; isRetry?: boolean }
      ) => Promise<void>)
    | null
  >(null);
  const locationRetryRef = useRef(false);
  const locationPromptedRef = useRef(false);

  const copy = uiCopy[selectedLanguage];

  const hasLocation = useMemo(
    () =>
      typeof context.farm.lat === "number" &&
      typeof context.farm.lon === "number",
    [context.farm.lat, context.farm.lon]
  );


  useEffect(() => {
    contextRef.current = context;
  }, [context]);

  useEffect(() => {
    sessionRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    languageRef.current = selectedLanguage;
    setStoredLanguage(selectedLanguage);
    setContext((prev) => ({ ...prev, language: selectedLanguage }));
  }, [selectedLanguage]);

  useEffect(() => {
    voiceReplyRef.current = voiceReplyEnabled;
  }, [voiceReplyEnabled]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    lastNeedsHashRef.current = lastNeedsHash;
  }, [lastNeedsHash]);

  useEffect(() => {
    storeFarmToStorage(context.farm);
  }, [context.farm.lat, context.farm.lon, context.farm.locationName]);

  useEffect(() => {
    storeCropToStorage(context.crop);
  }, [context.crop.name, context.crop.stage]);

  useEffect(() => {
    if (!audioUrl) return;

    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    setStatus("speaking");

    audio.play().catch(() => {
      setStatus("idle");
    });

    audio.onended = () => {
      setStatus("idle");
      setAudioUrl(null);
    };

    return () => {
      audio.pause();
      URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const appendMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const appendAssistantText = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setLastAssistantText(trimmed);
      appendMessage({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        role: "assistant",
        kind: "text",
        text: trimmed,
      });
    },
    [appendMessage]
  );

  const appendUserText = useCallback(
    (text: string) => {
      appendMessage({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        role: "user",
        kind: "text",
        text,
      });
    },
    [appendMessage]
  );

  const appendAdvisory = useCallback(
    (lines: ChatLine[]) => {
      appendMessage({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        role: "assistant",
        kind: "advisory",
        lines,
      });
    },
    [appendMessage]
  );

  const buildPendingConfirm = useCallback(
    (replyText: string) => {
      const inferredCrop = inferCropFromText(replyText);
      const inferredLocation = inferLocationName(replyText);
      const farm = { ...contextRef.current.farm };
      const crop = { ...contextRef.current.crop };
      if (inferredCrop) crop.name = inferredCrop;
      if (inferredLocation) farm.locationName = inferredLocation;
      return {
        farm,
        crop,
        language: languageRef.current,
      };
    },
    []
  );

  const stopAudioPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setStatus("idle");
  }, [audioUrl]);

  const handleSpeak = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setStatus("thinking");
      const result = await requestSpeechAudio(trimmed, languageRef.current);
      if (!result.ok || !result.data) {
        setStatus("idle");
        setError(
          languageRef.current === "sw"
            ? "Sauti haipatikani, maandishi bado yanafanya kazi."
            : "Voice unavailable, text still works."
        );
        return;
      }
      const url = URL.createObjectURL(result.data);
      setAudioUrl(url);
    },
    []
  );

  const maybeSpeak = useCallback(
    (text: string, source: "text" | "voice") => {
      if (source !== "voice") return;
      if (!voiceReplyRef.current) return;
      void handleSpeak(text);
    },
    [handleSpeak]
  );

  const updateContextFromText = useCallback(
    (text: string, current: ConversationContext): ConversationContext => {
      const next: ConversationContext = {
        ...current,
        farm: { ...current.farm },
        crop: { ...current.crop },
        signals: { ...current.signals },
      };

      const inferredCrop = inferCropFromText(text);
      if (inferredCrop) {
        next.crop.name = inferredCrop;
      }

      const inferredStage = inferStageFromText(text);
      if (inferredStage) {
        next.crop.stage = inferredStage;
      }

      const inferredLocation = inferLocationName(text);
      if (inferredLocation && !next.farm.locationName) {
        next.farm.locationName = inferredLocation;
      }

      return next;
    },
    []
  );

  const requestGeolocation = useCallback(async () => {
    if (!navigator.geolocation) {
      throw new Error("Geolocation unavailable");
    }

    return new Promise<{ lat: number; lon: number; locationName?: string }>(
      (resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lon: position.coords.longitude,
            });
          },
          (error) => reject(error),
          { enableHighAccuracy: true, timeout: 10000 }
        );
      }
    );
  }, []);

  const handleBackendCollectContext = useCallback(
    async (payload: any, originalMessage: string, source: "text" | "voice") => {
      const replyText = payload?.reply || copy.askCrop;
      const needs = payload?.needs || {};
      const needsHash = buildNeedsHash(needs, languageRef.current);
      let didRetry = false;

      if (needsHash !== lastNeedsHashRef.current) {
        setLastNeedsHash(needsHash);
        lastNeedsHashRef.current = needsHash;
        appendAssistantText(replyText);
        maybeSpeak(replyText, source);
        if (isConfirmationPrompt(replyText)) {
          setPendingConfirm(buildPendingConfirm(replyText));
        }
      }

      setPhase("collect_context");

      if (needs?.location && !contextRef.current.farm.lat && !contextRef.current.farm.lon) {
        if (locationRetryRef.current) return;
        locationRetryRef.current = true;

        try {
          const geo = await requestGeolocation();
          const updatedFarm = {
            ...contextRef.current.farm,
            lat: geo.lat,
            lon: geo.lon,
            locationName:
              contextRef.current.farm.locationName || "Unknown location",
          };
          const updatedContext = {
            ...contextRef.current,
            farm: updatedFarm,
          };
          contextRef.current = updatedContext;
          setContext(updatedContext);

          if (submitMessageRef.current) {
            didRetry = true;
            await submitMessageRef.current(originalMessage, source, {
              skipUserBubble: true,
              isRetry: true,
            });
          }
        } catch {
          if (!locationPromptedRef.current) {
            locationPromptedRef.current = true;
            appendAssistantText(copy.askTypeLocation);
            maybeSpeak(copy.askTypeLocation, source);
          }
        }
      }
      if (!didRetry) {
        setStatus("idle");
      }
    },
    [appendAssistantText, buildPendingConfirm, copy.askCrop, copy.askTypeLocation, maybeSpeak, requestGeolocation]
  );

  const handleAdvisoryResponse = useCallback(
    (payload: any, source: "text" | "voice") => {
      const advisory = payload?.advisory ?? payload;
      setPendingConfirm(null);
      const lines = formatAdvisoryForChat(advisory, copy);
      if (lines.length > 0) {
        appendAdvisory(lines);
      }

      const speakText = toSpeakText(advisory, copy.watchOuts);
      if (speakText) {
        setLastAssistantText(speakText);
        maybeSpeak(speakText, source);
      }

      if (advisory?.nextQuestion) {
        appendAssistantText(String(advisory.nextQuestion));
        maybeSpeak(String(advisory.nextQuestion), source);
      }

      setPhase("ready");
      setStatus("idle");
    },
    [appendAdvisory, appendAssistantText, copy.watchOuts, maybeSpeak]
  );

  const runAshaActions = useCallback(
    async (payload: any) => {
      if (!payload?.actions && !payload?.uiHint) return;
      setIsDispatchingActions(true);
      try {
        await dispatchAshaActions(payload, {
          navigate,
          cart,
          userId: currentUser?.uid,
          notify: (message, type) => {
            if (type === "error") {
              toast.error(message);
              return;
            }
            if (type === "success") {
              toast.success(message);
              return;
            }
            toast.info(message);
          },
        });
      } finally {
        setIsDispatchingActions(false);
      }
    },
    [cart, currentUser?.uid, navigate]
  );

  const sendToAsha = useCallback(
    async (
      message: string,
      source: "text" | "voice",
      overrides?: {
        farm?: ConversationContext["farm"];
        crop?: ConversationContext["crop"];
        language?: "en" | "sw";
      }
    ) => {
      setPhase("thinking");
      setStatus("thinking");

      const payload = {
        sessionId: sessionRef.current || getOrCreateSessionId(),
        language: overrides?.language ?? languageRef.current,
        message,
        farm: {
          locationName:
            overrides?.farm?.locationName ?? contextRef.current.farm.locationName,
          lat: overrides?.farm?.lat ?? contextRef.current.farm.lat,
          lon: overrides?.farm?.lon ?? contextRef.current.farm.lon,
        },
        crop: {
          name: overrides?.crop?.name ?? contextRef.current.crop.name,
          stage: overrides?.crop?.stage ?? contextRef.current.crop.stage,
        },
        signals: contextRef.current.signals ?? {},
      };

      console.log("POST /advisory/generate payload", payload);

      try {
        const token = currentUser ? await currentUser.getIdToken() : undefined;
        const data = await generateAdvisory(payload, { token });
        console.log("Worker response", data);

        if (data?.mode === "collect_context") {
          await handleBackendCollectContext(data, message, source);
          void runAshaActions(data);
          return;
        }

        if (data?.mode === "advisory" && data?.advisory) {
          handleAdvisoryResponse(data, source);
          void runAshaActions(data);
          return;
        }

        if (data?.advisory) {
          handleAdvisoryResponse(data, source);
          void runAshaActions(data);
          return;
        }

        if (typeof data?.reply === "string") {
          const replyText = data.reply;
          appendAssistantText(replyText);
          maybeSpeak(replyText, source);
          if (isConfirmationPrompt(replyText)) {
            setPendingConfirm(buildPendingConfirm(replyText));
          }
        } else {
          appendAssistantText(copy.howCanIHelp);
          maybeSpeak(copy.howCanIHelp, source);
        }

        void runAshaActions(data);
        setStatus("idle");
        setPhase("collect_context");
      } catch (error: any) {
        const fallbackMessage =
          languageRef.current === "sw"
            ? "Samahani, Asha hawezi kujibu sasa."
            : "I couldn't generate advice.";
        const messageText = String(error?.message || error || fallbackMessage);

        appendAssistantText(messageText);
        setError(messageText);
        setStatus("idle");
        setPhase("collect_context");
      }
    },
    [
      appendAssistantText,
      buildPendingConfirm,
      copy.howCanIHelp,
      currentUser,
      handleAdvisoryResponse,
      handleBackendCollectContext,
      maybeSpeak,
      runAshaActions,
    ]
  );

  const submitMessage = useCallback(
    async (
      message: string,
      source: "text" | "voice",
      options?: { skipUserBubble?: boolean; isRetry?: boolean }
    ) => {
      const trimmed = message.trim();
      if (!trimmed) return;

      if (!options?.skipUserBubble) {
        appendUserText(trimmed);
      }

      setError(null);

      if (!options?.isRetry) {
        locationRetryRef.current = false;
        locationPromptedRef.current = false;
      }
      const normalized = trimmed.toLowerCase();
      let confirmationOverrides:
        | {
            farm?: ConversationContext["farm"];
            crop?: ConversationContext["crop"];
            language?: "en" | "sw";
          }
        | undefined;

      if (pendingConfirm) {
        if (["yes", "y", "ndio"].includes(normalized)) {
          const confirmedFarm = {
            ...contextRef.current.farm,
            ...pendingConfirm.farm,
          };
          const confirmedCrop = {
            ...contextRef.current.crop,
            ...pendingConfirm.crop,
          };
          const confirmedContext = {
            ...contextRef.current,
            farm: confirmedFarm,
            crop: confirmedCrop,
          };
          contextRef.current = confirmedContext;
          setContext(confirmedContext);
          confirmationOverrides = {
            farm: confirmedFarm,
            crop: confirmedCrop,
            language: pendingConfirm.language,
          };
          setPendingConfirm(null);
        } else if (["no", "n", "hapana"].includes(normalized)) {
          const clearedContext = {
            ...contextRef.current,
            farm: {
              ...contextRef.current.farm,
              locationName: undefined,
            },
            crop: {
              ...contextRef.current.crop,
              name: undefined,
              stage: contextRef.current.crop.stage,
            },
          };
          contextRef.current = clearedContext;
          setContext(clearedContext);
          setPendingConfirm(null);
        }
      }

      const updatedContext = updateContextFromText(trimmed, contextRef.current);
      contextRef.current = updatedContext;
      setContext(updatedContext);

      await sendToAsha(trimmed, source, confirmationOverrides);
    },
    [
      appendUserText,
      pendingConfirm,
      sendToAsha,
      updateContextFromText,
    ]
  );

  useEffect(() => {
    submitMessageRef.current = submitMessage;
  }, [submitMessage]);

  const handleSend = useCallback(() => {
    if (status === "thinking") return;
    const message = input.trim();
    if (!message) return;
    setInput("");
    void submitMessage(message, "text");
  }, [input, status, submitMessage]);

  const startListening = useCallback(() => {
    if (status === "thinking") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError(
        languageRef.current === "sw"
          ? "Kivinjari hiki hakiungi mkono kipaza sauti."
          : "Speech recognition is not supported in this browser."
      );
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    const recognition: InstanceType<SpeechRecognitionConstructor> =
      new SpeechRecognition();
    recognition.lang = languageRef.current === "sw" ? "sw-KE" : "en-US";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onresult = (event: any) => {
      const results = Array.from(event.results || []);
      const finalTranscript = results
        .map((result: any) => result?.[0]?.transcript)
        .filter(Boolean)
        .join(" ")
        .trim();
      if (finalTranscript) {
        transcriptRef.current = finalTranscript;
        setTranscript(finalTranscript);
      }
    };

    recognition.onerror = () => {
      setStatus("idle");
    };

    recognition.onend = () => {
      setStatus("idle");
      const finalText = transcriptRef.current.trim();
      if (finalText) {
        transcriptRef.current = "";
        setTranscript("");
        void submitMessage(finalText, "voice");
      }
    };

    recognitionRef.current = recognition;
    transcriptRef.current = "";
    setTranscript("");
    setStatus("listening");
    recognition.start();
  }, [status, submitMessage]);

  const handleMicClick = useCallback(() => {
    if (status === "listening") {
      recognitionRef.current?.stop();
      setStatus("idle");
      return;
    }
    startListening();
  }, [startListening, status]);

  const handleNewChat = useCallback(() => {
    const newId = generateSessionId();
    setSessionId(newId);
    safeSetItem(SESSION_ID_KEY, newId);
    setMessages([]);
    setInput("");
    setTranscript("");
    transcriptRef.current = "";
    setPhase("idle");
    setStatus("idle");
    setError(null);
    setLastAssistantText("");
    setAudioUrl(null);
    setLastNeedsHash(null);
    lastNeedsHashRef.current = null;
  }, []);

  const handleUseLocation = useCallback(async () => {
    try {
      const geo = await requestGeolocation();
      const updatedFarm = {
        ...contextRef.current.farm,
        lat: geo.lat,
        lon: geo.lon,
        locationName:
          contextRef.current.farm.locationName || "Unknown location",
      };
      const updatedContext = {
        ...contextRef.current,
        farm: updatedFarm,
      };
      contextRef.current = updatedContext;
      setContext(updatedContext);
    } catch {
      appendAssistantText(copy.askTypeLocation);
    }
  }, [appendAssistantText, copy.askTypeLocation, requestGeolocation]);

  const handleSpeakLast = useCallback(() => {
    if (!lastAssistantText) return;
    void handleSpeak(lastAssistantText);
  }, [handleSpeak, lastAssistantText]);

  const locationWarning =
    !hasLocation &&
    (selectedLanguage === "sw"
      ? "Eneo halijawekwa. Nenda Settings > Location kuwezesha."
      : "Location not set. Go to Settings > Location to enable.");

  return (
    <Card className="shadow-sm">
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>{copy.title}</CardTitle>
            <CardDescription>{copy.subtitle}</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
              value={selectedLanguage}
              onChange={(event) =>
                setSelectedLanguage(resolveLanguage(event.target.value))
              }
            >
              <option value="en">English</option>
              <option value="sw">Kiswahili</option>
            </select>
            <Button variant="outline" size="sm" onClick={handleNewChat}>
              New chat
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-muted-foreground">
            <span
              className={cn(
                "rounded-full px-2 py-1",
                hasLocation
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              )}
            >
              {hasLocation ? copy.locationOn : copy.locationOff}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span>{copy.voiceReply}</span>
            <Switch
              checked={voiceReplyEnabled}
              onCheckedChange={setVoiceReplyEnabled}
            />
            {lastAssistantText && (
              <Button variant="outline" size="sm" onClick={handleSpeakLast}>
                {copy.speak}
              </Button>
            )}
            {audioUrl && (
              <Button variant="outline" size="sm" onClick={stopAudioPlayback}>
                <Square className="mr-2 h-4 w-4" />
                {copy.stopAudio}
              </Button>
            )}
          </div>
        </div>

        {!hasLocation && locationWarning && (
          <Alert>
            <AlertDescription className="text-xs">
              {locationWarning}
            </AlertDescription>
          </Alert>
        )}

        <div className="max-h-[360px] space-y-3 overflow-y-auto rounded-lg border bg-muted/30 p-3">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">{copy.ready}</p>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  )}
                >
                  {message.kind === "text" && (
                    <p className="whitespace-pre-wrap">{message.text}</p>
                  )}
                  {message.kind === "advisory" && (
                    <div className="space-y-1">
                      {message.lines?.map((line, index) => {
                        if (line.type === "title") {
                          return (
                            <div key={index} className="font-semibold">
                              {line.text}
                            </div>
                          );
                        }
                        if (line.type === "heading") {
                          return (
                            <div key={index} className="pt-2 font-medium">
                              {line.text}
                            </div>
                          );
                        }
                        if (line.type === "bullet") {
                          return (
                            <div key={index} className="flex gap-2">
                              <span>•</span>
                              <span>{line.text}</span>
                            </div>
                          );
                        }
                        return (
                          <div key={index} className="text-sm">
                            {line.text}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {status === "listening" && (
          <div className="rounded-md border border-dashed p-2 text-xs text-muted-foreground">
            {copy.listening}
            {transcript ? ` ${transcript}` : ""}
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleUseLocation}
            disabled={status === "thinking"}
          >
            {copy.useLocation}
          </Button>
          <div className="text-xs text-muted-foreground">
            {status === "speaking" ? copy.voicePlaying : ""}
          </div>
        </div>

        {isDispatchingActions && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Applying actions...</span>
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={copy.howCanIHelp}
            disabled={status === "thinking"}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleSend();
              }
            }}
          />
          <div className="flex gap-2">
            <Button
              onClick={handleSend}
              disabled={status === "thinking"}
              className="flex-1"
            >
              <Send className="mr-2 h-4 w-4" />
              {copy.send}
            </Button>
            <Button
              variant={status === "listening" ? "secondary" : "outline"}
              onClick={handleMicClick}
              disabled={status === "thinking"}
            >
              <Mic className="mr-2 h-4 w-4" />
              {copy.mic}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
