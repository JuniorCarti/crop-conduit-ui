# Marketplace Module - Quick Setup Guide

## 🚀 5-Minute Setup

### Step 1: Update App.tsx

Replace the Marketplace import:

```typescript
// Old
import Marketplace from "./pages/Marketplace";

// New
import MarketplaceEnhanced from "./pages/MarketplaceEnhanced";

// Update route
<Route path="/marketplace" element={<MarketplaceEnhanced />} />
```

### Step 2: Add Environment Variables

Add to your `.env` file:

```env
# M-Pesa (Mock mode for development)
VITE_MPESA_MOCK_MODE=true

# Supabase (for image storage)
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Step 3: Deploy Firestore Rules

```bash
# Copy rules to firestore.rules or merge with existing
cat firestore.marketplace.rules >> firestore.rules

# Deploy
firebase deploy --only firestore:rules
```

### Step 4: Deploy Cloud Functions (Optional for Mock Mode)

If using mock mode (`VITE_MPESA_MOCK_MODE=true`), you can skip this step initially.

For production M-Pesa:

```bash
cd cloud/functions/marketplace
npm install
firebase deploy --only functions
```

### Step 5: Test the Module

1. Start dev server: `npm run dev`
2. Navigate to `/marketplace`
3. Create a test listing
4. Test search and filters
5. Test order creation (mock payment will auto-complete)

## ✅ Verification Checklist

- [ ] Marketplace page loads without errors
- [ ] Can create a listing with images
- [ ] Can search and filter listings
- [ ] Can view listing details
- [ ] Can create an order
- [ ] Payment flow works (mock mode)
- [ ] Chat opens correctly
- [ ] Orders appear in "My Orders" tab

## 🐛 Troubleshooting

**"Failed to load listings"**
- Check Firebase config in `.env`
- Verify Firestore rules are deployed
- Check browser console for errors

**"Images not uploading"**
- Verify Supabase credentials
- Check storage bucket exists and is public
- Check file size < 10MB

**"Payment not working"**
- In mock mode, payment auto-completes after 3 seconds
- Check Cloud Functions logs if using production mode
- Verify phone number format: 254XXXXXXXXX

**"Chat not loading"**
- Verify user is authenticated
- Check Firestore rules allow chat access
- Check browser console for subscription errors

## 📖 Next Steps

1. **Customize UI**: Update components to match your design system
2. **Add Features**: Implement admin dashboard, receipt generation
3. **Production Setup**: Configure real M-Pesa credentials
4. **Monitoring**: Set up error tracking and analytics
5. **Testing**: Add integration tests with Firebase Emulator

## 📚 Full Documentation

See `src/features/marketplace/README.md` for complete documentation.
