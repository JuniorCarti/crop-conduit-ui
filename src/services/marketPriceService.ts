/**
 * Market Price Service
 * Fetches, parses, and manages market price data from Excel file
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  runTransaction,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "sonner";
import { auth, db } from "@/lib/firebase";

export interface MarketPrice {
  id?: string;
  commodity: string;
  classification?: string;
  grade?: string;
  sex?: string;
  market: string;
  wholesale: number;
  retail: number;
  supply?: string;
  volume?: number;
  county: string;
  date: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const MARKET_PRICES_COLLECTION = "market_prices";

type PredictCommodity = "potatoes" | "kale" | "tomatoes" | "onion" | "cabbage";

const PREDICT_COMMODITIES: ReadonlySet<PredictCommodity> = new Set([
  "potatoes",
  "kale",
  "tomatoes",
  "onion",
  "cabbage",
]);

const STORAGE_COMMODITY_LABELS: Record<PredictCommodity, string> = {
  tomatoes: "Tomatoes",
  onion: "Onions",
  potatoes: "Irish potato",
  kale: "Kale",
  cabbage: "Cabbage",
};

export const getStorageCommodityLabel = (commodity: PredictCommodity): string =>
  STORAGE_COMMODITY_LABELS[commodity];

const DEFAULT_PREVIOUS_MONTH_PRICES: Record<PredictCommodity, number> = {
  tomatoes: 50,
  onion: 60,
  potatoes: 40,
  kale: 45,
  cabbage: 35,
};

const unsupportedPredictCommodities = new Set<PredictCommodity>();

const AUTH_REQUIRED_MESSAGE = "Login required to load cached market prices.";
let authMessageShown = false;

let authReady = false;
let authReadyPromise: Promise<void> | null = null;

const awaitAuthReady = (): Promise<void> => {
  if (authReady) {
    return Promise.resolve();
  }
  if (!authReadyPromise) {
    authReadyPromise = new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, () => {
        authReady = true;
        unsubscribe();
        resolve();
      });
    });
  }
  return authReadyPromise;
};

const hasAuthenticatedUser = (): boolean => !!auth.currentUser;

const canUseFirestore = async (): Promise<boolean> => {
  await awaitAuthReady();
  return hasAuthenticatedUser();
};

const notifyAuthRequired = () => {
  if (authMessageShown) return;
  authMessageShown = true;
  console.warn(AUTH_REQUIRED_MESSAGE);
  if (typeof window !== "undefined") {
    toast.warning(AUTH_REQUIRED_MESSAGE);
  }
};

const logFirestoreSkip = (context: string) => {
  console.info(`[MarketPriceService] Skipping Firestore ${context}: user not authenticated.`);
  notifyAuthRequired();
};

const isPermissionDenied = (error: any): boolean => {
  const message = String(error?.message || "");
  return (
    error?.code === "permission-denied" ||
    message.includes("Missing or insufficient permissions") ||
    message.toLowerCase().includes("permission-denied")
  );
};

const logPermissionDenied = (context: string, error?: any) => {
  if (import.meta.env.DEV) {
    console.warn(`[MarketPriceService] Firestore permission denied (${context}).`, error);
  }
};

// Render API Configuration
// Set this in your .env file: VITE_RENDER_API_URL=https://market-forecaster-kenyan-agro-market-621a.onrender.com/predict
// Automatically appends /predict if not present
const getRenderApiUrl = (): string => {
  const envUrl = import.meta.env.VITE_RENDER_API_URL || "https://market-forecaster-kenyan-agro-market-621a.onrender.com";
  // Ensure URL ends with /predict
  let baseUrl = envUrl.trim();
  // Remove trailing slash if present
  if (baseUrl.endsWith("/")) {
    baseUrl = baseUrl.slice(0, -1);
  }
  // Append /predict if not already present
  if (!baseUrl.includes("/predict")) {
    return `${baseUrl}/predict`;
  }
  return baseUrl;
};
const RENDER_API_URL = getRenderApiUrl();

/**
 * Render API Request Interface (for POST /predict)
 */
const REGIONS = ["Central", "Coast", "Eastern", "Nairobi", "North Eastern", "Nyanza", "Rift Valley"] as const;
type Region = (typeof REGIONS)[number];

