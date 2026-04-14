# Market Oracle Agent - Enhanced UI Features (Mockups)

## Overview
This document describes all the new UI components created for the Market Oracle Agent. These are **UI mockups with sample data** and are ready for backend integration.

## 🎨 New Components Created

### 1. **PriceForecast7Day.tsx**
**Location**: `src/components/marketPrices/PriceForecast7Day.tsx`

**Features**:
- 7-day price predictions with confidence intervals
- Price trend indicators (up/down/flat)
- Lower and upper bound price ranges
- Confidence levels (High/Medium/Low)
- Percentage change from current price

**Props**:
```typescript
interface PriceForecast7DayProps {
  commodity: string;
  market: string;
  currentPrice: number;
}
```

**Backend Integration Needed**:
- Extend `/predict` API to accept `days` parameter (1-7)
- Return array of predictions with confidence intervals
- Calculate trend based on historical patterns

---

### 2. **PriceAlertsManager.tsx**
**Location**: `src/components/marketPrices/PriceAlertsManager.tsx`

**Features**:
- Create price threshold alerts (above/below)
- Multi-channel notifications (SMS, WhatsApp, Email)
- Enable/disable alerts with toggle
- Delete alerts
- Visual alert status indicators

**Props**: None (standalone component)

**Backend Integration Needed**:
- Firestore collection: `priceAlerts/{userId}/alerts/{alertId}`
- Cloud Function to monitor prices and trigger alerts
- Twilio/Resend integration for SMS/WhatsApp/Email
- Alert history tracking

**Firestore Schema**:
```typescript
{
  userId: string;
  commodity: string;
  market: string;
  condition: "above" | "below";
  threshold: number;
  enabled: boolean;
  channels: ("sms" | "whatsapp" | "email")[];
  createdAt: Timestamp;
  lastTriggered?: Timestamp;
}
```

---

### 3. **ComparativeMarketAnalysis.tsx**
**Location**: `src/components/marketPrices/ComparativeMarketAnalysis.tsx`

**Features**:
- Side-by-side market comparison
- Transport cost calculation
- Net profit analysis (price - transport)
- Distance and demand indicators
- Recommended market highlighting

**Props**:
```typescript
interface ComparativeMarketAnalysisProps {
  commodity: string;
  currentLocation: string;
}
```

**Backend Integration Needed**:
- Fetch prices from multiple markets simultaneously
- Calculate transport costs using logistics service
- Integrate with Google Maps Distance Matrix API
- Real-time demand indicators from market data

---

### 4. **SeasonalPricePatterns.tsx**
**Location**: `src/components/marketPrices/SeasonalPricePatterns.tsx`

**Features**:
- 12-month historical price chart
- Average, min, max prices per month
- Year-over-year comparison
- Best/worst selling months identification
- Seasonal insights and recommendations

**Props**:
```typescript
interface SeasonalPricePatternsProps {
  commodity: string;
  market: string;
}
```

**Backend Integration Needed**:
- Aggregate historical price data by month
- Calculate 3-year rolling averages
- Identify seasonal patterns using ML
- Store in Firestore: `seasonalPatterns/{commodity}/{market}`

---

### 5. **DemandForecasting.tsx**
**Location**: `src/components/marketPrices/DemandForecasting.tsx`

**Features**:
- Holiday/event-based demand predictions
- Demand increase percentages
- Affected commodities list
- Action recommendations
- Event type categorization (holiday/season/event)

**Props**:
```typescript
interface DemandForecastingProps {
  commodity?: string;
}
```

**Backend Integration Needed**:
- Calendar of Kenyan holidays and events
- Historical demand spike data
- ML model to predict demand based on events
- Firestore collection: `demandEvents/{year}/{eventId}`

**Event Schema**:
```typescript
{
  date: string;
  event: string;
  demandIncrease: number;
  commodities: string[];
  reason: string;
  type: "holiday" | "season" | "event";
}
```

---

### 6. **WeatherPriceCorrelation.tsx**
**Location**: `src/components/marketPrices/WeatherPriceCorrelation.tsx`

