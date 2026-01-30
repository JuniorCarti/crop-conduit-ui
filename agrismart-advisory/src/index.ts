type Env = {
  FIREBASE_PROJECT_ID: string;
  FIREBASE_WEB_API_KEY: string;
  FIREBASE_SERVICE_ACCOUNT_JSON?: string;
  ALLOWED_ORIGINS: string;
  ASHA_DB: D1Database;
  AI?: {
    run: (model: string, input: { messages: ChatMessage[] }) => Promise<{ response?: string }>;
  };
};

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type FirestoreDoc = {
  name: string;
  fields?: Record<string, any>;
  createTime?: string;
  updateTime?: string;
};

type ServiceAccount = {
  client_email: string;
  private_key: string;
};

type SessionState = {
  language?: "en" | "sw";
  stage?: "chat" | "collect_profile" | "confirm_checkout";
  lastIntent?: "general" | "marketplace" | "climate" | "orders" | "profile";
  lastListingId?: string | null;
  lastFarmId?: string | null;
  pendingAction?: "checkout" | null;
  profileDraft?: Record<string, any> | null;
};

type ActionPayload =
  | { type: "NAVIGATE"; to: string }
  | { type: "OPEN_LISTING"; listingId: string }
  | { type: "ADD_TO_CART"; listing: Record<string, any> }
  | { type: "OPEN_CART" }
  | { type: "CHECKOUT" }
  | { type: "PREFILL_CHECKOUT"; buyer: Record<string, any> };

type ClientContext = {
  activeFarmId?: string;
  activeTab?: "marketplace" | "climate" | "asha" | "orders" | "profile";
  cartCount?: number;
};

type ListingMatch = {
  listing: Record<string, any>;
  score: number;
};

const FIRESTORE_SCOPE = "https://www.googleapis.com/auth/datastore";
const FIRESTORE_BASE_URL = "https://firestore.googleapis.com/v1/projects";
const OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
const SECURETOKEN_JWK_URL =
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";
const WEATHER_PROXY_URL = "https://agrismart-weather-proxy.ridgejunior204.workers.dev/";

const MAX_MESSAGE_LENGTH = 4000;
const HISTORY_LIMIT = 20;
const ASHA_MODEL = "@cf/meta/llama-3.1-8b-instruct";
const ASHA_SYSTEM_PROMPT = "You are Asha, AgriSmart's farming assistant. Be concise and helpful.";

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

let cachedAccessToken: { token: string; expiresAt: number } | null = null;
let cachedServiceAccount: ServiceAccount | null = null;
let cachedJwks: { keys: JsonWebKey[]; expiresAt: number } | null = null;

function parseAllowedOrigins(env: Env): string[] {
  return (env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function isOriginAllowed(origin: string | null, allowed: string[]): boolean {
  if (!origin) return true;
  return allowed.includes(origin);
}

function getCorsHeaders(request: Request, env: Env): HeadersInit {
  const origin = request.headers.get("Origin") ?? "";
  const allowed = parseAllowedOrigins(env);
  const allowOrigin = origin && allowed.includes(origin) ? origin : "null";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  };
}

function jsonResponse(request: Request, env: Env, body: unknown, status = 200): Response {
  const headers = {
    "Content-Type": "application/json",
    ...getCorsHeaders(request, env),
  };
  return new Response(JSON.stringify(body), { status, headers });
}

async function readJson(request: Request): Promise<any> {
  try {
    return await request.json();
  } catch {
    throw new HttpError(400, "Invalid JSON body");
  }
}

function assertString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new HttpError(400, `${field} must be a string`);
  }
  const trimmed = value.trim();
  if (!trimmed) {
    throw new HttpError(400, `${field} is required`);
  }
  return trimmed;
}

function assertMessage(value: unknown): string {
  const message = assertString(value, "message");
  if (message.length > MAX_MESSAGE_LENGTH) {
    throw new HttpError(400, `message must be at most ${MAX_MESSAGE_LENGTH} characters`);
  }
  return message;
}

function assertOptionalString(value: unknown, field: string): string | null {
  if (value == null) return null;
  if (typeof value !== "string") {
    throw new HttpError(400, `${field} must be a string`);
  }
  const trimmed = value.trim();
  return trimmed || null;
}

function safeContext(value: unknown): Record<string, any> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, any>;
}

function nowMs(): number {
  return Date.now();
}

