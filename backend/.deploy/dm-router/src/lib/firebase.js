const JWKS_URL = new URL(
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'
);

let jwksClient;

async function getJwksClient() {
  if (jwksClient) return jwksClient;
  const { createRemoteJWKSet } = await import('jose');
  jwksClient = createRemoteJWKSet(JWKS_URL);
  return jwksClient;
}

async function verifyFirebaseToken(idToken, projectId) {
  if (!projectId) {
    throw new Error('FIREBASE_PROJECT_ID is not set');
  }
  const { jwtVerify } = await import('jose');
  const jwks = await getJwksClient();
  const issuer = `https://securetoken.google.com/${projectId}`;

  const { payload } = await jwtVerify(idToken, jwks, {
    audience: projectId,
    issuer
  });

  return {
    uid: payload.user_id || payload.sub,
    email: payload.email || null,
    name: payload.name || payload.email || null,
    raw: payload
  };
}

module.exports = { verifyFirebaseToken };