const isRegion = (value: string): value is Region => REGIONS.includes(value as Region);

const MARKET_REGION_MAP = {
  Nairobi: "Nairobi",
  Mombasa: "Coast",
  Kisumu: "Nyanza",
  Nakuru: "Rift Valley",
} as const satisfies Record<string, Region>;

const resolveAdmin1 = (marketName: string): Region => {
  const normalized = marketName.toLowerCase();
  const match = (Object.keys(MARKET_REGION_MAP) as Array<keyof typeof MARKET_REGION_MAP>)
    .find((city) => normalized.includes(city.toLowerCase()));

  if (!match) {
    throw new Error(
      `[MarketPriceService] Invalid region mapping for market "${marketName}". ` +
      `Expected one of: ${Object.keys(MARKET_REGION_MAP).join(", ")}`
    );
  }

  const region = MARKET_REGION_MAP[match];
  if (!isRegion(region)) {
    throw new Error(
      `[MarketPriceService] Invalid region "${region}" derived for market "${marketName}". ` +
      `Valid regions: ${REGIONS.join(", ")}`
    );
  }

  return region;
};

interface RenderApiRequest {
  date: string;
  admin1: Region; // Region enum (API requires regions)
  market: string;
  commodity: string;
  pricetype: "retail" | "wholesale";
  previous_month_price?: number;
}

/**
 * Render API Response Interface (prediction response)
 */
interface RenderApiResponse {
  date?: string;
  admin1?: Region;
  market?: string;
  commodity?: string;
  retail?: number;
  wholesale?: number;
  predicted_price?: number;
  prediction_per_kg?: number; // API returns this field
  unit?: string;
  previous_month_price?: number;
  // API might return additional fields
  [key: string]: any;
}

/**
 * Generate composite key for market price
 */
function generatePriceKey(commodity: string, market: string, date: Date): string {
  const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
  return `${commodity}_${market}_${dateStr}`.replace(/[^a-zA-Z0-9_]/g, "_");
}

/**
 * Normalize UI commodity labels to the Render /predict API contract.
 */
export function normalizeCommodityForPredict(uiCommodity: string): PredictCommodity {
  const normalized = uiCommodity.trim().toLowerCase();
  if (!normalized) {
    throw new Error("[MarketPriceService] Unsupported commodity: empty value");
  }

  if (normalized.includes("potato")) return "potatoes";
  if (normalized.includes("onion")) return "onion";
  if (normalized.includes("tomato")) return "tomatoes";
  if (normalized.includes("kale")) return "kale";
  if (normalized.includes("cabbage")) return "cabbage";

  throw new Error(
    `[MarketPriceService] Unsupported commodity "${uiCommodity}". ` +
    `Expected one of: ${Array.from(PREDICT_COMMODITIES).join(", ")}`
  );
}

/**
 * Excel parsing removed - now using Render API only
 * This function is deprecated and kept for backward compatibility
 */
export async function fetchAndParseExcel(): Promise<MarketPrice[]> {
  console.warn("[MarketPriceService] Excel parsing is deprecated. Using Render API only.");
  return [];
}

/**
 * Upload market prices to Firestore
 * Uses transactions to prevent duplicates
 */
