import type { AshaChatRequest, AshaResponse } from "@/types/asha";

const DEFAULT_ADVISORY_API_URL = "https://agrismart-advisory.ridgejunior204.workers.dev";

const resolveAdvisoryUrl = (): string =>
  (
    import.meta.env.VITE_ADVISORY_API_BASE_URL ||
    import.meta.env.VITE_ADVISORY_WORKER_URL ||
    DEFAULT_ADVISORY_API_URL
  ).replace(/\/$/, "");

const parseResponse = async (response: Response): Promise<any> => {
  const contentType = response.headers.get("Content-Type") || "";
  const text = await response.text();
  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(text);
    } catch {
      return { ok: false, error: text || "Invalid JSON response" };
    }
  }
  try {
    return JSON.parse(text);
  } catch {
    return { ok: false, error: text || "Invalid response" };
  }
};

const normalizeReply = (data: any): string => {
  if (typeof data?.reply === "string") return data.reply;
  if (typeof data?.advisory === "string") return data.advisory;
  if (data?.advisory?.title || data?.advisory?.bullets) {
    const title = data.advisory?.title ? String(data.advisory.title) : "";
    const bullets = Array.isArray(data.advisory?.bullets) ? data.advisory.bullets : [];
    const lines = bullets
      .map((bullet: any) => {
        const heading = bullet?.heading ? `${bullet.heading}: ` : "";
        const points = Array.isArray(bullet?.points) ? bullet.points.join("; ") : "";
        return `${heading}${points}`.trim();
      })
      .filter(Boolean);
    return [title, ...lines].filter(Boolean).join("\n");
  }
  if (typeof data === "string") return data;
  return "Asha could not generate a response.";
};

export async function sendAshaChat(
  payload: AshaChatRequest,
  token?: string
): Promise<AshaResponse> {
  const baseUrl = resolveAdvisoryUrl();
  const endpoints = ["/asha/chat", "/advisory/generate"];

  let lastError = "Request failed.";

  for (const endpoint of endpoints) {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    }).catch((error) => {
      lastError = error?.message || "Network error";
      return null;
    });

    if (!response) continue;

    const data = await parseResponse(response);

    if (!response.ok) {
      lastError = data?.error || data?.message || `Request failed (${response.status})`;
      if (response.status === 404 && endpoint === "/asha/chat") {
        continue;
      }
      return {
        ok: false,
        reply: normalizeReply(data),
        error: lastError,
        ...data,
      } as AshaResponse;
    }

    const reply = normalizeReply(data);
    return {
      ok: data?.ok ?? true,
      reply,
      intent: data?.intent,
      actions: data?.actions,
      uiHint: data?.uiHint ?? null,
      toolResult: data?.toolResult,
      ...data,
    } as AshaResponse;
  }

  return {
    ok: false,
    reply: "Asha could not respond right now.",
    error: lastError,
  };
}
