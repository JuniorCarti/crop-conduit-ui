/**
 * API Service Layer - Dummy Implementation
 * 
 * This file contains all API endpoints returning realistic dummy data.
 * When integrating with a real backend, replace these functions with actual HTTP calls.
 * 
 * TODO: Replace with real API endpoints:
 * - Oracle Agent: Market price APIs (e.g., commodity exchanges, market data providers)
 * - Sentinel Agent: Satellite imagery APIs (e.g., Sentinel-2, Google Earth Engine)
 * - Quartermaster Agent: Resource management APIs
 * - Foreman Agent: Harvest planning APIs
 * - Chancellor Agent: Financial APIs (e.g., loan providers, insurance APIs)
 * - Marketplace: E-commerce APIs
 * - Community: Social/forum APIs
 */

import { format, subDays, subWeeks, subMonths } from "date-fns";
import { collection, getDocs, limit, orderBy, query, Timestamp, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { subscribeToCashFlowForecasts } from "./firestore-finance";
import { getAveragePrice, getMarketPrices, syncMarketForecastWithFallback } from "./marketPriceService";
import { getEstimatedSupply } from "./nextHarvestService";

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.cropconduit.com';
const DEFAULT_DELAY = 500; // Simulate 500ms network latency

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

// Oracle Agent Types
export interface CropPrice {
  id: number;
  name: string;
  price: number;
  unit: string;
  change: number;
  trend: 'up' | 'down';
  lastUpdated: string;
}

export interface PriceHistory {
  date: string;
  [cropName: string]: string | number;
}

export interface RecommendedMarket {
  id: number;
  name: string;
  distance: string;
  bestFor: string;
  avgPrice: number;
  location: string;
}

export interface PricePrediction {
  crop: string;
  currentPrice: number;
  predictedPrice: number;
  confidence: number;
  timeframe: string;
}

// Sentinel Agent Types
export interface FieldData {
  id: number;
  name: string;
  crop: string;
  area: string;
  ndvi: number;
  moisture: number;
  health: 'Excellent' | 'Good' | 'Moderate' | 'Needs Attention';
  lastUpdated: string;
}

export interface NDVIHistory {
  week: string;
  [fieldName: string]: string | number;
}

export interface YieldForecast {
  field: string;
  current: number;
  projected: number;
  unit: string;
  confidence: number;
}

// Quartermaster Agent Types
export interface InventoryItem {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  status: 'Sufficient' | 'Low' | 'Critical';
  reorderAt: number;
  lastUpdated: string;
}

export interface Recommendation {
  id: number;
  type: 'Fertilizer' | 'Irrigation' | 'Pesticide' | 'Seed';
  product?: string;
  action?: string;
  amount: string;
  field: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

export interface IrrigationSchedule {
  day: string;
  field: string;
  duration: string;
  time: string;
  status: 'scheduled' | 'completed' | 'skipped';
}

// Foreman Agent Types
export interface HarvestSchedule {
  id: number;
  field: string;
  crop: string;
  optimalDate: string;
  status: 'Ready' | 'Pending' | 'Upcoming' | 'Completed';
  workers: number;
  estimatedYield: number;
}

export interface Worker {
  id: number;
  name: string;
  role: string;
  status: 'Available' | 'On Task' | 'Unavailable';
  rating: number;
  phone?: string;
}

export interface DeliverySchedule {
  id: number;
  destination: string;
  date: string;
  cargo: string;
  status: 'Scheduled' | 'Pending' | 'In Transit' | 'Delivered';
  driver?: string;
}

export interface StorageRecommendation {
  id: number;
  crop: string;
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
}

// Chancellor Agent Types
export interface CashflowData {
  month: string;
  income: number;
  expenses: number;
}

export interface LoanOption {
  id: number;
  provider: string;
  amount: number;
  rate: string;
  term: string;
  status: 'Eligible' | 'Pending' | 'Rejected';
  monthlyPayment?: number;
}

export interface InsuranceOption {
  id: number;
  type: string;
  coverage: string;
  premium: number;
  provider: string;
}

export interface RiskAnalysis {
  weatherRisk: { level: 'Low' | 'Medium' | 'High'; value: number };
  marketRisk: { level: 'Low' | 'Medium' | 'High'; value: number };
  pestRisk: { level: 'Low' | 'Medium' | 'High'; value: number };
}

export interface RevenueProjection {
  month: string;
  projected: number;
  actual?: number;
  confidence: number;
}

// Marketplace Types
export interface Listing {
  id: number;
  title: string;
  price: number;
  seller: string;
  location: string;
  rating: number;
  image: string;
  quantity: number;
  unit: string;
  description?: string;
  createdAt: string;
}

export interface Transaction {
  id: number;
  item: string;
  buyer: string;
  amount: number;
  date: string;
  status: 'Completed' | 'In Progress' | 'Cancelled';
  rating?: number;
}

export interface ChatMessage {
  id: number;
  sender: string;
  message: string;
  timestamp: string;
  isOwn: boolean;
}

// Community Types
export interface ForumPost {
  id: number;
  title: string;
  author: string;
  replies: number;
  views: number;
  time: string;
  category?: string;
  content?: string;
}

export interface Event {
  id: number;
  title: string;
  date: string;
  location: string;
  attendees: number;
  description?: string;
}

export interface KnowledgeResource {
  id: number;
  title: string;
  category: string;
  icon: string;
  type: 'Guide' | 'Video' | 'Article' | 'Course';
  url?: string;
}

// Dashboard Types
export interface Alert {
  id: number;
  type: 'warning' | 'info' | 'success' | 'error';
  title: string;
  message: string;
  timestamp: string;
  actionUrl?: string;
}

// ============================================================================
// ORACLE AGENT API (Market Forecasting)
// ============================================================================

export const oracleApi = {
  /**
   * Get current market prices for all crops
   * Fetches from Render API and syncs to Firestore, with fallback to cached data
   */
  async getCropPrices(): Promise<CropPrice[]> {
    try {
      // Sync from Render API /predict endpoint (with fallback to cached data)
      // The sync function has built-in guards to prevent concurrent calls and loops
      // Run sync in background - don't wait for it to complete
      syncMarketForecastWithFallback().catch((syncError) => {
        console.warn("[OracleApi] Render API /predict sync failed, using cached data:", syncError);
        // Continue with cached data - don't throw error
      });
      
      // Get latest prices for common commodities
      // Note: Commodity names must match what's stored in Firestore (capitalized first letter)
      const commodities = ["Tomatoes", "Onions", "Irish potato", "Kale", "Cabbage"];
      const prices: CropPrice[] = [];
      
      // Get prices from last 7 days
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      
      for (const commodity of commodities) {
        try {
          // Get average price for the commodity
          const avgPrice = await getAveragePrice(commodity, startDate);
          if (avgPrice) {
            // Get latest price to calculate change
            const latestPrice = await getMarketPrices({
              commodity,
              limitCount: 1,
            });
            
            const previousPrice = await getMarketPrices({
              commodity,
              startDate: new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days before
              endDate: startDate,
              limitCount: 1,
            });
            
            const currentPrice = latestPrice[0]?.retail || avgPrice.retail;
            const prevPrice = previousPrice[0]?.retail || currentPrice;
            const change = prevPrice > 0 ? ((currentPrice - prevPrice) / prevPrice) * 100 : 0;
            
            // Format commodity name for display (capitalize properly)
            const displayName = commodity === "Irish potato" ? "Irish Potato" : 
                                commodity.charAt(0).toUpperCase() + commodity.slice(1);
            
            prices.push({
              id: prices.length + 1,
              name: displayName,
              price: Math.round(currentPrice),
              unit: "per kg",
              change: Math.round(change * 10) / 10,
              trend: change >= 0 ? "up" : "down",
              lastUpdated: latestPrice[0]?.date?.toISOString() || new Date().toISOString(),
            });
          }
        } catch (error) {
          console.warn(`[OracleApi] Error fetching price for ${commodity}:`, error);
        }
      }
      
      // If no real data, return empty array (or fallback to dummy if needed)
      if (prices.length === 0) {
        console.warn("[OracleApi] No market prices found, returning empty array");
        return [];
      }
      
      return prices.sort((a, b) => b.price - a.price);
    } catch (error) {
      console.error("[OracleApi] Error fetching crop prices:", error);
      // Fallback to empty array on error
      return [];
    }
  },

  /**
   * Get price history for crops from Firestore
   */
  async getPriceHistory(period: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<PriceHistory[]> {
    try {
      // Calculate date range based on period
      let startDate: Date;
      const endDate = new Date();
      
      switch (period) {
        case "daily":
          startDate = subDays(endDate, 30);
          break;
        case "weekly":
          startDate = subWeeks(endDate, 12);
          break;
        case "monthly":
          startDate = subMonths(endDate, 12);
          break;
        default:
          startDate = subDays(endDate, 30);
      }
      
      // Get prices for common crops
      const crops = ["Maize", "Wheat", "Sorghum", "Tomato"];
      const historyMap = new Map<string, any>();
      
      for (const crop of crops) {
        const prices = await getMarketPrices({
          commodity: crop,
          startDate,
          endDate,
          limitCount: 1000,
        });
        
        // Group by date period
        prices.forEach((price) => {
          let dateKey: string;
          const priceDate = price.date instanceof Date ? price.date : new Date(price.date);
          
          switch (period) {
            case "daily":
              dateKey = format(priceDate, "MMM dd");
              break;
            case "weekly":
              dateKey = format(priceDate, "MMM dd");
              break;
            case "monthly":
              dateKey = format(priceDate, "MMM");
              break;
            default:
              dateKey = format(priceDate, "MMM dd");
          }
          
          if (!historyMap.has(dateKey)) {
            historyMap.set(dateKey, { date: dateKey });
          }
          
          const entry = historyMap.get(dateKey);
          const cropKey = crop.toLowerCase();
          if (!entry[cropKey]) {
            entry[cropKey] = [];
          }
          entry[cropKey].push(price.retail);
        });
      }
      
      // Calculate averages and format
      const history: PriceHistory[] = Array.from(historyMap.values()).map((entry) => {
        const result: any = { date: entry.date };
        crops.forEach((crop) => {
          const cropKey = crop.toLowerCase();
          if (entry[cropKey] && entry[cropKey].length > 0) {
            const avg = entry[cropKey].reduce((a: number, b: number) => a + b, 0) / entry[cropKey].length;
            result[cropKey] = Math.round(avg);
          }
        });
        return result;
      });
      
      // Sort by date
      return history.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA.getTime() - dateB.getTime();
      });
    } catch (error) {
      console.error("Error fetching price history:", error);
      return [];
    }
  },

  /**
   * Get recommended markets based on location and crop from Firestore
   * Also considers upcoming harvest supply
   */
  async getRecommendedMarkets(crop?: string): Promise<RecommendedMarket[]> {
    try {
      // Get prices for the specified crop or all crops
      const prices = await getMarketPrices({
        commodity: crop,
        limitCount: 100,
      });
      
      // Group by market and calculate averages
      const marketMap = new Map<string, { prices: number[]; commodity: string; county: string }>();
      
      prices.forEach((price) => {
        if (!marketMap.has(price.market)) {
          marketMap.set(price.market, { prices: [], commodity: price.commodity, county: price.county });
        }
        const market = marketMap.get(price.market)!;
        market.prices.push(price.retail);
      });
      
      // Convert to RecommendedMarket format
      const markets: RecommendedMarket[] = Array.from(marketMap.entries()).map(([name, data], index) => {
        const avgPrice = data.prices.reduce((a, b) => a + b, 0) / data.prices.length;
        return {
          id: index + 1,
          name,
          distance: "N/A", // Could calculate from user location
          bestFor: data.commodity,
          avgPrice: Math.round(avgPrice),
          location: data.county || "Kenya",
        };
      });
      
      // Sort by average price (highest first)
      // Also consider supply forecasts for better recommendations
      const marketsWithSupply = await Promise.all(
        markets.map(async (market) => {
          try {
            // Get estimated supply for the crop in this market's county
            // This helps recommend markets where supply might be lower (better prices)
            // Simplified - in production, get userId from context
            // For now, just return market as-is
            return market;
          } catch (error) {
            return market;
          }
        })
      );
      
      return marketsWithSupply.sort((a, b) => b.avgPrice - a.avgPrice).slice(0, 10);
    } catch (error) {
      console.error("Error fetching recommended markets:", error);
      return [];
    }
  },

  /**
   * Get price predictions for crops
   * Uses market prices and supply forecasts
   */
  async getPricePredictions(crop?: string): Promise<PricePrediction[]> {
    try {
      // Get current user (simplified - in production pass userId)
      // For now, get prices for all users' crops
      const commodities = crop ? [crop] : ["Tomato", "Onion", "Avocado", "Mango", "Irish Potato", "Maize", "Wheat", "Sorghum"];
      const predictions: PricePrediction[] = [];
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      
      for (const commodity of commodities) {
        try {
          const avgPrice = await getAveragePrice(commodity, startDate);
          if (avgPrice) {
            // Simple prediction: if supply is high, price may drop; if low, price may rise
            // In production, use ML model
            const latestPrices = await getMarketPrices({
              commodity,
              limitCount: 10,
            });
            
            if (latestPrices.length > 0) {
              const currentPrice = latestPrices[0].retail;
              const priceTrend = latestPrices.length > 1 
                ? latestPrices[0].retail - latestPrices[latestPrices.length - 1].retail
                : 0;
              
              // Simple prediction: continue trend with 70% confidence
              const predictedPrice = currentPrice + (priceTrend * 0.7);
              
              predictions.push({
                crop: commodity,
                currentPrice: Math.round(currentPrice),
                predictedPrice: Math.round(predictedPrice),
                confidence: 0.75,
                timeframe: "7 days",
              });
            }
          }
        } catch (error) {
          console.warn(`Error predicting price for ${commodity}:`, error);
        }
      }
      
      return predictions;
    } catch (error) {
      console.error("Error getting price predictions:", error);
      return [];
    }
  },
};

// ============================================================================
// SENTINEL AGENT API (Crop Intelligence)
// ============================================================================

export const sentinelApi = {
  /**
   * Get field monitoring data
   * TODO: Replace with Sentinel-2 satellite imagery API or Google Earth Engine
   */
  async getFieldData(): Promise<FieldData[]> {
    await delay(DEFAULT_DELAY);
    return [
      { id: 1, name: "North Field", crop: "Maize", area: "5 ha", ndvi: 0.78, moisture: 65, health: "Good", lastUpdated: new Date().toISOString() },
      { id: 2, name: "South Field", crop: "Wheat", area: "3 ha", ndvi: 0.62, moisture: 45, health: "Moderate", lastUpdated: new Date().toISOString() },
      { id: 3, name: "East Plot", crop: "Sorghum", area: "2 ha", ndvi: 0.85, moisture: 72, health: "Excellent", lastUpdated: new Date().toISOString() },
      { id: 4, name: "West Garden", crop: "Groundnuts", area: "1.5 ha", ndvi: 0.55, moisture: 38, health: "Needs Attention", lastUpdated: new Date().toISOString() },
    ];
  },

  /**
   * Get NDVI history for fields
   * TODO: Replace with satellite imagery time series API
   */
  async getNDVIHistory(fieldId?: number): Promise<NDVIHistory[]> {
    await delay(DEFAULT_DELAY);
    return [
      { week: "W1", north: 0.65, south: 0.58, east: 0.70 },
      { week: "W2", north: 0.68, south: 0.60, east: 0.75 },
      { week: "W3", north: 0.72, south: 0.61, east: 0.78 },
      { week: "W4", north: 0.75, south: 0.62, east: 0.82 },
      { week: "W5", north: 0.78, south: 0.62, east: 0.85 },
    ];
  },

  /**
   * Get yield forecasts
   * TODO: Replace with ML-based yield prediction API
   */
  async getYieldForecasts(): Promise<YieldForecast[]> {
    await delay(DEFAULT_DELAY);
    return [
      { field: "North Field", current: 4.2, projected: 4.8, unit: "tons/ha", confidence: 0.88 },
      { field: "South Field", current: 2.8, projected: 3.1, unit: "tons/ha", confidence: 0.75 },
      { field: "East Plot", current: 3.5, projected: 4.0, unit: "tons/ha", confidence: 0.82 },
    ];
  },

  /**
   * Get soil moisture data
   * TODO: Replace with soil sensor API or satellite-derived soil moisture data
   */
  async getSoilMoisture(fieldId?: number): Promise<number> {
    await delay(DEFAULT_DELAY);
    return Math.floor(Math.random() * 40) + 40; // Random between 40-80
  },
};

// ============================================================================
// QUARTERMASTER AGENT API (Resource Management)
// ============================================================================

export const quartermasterApi = {
  /**
   * Get inventory items
   * TODO: Replace with inventory management API
   */
  async getInventory(): Promise<InventoryItem[]> {
    await delay(DEFAULT_DELAY);
    return [
      { id: 1, name: "NPK Fertilizer", quantity: 250, unit: "kg", status: "Sufficient", reorderAt: 100, lastUpdated: new Date().toISOString() },
      { id: 2, name: "Maize Seeds", quantity: 45, unit: "kg", status: "Low", reorderAt: 50, lastUpdated: new Date().toISOString() },
      { id: 3, name: "Pesticide A", quantity: 12, unit: "liters", status: "Sufficient", reorderAt: 5, lastUpdated: new Date().toISOString() },
      { id: 4, name: "Herbicide", quantity: 8, unit: "liters", status: "Low", reorderAt: 10, lastUpdated: new Date().toISOString() },
    ];
  },

  /**
   * Get AI-powered recommendations
   * TODO: Replace with recommendation engine API
   */
  async getRecommendations(): Promise<Recommendation[]> {
    await delay(DEFAULT_DELAY);
    return [
      { id: 1, type: "Fertilizer", product: "Urea", amount: "50 kg/ha", field: "South Field", reason: "Low nitrogen levels", priority: "high" },
      { id: 2, type: "Irrigation", action: "Increase", amount: "2 hours/day", field: "West Garden", reason: "Low soil moisture", priority: "high" },
      { id: 3, type: "Pesticide", product: "Neem Oil", amount: "2 liters/ha", field: "North Field", reason: "Pest activity detected", priority: "medium" },
    ];
  },

  /**
   * Get irrigation schedule
   * TODO: Replace with irrigation management API
   */
  async getIrrigationSchedule(): Promise<IrrigationSchedule[]> {
    await delay(DEFAULT_DELAY);
    return [
      { day: "Mon", field: "North Field", duration: "4 hrs", time: "6:00 AM", status: "scheduled" },
      { day: "Tue", field: "South Field", duration: "3 hrs", time: "6:00 AM", status: "scheduled" },
      { day: "Wed", field: "East Plot", duration: "2 hrs", time: "5:30 AM", status: "scheduled" },
      { day: "Thu", field: "West Garden", duration: "4 hrs", time: "6:00 AM", status: "scheduled" },
      { day: "Fri", field: "North Field", duration: "4 hrs", time: "6:00 AM", status: "scheduled" },
    ];
  },

  /**
   * Add inventory item
   * TODO: Replace with POST request to inventory API
   */
  async addInventoryItem(item: Omit<InventoryItem, 'id' | 'lastUpdated'>): Promise<InventoryItem> {
    await delay(DEFAULT_DELAY);
    return {
      ...item,
      id: Date.now(),
      lastUpdated: new Date().toISOString(),
    };
  },
};

// ============================================================================
// FOREMAN AGENT API (Harvest & Logistics)
// ============================================================================

export const foremanApi = {
  /**
   * Get harvest schedule
   * TODO: Replace with harvest planning API
   */
  async getHarvestSchedule(): Promise<HarvestSchedule[]> {
    await delay(DEFAULT_DELAY);
    return [
      { id: 1, field: "North Field", crop: "Maize", optimalDate: "Dec 15, 2024", status: "Ready", workers: 8, estimatedYield: 24 },
      { id: 2, field: "East Plot", crop: "Sorghum", optimalDate: "Dec 20, 2024", status: "Pending", workers: 5, estimatedYield: 8 },
      { id: 3, field: "South Field", crop: "Wheat", optimalDate: "Jan 5, 2025", status: "Upcoming", workers: 6, estimatedYield: 9 },
    ];
  },

  /**
   * Get available workers
   * TODO: Replace with workforce management API
   */
  async getWorkers(): Promise<Worker[]> {
    await delay(DEFAULT_DELAY);
    return [
      { id: 1, name: "James Kariuki", role: "Harvester", status: "Available", rating: 4.8, phone: "+254 712 345 678" },
      { id: 2, name: "Mary Wanjiku", role: "Driver", status: "On Task", rating: 4.9, phone: "+254 723 456 789" },
      { id: 3, name: "Peter Mwangi", role: "Harvester", status: "Available", rating: 4.6, phone: "+254 734 567 890" },
      { id: 4, name: "Grace Njeri", role: "Supervisor", status: "Available", rating: 5.0, phone: "+254 745 678 901" },
    ];
  },

  /**
   * Get delivery schedule
   * TODO: Replace with logistics API
   */
  async getDeliverySchedule(): Promise<DeliverySchedule[]> {
    await delay(DEFAULT_DELAY);
    return [
      { id: 1, destination: "Nairobi Wakulima Market", date: "Dec 16, 2024", cargo: "5 tons Maize", status: "Scheduled", driver: "Mary Wanjiku" },
      { id: 2, destination: "Eldoret Warehouse", date: "Dec 22, 2024", cargo: "3 tons Sorghum", status: "Pending" },
    ];
  },

  /**
   * Get storage recommendations
   * TODO: Replace with storage management API
   */
  async getStorageRecommendations(): Promise<StorageRecommendation[]> {
    await delay(DEFAULT_DELAY);
    return [
      { id: 1, crop: "Maize", recommendation: "Store at 13% moisture content or below", priority: "high" },
      { id: 2, crop: "Maize", recommendation: "Use hermetic bags for pest prevention", priority: "high" },
      { id: 3, crop: "General", recommendation: "Check storage temperature weekly", priority: "medium" },
    ];
  },
};

// ============================================================================
// CHANCELLOR AGENT API (Finance & Business)
// ============================================================================

export const chancellorApi = {
  /**
   * Get cashflow data
   * TODO: Replace with financial API
   */
  async getCashflow(): Promise<CashflowData[]> {
    try {
      // Get last 6 months of cashflow
      const startDate = subMonths(new Date(), 6);
      
      // Query cashflow forecasts
      const q = query(
        collection(db, "cashFlowForecasts"),
        where("date", ">=", Timestamp.fromDate(startDate)),
        orderBy("date", "asc"),
        limit(200)
      );
      
      const snapshot = await getDocs(q);
      const monthlyData = new Map<string, { income: number; expenses: number }>();
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const date = data.date?.toDate() || new Date();
        const monthKey = format(date, "MMM");
        
        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, { income: 0, expenses: 0 });
        }
        
        const monthData = monthlyData.get(monthKey)!;
        monthData.income += data.inflow || 0;
        monthData.expenses += data.outflow || 0;
      });
      
      // Convert to array format
      const cashflow: CashflowData[] = Array.from(monthlyData.entries()).map(([month, data]) => ({
        month,
        income: Math.round(data.income),
        expenses: Math.round(data.expenses),
      }));
      
      // If we have data, return it, otherwise return empty array
      return cashflow.length > 0 ? cashflow : [];
    } catch (error) {
      console.error("Error fetching cashflow:", error);
      return [];
    }
  },

  /**
   * Get loan options
   * TODO: Replace with financial services API (e.g., loan aggregator API)
   */
  async getLoanOptions(): Promise<LoanOption[]> {
    await delay(DEFAULT_DELAY);
    return [
      { id: 1, provider: "Kenya Commercial Bank", amount: 6500000, rate: "8.5%", term: "12 months", status: "Eligible", monthlyPayment: 565500 },
      { id: 2, provider: "Equity Bank AgriCredit", amount: 3900000, rate: "10%", term: "6 months", status: "Eligible", monthlyPayment: 682500 },
      { id: 3, provider: "Juhudi Kilimo", amount: 1950000, rate: "12%", term: "3 months", status: "Eligible", monthlyPayment: 669500 },
      { id: 4, provider: "Cooperative Bank", amount: 5200000, rate: "9%", term: "9 months", status: "Eligible", monthlyPayment: 600000 },
    ];
  },

  /**
   * Get insurance options
   * TODO: Replace with insurance API
   */
  async getInsuranceOptions(): Promise<InsuranceOption[]> {
    await delay(DEFAULT_DELAY);
    return [
      { id: 1, type: "Crop Insurance", coverage: "Weather damage", premium: 65000, provider: "APA Insurance" },
      { id: 2, type: "Livestock Insurance", coverage: "Disease & theft", premium: 45500, provider: "CIC Insurance" },
      { id: 3, type: "Equipment Insurance", coverage: "Breakdown & damage", premium: 26000, provider: "APA Insurance" },
      { id: 4, type: "Comprehensive Farm Insurance", coverage: "All risks", premium: 130000, provider: "UAP Insurance" },
    ];
  },

  /**
   * Get risk analysis
   * TODO: Replace with risk assessment API
   */
  async getRiskAnalysis(): Promise<RiskAnalysis> {
    await delay(DEFAULT_DELAY);
    return {
      weatherRisk: { level: "Medium", value: 45 },
      marketRisk: { level: "Low", value: 25 },
      pestRisk: { level: "High", value: 70 },
    };
  },

  /**
   * Get revenue projections
   * TODO: Replace with financial forecasting API
   */
  async getRevenueProjections(): Promise<RevenueProjection[]> {
    await delay(DEFAULT_DELAY);
    return [
      { month: "Jan", projected: 3900000, confidence: 0.85 },
      { month: "Feb", projected: 4160000, confidence: 0.82 },
      { month: "Mar", projected: 4550000, confidence: 0.88 },
    ];
  },
};