function base64UrlDecodeToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (padded.length % 4)) % 4;
  const normalized = padded + "=".repeat(padLength);
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function parseJwt(token: string): { header: any; payload: any; data: Uint8Array; signature: Uint8Array } {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new HttpError(401, "Invalid token format");
  }
  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  let header: any;
  let payload: any;
  try {
    header = JSON.parse(new TextDecoder().decode(base64UrlDecodeToBytes(encodedHeader)));
    payload = JSON.parse(new TextDecoder().decode(base64UrlDecodeToBytes(encodedPayload)));
  } catch {
    throw new HttpError(401, "Invalid token payload");
  }
  const data = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`);
  const signature = base64UrlDecodeToBytes(encodedSignature);
  return { header, payload, data, signature };
}

async function getSecureTokenJwks(): Promise<JsonWebKey[]> {
  if (cachedJwks && cachedJwks.expiresAt > Date.now()) {
    return cachedJwks.keys;
  }
  const response = await fetch(SECURETOKEN_JWK_URL);
  if (!response.ok) {
    throw new HttpError(500, "Failed to fetch token certificates");
  }
  const cacheControl = response.headers.get("Cache-Control") || "";
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/i);
  const maxAgeSeconds = maxAgeMatch ? Number(maxAgeMatch[1]) : 3600;
  const body = await response.json<any>();
  const keys = Array.isArray(body?.keys) ? (body.keys as JsonWebKey[]) : [];
  cachedJwks = {
    keys,
    expiresAt: Date.now() + maxAgeSeconds * 1000,
  };
  return keys;
}

async function verifyFirebaseToken(request: Request, env: Env): Promise<{ uid: string }>{
  const auth = request.headers.get("Authorization") || "";
  const [scheme, token] = auth.split(" ");
  if (scheme !== "Bearer" || !token) {
    throw new HttpError(401, "Missing Authorization bearer token");
  }
  if (!env.FIREBASE_PROJECT_ID) {
    throw new HttpError(500, "FIREBASE_PROJECT_ID is not configured");
  }
  const { header, payload, data, signature } = parseJwt(token);
  if (header?.alg !== "RS256" || !header?.kid) {
    throw new HttpError(401, "Invalid token header");
  }
  const keys = await getSecureTokenJwks();
  const jwk = keys.find((item) => item.kid === header.kid);
  if (!jwk) {
    throw new HttpError(401, "Token key not found");
  }
  const cryptoKey = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const verified = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    signature,
    data,
  );
  if (!verified) {
    throw new HttpError(401, "Invalid token signature");
  }
  const issuer = `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`;
  if (payload?.iss !== issuer) {
    throw new HttpError(401, "Invalid token issuer");
  }
  if (payload?.aud !== env.FIREBASE_PROJECT_ID) {
    throw new HttpError(401, "Invalid token audience");
  }
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (typeof payload?.exp !== "number" || payload.exp < nowSeconds) {
    throw new HttpError(401, "Token expired");
  }
  const uid = payload?.user_id || payload?.sub;
  if (!uid || typeof uid !== "string") {
    throw new HttpError(401, "Invalid token subject");
  }
  return { uid };
}

function decodeValue(value: any): any {
  if (!value || typeof value !== "object") return null;
  if ("stringValue" in value) return value.stringValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return value.doubleValue;
  if ("booleanValue" in value) return value.booleanValue;
  if ("timestampValue" in value) return value.timestampValue;
  if ("nullValue" in value) return null;
  if ("mapValue" in value) {
    const fields = value.mapValue?.fields || {};
    return decodeFields(fields);
  }
  if ("arrayValue" in value) {
    const values = value.arrayValue?.values || [];
    return values.map((entry: any) => decodeValue(entry));
  }
  return value;
}

function decodeFields(fields: Record<string, any>): Record<string, any> {
  const output: Record<string, any> = {};
  for (const [key, value] of Object.entries(fields || {})) {
    output[key] = decodeValue(value);
  }
  return output;
}

function encodeValue(value: any): any {
  if (value === null) return { nullValue: null };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") {
    if (Number.isInteger(value)) return { integerValue: value.toString() };
    return { doubleValue: value };
  }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map((entry) => encodeValue(entry)) } };
  }
  if (value && typeof value === "object" && "timestampValue" in value) {
    return { timestampValue: value.timestampValue };
  }
  if (value && typeof value === "object") {
    return { mapValue: { fields: encodeFields(value as Record<string, any>) } };
  }
  return { nullValue: null };
}

function encodeFields(input: Record<string, any>): Record<string, any> {
  const fields: Record<string, any> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    fields[key] = encodeValue(value);
  }
  return fields;
}

function base64UrlEncode(input: ArrayBuffer | Uint8Array | string): string {
  let bytes: Uint8Array;
  if (typeof input === "string") {
    bytes = new TextEncoder().encode(input);
  } else if (input instanceof ArrayBuffer) {
    bytes = new Uint8Array(input);
  } else {
    bytes = input;
  }
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const clean = pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s+/g, "");
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function getServiceAccount(env: Env): Promise<ServiceAccount> {
  if (cachedServiceAccount) return cachedServiceAccount;
  if (!env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    throw new HttpError(500, "FIREBASE_SERVICE_ACCOUNT_JSON is not configured");
  }
  let parsed: ServiceAccount;
  try {
    parsed = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON);
  } catch {
    throw new HttpError(500, "FIREBASE_SERVICE_ACCOUNT_JSON is invalid JSON");
  }
  if (!parsed.client_email || !parsed.private_key) {
    throw new HttpError(500, "Service account is missing client_email or private_key");
  }
  cachedServiceAccount = {
    client_email: parsed.client_email,
    private_key: parsed.private_key,
  };
  return cachedServiceAccount;
}

async function signJwt(env: Env): Promise<string> {
  const serviceAccount = await getServiceAccount(env);
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    scope: FIRESTORE_SCOPE,
    aud: OAUTH_TOKEN_URL,
    iat: now,
    exp: now + 3600,
  };
  const header = { alg: "RS256", typ: "JWT" };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;
  const keyData = pemToArrayBuffer(serviceAccount.private_key);
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    keyData,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(data),
  );
  return `${data}.${base64UrlEncode(signature)}`;
}

async function getAccessToken(env: Env): Promise<string> {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now()) {
    return cachedAccessToken.token;
  }
  const assertion = await signJwt(env);
  const form = new URLSearchParams();
  form.set("grant_type", "urn:ietf:params:oauth:grant-type:jwt-bearer");
  form.set("assertion", assertion);
  const response = await fetch(OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new HttpError(500, `Failed to get access token: ${text}`);
  }
  const data = await response.json<any>();
  const token = data.access_token;
  const expiresIn = Number(data.expires_in || 3600);
  if (!token) {
    throw new HttpError(500, "OAuth response missing access_token");
  }
  const safety = 600;
  const ttl = Math.max(0, Math.min(expiresIn - safety, 3000));
  cachedAccessToken = {
    token,
    expiresAt: Date.now() + ttl * 1000,
  };
  return token;
}

async function firestoreRequest(
  env: Env,
  method: string,
  path: string,
  body?: any,
  queryParams?: URLSearchParams,
): Promise<any> {
  if (!env.FIREBASE_PROJECT_ID) {
    throw new HttpError(500, "FIREBASE_PROJECT_ID is not configured");
  }
  const token = await getAccessToken(env);
  const url = new URL(
    `${FIRESTORE_BASE_URL}/${encodeURIComponent(env.FIREBASE_PROJECT_ID)}/databases/(default)/documents/${path}`,
  );
  if (queryParams) {
    queryParams.forEach((value, key) => url.searchParams.append(key, value));
  }
  const response = await fetch(url.toString(), {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  if (!response.ok) {
    let message = text;
    try {
      const parsed = JSON.parse(text);
      message = parsed.error?.message || text;
    } catch {
      // keep text
    }
    throw new HttpError(response.status, message || "Firestore request failed");
  }
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function firestoreRunQuery(env: Env, structuredQuery: Record<string, any>): Promise<FirestoreDoc[]> {
  if (!env.FIREBASE_PROJECT_ID) {
    throw new HttpError(500, "FIREBASE_PROJECT_ID is not configured");
  }
  const token = await getAccessToken(env);
  const url = `${FIRESTORE_BASE_URL}/${encodeURIComponent(env.FIREBASE_PROJECT_ID)}/databases/(default)/documents:runQuery`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ structuredQuery }),
  });
  const text = await response.text();
  if (!response.ok) {
    let message = text;
    try {
      const parsed = JSON.parse(text);
      message = parsed.error?.message || text;
    } catch {
      // keep text
    }
    throw new HttpError(response.status, message || "Firestore query failed");
  }
  if (!text) return [];
  let data: any[] = [];
  try {
    data = JSON.parse(text);
  } catch {
    return [];
  }
  const docs: FirestoreDoc[] = [];
  for (const entry of data) {
    if (entry && entry.document) {
      docs.push(entry.document as FirestoreDoc);
    }
  }
  return docs;
}

async function getDocument(env: Env, path: string): Promise<FirestoreDoc | null> {
  try {
    return await firestoreRequest(env, "GET", path);
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) return null;
    throw error;
  }
}

async function queryCollection(env: Env, collectionId: string, filters: any[], limit = 10): Promise<FirestoreDoc[]> {
  const where = filters.length === 1
    ? filters[0]
    : { compositeFilter: { op: "AND", filters } };
  const structuredQuery = {
    from: [{ collectionId }],
    where,
    limit,
  };
  return firestoreRunQuery(env, structuredQuery);
}

async function saveSessionState(env: Env, sessionId: string, uid: string, state: SessionState): Promise<void> {
  if (!env.ASHA_DB) return;
  const now = nowMs();
  try {
    const existing = await env.ASHA_DB.prepare(
      "SELECT uid FROM sessions WHERE sessionId = ? LIMIT 1",
    )
      .bind(sessionId)
      .first<{ uid: string }>();
    if (existing && existing.uid !== uid) {
      throw new HttpError(403, "Session not found");
    }
    const payload = JSON.stringify(state || {});
    await env.ASHA_DB.prepare(
      "INSERT INTO sessions (sessionId, uid, updatedAt, stateJson) VALUES (?, ?, ?, ?) ON CONFLICT(sessionId) DO UPDATE SET updatedAt = excluded.updatedAt, stateJson = excluded.stateJson",
    )
      .bind(sessionId, uid, now, payload)
      .run();
  } catch (error) {
    if (error instanceof HttpError) throw error;
  }
}

async function loadSessionState(env: Env, sessionId: string, uid: string): Promise<SessionState> {
  if (!env.ASHA_DB) return { stage: "chat" };
  try {
    const row = await env.ASHA_DB.prepare(
      "SELECT uid, stateJson FROM sessions WHERE sessionId = ? LIMIT 1",
    )
      .bind(sessionId)
      .first<{ uid: string; stateJson: string | null }>();
    if (!row) {
      return { stage: "chat" };
    }
    if (row.uid !== uid) {
      throw new HttpError(403, "Session not found");
    }
    if (!row.stateJson) return { stage: "chat" };
    const parsed = JSON.parse(row.stateJson);
    if (!parsed || typeof parsed !== "object") return { stage: "chat" };
    return parsed as SessionState;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    return { stage: "chat" };
  }
}

async function saveMessage(
  env: Env,
  sessionId: string,
  uid: string,
  role: "user" | "asha",
  text: string,
): Promise<void> {
  if (!env.ASHA_DB) return;
  try {
    await env.ASHA_DB.prepare(
      "INSERT INTO messages (sessionId, uid, role, text, createdAt) VALUES (?, ?, ?, ?, ?)",
    )
      .bind(sessionId, uid, role, text, nowMs())
      .run();
  } catch {
    // ignore D1 failures
  }
}

async function loadConversation(
  env: Env,
  sessionId: string,
  uid: string,
  limit = HISTORY_LIMIT,
): Promise<{ role: "user" | "assistant"; content: string }[]> {
  if (!env.ASHA_DB) return [];
  try {
    const result = await env.ASHA_DB.prepare(
      "SELECT role, text, createdAt FROM messages WHERE sessionId = ? AND uid = ? ORDER BY createdAt DESC LIMIT ?",
    )
      .bind(sessionId, uid, limit)
      .all<{ role: string; text: string; createdAt: number }>();
    const rows = result.results ?? [];
    return rows
      .reverse()
      .map((row) => ({
        role: row.role === "user" ? "user" : "assistant",
        content: row.text,
      }));
  } catch {
    return [];
  }
}

function detectIntent(message: string, clientContext: ClientContext | null, state: SessionState): SessionState["lastIntent"] {
  const lowered = message.toLowerCase();
  if (clientContext?.activeTab === "marketplace") return "marketplace";
  if (clientContext?.activeTab === "climate") return "climate";
  if (clientContext?.activeTab === "orders") return "orders";
  if (clientContext?.activeTab === "profile") return "profile";

  if (/(market|marketplace|buy|sell|listing|listings|price)/i.test(lowered)) return "marketplace";
  if (/(climate|weather|forecast|rain|temperature)/i.test(lowered)) return "climate";
  if (/(order|checkout|cart|purchase|pay)/i.test(lowered)) return "orders";
  if (/(profile|account|phone|name|county|ward|address)/i.test(lowered)) return "profile";
  return state.lastIntent || "general";
}

const cropKeywords = [
  "tomato",
  "maize",
  "beans",
  "onion",
  "potato",
  "cabbage",
  "kale",
  "sukuma",
  "rice",
  "wheat",
  "banana",
  "avocado",
  "mango",
];

function extractCropKeyword(message: string): string | null {
  const lowered = message.toLowerCase();
  for (const keyword of cropKeywords) {
    if (lowered.includes(keyword)) return keyword;
  }
  return null;
}

function normalizeListing(doc: FirestoreDoc): Record<string, any> {
  const data = doc.fields ? decodeFields(doc.fields) : {};
  const location = data.location || {};
  const images = Array.isArray(data.photoUrls)
    ? data.photoUrls
    : Array.isArray(data.images)
      ? data.images
      : [];
  return {
    id: doc.name ? doc.name.split("/").pop() : "",
    title: data.title ?? "",
    cropType: data.cropType ?? data.cropName ?? "",
    quantity: Number(data.quantity ?? 0),
    unit: data.unit ?? "kg",
    pricePerUnit: Number(data.pricePerUnit ?? data.price ?? 0),
    currency: data.currency ?? "KES",
    phoneNumber: data.phoneNumber ?? data.phone ?? "",
    location: {
      county: data.county ?? location.county ?? "",
      address: data.address ?? location.address ?? "",
      lat: Number(location.lat ?? data.lat ?? 0),
      lng: Number(location.lng ?? location.lon ?? data.lng ?? data.lon ?? 0),
      lon: Number(location.lon ?? data.lon ?? 0),
    },
    images,
    sellerId: data.sellerId ?? "",
    sellerName: data.sellerName ?? "",
    status: data.status ?? "active",
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  };
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function rankListings(listings: Record<string, any>[], cropKeyword: string | null, farmCoords?: { lat: number; lon: number }): ListingMatch[] {
  return listings.map((listing) => {
    let score = 0;
    const title = String(listing.title || "").toLowerCase();
    const cropType = String(listing.cropType || "").toLowerCase();
    if (cropKeyword && (title.includes(cropKeyword) || cropType.includes(cropKeyword))) {
      score += 50;
    }
    const lat = Number(listing.location?.lat ?? listing.location?.lng ?? 0);
    const lon = Number(listing.location?.lon ?? listing.location?.lng ?? 0);
    if (farmCoords && Number.isFinite(lat) && Number.isFinite(lon) && lat !== 0 && lon !== 0) {
      const dist = haversineKm(farmCoords.lat, farmCoords.lon, lat, lon);
      score += Math.max(0, 30 - dist);
    }
    if (listing.updatedAt) {
      score += 5;
    }
    return { listing, score };
  }).sort((a, b) => b.score - a.score);
}

function parseYesNo(message: string): "yes" | "no" | null {
  const lowered = message.trim().toLowerCase();
  if (["yes", "y", "ndio"].includes(lowered)) return "yes";
  if (["no", "n", "hapana"].includes(lowered)) return "no";
  return null;
}

async function handleLogisticsRoute(request: Request, env: Env): Promise<Response> {
  await verifyFirebaseToken(request, env);
  if (!env.ASHA_DB) {
    return jsonResponse(request, env, { ok: false, error: "D1 database not configured" }, 500);
  }

  const url = new URL(request.url);
  const crop = (url.searchParams.get("crop") || "").trim();
  const origin = (url.searchParams.get("origin") || "").trim();
  const destination = (url.searchParams.get("destination") || "").trim();

  if (!crop || !origin || !destination) {
    return jsonResponse(
      request,
      env,
      { ok: false, error: "crop, origin, and destination are required" },
      400,
    );
  }

  const row = await env.ASHA_DB.prepare(
    "SELECT id, crop, origin, destination, distance_km as distanceKm, recommended_vehicle as recommendedVehicle, estimated_cost_kes as estimatedCostKes, risk_level as riskLevel, departure_window as departureWindow, notes FROM logistics_routes WHERE lower(crop) = lower(?) AND lower(origin) = lower(?) AND lower(destination) = lower(?) LIMIT 1",
  )
    .bind(crop, origin, destination)
    .first<Record<string, any>>();

  if (!row) {
    return jsonResponse(
      request,
      env,
      { ok: false, error: "No transport data available for this route", data: null },
      404,
    );
  }

  return jsonResponse(request, env, { ok: true, data: row });
}

function extractBuyerInfo(message: string): Record<string, any> {
  const info: Record<string, any> = {};
  const phoneMatch = message.match(/(\+?\d{10,13})/);
  if (phoneMatch) info.phone = phoneMatch[1];
  const nameMatch = message.match(/(?:name is|i am|i'm)\s+([a-zA-Z\s]{3,40})/i);
  if (nameMatch) info.fullName = nameMatch[1].trim();
  const countyMatch = message.match(/county\s*[:\-]?\s*([a-zA-Z\s]{2,40})/i);
  if (countyMatch) info.county = countyMatch[1].trim();
  const wardMatch = message.match(/ward\s*[:\-]?\s*([a-zA-Z\s]{2,40})/i);
  if (wardMatch) info.ward = wardMatch[1].trim();
  const addressMatch = message.match(/address\s*[:\-]?\s*([^\n\r]+)/i);
  if (addressMatch) info.address = addressMatch[1].trim();
  return info;
}

function mergeProfile(base: Record<string, any>, patch: Record<string, any>): Record<string, any> {
  return {
    fullName: patch.fullName ?? base.fullName ?? "",
    phone: patch.phone ?? base.phone ?? "",
    county: patch.county ?? base.county ?? "",
    ward: patch.ward ?? base.ward ?? "",
    address: patch.address ?? base.address ?? "",
  };
}

function missingProfileFields(profile: Record<string, any>): string[] {
  const missing: string[] = [];
  if (!profile.fullName) missing.push("name");
  if (!profile.phone) missing.push("phone");
  if (!profile.county) missing.push("county");
  if (!profile.ward) missing.push("ward");
  if (!profile.address) missing.push("address");
  return missing;
}

async function fetchForecast(lat: number, lon: number): Promise<any | null> {
  const url = new URL(WEATHER_PROXY_URL);
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("days", "7");
  const response = await fetch(url.toString());
  if (!response.ok) return null;
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function loadListings(env: Env, status = "active", limit = 20): Promise<Record<string, any>[]> {
  const filters = [
    {
      fieldFilter: {
        field: { fieldPath: "status" },
        op: "EQUAL",
        value: { stringValue: status },
      },
    },
  ];
  const docs = await queryCollection(env, "listings", filters, limit);
  return docs.map(normalizeListing);
}

async function loadFarmerProfile(env: Env, uid: string): Promise<Record<string, any> | null> {
  const doc = await getDocument(env, `farmers/${uid}`);
  if (!doc?.fields) return null;
  const data = decodeFields(doc.fields);
  return {
    fullName: data.fullName ?? data.name ?? "",
    phone: data.phone ?? "",
    county: data.county ?? "",
    ward: data.ward ?? "",
    address: data.address ?? data.constituency ?? data.town ?? "",
  };
}

async function loadFarms(env: Env, uid: string, limit = 5): Promise<Record<string, any>[]> {
  const filters = [
    {
      fieldFilter: {
        field: { fieldPath: "uid" },
        op: "EQUAL",
        value: { stringValue: uid },
      },
    },
  ];
  const docs = await queryCollection(env, "farms", filters, limit);
  return docs.map((doc) => {
    const data = doc.fields ? decodeFields(doc.fields) : {};
    return {
      id: doc.name ? doc.name.split("/").pop() : "",
      name: data.name ?? "",
      lat: Number(data.lat ?? 0),
      lon: Number(data.lon ?? 0),
      uid: data.uid ?? "",
    };
  });
}

function buildReply(language: "en" | "sw", text: string): string {
  if (language === "sw") return text;
  return text;
}

async function generateAshaReply(
  env: Env,
  history: { role: "user" | "assistant"; content: string }[],
  message: string,
  language: "en" | "sw",
  fallback: string,
): Promise<string> {
  if (!env.AI?.run) return fallback;
  const system = `${ASHA_SYSTEM_PROMPT} Reply in ${language === "sw" ? "Swahili" : "English"}.`;
  const messages: ChatMessage[] = [
    { role: "system", content: system },
    ...history,
    { role: "user", content: message },
  ];
  try {
    const response = await env.AI.run(ASHA_MODEL, { messages });
    const text = response?.response?.trim();
    return text || fallback;
  } catch {
    return fallback;
  }
}

async function handleChat(request: Request, env: Env): Promise<Response> {
  const { uid } = await verifyFirebaseToken(request, env);
  const body = await readJson(request);
  const sessionId = assertString(body?.sessionId, "sessionId");
  const message = assertMessage(body?.message ?? "");
  const language = (assertOptionalString(body?.language, "language") || "en") as "en" | "sw";
  const clientContext = safeContext(body?.clientContext) as ClientContext | null;

  let state = await loadSessionState(env, sessionId, uid);
  state = { ...state, language };

  await saveMessage(env, sessionId, uid, "user", message);
  const history = await loadConversation(env, sessionId, uid, HISTORY_LIMIT);

  const confirm = parseYesNo(message);
  if (state.pendingAction === "checkout" && state.stage === "confirm_checkout" && confirm) {
    if (confirm === "yes") {
      state = { ...state, pendingAction: null, stage: "chat", lastIntent: "orders" };
      await saveSessionState(env, sessionId, uid, state);
      const reply = buildReply(language, "Great. Taking you to checkout now.");
      await saveMessage(env, sessionId, uid, "asha", reply);
      return jsonResponse(request, env, {
        ok: true,
        reply,
        intent: "orders",
        actions: [{ type: "OPEN_CART" }, { type: "CHECKOUT" }],
        uiHint: { navigateTo: "/checkout" },
        memory: state,
      });
    }
    state = { ...state, pendingAction: null, stage: "chat" };
    await saveSessionState(env, sessionId, uid, state);
    const reply = buildReply(language, "Okay, I will not proceed with checkout.");
    await saveMessage(env, sessionId, uid, "asha", reply);
    return jsonResponse(request, env, {
      ok: true,
      reply,
      intent: state.lastIntent || "general",
      actions: [],
      uiHint: null,
      memory: state,
    });
  }

  const intent = detectIntent(message, clientContext, state);
  const actions: ActionPayload[] = [];
  let uiHint: { navigateTo?: string; highlightId?: string } | null = null;
  let reply = buildReply(language, "How can I help you today?");

  if (state.stage === "collect_profile") {
    const farmerProfile = await loadFarmerProfile(env, uid).catch(() => null);
    const draft = mergeProfile(farmerProfile || {}, state.profileDraft || {});
    const extracted = extractBuyerInfo(message);
    const merged = mergeProfile(draft, extracted);
    const missing = missingProfileFields(merged);
    if (missing.length > 0) {
      state = { ...state, profileDraft: merged, stage: "collect_profile" };
      reply = buildReply(
        language,
        `Please share your ${missing.join(", ")} so I can proceed.`
      );
    } else {
      actions.push({ type: "PREFILL_CHECKOUT", buyer: merged });
      state = { ...state, profileDraft: null, stage: "confirm_checkout", pendingAction: "checkout" };
      reply = buildReply(language, "Thanks. I have your details. Confirm checkout YES/NO.");
    }
    state.lastIntent = "profile";
    await saveSessionState(env, sessionId, uid, state);
    await saveMessage(env, sessionId, uid, "asha", reply);
    return jsonResponse(request, env, {
      ok: true,
      reply,
      intent: "profile",
      actions,
      uiHint,
      memory: state,
    });
  }

  if (intent === "marketplace") {
    const listings = await loadListings(env).catch(() => []);
    const cropKeyword = extractCropKeyword(message);
    const farmId = clientContext?.activeFarmId || state.lastFarmId || null;
    let farmCoords: { lat: number; lon: number } | undefined;
    if (farmId) {
      const farmDoc = await getDocument(env, `farms/${farmId}`);
      const farmData = farmDoc?.fields ? decodeFields(farmDoc.fields) : null;
      if (farmData && farmData.uid === uid && typeof farmData.lat === "number" && typeof farmData.lon === "number") {
        farmCoords = { lat: farmData.lat, lon: farmData.lon };
      }
    }
    const ranked = rankListings(listings, cropKeyword, farmCoords);
    const best = ranked.length ? ranked[0].listing : null;

    actions.push({ type: "NAVIGATE", to: "/marketplace" });
    uiHint = { navigateTo: "/marketplace" };

    if (/add to cart|add cart|cart/i.test(message) && best) {
      actions.push({ type: "OPEN_LISTING", listingId: best.id });
      actions.push({ type: "ADD_TO_CART", listing: best });
      reply = buildReply(language, `Added ${best.title} to your cart.`);
      state.lastListingId = best.id;
    } else if (cropKeyword && best) {
      actions.push({ type: "OPEN_LISTING", listingId: best.id });
      reply = buildReply(language, `Here is a ${best.title} listing you can review.`);
      state.lastListingId = best.id;
    } else {
      reply = buildReply(language, "Here are the latest marketplace listings.");
    }

    state.lastIntent = "marketplace";
    await saveSessionState(env, sessionId, uid, state);
    await saveMessage(env, sessionId, uid, "asha", reply);

    return jsonResponse(request, env, {
      ok: true,
      reply,
      intent: "marketplace",
      actions,
      uiHint,
      memory: state,
    });
  }

  if (intent === "climate") {
    const farmId = clientContext?.activeFarmId || state.lastFarmId || null;
    let farm: Record<string, any> | null = null;
    if (farmId) {
      const farmDoc = await getDocument(env, `farms/${farmId}`);
      const farmData = farmDoc?.fields ? decodeFields(farmDoc.fields) : null;
      if (farmData && farmData.uid === uid) {
        farm = {
          id: farmId,
          lat: farmData.lat,
          lon: farmData.lon,
        };
      }
    }
    if (!farm) {
      const farms = await loadFarms(env, uid).catch(() => []);
      farm = farms.length ? farms[0] : null;
    }
    if (farm && typeof farm.lat === "number" && typeof farm.lon === "number") {
      const forecast = await fetchForecast(farm.lat, farm.lon);
      reply = forecast
        ? buildReply(language, "I fetched the 7-day forecast for your farm. Opening Climate.")
        : buildReply(language, "I could not fetch the forecast yet, but I can open Climate.");
      actions.push({ type: "NAVIGATE", to: "/climate" });
      uiHint = { navigateTo: "/climate" };
      state.lastFarmId = farm.id || farmId || state.lastFarmId || null;
    } else {
      reply = buildReply(language, "Please select a farm so I can fetch climate insights.");
    }

    state.lastIntent = "climate";
    await saveSessionState(env, sessionId, uid, state);
    await saveMessage(env, sessionId, uid, "asha", reply);

    return jsonResponse(request, env, {
      ok: true,
      reply,
      intent: "climate",
      actions,
      uiHint,
      memory: state,
    });
  }

  if (intent === "orders") {
    const farmerProfile = await loadFarmerProfile(env, uid).catch(() => null);
    const draft = mergeProfile(farmerProfile || {}, state.profileDraft || {});
    const missing = missingProfileFields(draft);

    if (missing.length > 0) {
      state = { ...state, stage: "collect_profile", profileDraft: draft, lastIntent: "orders" };
      reply = buildReply(language, `Please share your ${missing.join(", ")} to proceed to checkout.`);
    } else {
      state = { ...state, stage: "confirm_checkout", pendingAction: "checkout", lastIntent: "orders" };
      reply = buildReply(language, "I am ready to take you to checkout. Confirm YES/NO.");
    }

    await saveSessionState(env, sessionId, uid, state);
    await saveMessage(env, sessionId, uid, "asha", reply);

    return jsonResponse(request, env, {
      ok: true,
      reply,
      intent: "orders",
      actions,
      uiHint,
      memory: state,
    });
  }

  if (intent === "profile") {
    const farmerProfile = await loadFarmerProfile(env, uid).catch(() => null);
    if (farmerProfile) {
      reply = buildReply(
        language,
        `Your profile has ${farmerProfile.fullName || "your name"} and ${farmerProfile.phone || "no phone"}.`
      );
    } else {
      reply = buildReply(language, "I could not find your profile yet. Tell me your name, phone, county, ward, and address.");
      state = { ...state, stage: "collect_profile" };
    }
    state.lastIntent = "profile";
    await saveSessionState(env, sessionId, uid, state);
    await saveMessage(env, sessionId, uid, "asha", reply);

    return jsonResponse(request, env, {
      ok: true,
      reply,
      intent: "profile",
      actions,
      uiHint,
      memory: state,
    });
  }

  state.lastIntent = "general";
  reply = await generateAshaReply(env, history, message, language, reply);
  await saveSessionState(env, sessionId, uid, state);
  await saveMessage(env, sessionId, uid, "asha", reply);

  return jsonResponse(request, env, {
    ok: true,
    reply,
    intent: "general",
    actions,
    uiHint,
    memory: state,
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const allowedOrigins = parseAllowedOrigins(env);
    const origin = request.headers.get("Origin");
    const originAllowed = isOriginAllowed(origin, allowedOrigins);

    if (request.method === "OPTIONS") {
      const status = originAllowed ? 204 : 403;
      return new Response(null, { status, headers: getCorsHeaders(request, env) });
    }

    if (!originAllowed) {
      return jsonResponse(request, env, { ok: false, error: "Origin not allowed" }, 403);
    }

    try {
      if (request.method === "POST" && url.pathname === "/asha/chat") {
        return await handleChat(request, env);
      }

      if (request.method === "GET" && url.pathname === "/logistics") {
        return await handleLogisticsRoute(request, env);
      }

      return jsonResponse(request, env, { ok: false, error: "Not found" }, 404);
    } catch (error) {
      if (error instanceof HttpError) {
        return jsonResponse(request, env, { ok: false, error: error.message }, error.status);
      }
      return jsonResponse(request, env, { ok: false, error: "Internal server error" }, 500);
    }
  },
};
