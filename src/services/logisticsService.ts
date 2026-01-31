import type { LogisticsRouteResponse } from "@/types/logistics";

const DEFAULT_LOGISTICS_API_URL = "https://agrismart-advisory.ridgejunior204.workers.dev";

const resolveLogisticsUrl = (): string =>
  (
    import.meta.env.VITE_ADVISORY_API_BASE_URL ||
    import.meta.env.VITE_ADVISORY_WORKER_URL ||
    DEFAULT_LOGISTICS_API_URL
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

export async function fetchLogisticsRoute(
  params: { crop: string; origin: string; destination: string },
  token?: string
): Promise<LogisticsRouteResponse> {
  const baseUrl = resolveLogisticsUrl();
  const url = new URL(`${baseUrl}/logistics`);
  url.searchParams.set("crop", params.crop);
  url.searchParams.set("origin", params.origin);
  url.searchParams.set("destination", params.destination);

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  }).catch((error) => {
    return {
      ok: false,
      error: error?.message || "Network error",
      data: null,
    } as LogisticsRouteResponse & { ok: false };
  });

  if (!(response instanceof Response)) {
    return response;
  }

  const data = await parseResponse(response);

  if (!response.ok) {
    return {
      ok: false,
      data: null,
      error: data?.error || data?.message || `Request failed (${response.status})`,
    };
  }

  return {
    ok: data?.ok ?? true,
    data: data?.data ?? null,
    error: data?.error,
  };
}