// ============================================================================
// MARKETPLACE API
// ============================================================================

export const marketplaceApi = {
  /**
   * Get crop listings
   * TODO: Replace with e-commerce API
   */
  async getListings(search?: string): Promise<Listing[]> {
    await delay(DEFAULT_DELAY);
    const listings: Listing[] = [
      { id: 1, title: "Fresh Maize - 500kg", price: 175000, seller: "John Kamau", location: "Nairobi", rating: 4.8, image: "maize", quantity: 500, unit: "kg", createdAt: new Date().toISOString() },
      { id: 2, title: "Organic Wheat - 200kg", price: 90000, seller: "Mary Wanjiru", location: "Nakuru", rating: 4.9, image: "wheat", quantity: 200, unit: "kg", createdAt: new Date().toISOString() },
      { id: 3, title: "Premium Sorghum - 300kg", price: 84000, seller: "Peter Mwangi", location: "Eldoret", rating: 4.7, image: "sorghum", quantity: 300, unit: "kg", createdAt: new Date().toISOString() },
      { id: 4, title: "Groundnuts - 100kg", price: 85000, seller: "Grace Njeri", location: "Kisumu", rating: 4.6, image: "groundnuts", quantity: 100, unit: "kg", createdAt: new Date().toISOString() },
      { id: 5, title: "Fresh Tomatoes - 50kg", price: 7000, seller: "David Ochieng", location: "Nairobi", rating: 4.9, image: "tomatoes", quantity: 50, unit: "kg", createdAt: new Date().toISOString() },
      { id: 6, title: "Beans - 100kg", price: 18000, seller: "Sarah Achieng", location: "Kisumu", rating: 4.7, image: "beans", quantity: 100, unit: "kg", createdAt: new Date().toISOString() },
    ];
    
    if (search) {
      return listings.filter(l => 
        l.title.toLowerCase().includes(search.toLowerCase()) ||
        l.location.toLowerCase().includes(search.toLowerCase())
      );
    }
    return listings;
  },

  /**
   * Get transaction history
   * TODO: Replace with transaction API
   */
  async getTransactions(): Promise<Transaction[]> {
    await delay(DEFAULT_DELAY);
    return [
      { id: 1, item: "Maize 200kg", buyer: "Nairobi Agro Traders", amount: 70000, date: "Nov 28, 2024", status: "Completed", rating: 5 },
      { id: 2, item: "Wheat 150kg", buyer: "Nakuru Food Mart", amount: 67500, date: "Nov 25, 2024", status: "Completed", rating: 4 },
      { id: 3, item: "Sorghum 100kg", buyer: "Local Buyer", amount: 28000, date: "Dec 1, 2024", status: "In Progress" },
      { id: 4, item: "Tomatoes 50kg", buyer: "Eldoret Market", amount: 7000, date: "Dec 5, 2024", status: "Completed", rating: 5 },
    ];
  },

  /**
   * Get chat messages for a listing
   * TODO: Replace with real-time chat API (e.g., WebSocket, Firebase)
   */
  async getChatMessages(listingId: number): Promise<ChatMessage[]> {
    await delay(DEFAULT_DELAY);
    return [
      { id: 1, sender: "You", message: "Hello! I'm interested in your crop listing. Is it still available?", timestamp: "10:30 AM", isOwn: true },
      { id: 2, sender: "Seller", message: "Yes, it's available! The quality is excellent, harvested last week.", timestamp: "10:32 AM", isOwn: false },
    ];
  },

  /**
   * Create a new listing
   * TODO: Replace with POST request to marketplace API
   */
  async createListing(listing: Omit<Listing, 'id' | 'createdAt'>): Promise<Listing> {
    await delay(DEFAULT_DELAY);
    return {
      ...listing,
      id: Date.now(),
      createdAt: new Date().toISOString(),
    };
  },
};