export async function uploadMarketPrices(prices: MarketPrice[]): Promise<{ success: number; skipped: number; errors: number }> {
  let success = 0;
  let skipped = 0;
  let errors = 0;

  try {
    const allowFirestore = await canUseFirestore();
    if (!allowFirestore) {
      logFirestoreSkip("upload");
      return { success: 0, skipped: prices.length, errors: 0 };
    }

    // Process in batches to avoid Firestore limits
    const batchSize = 500;
    for (let i = 0; i < prices.length; i += batchSize) {
      const batch = prices.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (price) => {
          try {
            const key = generatePriceKey(price.commodity, price.market, price.date);
            const docRef = doc(db, MARKET_PRICES_COLLECTION, key);

            // Check if document exists
            const existingDoc = await getDoc(docRef);

            // Filter out undefined values to prevent Firebase errors
            const cleanPrice: any = {
              commodity: price.commodity,
              market: price.market,
              wholesale: price.wholesale,
              retail: price.retail,
              county: price.county,
              date: Timestamp.fromDate(price.date),
            };

            // Only include optional fields if they are defined
            if (price.classification !== undefined) cleanPrice.classification = price.classification;
            if (price.grade !== undefined) cleanPrice.grade = price.grade;
            if (price.sex !== undefined) cleanPrice.sex = price.sex;
            if (price.supply !== undefined && price.supply !== null && price.supply !== "") {
              cleanPrice.supply = price.supply;
            }
            if (price.volume !== undefined && price.volume !== null && !isNaN(price.volume)) {
              cleanPrice.volume = price.volume;
            }

            if (existingDoc.exists()) {
              // Update existing document
              const existingData = existingDoc.data();
              await setDoc(
                docRef,
                {
                  ...cleanPrice,
                  createdAt: existingData.createdAt || Timestamp.now(),
                  updatedAt: Timestamp.now(),
                },
                { merge: true }
              );
              success++;
            } else {
              // Create new document
              await setDoc(docRef, {
                ...cleanPrice,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
              });
              success++;
            }
          } catch (error: any) {
            console.error(`Error uploading price for ${price.commodity} - ${price.market}:`, error);
            errors++;
          }
        })
      );
    }

    return { success, skipped, errors };
  } catch (error: any) {
    console.error("Error uploading market prices:", error);
    throw error;
  }
}

/**
 * Sync Excel data to Firestore
 * DEPRECATED: Excel sync removed - now using Render API only
 * This function is kept for backward compatibility but returns empty result
 */
export async function syncMarketPricesFromExcel(): Promise<{ success: number; skipped: number; errors: number }> {
  console.warn("[MarketPriceService] Excel sync is deprecated. Use syncMarketForecastWithFallback() instead.");
  return { success: 0, skipped: 0, errors: 0 };
}

/**
 * Fetch market forecast data from Render API using POST /predict endpoint ONLY
 * Calls the prediction endpoint for multiple commodities/markets and syncs to Firestore
 * This function ONLY calls /predict - no other endpoints or options
 */
