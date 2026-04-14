# Testing Market Oracle Enhanced Features

## 🚀 How to Access

### Option 1: Direct URL
1. Start your dev server: `npm run dev`
2. Navigate to: `http://localhost:5173/market-prices-enhanced`
3. Login as a farmer or admin user

### Option 2: Add to Navigation
Add this to your Sidebar navigation:

```typescript
// In src/components/layout/Sidebar.tsx
{
  label: "Market Oracle (Enhanced)",
  route: "/market-prices-enhanced",
  icon: TrendingUp,
  roles: ["farmer", "admin"],
}
```

## 🎨 Features to Test

### 1. **Overview Tab**
- ✅ Market Price Table (existing feature)
- ✅ Price Chart (existing feature)

### 2. **Forecast Tab**
- ✅ **7-Day Price Forecast**: Shows predicted prices for next 7 days with confidence levels
- ✅ **Demand Forecasting**: Holiday/event-based demand predictions
- ✅ **Weather-Price Correlation**: How weather events impact prices

### 3. **Analytics Tab**
- ✅ **Comparative Market Analysis**: Compare prices across multiple markets with transport costs
- ✅ **Seasonal Price Patterns**: 12-month historical trends and best selling months

### 4. **Alerts Tab**
- ✅ **Price Alerts Manager**: Create price threshold alerts with SMS/WhatsApp/Email notifications

## 🎛️ Feature Toggles

Click the **"Feature Toggles"** button in the page header to:
- Enable/disable individual components
- See which features are active
- Test different combinations

## 📊 Sample Data

All components use **mock data** to demonstrate functionality:
- Prices range from KSh 50-100/kg
- 7-day forecasts show realistic price variations
- Market comparisons include 4 major Kenyan markets
- Seasonal patterns show 12-month trends
- Demand events include holidays like Ramadan, Easter, School Opening
- Weather impacts show drought, rain, frost, and wind scenarios

## 🔍 What to Look For

### Visual Elements
- ✅ "UI Mockup" badges on all new components
- ✅ Color-coded severity levels (green/yellow/red)
- ✅ Trend indicators (up/down/flat arrows)
- ✅ Confidence levels (High/Medium/Low)
- ✅ Interactive charts and graphs

### Functionality
- ✅ Create/delete price alerts
- ✅ Toggle alert channels (SMS/WhatsApp/Email)
- ✅ Switch between tabs
- ✅ View detailed market comparisons
- ✅ See seasonal insights

### Responsive Design
- ✅ Test on mobile (resize browser)
- ✅ Test on tablet
- ✅ Test on desktop

## 🐛 Known Limitations

1. **No Backend Integration**: All data is mock/sample data
2. **No Real API Calls**: Components don't fetch from Market Oracle API yet
3. **No Persistence**: Alerts/settings don't save to Firestore
4. **No Notifications**: SMS/WhatsApp/Email alerts don't actually send

## 📝 Testing Checklist

- [ ] Navigate to `/market-prices-enhanced`
- [ ] Click through all 4 tabs (Overview, Forecast, Analytics, Alerts)
- [ ] Open Feature Toggles dialog
- [ ] Toggle features on/off
- [ ] Create a price alert
- [ ] Delete a price alert
- [ ] View 7-day forecast
- [ ] Check seasonal patterns chart
- [ ] Review market comparison
- [ ] Test on mobile view
- [ ] Verify all "UI Mockup" badges are visible

## 🔧 Troubleshooting

### Issue: Page not loading
**Solution**: Make sure you're logged in as a farmer or admin user

### Issue: Components not showing
**Solution**: Check Feature Toggles - they might be disabled

### Issue: Styling looks broken
**Solution**: Clear browser cache and reload

### Issue: TypeScript errors
**Solution**: Run `npm install` to ensure all dependencies are installed

## 📸 Screenshots to Take

1. Overview tab with price table
2. 7-Day forecast component
3. Price alerts manager with alerts created
4. Comparative market analysis
5. Seasonal price patterns chart
6. Demand forecasting events
7. Weather-price correlation
8. Feature toggles dialog

## 🎯 Next Steps After Testing

1. **Provide Feedback**: What works? What needs improvement?
2. **Backend Integration**: Prioritize which features to connect first
3. **Real Data**: Replace mock data with actual Market Oracle API calls
4. **User Testing**: Get farmer feedback on UI/UX
5. **Mobile App**: Port these features to mobile app

## 📞 Support

If you encounter any issues:
1. Check browser console for errors
2. Verify you're on the correct route
3. Ensure you have the latest code (`git pull`)
4. Check that all files were created successfully

---

**Status**: ✅ Ready for Testing | 🎨 UI Complete | ⏳ Backend Integration Pending
