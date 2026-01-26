import { useEffect, useState } from "react";

export type EmailAlertsPreferences = {
  email: string;
  wantsFrost: boolean;
  wantsRain: boolean;
  lat: number;
  lon: number;
  locationName: string;
  enabledAt: string;
};

export const EMAIL_ALERTS_STORAGE_KEY = "agrismart_alerts_email";

const readStoredAlerts = (): EmailAlertsPreferences | null => {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(EMAIL_ALERTS_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as EmailAlertsPreferences;
  } catch {
    window.localStorage.removeItem(EMAIL_ALERTS_STORAGE_KEY);
    return null;
  }
};

export function useEmailAlerts() {
  const [savedAlerts, setSavedAlerts] = useState<EmailAlertsPreferences | null>(null);

  useEffect(() => {
    setSavedAlerts(readStoredAlerts());
  }, []);

  const saveAlerts = (prefs: EmailAlertsPreferences) => {
    setSavedAlerts(prefs);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(EMAIL_ALERTS_STORAGE_KEY, JSON.stringify(prefs));
    }
  };

  const clearAlerts = () => {
    setSavedAlerts(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(EMAIL_ALERTS_STORAGE_KEY);
    }
  };

  return { savedAlerts, saveAlerts, clearAlerts };
}
