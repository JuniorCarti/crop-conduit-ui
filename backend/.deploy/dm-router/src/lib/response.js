const DEFAULT_ALLOWED_HEADERS =
  'authorization,content-type,x-requested-with,accept,origin';
const DEFAULT_ALLOWED_METHODS = 'OPTIONS,GET,POST,PUT,DELETE';
const DEFAULT_EXPOSE_HEADERS = 'content-type,content-length';
const DEFAULT_ALLOWED_ORIGIN = 'http://localhost:8080';
const DEFAULT_MAX_AGE = '600';

function getAllowedOrigins() {
  const raw = process.env.ALLOWED_ORIGINS || '';
  return raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function resolveOrigin(requestOrigin) {
  const allowed = getAllowedOrigins();
  if (!allowed.length) return DEFAULT_ALLOWED_ORIGIN;
  if (!requestOrigin) return allowed[0];
  return allowed.includes(requestOrigin) ? requestOrigin : allowed[0];
}

function isOptionsRequest(event) {
  const method =
    event?.httpMethod ||
    event?.requestContext?.http?.method ||
    event?.requestContext?.httpMethod;
  return method === 'OPTIONS';
}

function preflightResponse(event) {
  return {
    statusCode: 204,
    headers: {
      ...corsHeaders(event),
    },
    body: '',
  };
}

function corsHeaders(event) {
  const origin = event?.headers?.origin || event?.headers?.Origin;
  return {
    'Access-Control-Allow-Origin': resolveOrigin(origin),
    'Access-Control-Allow-Headers': DEFAULT_ALLOWED_HEADERS,
    'Access-Control-Allow-Methods': DEFAULT_ALLOWED_METHODS,
    'Access-Control-Expose-Headers': DEFAULT_EXPOSE_HEADERS,
    'Access-Control-Max-Age': DEFAULT_MAX_AGE,
    Vary: 'Origin'
  };
}

function jsonResponse(event, statusCode, payload) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(event)
    },
    body: JSON.stringify(payload)
  };
}

function safeJsonResponse(event, statusCode, payload) {
  try {
    return jsonResponse(event, statusCode, payload);
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(event)
      },
      body: JSON.stringify({ message: 'Internal Server Error' })
    };
  }
}

const ok = (event, payload) => safeJsonResponse(event, 200, payload);
const created = (event, payload) => safeJsonResponse(event, 201, payload);
const badRequest = (event, message, details) =>
  safeJsonResponse(event, 400, { message, details });
const unauthorized = (event, message = 'Unauthorized') =>
  safeJsonResponse(event, 401, { message });
const forbidden = (event, message = 'Forbidden') =>
  safeJsonResponse(event, 403, { message });
const notFound = (event, message = 'Not Found') =>
  safeJsonResponse(event, 404, { message });
const tooManyRequests = (event, message = 'Too Many Requests') =>
  safeJsonResponse(event, 429, { message });
const serverError = (event, message = 'Internal Server Error') =>
  safeJsonResponse(event, 500, { message });

function requireEnv(key) {
  const value = process.env[key];
  if (!value) {
    const error = new Error(`Missing env var ${key}`);
    error.statusCode = 500;
    throw error;
  }
  return value;
}

function getRegion() {
  return process.env.REGION || process.env.AWS_REGION || 'us-east-2';
}

module.exports = {
  isOptionsRequest,
  preflightResponse,
  requireEnv,
  getRegion,
  jsonResponse,
  ok,
  created,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  tooManyRequests,
  serverError
};