export async function fetchMarketForecastFromRender(): Promise<{ success: number; skipped: number; errors: number }> {
  if (!RENDER_API_URL) {
    console.warn("[MarketPriceService] Render API URL not configured. Set VITE_RENDER_API_URL in .env");
    return { success: 0, skipped: 0, errors: 0 };
  }

  // Ensure we're only calling /predict endpoint
  if (!RENDER_API_URL.includes("/predict")) {
    console.error("[MarketPriceService] ERROR: API URL must point to /predict endpoint:", RENDER_API_URL);
    return { success: 0, skipped: 0, errors: 1 };
  }

  try {
    console.log("[MarketPriceService] Fetching market forecast from Render API /predict endpoint:", RENDER_API_URL);
    const allowFirestore = await canUseFirestore();
    if (!allowFirestore) {
      logFirestoreSkip("read/write");
    }

    const postPredict = async (payload: RenderApiRequest): Promise<Response> => {
      const normalizedCommodity = normalizeCommodityForPredict(payload.commodity);
      if (unsupportedPredictCommodities.has(normalizedCommodity)) {
        throw new Error(`[Predict] Commodity "${normalizedCommodity}" marked unsupported in this session.`);
      }
      const fixed: RenderApiRequest = {
        ...payload,
        commodity: normalizedCommodity,
        admin1: payload.admin1.trim() as Region,
        market: payload.market?.trim(),
      };

      console.log("[Predict] sending:", fixed);

      const res = await fetch(RENDER_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fixed),
      });

      // Always print error body if not OK.
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        let err: any = txt;
        try {
          err = JSON.parse(txt);
        } catch {}
        console.error("[Predict] API error:", res.status, err);
        if (res.status === 400) {
          unsupportedPredictCommodities.add(normalizedCommodity);
        }

        // Throw so caller can count it as an error.
        throw new Error(
          typeof err === "string"
            ? `Predict API error ${res.status}: ${err}`
            : `Predict API error ${res.status}: ${JSON.stringify(err)}`
        );
      }

      return res;
    };

    // Only query commodities supported by the API
    const supportedCommodities = Object.values(STORAGE_COMMODITY_LABELS);
    
    // Market mapping: internal name -> API name (admin1 resolved via mapping)
    const markets = [
      { name: "Wakulima", apiName: "Wakulima (Nairobi)" },
      { name: "Marikiti (Nairobi)", apiName: "Dandora (Nairobi)" }, // Marikiti not in API, use Dandora
      { name: "Mombasa Market", apiName: "Kongowea (Mombasa)" },
      { name: "Kisumu Market", apiName: "Kisumu" },
      { name: "Nakuru Market", apiName: "Nakuru" },
    ];

    // Use today's date for predictions
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0]; // YYYY-MM-DD format

    let success = 0;
    let skipped = 0;
    let errors = 0;

    // Fetch predictions for each commodity-market combination
    for (const commodityLabel of supportedCommodities) {
      let normalizedCommodity: PredictCommodity;
      try {
        normalizedCommodity = normalizeCommodityForPredict(commodityLabel);
      } catch (normalizeError) {
        console.warn("[MarketPriceService] Unsupported commodity, skipping predict:", commodityLabel, normalizeError);
        skipped += markets.length;
        continue;
      }

      if (unsupportedPredictCommodities.has(normalizedCommodity)) {
        console.warn(`[MarketPriceService] Skipping ${normalizedCommodity}: marked unsupported in this session.`);
        skipped += markets.length;
        continue;
      }

      const storageCommodity = STORAGE_COMMODITY_LABELS[normalizedCommodity];

      for (const marketInfo of markets) {
        if (unsupportedPredictCommodities.has(normalizedCommodity)) {
          skipped++;
          continue;
        }

        try {
          // Get previous month's price from Firestore for this commodity-market combination
          const previousMonthDate = new Date(today);
          previousMonthDate.setMonth(previousMonthDate.getMonth() - 1);

          // Try to get previous month price from Firestore
          let previousMonthPrice: number | undefined = undefined;
          if (allowFirestore) {
            try {
              const previousPrices = await getMarketPrices({
                commodity: storageCommodity,
                market: marketInfo.name,
                startDate: previousMonthDate,
                endDate: previousMonthDate,
                limitCount: 1,
              });

              if (previousPrices.length > 0) {
                // Use retail price as previous_month_price (or wholesale if retail not available)
                previousMonthPrice = previousPrices[0].retail || previousPrices[0].wholesale;
              }
            } catch (priceError) {
              console.warn(`[MarketPriceService] Could not fetch previous month price for ${storageCommodity} - ${marketInfo.name}:`, priceError);
            }
          }

          // Fallback to default price if not found (use average market price or default)
          if (previousMonthPrice === undefined || previousMonthPrice <= 0) {
            previousMonthPrice = DEFAULT_PREVIOUS_MONTH_PRICES[normalizedCommodity];
            console.log(`[MarketPriceService] Using default previous_month_price ${previousMonthPrice} for ${storageCommodity}`);
          }

          const admin1 = resolveAdmin1(marketInfo.apiName || marketInfo.name);

          const apiMarketName = marketInfo.apiName || marketInfo.name;
          const baseRequest: Omit<RenderApiRequest, "commodity" | "pricetype"> = {
            date: dateStr,
            admin1,
            market: apiMarketName,
          };

          console.log(`[MarketPriceService] Requesting prediction for ${storageCommodity} - ${marketInfo.name} (retail)`);
          console.log(`[MarketPriceService] Requesting prediction for ${storageCommodity} - ${marketInfo.name} (wholesale)`);
          const retailRequest: RenderApiRequest = {
            ...baseRequest,
            commodity: normalizedCommodity,
            pricetype: "retail",
            previous_month_price: previousMonthPrice,
          };
          const wholesaleRequest: RenderApiRequest = {
            ...baseRequest,
            commodity: normalizedCommodity,
            pricetype: "wholesale",
            previous_month_price: previousMonthPrice * 0.85, // Wholesale is typically 15% lower
          };

          const [retailResponse, wholesaleResponse] = await Promise.allSettled([
            postPredict(retailRequest),
            postPredict(wholesaleRequest),
          ]);

          // Process retail response
          let retailPrice: number | null = null;
          if (retailResponse.status === "fulfilled" && retailResponse.value.ok) {
            try {
              const retailData: RenderApiResponse = await retailResponse.value.json();
              console.log(`[MarketPriceService] Retail response for ${storageCommodity}:`, retailData);
              // API returns prediction_per_kg field - prioritize this field
              retailPrice = retailData.prediction_per_kg ?? retailData.predicted_price ?? retailData.retail ?? null;
              // Ensure price is a valid number
              if (retailPrice !== null && (typeof retailPrice !== "number" || isNaN(retailPrice) || retailPrice <= 0)) {
                retailPrice = null;
              }
            } catch (parseError) {
              console.warn(`[MarketPriceService] Error parsing retail response for ${storageCommodity} - ${marketInfo.name}:`, parseError);
            }
          } else if (retailResponse.status === "rejected") {
            console.warn(`[MarketPriceService] Retail request failed for ${storageCommodity} - ${marketInfo.name}:`, retailResponse.reason);
          }

          // Process wholesale response
          let wholesalePrice: number | null = null;
          if (wholesaleResponse.status === "fulfilled" && wholesaleResponse.value.ok) {
            try {
              const wholesaleData: RenderApiResponse = await wholesaleResponse.value.json();
              console.log(`[MarketPriceService] Wholesale response for ${storageCommodity}:`, wholesaleData);
              // API returns prediction_per_kg field - prioritize this field
              wholesalePrice = wholesaleData.prediction_per_kg ?? wholesaleData.predicted_price ?? wholesaleData.wholesale ?? null;
              // Ensure price is a valid number
              if (wholesalePrice !== null && (typeof wholesalePrice !== "number" || isNaN(wholesalePrice) || wholesalePrice <= 0)) {
                wholesalePrice = null;
              }
            } catch (parseError) {
              console.warn(`[MarketPriceService] Error parsing wholesale response for ${storageCommodity} - ${marketInfo.name}:`, parseError);
            }
          } else if (wholesaleResponse.status === "rejected") {
            console.warn(`[MarketPriceService] Wholesale request failed for ${storageCommodity} - ${marketInfo.name}:`, wholesaleResponse.reason);
          }

          // Skip if both prices are invalid
          if ((retailPrice === null || retailPrice <= 0) && (wholesalePrice === null || wholesalePrice <= 0)) {
            console.warn(`[MarketPriceService] Skipping ${storageCommodity} - ${marketInfo.name}: No valid prices (retail: ${retailPrice}, wholesale: ${wholesalePrice})`);
            skipped++;
            continue;
          }

          // Use predicted prices or fallback values
          const finalRetail = retailPrice && retailPrice > 0 ? retailPrice : (wholesalePrice && wholesalePrice > 0 ? wholesalePrice * 1.2 : 0);
          const finalWholesale = wholesalePrice && wholesalePrice > 0 ? wholesalePrice : (retailPrice && retailPrice > 0 ? retailPrice * 0.8 : 0);

          if (finalRetail <= 0 || finalWholesale <= 0) {
            skipped++;
            continue;
          }

          // Map to MarketPrice format
          const marketPrice: Omit<MarketPrice, "id" | "createdAt" | "updatedAt"> = {
            commodity: storageCommodity,
            market: marketInfo.name,
            county: admin1,
            retail: finalRetail,
            wholesale: finalWholesale,
            date: today,
          };

          if (allowFirestore) {
            // Generate composite key for upsert
            const priceKey = generatePriceKey(marketPrice.commodity, marketPrice.market, today);
            const docRef = doc(db, MARKET_PRICES_COLLECTION, priceKey);

            // Check if document exists to preserve createdAt
            const existingDoc = await getDoc(docRef);
            const createdAt = existingDoc.exists() && existingDoc.data().createdAt
              ? existingDoc.data().createdAt
              : Timestamp.now();

            // Upsert to Firestore (merge with existing data)
            await setDoc(
              docRef,
              {
                ...marketPrice,
                date: Timestamp.fromDate(today),
                updatedAt: Timestamp.now(),
                createdAt: createdAt,
              },
              { merge: true }
            );
          }

          success++;
        } catch (recordError: any) {
          console.error(`[MarketPriceService] Error processing ${storageCommodity} - ${marketInfo.name}:`, recordError);
          errors++;
        }
      }
    }

    console.log(`[MarketPriceService] Render API sync complete: ${success} success, ${skipped} skipped, ${errors} errors`);
    return { success, skipped, errors };
  } catch (error: any) {
    console.error("[MarketPriceService] Error fetching from Render API:", error);
    // Return error count but don't throw - allow fallback to cached data
    return { success: 0, skipped: 0, errors: 1 };
  }
}

