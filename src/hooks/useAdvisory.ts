import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { generateAdvisory } from "@/services/advisoryService";
import type { AdvisoryGenerateResponse } from "@/types/advisory";
import { auth } from "@/lib/firebase";

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
      const data = await generateAdvisory(payload, { token });
      return data as AdvisoryGenerateResponse;
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
