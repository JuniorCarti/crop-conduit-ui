const { verifyFirebaseToken } = require('./firebase');
const { getUserContext } = require('./firestoreClient');

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

  const userContext = await getUserContext(claims.uid);
  if (!userContext) {
    const error = new Error('User profile not found in Firestore');
    error.statusCode = 403;
    throw error;
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