// ============================================================================
// COMMUNITY API
// ============================================================================

export const communityApi = {
  /**
   * Get forum posts
   * TODO: Replace with forum API
   */
  async getForumPosts(search?: string): Promise<ForumPost[]> {
    await delay(DEFAULT_DELAY);
    const posts: ForumPost[] = [
      { id: 1, title: "Best practices for maize storage", author: "FarmerJoe", replies: 23, views: 156, time: "2 hours ago", category: "Storage" },
      { id: 2, title: "Dealing with fall armyworm", author: "AgriExpert", replies: 45, views: 289, time: "5 hours ago", category: "Pest Control" },
      { id: 3, title: "Organic fertilizer recipes", author: "GreenThumb", replies: 18, views: 98, time: "1 day ago", category: "Fertilizer" },
      { id: 4, title: "Water conservation techniques", author: "SmartFarm", replies: 31, views: 201, time: "2 days ago", category: "Irrigation" },
    ];
    
    if (search) {
      return posts.filter(p => 
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.author.toLowerCase().includes(search.toLowerCase())
      );
    }
    return posts;
  },

  /**
   * Get events calendar
   * TODO: Replace with events API
   */
  async getEvents(): Promise<Event[]> {
    await delay(DEFAULT_DELAY);
    return [
      { id: 1, title: "Farmers Training Workshop", date: "Dec 10, 2024", location: "Kumasi Agri Center", attendees: 45, description: "Hands-on training sessions" },
      { id: 2, title: "Seed Fair 2024", date: "Dec 15, 2024", location: "Tamale Exhibition Hall", attendees: 120, description: "Annual seed exhibition" },
      { id: 3, title: "Smart Farming Webinar", date: "Dec 18, 2024", location: "Online", attendees: 89, description: "Digital agriculture webinar" },
    ];
  },

  /**
   * Get knowledge resources
   * TODO: Replace with knowledge base API
   */
  async getKnowledgeResources(): Promise<KnowledgeResource[]> {
    await delay(DEFAULT_DELAY);
    return [
      { id: 1, title: "Crop Disease Identification", category: "Guides", icon: "📚", type: "Guide" },
      { id: 2, title: "Organic Farming Basics", category: "Videos", icon: "🎥", type: "Video" },
      { id: 3, title: "Market Pricing Strategies", category: "Articles", icon: "📄", type: "Article" },
      { id: 4, title: "Climate-Smart Agriculture", category: "Courses", icon: "🎓", type: "Course" },
    ];
  },

  /**
   * Create a new forum post
   * TODO: Replace with POST request to forum API
   */
  async createPost(post: Omit<ForumPost, 'id' | 'replies' | 'views' | 'time'>): Promise<ForumPost> {
    await delay(DEFAULT_DELAY);
    return {
      ...post,
      id: Date.now(),
      replies: 0,
      views: 0,
      time: "just now",
    };
  },
};

