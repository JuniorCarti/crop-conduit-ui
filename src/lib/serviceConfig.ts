/**
 * AgriSmart Service Configuration
 *
 * Centralized configuration for all external services, timeouts,
 * retry policies, and feature flags. Single source of truth for
 * operational parameters.
 */

// ─── API Timeouts (ms) ──────────────────────────────────────────────────────
export const TIMEOUTS = {
  /** Default API call timeout */
  default: 10_000,
  /** Firebase Firestore operations */
  firestore: 15_000,
  /** Weather/climate API calls */
  weather: 12_000,
  /** Market Oracle predictions */
  marketOracle: 20_000,
  /** ASHA AI advisory */
  advisory: 30_000,
  /** Azure OpenAI/Speech */
  azureAI: 25_000,
  /** M-Pesa payment initiation */
  payment: 15_000,
  /** File uploads */
  upload: 60_000,
} as const;

// ─── Retry Configuration ─────────────────────────────────────────────────────
export const RETRY = {
  /** Maximum retry attempts for failed requests */
  maxAttempts: 3,
  /** Base delay between retries (ms) — exponential backoff applied */
  baseDelay: 1_000,
  /** Maximum delay between retries (ms) */
  maxDelay: 10_000,
  /** HTTP status codes that should trigger a retry */
  retryableStatuses: [408, 429, 500, 502, 503, 504],
} as const;

// ─── Cache Durations (ms) ────────────────────────────────────────────────────
export const CACHE = {
  /** Market prices — refresh every 5 minutes */
  marketPrices: 5 * 60 * 1_000,
  /** Climate data — refresh every 15 minutes */
  climate: 15 * 60 * 1_000,
  /** User profile — refresh every 10 minutes */
  userProfile: 10 * 60 * 1_000,
  /** Listings — refresh every 2 minutes */
  listings: 2 * 60 * 1_000,
  /** Static reference data — refresh every hour */
  referenceData: 60 * 60 * 1_000,
} as const;

// ─── API Endpoints ───────────────────────────────────────────────────────────
export const ENDPOINTS = {
  weatherProxy: import.meta.env.VITE_WEATHER_PROXY_URL || '',
  advisoryWorker: import.meta.env.VITE_ADVISORY_WORKER_URL || '',
  marketApi: import.meta.env.VITE_MARKET_API_URL || '',
  communityApi: import.meta.env.VITE_COMMUNITY_API_BASE_URL || '',
  ashaApi: import.meta.env.VITE_ASHA_API_BASE_URL || '',
  buyerApi: import.meta.env.VITE_BUYER_API_BASE_URL || '',
  renderApi: import.meta.env.VITE_RENDER_API_URL || '',
} as const;

// ─── Feature Flags ───────────────────────────────────────────────────────────
export const FEATURES = {
  coopTrade: import.meta.env.VITE_ENABLE_COOP_TRADE === 'true',
  intlSimulation: import.meta.env.VITE_INTL_SIM_ENABLED === 'true',
  buyerTrade: import.meta.env.VITE_ENABLE_BUYER_TRADE === 'true',
  buyerDashboard: import.meta.env.VITE_ENABLE_BUYER_DASHBOARD === 'true',
  buyerBilling: import.meta.env.VITE_ENABLE_BUYER_BILLING === 'true',
  testDeposit: import.meta.env.VITE_ENABLE_TEST_DEPOSIT === 'true',
  kenyaMemberMap: import.meta.env.VITE_ENABLE_KENYA_MEMBER_MAP === 'true',
  mockAdvisory: import.meta.env.VITE_USE_MOCK_ADVISORY === 'true',
  mpesaMock: import.meta.env.VITE_MPESA_MOCK_MODE === 'true',
} as const;

// ─── Rate Limits (client-side throttling) ────────────────────────────────────
export const RATE_LIMITS = {
  /** Max advisory requests per minute */
  advisoryPerMinute: 10,
  /** Max market predictions per minute */
  marketPredictionsPerMinute: 5,
  /** Max payment attempts per 5 minutes */
  paymentsPer5Min: 3,
  /** Max file uploads per minute */
  uploadsPerMinute: 5,
} as const;

// ─── Pagination ──────────────────────────────────────────────────────────────
export const PAGINATION = {
  /** Default page size for listings */
  listings: 20,
  /** Default page size for orders */
  orders: 15,
  /** Default page size for community posts */
  communityPosts: 10,
  /** Default page size for members */
  members: 25,
  /** Maximum items per request */
  maxPageSize: 50,
} as const;
