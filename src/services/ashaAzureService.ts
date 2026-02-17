import { auth } from "@/lib/firebase";

const resolveBaseUrl = () => {
  const base = import.meta.env.VITE_ASHA_API_BASE_URL as string | undefined;
  if (!base) {
    throw new Error("Asha API is not configured.");
  }
  return base.replace(/\/$/, "");
};

const logDev = (label: string, payload?: unknown) => {
  if (!import.meta.env.DEV) return;
  if (payload === undefined) {
    console.info(`[AshaAPI] ${label}`);
    return;
  }
  console.info(`[AshaAPI] ${label}`, payload);
};

const getAuthHeaders = async (extra?: Record<string, string>) => {
  const token = await auth.currentUser?.getIdToken();
  if (!token) {
    throw new Error("Authentication required.");
  }
  return {
    Authorization: `Bearer ${token}`,
    ...(extra || {}),
  };
};

const parseJson = async (response: Response) => {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { message: text || "Unexpected response" };
  }
};

const parseError = (data: any, fallback: string) =>
  data?.error || data?.message || fallback;

type ChatContext = Record<string, any> | undefined;

export async function sendChatMessage(
  message: string,
  options?: {
    role?: string;
    language?: "en" | "sw";
    context?: ChatContext;
  }
) {
  const cleanMessage = String(message || "").trim();
  if (!cleanMessage) {
    throw new Error("message is required.");
  }
  const body: Record<string, unknown> = {
    message: cleanMessage,
    language: options?.language || "en",
  };
  if (options?.role) body.role = options.role;
  if (options?.context && Object.keys(options.context).length > 0) {
    body.context = options.context;
  }
  const url = `${resolveBaseUrl()}/asha/chat`;
  logDev("chat request", { url, body });
  const response = await fetch(url, {
    method: "POST",
    headers: await getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
  logDev("chat status", { status: response.status });
  const data = await parseJson(response);
  logDev("chat response", data);
  if (!response.ok || data?.ok === false) {
    throw new Error(parseError(data, "Asha chat request failed."));
  }
  return data;
}

export async function speechToText(file: Blob | File) {
  const form = new FormData();
  form.append("file", file, file instanceof File ? file.name : "audio.webm");
  const url = `${resolveBaseUrl()}/asha/stt`;
  logDev("stt request", { url, fileName: file instanceof File ? file.name : "audio.webm", size: file.size });
  const response = await fetch(url, {
    method: "POST",
    headers: await getAuthHeaders(),
    body: form,
  });
  logDev("stt status", { status: response.status });
  const data = await parseJson(response);
  logDev("stt response", data);
  if (!response.ok || data?.ok === false) {
    throw new Error(parseError(data, "Speech-to-text failed."));
  }
  return data;
}

export async function textToSpeech(text: string, voice?: string) {
  const cleanText = String(text || "").trim();
  if (!cleanText) {
    throw new Error("text is required.");
  }
  const url = `${resolveBaseUrl()}/asha/tts`;
  logDev("tts request", { url, length: cleanText.length, voice: voice || null });
  const response = await fetch(url, {
    method: "POST",
    headers: await getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ text: cleanText, voice }),
  });
  logDev("tts status", { status: response.status });
  const data = await parseJson(response);
  logDev("tts response", data);
  if (!response.ok || data?.ok === false) {
    throw new Error(parseError(data, "Text-to-speech failed."));
  }
  const base64 = data?.audioBase64 as string | undefined;
  if (!base64) {
    throw new Error("Text-to-speech returned empty audio.");
  }
  const bytes = atob(base64.includes(",") ? base64.split(",")[1] : base64);
  const buffer = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i += 1) {
    buffer[i] = bytes.charCodeAt(i);
  }
  return new Blob([buffer], { type: data?.contentType || "audio/mpeg" });
}
