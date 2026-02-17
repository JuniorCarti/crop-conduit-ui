import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { generateAdvisory } from "@/services/advisoryService";
import type { AdvisoryGenerateResponse } from "@/types/advisory";
import { auth } from "@/lib/firebase";
import type { AdvisoryContext } from "@/types/advisoryContext";

type PendingConfirm = {
  farm?: Record<string, any>;
  crop?: Record<string, any>;
  language: "en" | "sw";
} | null;

type SendToAshaOptions = {
  language: "en" | "sw";
  farm?: Record<string, any>;
  crop?: Record<string, any>;
  signals?: Record<string, any>;
  onAssistantMessage?: (text: string) => void;
  onAdvisory?: (advisory: any) => void;
};

export function useAdvisory() {
  const mutation = useMutation<AdvisoryGenerateResponse, Error, Record<string, any>>({
    mutationFn: async (payload) => {
      const token = await auth.currentUser?.getIdToken();
      const context = payload as AdvisoryContext;
      const weatherDay = context.weather?.daily?.[0];
      const bestMarket = context.market?.bestMarket;
      const topMarket = context.market?.topMarkets?.[0];

      const requestPayload = {
        crop: context.crop?.name || payload?.crop?.name || "",
        growthStage: context.crop?.stage || payload?.crop?.stage || "",
        language: context.language || "en",
        farmId: payload?.farmId ?? null,
        farmContext: {
          county: context.farm?.county || "",
          ward: context.farm?.ward || "",
          lat: context.farm?.lat ?? null,
          lon: context.farm?.lng ?? null,
          crops: payload?.farmContext?.crops || [],
          mainCrop: context.crop?.name || "",
        },
        climateContext: {
          forecastSummary: context.weather?.summary || "",
          rainfallChance: weatherDay?.rainChancePct ?? null,
          tempMin: weatherDay?.minTempC ?? null,
          tempMax: weatherDay?.maxTempC ?? null,
          alerts: (context.weather?.alerts || []).map((row) => row?.message).filter(Boolean),
          daily: context.weather?.daily || [],
        },
        marketContext: {
          marketName: bestMarket?.market || topMarket?.market || "",
          pricePerKg: bestMarket?.netPrice ?? topMarket?.retail ?? topMarket?.wholesale ?? null,
          priceTrend: topMarket?.trend7d === "up" || topMarket?.trend7d === "down" ? topMarket?.trend7d : "flat",
          updatedAt: topMarket?.lastUpdated || null,
          topMarkets: context.market?.topMarkets || [],
        },
        dataUsed: payload?.dataUsed ?? null,
      };

      const data = await generateAdvisory(requestPayload, { token });
      const nested = (data?.advisory && typeof data.advisory === "object") ? data.advisory : null;
      const nestedBullets = Array.isArray(nested?.bullets) ? nested.bullets : [];
      const nestedActions = nestedBullets
        .flatMap((group: any) => (Array.isArray(group?.points) ? group.points : []))
        .map((item: any) => String(item || "").trim())
        .filter(Boolean);
      const nestedRisks = Array.isArray(nested?.watchOuts)
        ? nested.watchOuts.map((item: any) => String(item || "").trim()).filter(Boolean)
        : [];
      const nestedSummary =
        (typeof nested?.summary === "string" ? nested.summary : "") ||
        (typeof nested?.title === "string" ? nested.title : "") ||
        "";

      return {
        ...(data as AdvisoryGenerateResponse),
        summary: data?.summary || nestedSummary || (typeof data?.advisory === "string" ? data.advisory : ""),
        actions:
          Array.isArray(data?.actions) && data.actions.length
            ? data.actions
            : nestedActions,
        risks:
          Array.isArray(data?.risks) && data.risks.length
            ? data.risks
            : nestedRisks,
        weeklyWatch:
          Array.isArray((data as any)?.weeklyWatch) && (data as any).weeklyWatch.length
            ? (data as any).weeklyWatch
            : nestedRisks,
        marketAdvice:
          (data as any)?.marketAdvice ||
          (typeof nested?.marketAngle === "string" ? nested.marketAngle : ""),
      } as AdvisoryGenerateResponse;
    },
  });

  const sessionId = useMemo(() => {
    if (typeof window === "undefined") return "session";
    const key = "asha_session_id";
    let value = window.localStorage.getItem(key);
    if (!value) {
      value =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      window.localStorage.setItem(key, value);
    }
    return value;
  }, []);

  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm>(null);
  const [isSending, setIsSending] = useState(false);

  const sendToAsha = async (
    userText: string,
    overrides: Record<string, any> = {},
    options?: SendToAshaOptions
  ) => {
    setIsSending(true);
    try {
      const payload = {
        sessionId,
        language: options?.language ?? "en",
        message: userText,
        farm: options?.farm ?? {},
        crop: options?.crop ?? {},
        signals: options?.signals ?? {},
        ...overrides,
      };

      const token = await auth.currentUser?.getIdToken();
      const data = await generateAdvisory(payload, { token });

      if (data?.mode === "collect_context") {
        if (typeof data.reply === "string") {
          options?.onAssistantMessage?.(data.reply);
        }
        return data;
      }

      if (data?.mode === "advisory" && data?.advisory) {
        options?.onAdvisory?.(data.advisory);
        return data;
      }

      if (typeof data?.reply === "string") {
        options?.onAssistantMessage?.(data.reply);
      }

      return data;
    } catch (error: any) {
      options?.onAssistantMessage?.(
        `I couldn't generate advice. ${String(error?.message || error)}`
      );
      throw error;
    } finally {
      setIsSending(false);
    }
  };

  return {
    ...mutation,
    sendToAsha,
    pendingConfirm,
    setPendingConfirm,
    sessionId,
    isSending,
  };
}
