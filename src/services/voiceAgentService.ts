import type { AdvisoryGenerateResponse } from "@/types/advisory";

type VoiceAgentResult<T> = {
  ok: boolean;
  data?: T;
  error?: string;
};

export type AdvisoryRequestPayload = {
  sessionId: string;
  language: "sw" | "en";
  message: string;
  farm: {
    locationName?: string;
    lat?: number;
    lon?: number;
  };
  crop: {
    name?: string;
    stage?: string;
  };
};

export type AdvisoryResponsePayload = {
  ok?: boolean;
  mode?: string;
  advisory?: AdvisoryGenerateResponse | any;
  needs?: { crop?: boolean; location?: boolean; stage?: boolean };
  reply?: string;
  language?: "sw" | "en";
  sessionId?: string;
  meta?: Record<string, any>;
  [key: string]: any;
};

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_ADVISORY_API_URL =
  "https://agrismart-advisory.ridgejunior204.workers.dev";

const resolveAdvisoryApiUrl = (): string =>
  (
    import.meta.env.VITE_ADVISORY_API_URL ||
    import.meta.env.VITE_ADVISORY_WORKER_URL ||
    DEFAULT_ADVISORY_API_URL
  ).replace(/\/$/, "");

const readResponsePayload = async (response: Response): Promise<any> => {
  const contentType = response.headers.get("Content-Type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
};

const parseErrorMessage = async (response: Response): Promise<string> => {
  try {
    const data = await readResponsePayload(response);
    if (typeof data === "string") return data;
    if (data?.error) return String(data.error);
    if (data?.message) return String(data.message);
  } catch {
    // Ignore parsing errors.
  }
  return `Request failed (${response.status})`;
};

const normalizeAdvisoryResponse = (data: any): AdvisoryResponsePayload => {
  if (typeof data === "string") {
    return {
      ok: true,
      mode: "advisory",
      advisory: {
        title: "",
        bullets: [{ heading: "", points: [data] }],
      },
    };
  }

  if (data && typeof data === "object") {
    if (data.mode) {
      return data as AdvisoryResponsePayload;
    }
    if (data.advisory) {
      return {
        mode: "advisory",
        ok: data.ok ?? true,
        ...data,
      } as AdvisoryResponsePayload;
    }
    return {
      ok: data.ok ?? true,
      mode: "advisory",
      advisory: data,
    } as AdvisoryResponsePayload;
  }

  return {
    ok: true,
    mode: "advisory",
    advisory: {
      title: "",
      bullets: [{ heading: "", points: [String(data)] }],
    },
  };
};

const requestWithTimeout = async (
  url: string,
  options: RequestInit,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
};

export async function requestAdvisory(
  payload: AdvisoryRequestPayload
): Promise<VoiceAgentResult<AdvisoryResponsePayload>> {
  const baseUrl = resolveAdvisoryApiUrl();

  console.debug("[Asha] advisory request payload", {
    sessionId: payload.sessionId ? "<provided>" : "<missing>",
    language: payload.language,
    message: payload.message ? "<provided>" : "<missing>",
    farm: {
      lat: typeof payload.farm.lat,
      lon: typeof payload.farm.lon,
      locationName: payload.farm.locationName ? "<provided>" : "<missing>",
    },
    crop: {
      name: payload.crop.name || "<missing>",
      stage: payload.crop.stage || "<missing>",
    },
  });

  let response: Response;
  try {
    response = await requestWithTimeout(`${baseUrl}/advisory/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (error: any) {
    const message =
      error?.name === "AbortError"
        ? "Request timed out."
        : error?.message || "Request failed.";
    return { ok: false, error: message };
  }

  console.debug("[Asha] advisory response status", response.status);

  if (!response.ok) {
    try {
      const rawBody = await readResponsePayload(response.clone());
      console.error("[Asha] Advisory request failed", {
        status: response.status,
        error: rawBody,
      });
    } catch (error) {
      console.error("[Asha] Advisory request failed", {
        status: response.status,
        error: "<unreadable>",
        details: error,
      });
    }
    const message = await parseErrorMessage(response);
    return { ok: false, error: message };
  }

  const data = await readResponsePayload(response);
  const normalized = normalizeAdvisoryResponse(data);
  return { ok: true, data: normalized };
}

const decodeBase64Audio = (base64: string, mimeType = "audio/mpeg"): Blob => {
  const sanitized = base64.includes(",") ? base64.split(",")[1] : base64;
  const byteCharacters = atob(sanitized);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i += 1) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  return new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
};

export async function requestSpeechAudio(
  text: string,
  language: "sw" | "en"
): Promise<VoiceAgentResult<Blob>> {
  const baseUrl = resolveAdvisoryApiUrl();

  const trimmedText = text.trim();
  if (!trimmedText) {
    return { ok: false, error: "Response text is empty." };
  }

  let response: Response;
  try {
    response = await requestWithTimeout(`${baseUrl}/voice/speak`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: trimmedText, language }),
    });
  } catch (error: any) {
    const message =
      error?.name === "AbortError"
        ? "Request timed out."
        : error?.message || "Request failed.";
    return { ok: false, error: message };
  }

  console.debug("[Asha] voice response status", response.status);

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    return { ok: false, error: message };
  }

  const contentType = response.headers.get("Content-Type") || "";

  if (contentType.includes("application/json")) {
    let data: any;
    try {
      data = await response.json();
    } catch (error: any) {
      return {
        ok: false,
        error: error?.message || "Failed to read audio response.",
      };
    }
    const audioBase64 =
      data?.audio || data?.audioContent || data?.audio_base64 || data?.data;
    if (typeof audioBase64 === "string") {
      return { ok: true, data: decodeBase64Audio(audioBase64) };
    }

    if (typeof data?.url === "string") {
      try {
        const audioResponse = await fetch(data.url);
        if (!audioResponse.ok) {
          return { ok: false, error: "Failed to fetch audio." };
        }
        const blob = await audioResponse.blob();
        return { ok: true, data: blob };
      } catch (error: any) {
        return {
          ok: false,
          error: error?.message || "Failed to fetch audio.",
        };
      }
    }

    return { ok: false, error: "Audio response was empty." };
  }

  const blob = await response.blob();
  if (blob.size === 0) {
    return { ok: false, error: "Audio response was empty." };
  }
  return { ok: true, data: blob };
}
