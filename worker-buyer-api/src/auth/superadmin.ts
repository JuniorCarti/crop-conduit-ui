import type { AuthClaims, Env } from "../types";

const parseCsv = (value?: string): string[] =>
  String(value || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

export const isSuperadmin = (auth: AuthClaims, env: Env): boolean => {
  const emails = new Set(parseCsv(env.SUPERADMIN_EMAILS).map((v) => v.toLowerCase()));
  const uids = new Set(parseCsv(env.SUPERADMIN_UIDS));

  const emailMatch = auth.email ? emails.has(auth.email.toLowerCase()) : false;
  const uidMatch = uids.has(auth.uid);

  return emailMatch || uidMatch;
};
