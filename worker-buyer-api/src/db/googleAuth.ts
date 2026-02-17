import { SignJWT, importPKCS8 } from "jose";
import type { Env } from "../types";
import { HttpError } from "../domain/errors";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/datastore";

let cachedToken: { value: string; expMs: number } | null = null;

export async function getGoogleAccessToken(env: Env): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expMs - 60_000) {
    return cachedToken.value;
  }

  const projectId = env.FIREBASE_PROJECT_ID;
  const clientEmail = env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKeyRaw) {
    throw new HttpError(500, "CONFIG_ERROR", "Missing Firebase service account secrets");
  }

  const privateKey = privateKeyRaw.replace(/\\n/g, "\n");
  const alg = "RS256";
  const now = Math.floor(Date.now() / 1000);

  const key = await importPKCS8(privateKey, alg);
  const assertion = await new SignJWT({
    scope: SCOPE,
  })
    .setProtectedHeader({ alg, typ: "JWT" })
    .setIssuer(clientEmail)
    .setSubject(clientEmail)
    .setAudience(TOKEN_URL)
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);

  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion,
  });

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new HttpError(500, "GOOGLE_AUTH_FAILED", "Failed to obtain Google access token", text);
  }

  const json = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) {
    throw new HttpError(500, "GOOGLE_AUTH_FAILED", "Google token response missing access_token");
  }

  const expiresMs = Date.now() + (Number(json.expires_in || 3600) * 1000);
  cachedToken = { value: json.access_token, expMs: expiresMs };
  return json.access_token;
}
