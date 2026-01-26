export type EmailAlertsPayload = {
  email: string;
  lat: number;
  lon: number;
  locationName?: string;
  wantsFrost?: boolean;
  wantsRain?: boolean;
};

export type WhatsAppAlertsPayload = {
  msisdn: string;
  lat: number;
  lon: number;
  locationName?: string;
  wantsFrost?: boolean;
  wantsRain?: boolean;
};

export type AlertsResponse = {
  success?: boolean;
  message?: string;
};

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
    if (typeof data === "string") {
      return data;
    }
    if (data?.error) {
      return String(data.error);
    }
    if (data?.message) {
      return String(data.message);
    }
  } catch {
    // Ignore JSON parsing errors.
  }
  return `Request failed (${response.status})`;
};

export const isAlertsWorkerConfigured = (): boolean =>
  Boolean(import.meta.env.VITE_ALERTS_WORKER_URL);

const postSubscription = async (
  path: string,
  payload: EmailAlertsPayload | WhatsAppAlertsPayload
): Promise<AlertsResponse> => {
  const baseUrl = resolveAlertsWorkerUrl();
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return response.json().catch(() => ({}));
};

export const subscribeEmail = (payload: EmailAlertsPayload) =>
  postSubscription("/subscribe/email", payload);

export const subscribeWhatsApp = (payload: WhatsAppAlertsPayload) =>
  postSubscription("/subscribe/whatsapp", payload);
