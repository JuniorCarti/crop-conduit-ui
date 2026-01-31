const { verifyFirebaseToken } = require('../lib/firebase');

async function requireAuth(event) {
  const header = event?.headers?.authorization || event?.headers?.Authorization;
  if (!header || !header.startsWith('Bearer ')) {
    const error = new Error('Missing Authorization header');
    error.statusCode = 401;
    throw error;
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    const error = new Error('Missing token');
    error.statusCode = 401;
    throw error;
  }

  try {
    const claims = await verifyFirebaseToken(token, process.env.FIREBASE_PROJECT_ID);
    return {
      uid: claims.uid,
      email: claims.email,
      name: claims.name
    };
  } catch (err) {
    const error = new Error('Invalid or expired token');
    error.statusCode = 401;
    error.cause = err;
    throw error;
  }
}

module.exports = { requireAuth };
