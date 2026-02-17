import { textToSpeech } from "@/services/ashaAzureService";

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
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Response text is empty.");
  }
  return textToSpeech(trimmed, options?.voice);
}
