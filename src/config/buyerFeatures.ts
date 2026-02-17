const isEnabled = (value: string | undefined, defaultValue = true) => {
  if (value == null || value.trim() === "") return defaultValue;
  return value.toLowerCase() !== "false";
};

export const BUYER_DASHBOARD_ENABLED = isEnabled(import.meta.env.VITE_ENABLE_BUYER_DASHBOARD, true);
export const BUYER_BILLING_ENABLED = isEnabled(import.meta.env.VITE_ENABLE_BUYER_BILLING, true);
