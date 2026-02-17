import type { AuthClaims, Env } from "../types";
import { HttpError } from "../domain/errors";
import { verifyFirebaseToken } from "./verifyFirebaseToken";

export async function requireAuth(request: Request, env: Env): Promise<AuthClaims> {
  const authHeader = request.headers.get("Authorization") || "";
  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    throw new HttpError(401, "UNAUTHORIZED", "Missing Authorization bearer token");
  }

  return verifyFirebaseToken(token, env);
}
