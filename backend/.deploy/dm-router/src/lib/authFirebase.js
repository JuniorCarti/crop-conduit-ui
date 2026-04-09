const { verifyFirebaseToken } = require('./firebase');

function getBearerToken(event) {
  const header = event?.headers?.authorization || event?.headers?.Authorization;
  if (!header || !header.startsWith('Bearer ')) {
    const error = new Error('Missing Authorization header');
    error.statusCode = 401;
    throw error;
  }
  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    const error = new Error('Missing bearer token');
    error.statusCode = 401;
    throw error;
  }
  return token;
}

async function authenticateRequest(event) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    const error = new Error('FIREBASE_PROJECT_ID is not configured');
    error.statusCode = 500;
    throw error;
  }

  const token = getBearerToken(event);
  let claims;
  try {
    claims = await verifyFirebaseToken(token, projectId);
  } catch (cause) {
    const error = new Error('Invalid or expired Firebase token');
    error.statusCode = 401;
    error.cause = cause;
    throw error;
  }

  let userContext = null;
  try {
    const { getUserContext } = require('./firestoreClient');
    userContext = await getUserContext(claims.uid);
  } catch (cause) {
    console.warn(
      '[Auth] Firestore user context lookup failed; continuing with Firebase claims only',
      { uid: claims.uid, message: cause?.message || String(cause) }
    );
  }

  if (!userContext) {
    userContext = {
      uid: claims.uid,
      role: typeof claims.role === 'string' ? claims.role : null,
      orgId: typeof claims.orgId === 'string' ? claims.orgId : null,
      orgType: typeof claims.orgType === 'string' ? claims.orgType : null,
      email: claims.email || null,
      displayName: claims.name || null
    };
  }

  return {
    uid: claims.uid,
    email: claims.email,
    name: claims.name,
    role: userContext.role,
    orgId: userContext.orgId,
    orgType: userContext.orgType,
    userContext
  };
}

module.exports = {
  authenticateRequest
};
