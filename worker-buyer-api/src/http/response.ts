import type { ApiError, ApiSuccess, Env } from "../types";
import { HttpError } from "../domain/errors";
import { corsHeaders } from "./cors";

export const json = <T>(request: Request, env: Env, status: number, body: ApiSuccess<T> | ApiError): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(request, env),
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
  });

export const ok = <T>(request: Request, env: Env, data: T, status = 200): Response =>
  json(request, env, status, { ok: true, data });

export const fail = (request: Request, env: Env, status: number, code: string, error: string, details?: unknown): Response =>
  json(request, env, status, { ok: false, code, error, details });

export const asHttpError = (error: unknown): HttpError => {
  if (error instanceof HttpError) return error;
  const message = error instanceof Error ? error.message : "Internal server error";
  return new HttpError(500, "INTERNAL_ERROR", message);
};
