import type { Env } from "../types";

export const parseAllowedOrigins = (env: Env): string[] =>
  String(env.CORS_ALLOW_ORIGINS || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

export const corsHeaders = (request: Request, env: Env): Record<string, string> => {
  const origins = parseAllowedOrigins(env);
  const origin = request.headers.get("Origin") || "";
  const allowOrigin = origin
    ? origins.includes(origin)
      ? origin
      : "null"
    : origins[0] || "null";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Authorization,Content-Type",
    Vary: "Origin",
  };
};

export const preflight = (request: Request, env: Env): Response =>
  new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders(request, env),
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
  });
