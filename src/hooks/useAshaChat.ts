import { useCallback, useMemo, useRef, useState } from "react";
import { sendAshaChat } from "@/services/ashaService";
import type { AshaChatRequest, AshaMessage, AshaResponse, AshaCard } from "@/types/asha";
import { useAuth } from "@/contexts/AuthContext";
import { dispatchAshaActions } from "@/services/ashaActionDispatcher";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

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
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const cart = useCart();
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
        const token = currentUser ? await currentUser.getIdToken() : undefined;
        const response = await sendAshaChat(
          {
            ...payload,
            sessionId,
            message,
          },
          token
        );

        const replyText = response.reply || "Asha could not respond right now.";
        const replyLanguage = payload.language ?? "en";
        const replyMessage: AshaMessage = {
          id: `${Date.now()}-assistant`,
          role: "assistant",
          text: replyText,
          createdAt: Date.now(),
          status: response.ok ? "sent" : "error",
          intent: response.intent,
          actions: response.actions,
          uiHint: response.uiHint,
          toolResult: response.toolResult,
          cards: buildCards(response),
          autoPlay: options?.autoPlay ?? false,
          language: replyLanguage,
        };

        setMessages((prev) => [...prev, replyMessage]);

        if (response.actions || response.uiHint) {
          await dispatchAshaActions(response, {
            navigate,
            cart,
            userId: currentUser?.uid,
            notify: (msg, type) => {
              if (type === "error") {
                toast.error(msg);
                return;
              }
              if (type === "success") {
                toast.success(msg);
                return;
              }
              toast.info(msg);
            },
          });
        }

        if (!response.ok && response.error) {
          setError(response.error);
        }
      } catch (err: any) {
        const messageText = err?.message || "Failed to reach Asha.";
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
    [cart, currentUser, navigate, sessionId]
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
