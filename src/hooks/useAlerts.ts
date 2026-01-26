import { useMutation } from "@tanstack/react-query";
import {
  subscribeEmail,
  subscribeWhatsApp,
  type EmailAlertsPayload,
  type WhatsAppAlertsPayload,
  type AlertsResponse,
} from "@/services/alertsService";

export function useSubscribeEmailAlerts() {
  return useMutation<AlertsResponse, Error, EmailAlertsPayload>({
    mutationFn: (payload) => subscribeEmail(payload),
  });
}

export function useSubscribeWhatsAppAlerts() {
  return useMutation<AlertsResponse, Error, WhatsAppAlertsPayload>({
    mutationFn: (payload) => subscribeWhatsApp(payload),
  });
}
