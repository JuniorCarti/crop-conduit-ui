export async function generateAdvisory(
  payload: Record<string, any>,
  options?: { token?: string }
) {
  const primaryBaseUrl = import.meta.env.VITE_ASHA_API_BASE_URL;
  const legacyBaseUrl = import.meta.env.VITE_ADVISORY_API_BASE_URL;
  const baseUrls = [primaryBaseUrl, legacyBaseUrl].filter(Boolean) as string[];
  if (!baseUrls.length) {
    throw new Error("Missing VITE_ASHA_API_BASE_URL or VITE_ADVISORY_API_BASE_URL");
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (options?.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);
  const candidatePaths = ["/asha/advisory/generate", "/advisory/generate"];

  try {
    let lastError: Error | null = null;

    for (const baseUrl of baseUrls) {
      const root = baseUrl.replace(/\/$/, "");

      for (const path of candidatePaths) {
        let response: Response;
        try {
          response = await fetch(`${root}${path}`, {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
            signal: controller.signal,
          });
        } catch (error: any) {
          lastError = error;
          continue;
        }

        const text = await response.text();
        let data: any;
        try {
          data = JSON.parse(text);
        } catch {
          data = { ok: false, error: text };
        }

        const message = String(data?.error || data?.message || "").toLowerCase();
        const isRouteMiss =
          response.status === 404 ||
          response.status === 405 ||
          message.includes("route not found") ||
          message.includes("not found");

        if (isRouteMiss) {
          continue;
        }

        if (!response.ok || data?.ok === false) {
          throw new Error(data?.error || data?.message || `Request failed (${response.status})`);
        }

        return data;
      }
    }

    if (lastError) {
      throw lastError;
    }
    throw new Error("Route not found");
  } finally {
    clearTimeout(timeout);
  }
}
