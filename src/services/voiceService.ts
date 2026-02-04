const API_BASE_URL = import.meta.env.VITE_ASHA_API_BASE_URL || "";

if (!API_BASE_URL) {
  throw new Error("VITE_ASHA_API_BASE_URL is not configured.");
}

const TTS_URL = `${API_BASE_URL.replace(/\/$/, "")}/asha/voice/tts`;

const parseError = async (response: Response): Promise<string> => {
  try {
    const data = await response.json();
    if (typeof data === "string") return data;
    if (data?.error) return String(data.error);
    if (data?.message) return String(data.message);
  } catch {
    // ignore
  }
  return `Request failed (${response.status})`;
};

const decodeBase64Audio = (base64: string, mimeType = "audio/mpeg"): Blob => {
  const sanitized = base64.includes(",") ? base64.split(",")[1] : base64;
  const byteCharacters = atob(sanitized);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i += 1) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  return new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
};

export async function speakText(
  text: string,
  options?: {
    language?: "en" | "sw";
    voice?: string;
    format?: "mp3" | "wav";
    token?: string;
    signal?: AbortSignal;
  }
): Promise<Blob> {
  const trimmedText = text.trim();
  if (!trimmedText) {
    throw new Error("Response text is empty.");
  }

  const payload: Record<string, any> = {
    text: trimmedText,
    format: options?.format || "mp3",
  };

  if (options?.language) {
    payload.language = options.language;
  }
  if (options?.voice) {
    payload.voice = options.voice;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options?.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(TTS_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    signal: options?.signal,
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const body = await response.json().catch(() => null);
  const base64 = body?.audioBase64;
  const contentType = body?.contentType || "audio/mpeg";

  if (!base64) {
    throw new Error("Audio response was empty.");
  }

  const blob = decodeBase64Audio(base64, contentType);
  if (blob.size === 0) {
    throw new Error("Audio response was empty.");
  }

  return blob;
}