// ============================================================================
// DASHBOARD API
// ============================================================================

export const dashboardApi = {
  /**
   * Get all alerts/notifications
   * TODO: Replace with notification API
   */
  async getAlerts(): Promise<Alert[]> {
    try {
      const alerts: Alert[] = [];
      
      // Get alerts from various sources
      // 1. Price alerts (from market prices)
      try {
        const recentPrices = await getMarketPrices({
          limitCount: 20,
        });
        
        // Check for significant price changes
        const priceChanges = new Map<string, { current: number; previous: number }>();
        
        for (const price of recentPrices) {
          const key = `${price.commodity}_${price.market}`;
          if (!priceChanges.has(key)) {
            // Get previous price (7 days ago)
            const previousDate = new Date(price.date);
            previousDate.setDate(previousDate.getDate() - 7);
            const previousPrices = await getMarketPrices({
              commodity: price.commodity,
              market: price.market,
              startDate: previousDate,
              endDate: price.date,
              limitCount: 1,
            });
            
            if (previousPrices.length > 0) {
              const change = ((price.retail - previousPrices[0].retail) / previousPrices[0].retail) * 100;
              if (Math.abs(change) > 5) {
                alerts.push({
                  id: alerts.length + 1,
                  type: change > 0 ? "success" : "warning",
                  title: `${price.commodity} Price ${change > 0 ? "Increase" : "Drop"}`,
                  message: `${price.commodity} prices ${change > 0 ? "increased" : "dropped"} by ${Math.abs(change).toFixed(1)}% in ${price.market}`,
                  timestamp: price.date instanceof Date ? price.date.toISOString() : new Date(price.date).toISOString(),
                });
              }
            }
          }
        }
      } catch (error) {
        console.warn("Error fetching price alerts:", error);
      }
      
      // 2. Finance alerts (from finance module)
      try {
        // This would need userId - for now, skip or use a different approach
      } catch (error) {
        console.warn("Error fetching finance alerts:", error);
      }
      
      // Sort by timestamp (newest first) and limit to 10
      return alerts
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      return [];
    }
  },
};