// Guard to prevent concurrent syncs
let isSyncing = false;
let lastSyncTime: number | null = null;
const SYNC_COOLDOWN_MS = 60000; // 1 minute cooldown between syncs

/**
 * Sync market forecast from Render API with fallback to cached Firestore data
 * This is the main entry point for the Market Oracle Agent
 * Only calls /predict endpoint - prevents concurrent syncs and loops
 */
export async function syncMarketForecastWithFallback(): Promise<{ success: number; skipped: number; errors: number }> {
  // Prevent concurrent syncs
  if (isSyncing) {
    console.log("[MarketPriceService] Sync already in progress, skipping...");
    return { success: 0, skipped: 0, errors: 0 };
  }

  // Enforce cooldown period
  const now = Date.now();
  if (lastSyncTime !== null && (now - lastSyncTime) < SYNC_COOLDOWN_MS) {
    console.log(`[MarketPriceService] Sync cooldown active, skipping. Next sync available in ${Math.ceil((SYNC_COOLDOWN_MS - (now - lastSyncTime)) / 1000)}s`);
    return { success: 0, skipped: 0, errors: 0 };
  }

  // Set sync flag
  isSyncing = true;
  lastSyncTime = now;

  try {
    console.log("[MarketPriceService] Starting market forecast sync from Render API /predict endpoint...");
    await awaitAuthReady();
    if (!hasAuthenticatedUser()) {
      logFirestoreSkip("cache");
    }
    
    // Only call /predict endpoint - no other options
    const syncResult = await fetchMarketForecastFromRender();
    
    if (syncResult.success > 0) {
      console.log(`[MarketPriceService] Successfully synced ${syncResult.success} records from Render API /predict`);
    } else if (syncResult.errors > 0) {
      console.warn("[MarketPriceService] Render API /predict sync failed, will use cached Firestore data");
    } else {
      console.log("[MarketPriceService] Sync completed with no new data");
    }
    
    return syncResult;
  } catch (error: any) {
    console.error("[MarketPriceService] Error in sync with fallback:", error);
    // Return error result instead of silently failing
    return { success: 0, skipped: 0, errors: 1 };
  } finally {
    // Always clear sync flag, even on error
    isSyncing = false;
    console.log("[MarketPriceService] Sync process completed");
  }
}

