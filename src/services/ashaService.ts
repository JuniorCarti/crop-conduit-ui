import type { AshaChatRequest, AshaResponse } from "@/types/asha";
import { sendChatMessage } from "@/services/ashaAzureService";

const normalizeReply = (data: any): string =>
  typeof data?.reply === "string" ? data.reply.trim() : "";

export async function sendAshaChat(
  payload: AshaChatRequest,
  _token?: string
): Promise<AshaResponse> {
  try {
    const sourceContext = (payload.context as any) || {};
    const compactContext: Record<string, unknown> = {};
    if (payload.farm && Object.keys(payload.farm).length > 0) compactContext.farm = payload.farm;
    if (sourceContext.weather) compactContext.weather = sourceContext.weather;
    if (sourceContext.market) compactContext.market = sourceContext.market;

    const data = await sendChatMessage(payload.message, {
      role: (payload.context as any)?.role || "farmer",
      language: payload.language,
      context: Object.keys(compactContext).length ? compactContext : undefined,
    });

    return {
      ok: data?.ok === true,
      reply: normalizeReply(data),
      intent: data?.intent,
      actions: [],
      uiHint: null,
      toolResult: data?.toolResult,
    };
  } catch (error: any) {
    return {
      ok: false,
      reply: "Asha could not respond right now.",
      error: error?.message || "Asha chat failed.",
      actions: [],
      uiHint: null,
    };
  }
}
