import { createRemoteJWKSet, jwtVerify } from "jose";
import type { AuthClaims, Env } from "../types";
import { HttpError } from "../domain/errors";

const SECURETOKEN_JWKS_URL = new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com");

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

const getJwks = () => {
  if (!jwks) {
    jwks = createRemoteJWKSet(SECURETOKEN_JWKS_URL);
  }
  return jwks;
};

export async function verifyFirebaseToken(token: string, env: Env): Promise<AuthClaims> {
  const projectId = env.FIREBASE_PROJECT_ID;
  if (!projectId) throw new HttpError(500, "CONFIG_ERROR", "Missing FIREBASE_PROJECT_ID");

  try {
    const { payload } = await jwtVerify(token, getJwks(), {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });

    const uid = typeof payload.sub === "string" ? payload.sub : null;
    if (!uid) {
      throw new HttpError(401, "INVALID_TOKEN", "Token missing subject");
    }

    return {
      uid,
      email: typeof payload.email === "string" ? payload.email : undefined,
      emailVerified: typeof payload.email_verified === "boolean" ? payload.email_verified : undefined,
      claims: payload as Record<string, unknown>,
    };
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(401, "INVALID_TOKEN", "Invalid or expired Firebase token");
  }
}
