import type { Env } from "./types";
import { preflight } from "./http/cors";
import { asHttpError, fail } from "./http/response";
import { route } from "./router";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") return preflight(request, env);

    try {
      const url = new URL(request.url);
      return await route(request, env, url.pathname);
    } catch (error) {
      const e = asHttpError(error);
      if (e.status >= 500) {
        console.error("worker_error", { code: e.code, message: e.message, details: e.details });
      }
      return fail(request, env, e.status, e.code, e.message, e.details);
    }
  },
};