**Features**:
- Weather event impact on prices
- Severity levels (Low/Medium/High)
- Price impact percentages
- Projected prices based on weather
- Urgent action recommendations

**Props**:
```typescript
interface WeatherPriceCorrelationProps {
  commodity: string;
  region: string;
}
```

**Backend Integration Needed**:
- Integrate with Climate Intelligence service
- ML model to correlate weather events with price changes
- Historical weather-price data analysis
- Real-time weather alerts from weather API

---

### 7. **MarketPricesEnhanced.tsx** (New Page)
**Location**: `src/pages/MarketPricesEnhanced.tsx`

**Features**:
- Tabbed interface (Overview, Forecast, Analytics, Alerts)
- Feature toggle dialog for UI mockups
- Integrated all new components
- Responsive layout

**Usage**:
```typescript
// Add to router
<Route path="/market-prices-enhanced" element={<MarketPricesEnhanced />} />
```

---

## 🔧 Backend Integration Checklist

### High Priority
- [ ] Extend `/predict` API for 7-day forecasts
- [ ] Create `priceAlerts` Firestore collection
- [ ] Implement alert monitoring Cloud Function
- [ ] Add SMS/WhatsApp/Email notification service

### Medium Priority
- [ ] Build comparative market analysis API
- [ ] Aggregate seasonal price patterns
- [ ] Create demand events calendar
- [ ] Implement weather-price correlation ML model

### Low Priority
- [ ] Add export market intelligence
- [ ] Implement blockchain price verification
- [ ] Create gamification features
- [ ] Add voice-based price queries

---

## 📊 Data Requirements

### New Firestore Collections

1. **priceAlerts**
```
priceAlerts/{userId}/alerts/{alertId}
- commodity, market, condition, threshold, enabled, channels
```

2. **seasonalPatterns**
```
seasonalPatterns/{commodity}/{market}
- monthlyData: { month, avgPrice, minPrice, maxPrice }
- yearOverYear: { year, avgPrice }
```

3. **demandEvents**
```
demandEvents/{year}/{eventId}
- date, event, demandIncrease, commodities, type
```

4. **weatherPriceImpacts**
```
weatherPriceImpacts/{region}/{eventId}
- weatherEvent, severity, priceImpact, affectedCrops
```

---

## 🚀 How to Use

### Enable Enhanced Market Prices Page

1. **Add route to App.tsx**:
```typescript
import MarketPricesEnhanced from "@/pages/MarketPricesEnhanced";

// In routes
<Route path="/market-prices-enhanced" element={<MarketPricesEnhanced />} />
```

2. **Update navigation**:
```typescript
// In Sidebar.tsx or navigation
{
  label: "Market Prices (Enhanced)",
  route: "/market-prices-enhanced",
  icon: TrendingUp,
}
```

3. **Toggle features**:
- Click "Feature Toggles" button in page header
- Enable/disable individual components
- All components use mock data until backend is integrated

---

## 🎯 Next Steps

1. **Phase 1**: Implement 7-day forecast API
2. **Phase 2**: Build price alerts system
3. **Phase 3**: Add comparative market analysis
4. **Phase 4**: Integrate seasonal patterns
5. **Phase 5**: Add demand forecasting
6. **Phase 6**: Implement weather-price correlation

---

## 📝 Notes

- All components have "UI Mockup" badge to indicate they use sample data
- Components are fully functional with mock data
- No changes to existing Market Oracle implementation
- Ready for backend integration without breaking changes
- Mobile-responsive design
- Supports English/Swahili translations (keys need to be added to locales)

---

## 🔗 Related Files

- `src/services/marketOracleService.ts` - Existing Market Oracle service
- `src/services/marketPriceService.ts` - Existing price service
- `src/hooks/useMarketOraclePrediction.ts` - Existing prediction hook
- `src/pages/MarketPrices.tsx` - Original market prices page (unchanged)

---

**Status**: ✅ UI Complete | ⏳ Backend Integration Pending