/**
 * Get market prices with filters
 */
export async function getMarketPrices(filters: {
  commodity?: string;
  market?: string;
  county?: string;
  startDate?: Date;
  endDate?: Date;
  limitCount?: number;
}): Promise<MarketPrice[]> {
  try {
    await awaitAuthReady();
    if (!hasAuthenticatedUser()) {
      logFirestoreSkip("read");
      return [];
    }

    let q = query(collection(db, MARKET_PRICES_COLLECTION));

    if (filters.commodity) {
      q = query(q, where("commodity", "==", filters.commodity));
    }
    if (filters.market) {
      q = query(q, where("market", "==", filters.market));
    }
    if (filters.county) {
      q = query(q, where("county", "==", filters.county));
    }
    if (filters.startDate) {
      q = query(q, where("date", ">=", Timestamp.fromDate(filters.startDate)));
    }
    if (filters.endDate) {
      q = query(q, where("date", "<=", Timestamp.fromDate(filters.endDate)));
    }

    q = query(q, orderBy("date", "desc"));
    if (filters.limitCount) {
      q = query(q, limit(filters.limitCount));
    }

    const snapshot = await getDocs(q);
    const prices: MarketPrice[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      prices.push({
        id: doc.id,
        ...data,
        date: data.date?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as MarketPrice);
    });

    return prices;
  } catch (error: any) {
    if (isPermissionDenied(error)) {
      logPermissionDenied("read", error);
      return [];
    }
    console.error("Error getting market prices:", error);
    throw error;
  }
}

