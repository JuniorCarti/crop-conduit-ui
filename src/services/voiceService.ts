const DEFAULT_ADVISORY_API_URL = "https://agrismart-advisory.ridgejunior204.workers.dev";

const resolveAdvisoryUrl = (): string =>
  (
    import.meta.env.VITE_ADVISORY_API_BASE_URL ||
    import.meta.env.VITE_ADVISORY_WORKER_URL ||
    DEFAULT_ADVISORY_API_URL
  ).replace(/\/$/, "");

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

export async function speakText(text: string, signal?: AbortSignal): Promise<Blob> {
  const baseUrl = resolveAdvisoryUrl();
  const response = await fetch(`${baseUrl}/voice/speak`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
    signal,
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.blob();
}
