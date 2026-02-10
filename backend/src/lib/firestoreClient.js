const admin = require('firebase-admin');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

const secretsClient = new SecretsManagerClient({});
let firebaseApp;
let cachedSecretName;
let cachedServiceAccount;

function decodeSecretValue(secret) {
  if (secret.SecretString) return secret.SecretString;
  if (secret.SecretBinary) {
    return Buffer.from(secret.SecretBinary, 'base64').toString('utf8');
  }
  throw new Error('Secret value is empty');
}

async function getServiceAccountFromSecret() {
  const secretArn = process.env.FIRESTORE_SERVICE_ACCOUNT_SECRET_ARN;
  if (!secretArn) {
    const error = new Error('FIRESTORE_SERVICE_ACCOUNT_SECRET_ARN is not set');
    error.statusCode = 500;
    throw error;
  }
  if (cachedServiceAccount && cachedSecretName === secretArn) {
    return cachedServiceAccount;
  }

  const secret = await secretsClient.send(
    new GetSecretValueCommand({ SecretId: secretArn })
  );
  const secretString = decodeSecretValue(secret);
  const parsed = JSON.parse(secretString);
  cachedSecretName = secretArn;
  cachedServiceAccount = parsed;
  return parsed;
}

async function getFirebaseApp() {
  if (firebaseApp) return firebaseApp;

  const serviceAccount = await getServiceAccountFromSecret();
  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id
  });
  return firebaseApp;
}

async function getFirestore() {
  const app = await getFirebaseApp();
  return app.firestore();
}

async function getUserContext(uid) {
  const db = await getFirestore();
  const snap = await db.collection('users').doc(uid).get();
  if (!snap.exists) return null;
  const data = snap.data() || {};
  return {
    uid,
    role: typeof data.role === 'string' ? data.role : null,
    orgId: typeof data.orgId === 'string' ? data.orgId : null,
    orgType: typeof data.orgType === 'string' ? data.orgType : null,
    email: typeof data.email === 'string' ? data.email : null,
    displayName: typeof data.displayName === 'string' ? data.displayName : null
  };
}

async function getOrgProfile(orgId) {
  const db = await getFirestore();
  const snap = await db.collection('orgs').doc(orgId).get();
  if (!snap.exists) return null;
  const data = snap.data() || {};
  return {
    orgId,
    orgName: typeof data.orgName === 'string' ? data.orgName : null,
    county: typeof data.county === 'string' ? data.county : null
  };
}

module.exports = {
  getFirestore,
  getUserContext,
  getOrgProfile
};

