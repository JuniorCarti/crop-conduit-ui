import { useCallback, useMemo, useRef, useState } from "react";
import { sendAshaChat } from "@/services/ashaService";
import type { AshaChatRequest, AshaMessage, AshaResponse, AshaCard } from "@/types/asha";

const SESSION_KEY = "asha_session_id";

const generateSessionId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
};

const getSessionId = (): string => {
  if (typeof window === "undefined") return generateSessionId();
  const stored = window.localStorage.getItem(SESSION_KEY);
  if (stored && stored.trim()) return stored;
  const created = generateSessionId();
  window.localStorage.setItem(SESSION_KEY, created);
  return created;
};

const buildCards = (response: AshaResponse): AshaCard[] => {
  const cards: AshaCard[] = [];

  if (response.intent === "climate") {
    cards.push({
      type: "climate",
      title: "Climate snapshot",
      subtitle: "Open Climate for detailed forecast",
      items: ["7-day outlook", "Rain & frost signals"],
    });
  }

  if (response.intent === "orders") {
    cards.push({
      type: "logistics",
      title: "Order flow",
      subtitle: "Checkout is ready when you confirm",
      items: ["Delivery details", "Payment method"],
    });
  }

  if (response.intent === "marketplace") {
    const listingAction = response.actions?.find((action) => action.type === "ADD_TO_CART") as any;
    if (listingAction?.listing) {
      cards.push({
        type: "market",
        title: "Suggested listing",
        subtitle: "Matched from marketplace",
        listing: {
          title: listingAction.listing.title || "Listing",
          price: listingAction.listing.pricePerUnit || listingAction.listing.price,
          unit: listingAction.listing.unit,
          county: listingAction.listing.location?.county,
        },
      });
    } else {
      cards.push({
        type: "market",
        title: "Marketplace",
        subtitle: "Browse listings to compare prices",
      });
    }
  }

  return cards;
};

export function useAshaChat() {
  const [sessionId, setSessionId] = useState(getSessionId);
  const [messages, setMessages] = useState<AshaMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  const sendMessage = useCallback(
    async (
      message: string,
      payload: Omit<AshaChatRequest, "message" | "sessionId">,
      options?: { autoPlay?: boolean }
    ) => {
      if (!message.trim() || inFlightRef.current) return;
      inFlightRef.current = true;
      setError(null);
      setIsLoading(true);

      const now = Date.now();
      setMessages((prev) => [
        ...prev,
        {
          id: `${now}-user`,
          role: "user",
          text: message,
          createdAt: now,
          status: "sent",
        },
      ]);

      try {
        const response = await sendAshaChat(
          {
            ...payload,
            sessionId,
            message,
          }
        );

        const replyText =
          typeof response.reply === "string" ? response.reply.trim() : "";
        const isReplySuccess = response.ok === true && replyText.length > 0;
        const fallbackText = "I didn't catch that - please try again.";
        const replyLanguage = payload.language ?? "en";
        const replyMessage: AshaMessage = {
          id: `${Date.now()}-assistant`,
          role: "assistant",
          text: isReplySuccess ? replyText : fallbackText,
          createdAt: Date.now(),
          status: isReplySuccess ? "sent" : "error",
          intent: response.intent,
          actions: response.actions,
          uiHint: response.uiHint,
          toolResult: response.toolResult,
          cards: buildCards(response),
          autoPlay: options?.autoPlay ?? false,
          language: replyLanguage,
        };

        setMessages((prev) => [...prev, replyMessage]);

        if (!isReplySuccess) {
          setError(response.error || fallbackText);
        }
      } catch (err: any) {
        const messageText =
          err?.message || (import.meta.env.DEV ? "Failed to reach Asha." : "I didn't catch that - please try again.");
        setError(messageText);
        setMessages((prev) => [
          ...prev,
          {
            id: `${Date.now()}-assistant-error`,
            role: "assistant",
            text: messageText,
            createdAt: Date.now(),
            status: "error",
          },
        ]);
      } finally {
        inFlightRef.current = false;
        setIsLoading(false);
      }
    },
    [sessionId]
  );

  const resetSession = useCallback(() => {
    const nextId = generateSessionId();
    setSessionId(nextId);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SESSION_KEY, nextId);
    }
    setMessages([]);
    setError(null);
  }, []);

  const hasMessages = useMemo(() => messages.length > 0, [messages.length]);

  return {
    sessionId,
    messages,
    isLoading,
    error,
    hasMessages,
    sendMessage,
    resetSession,
    setMessages,
  };
}