/**
 * Subscribe to market prices with real-time updates
 */
export function subscribeToMarketPrices(
  filters: {
    commodity?: string;
    market?: string;
    county?: string;
    startDate?: Date;
    endDate?: Date;
  },
  callback: (prices: MarketPrice[]) => void
): () => void {
  try {
    let active = true;
    let unsubscribeSnapshot: (() => void) | null = null;

    awaitAuthReady().then(() => {
      if (!active) return;
      if (!hasAuthenticatedUser()) {
        logFirestoreSkip("subscription");
        callback([]);
        return;
      }

      let q = query(collection(db, MARKET_PRICES_COLLECTION));

      if (filters.commodity) {
        q = query(q, where("commodity", "==", filters.commodity));
      }
      if (filters.market) {
        q = query(q, where("market", "==", filters.market));
      }
      if (filters.county) {
        q = query(q, where("county", "==", filters.county));
      }
      if (filters.startDate) {
        q = query(q, where("date", ">=", Timestamp.fromDate(filters.startDate)));
      }
      if (filters.endDate) {
        q = query(q, where("date", "<=", Timestamp.fromDate(filters.endDate)));
      }

      q = query(q, orderBy("date", "desc"), limit(1000));

      unsubscribeSnapshot = onSnapshot(
        q,
        (snapshot) => {
          const prices: MarketPrice[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            prices.push({
              id: doc.id,
              ...data,
              date: data.date?.toDate() || new Date(),
              createdAt: data.createdAt?.toDate(),
              updatedAt: data.updatedAt?.toDate(),
            } as MarketPrice);
          });
          callback(prices);
        },
        (error) => {
          console.error("Error subscribing to market prices:", error);
          callback([]);
        }
      );
    });

    return () => {
      active = false;
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  } catch (error: any) {
    console.error("Error setting up market price subscription:", error);
    return () => {};
  }
}

/**
 * Get latest price for a commodity and market
 */
export async function getLatestPrice(commodity: string, market?: string): Promise<MarketPrice | null> {
  try {
    await awaitAuthReady();
    if (!hasAuthenticatedUser()) {
      logFirestoreSkip("latest price read");
      return null;
    }

    let q = query(
      collection(db, MARKET_PRICES_COLLECTION),
      where("commodity", "==", commodity),
      orderBy("date", "desc"),
      limit(1)
    );

    if (market) {
      q = query(
        collection(db, MARKET_PRICES_COLLECTION),
        where("commodity", "==", commodity),
        where("market", "==", market),
        orderBy("date", "desc"),
        limit(1)
      );
    }

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      date: data.date?.toDate() || new Date(),
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    } as MarketPrice;
  } catch (error: any) {
    if (isPermissionDenied(error)) {
      logPermissionDenied("latest price read", error);
      return null;
    }
    console.error("Error getting latest price:", error);
    return null;
  }
}

/**
 * Get average price for a commodity across all markets
 */
export async function getAveragePrice(commodity: string, date?: Date): Promise<{ wholesale: number; retail: number } | null> {
  try {
    await awaitAuthReady();
    if (!hasAuthenticatedUser()) {
      logFirestoreSkip("average price read");
      return null;
    }

    let q = query(
      collection(db, MARKET_PRICES_COLLECTION),
      where("commodity", "==", commodity),
      orderBy("date", "desc"),
      limit(100)
    );

    if (date) {
      q = query(
        collection(db, MARKET_PRICES_COLLECTION),
        where("commodity", "==", commodity),
        where("date", ">=", Timestamp.fromDate(date)),
        orderBy("date", "desc"),
        limit(100)
      );
    }

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return null;
    }

    let totalWholesale = 0;
    let totalRetail = 0;
    let count = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      totalWholesale += data.wholesale || 0;
      totalRetail += data.retail || 0;
      count++;
    });

    return {
      wholesale: totalWholesale / count,
      retail: totalRetail / count,
    };
  } catch (error: any) {
    if (isPermissionDenied(error)) {
      logPermissionDenied("average price read", error);
      return null;
    }
    console.error("Error getting average price:", error);
    return null;
  }
}
