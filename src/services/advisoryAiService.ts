import type { AdvisoryContext, AdvisoryResponse } from "@/types/advisory";

const resolveAlertsWorkerUrl = (): string => {
  const baseUrl = import.meta.env.VITE_ALERTS_WORKER_URL;
  if (!baseUrl) {
    throw new Error("Alerts service is not configured.");
  }
  return baseUrl.replace(/\/$/, "");
};

const parseErrorMessage = async (response: Response): Promise<string> => {
  try {
    const data = await response.json();
    if (typeof data === "string") return data;
    if (data?.error) return String(data.error);
    if (data?.message) return String(data.message);
  } catch {
    // Ignore JSON parsing errors.
  }
  return `Request failed (${response.status})`;
};

const useMockAdvisory = (): boolean =>
  import.meta.env.VITE_USE_MOCK_ADVISORY === "true";

const buildMockResponse = (note: string): AdvisoryResponse => ({
  summary: "Mock advisory: verify forecast and market data before acting.",
  actions: [
    {
      title: "Prepare drainage",
      detail: "Clear field channels ahead of expected rain.",
      why: note,
    },
    {
      title: "Inspect crop canopy",
      detail: "Check for early stress and adjust irrigation.",
      why: note,
    },
  ],
  risks: [
    {
      label: "Rainfall risk",
      severity: "medium",
      why: note,
    },
  ],
  marketAdvice:
    "Market signal is unavailable in mock mode. Verify with current market price sync.",
  disclaimer: "This is a mock advisory response.",
});

export async function generateAdvisory(
  context: AdvisoryContext
): Promise<AdvisoryResponse> {
  const baseUrl = resolveAlertsWorkerUrl();
  const url = `${baseUrl}/advisory/generate`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(context),
    });

    if (!response.ok) {
      const message = await parseErrorMessage(response);
      if (useMockAdvisory() && response.status >= 500) {
        return buildMockResponse(message);
      }
      throw new Error(message);
    }

    return response.json() as Promise<AdvisoryResponse>;
  } catch (error: any) {
    if (useMockAdvisory()) {
      return buildMockResponse(error?.message || "Advisory service unavailable.");
    }
    throw error;
  }
}
