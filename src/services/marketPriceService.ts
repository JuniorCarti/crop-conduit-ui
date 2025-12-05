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
import { db } from "@/lib/firebase";

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

// Render API Configuration
// Set this in your .env file: VITE_RENDER_API_URL=https://market-forecaster-kenyan-agro-market.onrender.com/predict
// Automatically appends /predict if not present
const getRenderApiUrl = (): string => {
  const envUrl = import.meta.env.VITE_RENDER_API_URL || "https://market-forecaster-kenyan-agro-market.onrender.com";
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
interface RenderApiRequest {
  date: string;
  admin1: string; // County/Region
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
  admin1?: string; // County/Region
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
    
    // Commodity mapping: internal name -> API name
    // API valid values (from error messages): ['cabbage', 'potatoes', 'kale', 'tomatoes', 'onion']
    // Note: API expects lowercase values!
    const commodityMapping: Record<string, string> = {
      "tomatoes": "tomatoes", // API expects lowercase
      "onions": "onion", // API expects lowercase singular "onion", not "Onions (dry)"
      "irish potato": "potatoes", // API expects lowercase "potatoes", not "Potatoes (Irish)"
      "potatoes": "potatoes",
      "kale": "kale",
      "cabbage": "cabbage",
    };

    // Only query commodities supported by the API
    const supportedCommodities = ["tomatoes", "onions", "irish potato"];
    
    // Market mapping: internal name -> API name and admin1 (county)
    const markets = [
      { name: "Wakulima", apiName: "Wakulima (Nairobi)", admin1: "Nairobi" },
      { name: "Marikiti (Nairobi)", apiName: "Dandora (Nairobi)", admin1: "Nairobi" }, // Marikiti not in API, use Dandora
      { name: "Mombasa Market", apiName: "Kongowea (Mombasa)", admin1: "Coast" }, // Mombasa -> Coast county
      { name: "Kisumu Market", apiName: "Kisumu", admin1: "Nyanza" }, // Kisumu -> Nyanza county
      { name: "Nakuru Market", apiName: "Nakuru", admin1: "Rift Valley" }, // Nakuru -> Rift Valley county
    ];

    // Use today's date for predictions
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0]; // YYYY-MM-DD format

    let success = 0;
    let skipped = 0;
    let errors = 0;

    // Fetch predictions for each commodity-market combination
    for (const commodity of supportedCommodities) {
      for (const marketInfo of markets) {
        try {
          // Map commodity to API format
          const apiCommodity = commodityMapping[commodity.toLowerCase()] || commodity.toLowerCase();
          
          // Skip if commodity is not supported by API
          // API valid values (from error messages): ['cabbage', 'potatoes', 'kale', 'tomatoes', 'onion']
          const supportedApiCommodities = ["tomatoes", "onion", "potatoes", "kale", "cabbage"];
          if (!supportedApiCommodities.includes(apiCommodity.toLowerCase())) {
            skipped++;
            continue;
          }

          // Get previous month's price from Firestore for this commodity-market combination
          const previousMonthDate = new Date(today);
          previousMonthDate.setMonth(previousMonthDate.getMonth() - 1);
          const previousMonthStr = previousMonthDate.toISOString().split("T")[0];

          // Try to get previous month price from Firestore
          let previousMonthPrice: number | undefined = undefined;
          try {
            const previousPrices = await getMarketPrices({
              commodity: commodity.charAt(0).toUpperCase() + commodity.slice(1),
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
            console.warn(`[MarketPriceService] Could not fetch previous month price for ${commodity} - ${marketInfo.name}:`, priceError);
          }

          // Fallback to default price if not found (use average market price or default)
          if (previousMonthPrice === undefined || previousMonthPrice <= 0) {
            // Default prices per commodity (in KSh per kg/unit) - can be adjusted
            const defaultPrices: Record<string, number> = {
              tomatoes: 50,
              onions: 60,
              "onion": 60,
              "irish potato": 40,
              potatoes: 40,
            };
            previousMonthPrice = defaultPrices[commodity.toLowerCase()] || defaultPrices[apiCommodity] || 50;
            console.log(`[MarketPriceService] Using default previous_month_price ${previousMonthPrice} for ${commodity}`);
          }

          // Fetch retail price prediction
          // Use apiName for API request, but keep name for Firestore queries
          const apiMarketName = marketInfo.apiName || marketInfo.name;
          const retailRequest: RenderApiRequest = {
            date: dateStr,
            admin1: marketInfo.admin1,
            market: apiMarketName,
            commodity: apiCommodity,
            pricetype: "retail",
            previous_month_price: previousMonthPrice,
          };

          // Fetch wholesale price prediction (use slightly lower price for wholesale)
          const wholesaleRequest: RenderApiRequest = {
            date: dateStr,
            admin1: marketInfo.admin1,
            market: apiMarketName,
            commodity: apiCommodity,
            pricetype: "wholesale",
            previous_month_price: previousMonthPrice * 0.85, // Wholesale is typically 15% lower
          };

          console.log(`[MarketPriceService] Requesting prediction for ${commodity} - ${marketInfo.name} (retail)`);
          console.log(`[MarketPriceService] Requesting prediction for ${commodity} - ${marketInfo.name} (wholesale)`);

          // Make parallel requests for retail and wholesale
          const [retailResponse, wholesaleResponse] = await Promise.allSettled([
            fetch(RENDER_API_URL, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(retailRequest),
            }),
            fetch(RENDER_API_URL, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(wholesaleRequest),
            }),
          ]);

          // Process retail response
          let retailPrice: number | null = null;
          if (retailResponse.status === "fulfilled" && retailResponse.value.ok) {
            try {
              const retailData: RenderApiResponse = await retailResponse.value.json();
              console.log(`[MarketPriceService] Retail response for ${commodity}:`, retailData);
              // API returns prediction_per_kg field - prioritize this field
              retailPrice = retailData.prediction_per_kg ?? retailData.predicted_price ?? retailData.retail ?? null;
              // Ensure price is a valid number
              if (retailPrice !== null && (typeof retailPrice !== "number" || isNaN(retailPrice) || retailPrice <= 0)) {
                retailPrice = null;
              }
            } catch (parseError) {
              console.warn(`[MarketPriceService] Error parsing retail response for ${commodity} - ${marketInfo.name}:`, parseError);
            }
          } else if (retailResponse.status === "rejected") {
            console.warn(`[MarketPriceService] Retail request failed for ${commodity} - ${marketInfo.name}:`, retailResponse.reason);
          } else if (retailResponse.status === "fulfilled" && !retailResponse.value.ok) {
            const errorText = await retailResponse.value.text().catch(() => "Unknown error");
            console.warn(`[MarketPriceService] Retail API error for ${commodity}: ${retailResponse.value.status} - ${errorText}`);
          }

          // Process wholesale response
          let wholesalePrice: number | null = null;
          if (wholesaleResponse.status === "fulfilled" && wholesaleResponse.value.ok) {
            try {
              const wholesaleData: RenderApiResponse = await wholesaleResponse.value.json();
              console.log(`[MarketPriceService] Wholesale response for ${commodity}:`, wholesaleData);
              // API returns prediction_per_kg field - prioritize this field
              wholesalePrice = wholesaleData.prediction_per_kg ?? wholesaleData.predicted_price ?? wholesaleData.wholesale ?? null;
              // Ensure price is a valid number
              if (wholesalePrice !== null && (typeof wholesalePrice !== "number" || isNaN(wholesalePrice) || wholesalePrice <= 0)) {
                wholesalePrice = null;
              }
            } catch (parseError) {
              console.warn(`[MarketPriceService] Error parsing wholesale response for ${commodity} - ${marketInfo.name}:`, parseError);
            }
          } else if (wholesaleResponse.status === "rejected") {
            console.warn(`[MarketPriceService] Wholesale request failed for ${commodity} - ${marketInfo.name}:`, wholesaleResponse.reason);
          } else if (wholesaleResponse.status === "fulfilled" && !wholesaleResponse.value.ok) {
            const errorText = await wholesaleResponse.value.text().catch(() => "Unknown error");
            console.warn(`[MarketPriceService] Wholesale API error for ${commodity}: ${wholesaleResponse.value.status} - ${errorText}`);
          }

          // Skip if both prices are invalid
          if ((retailPrice === null || retailPrice <= 0) && (wholesalePrice === null || wholesalePrice <= 0)) {
            console.warn(`[MarketPriceService] Skipping ${commodity} - ${marketInfo.name}: No valid prices (retail: ${retailPrice}, wholesale: ${wholesalePrice})`);
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
            commodity: commodity.charAt(0).toUpperCase() + commodity.slice(1), // Capitalize first letter
            market: marketInfo.name,
            county: marketInfo.admin1,
            retail: finalRetail,
            wholesale: finalWholesale,
            date: today,
          };

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

          success++;
        } catch (recordError: any) {
          console.error(`[MarketPriceService] Error processing ${commodity} - ${marketInfo.name}:`, recordError);
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

    return onSnapshot(
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
    console.error("Error getting latest price:", error);
    return null;
  }
}

/**
 * Get average price for a commodity across all markets
 */
export async function getAveragePrice(commodity: string, date?: Date): Promise<{ wholesale: number; retail: number } | null> {
  try {
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
    console.error("Error getting average price:", error);
    return null;
  }
}
