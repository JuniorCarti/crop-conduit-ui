# Marketplace Module - Complete Implementation Guide

## Overview

The Marketplace module provides a comprehensive buyer-seller platform for agricultural products with:
- Listing creation and management
- Real-time search and filtering
- Secure payment via M-Pesa STK Push
- Escrow system for safe transactions
- Real-time chat with negotiation
- Order management and tracking
- Rating and review system
- Dispute resolution

## Architecture

```
src/features/marketplace/
├── components/          # React UI components
│   ├── ListingCard.tsx
│   ├── CreateListingForm.tsx
│   ├── ChatWindow.tsx
│   └── PaymentCheckout.tsx
├── hooks/              # React hooks for data fetching
│   └── useMarketplace.ts
├── models/             # TypeScript type definitions
│   └── types.ts
├── pages/              # Full page components
│   ├── MarketplaceBrowse.tsx
│   ├── MarketplaceListingDetail.tsx
│   └── MarketplaceOrders.tsx
└── services/           # Business logic services
    ├── ListingService.ts
    ├── OrderService.ts
    ├── PaymentService.ts
    ├── ChatService.ts
    ├── RatingService.ts
    └── DisputeService.ts

cloud/functions/marketplace/
└── index.ts            # Firebase Cloud Functions
```

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the project root:

```env
# Firebase
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id

# Supabase (for file storage)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# M-Pesa (Sandbox for testing)
VITE_MPESA_MOCK_MODE=true  # Set to false for production
MPESA_CONSUMER_KEY=your-consumer-key
MPESA_CONSUMER_SECRET=your-consumer-secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your-passkey
MPESA_ENV=sandbox  # or "production"

# Firebase Emulator (optional)
VITE_USE_FIREBASE_EMULATOR=false
```

### 2. Install Dependencies

```bash
# Frontend dependencies (already in package.json)
npm install

# Cloud Functions dependencies
cd cloud/functions/marketplace
npm install firebase-functions firebase-admin axios
npm install --save-dev @types/node typescript
```

### 3. Firebase Setup

#### Initialize Firebase in your project:
```bash
firebase init
```

#### Deploy Firestore Rules:
```bash
firebase deploy --only firestore:rules
```

#### Deploy Cloud Functions:
```bash
firebase deploy --only functions:marketplace-initiatePayment,functions:marketplace-mpesaCallback,functions:marketplace-releaseEscrow
```

#### Set Cloud Function Configuration:
```bash
firebase functions:config:set \
  mpesa.consumer_key="your-key" \
  mpesa.consumer_secret="your-secret" \
  mpesa.shortcode="174379" \
  mpesa.passkey="your-passkey" \
  mpesa.env="sandbox" \
  app.callback_url="https://your-domain.com/mpesa/callback"
```

### 4. Supabase Setup

1. Create a Supabase project at https://supabase.com
2. Create a storage bucket named `uploads`
3. Set bucket to public or configure RLS policies
4. Add your Supabase URL and anon key to `.env`

### 5. Firestore Indexes

Create the following composite indexes in Firestore:

```
Collection: listings
- Fields: cropType (Ascending), createdAt (Descending)
- Fields: status (Ascending), createdAt (Descending)
- Fields: sellerId (Ascending), status (Ascending)

Collection: orders
- Fields: buyerId (Ascending), createdAt (Descending)
- Fields: sellerId (Ascending), createdAt (Descending)
- Fields: status (Ascending), createdAt (Descending)

Collection: transactions
- Fields: orderId (Ascending), createdAt (Descending)

Collection: chats
- Fields: participants (Array), updatedAt (Descending)
```

Run:
```bash
firebase deploy --only firestore:indexes
```

## M-Pesa Integration

### Sandbox Testing

1. **Get Sandbox Credentials:**
   - Visit https://developer.safaricom.co.ke
   - Create a developer account
   - Get sandbox credentials from the API section

2. **Test Phone Numbers:**
   - Use test numbers: 254708374149, 254712345678
   - PIN: Use any 4-digit number (sandbox mode)

3. **Mock Mode:**
   - Set `VITE_MPESA_MOCK_MODE=true` for local development
   - Payments will auto-complete after 3 seconds
   - No actual API calls are made

### Production Setup

1. **Get Production Credentials:**
   - Complete M-Pesa API registration
   - Get production consumer key/secret
   - Configure shortcode and passkey

2. **Update Environment:**
   - Set `MPESA_ENV=production`
   - Set `VITE_MPESA_MOCK_MODE=false`
   - Update Cloud Function config with production credentials

3. **Callback URL:**
   - Configure your callback URL in M-Pesa portal
   - URL format: `https://your-domain.com/mpesa/callback`
   - Must be HTTPS and publicly accessible

## Usage Examples

### Creating a Listing

```typescript
import { useCreateListing } from "@/features/marketplace/hooks/useMarketplace";

function CreateListingPage() {
  const createListing = useCreateListing();
  
  const handleSubmit = async (data) => {
    await createListing.mutateAsync({
      title: "Fresh Maize",
      cropType: "Maize",
      quantity: 100,
      unit: "kg",
      pricePerUnit: 50,
      currency: "KES",
      location: {
        lat: -1.2921,
        lng: 36.8219,
        county: "Nairobi",
      },
      images: ["https://..."],
      status: "active",
    });
  };
}
```

### Searching Listings

```typescript
import { useSearchListings } from "@/features/marketplace/hooks/useMarketplace";

function BrowsePage() {
  const { data, isLoading } = useSearchListings(
    {
      cropType: "Maize",
      minPrice: 40,
      maxPrice: 60,
    },
    "price_low"
  );
  
  return (
    <div>
      {data?.listings.map(listing => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
```

### Processing Payment

```typescript
import { useInitiatePayment } from "@/features/marketplace/hooks/useMarketplace";

function CheckoutPage() {
  const initiatePayment = useInitiatePayment();
  
  const handlePayment = async () => {
    await initiatePayment.mutateAsync({
      orderId: "order123",
      phone: "254712345678",
      amount: 5000,
    });
  };
}
```

## Testing

### Unit Tests

```bash
npm test -- marketplace
```

### Integration Tests (Firebase Emulator)

1. Start emulators:
```bash
firebase emulators:start
```

2. Run tests:
```bash
npm run test:integration
```

### Manual Testing Checklist

- [ ] Create listing with images
- [ ] Search and filter listings
- [ ] View listing details
- [ ] Create order
- [ ] Initiate M-Pesa payment (mock mode)
- [ ] Send chat message
- [ ] Make offer in chat
- [ ] Accept/decline offer
- [ ] Mark order as shipped (seller)
- [ ] Confirm delivery (buyer)
- [ ] Submit rating
- [ ] Create dispute
- [ ] Admin resolve dispute

## Security Considerations

1. **Firestore Rules:** Always validate on server-side
2. **Payment Callbacks:** Verify M-Pesa signature in production
3. **File Uploads:** Validate file types and sizes
4. **Rate Limiting:** Implement on Cloud Functions
5. **Input Validation:** Use Zod schemas on frontend and backend

## Offline Support

The module uses Firestore offline persistence:
- Chat messages cached locally
- Orders available offline
- Automatic sync on reconnect
- Optimistic UI updates

## Monitoring

1. **Cloud Functions Logs:**
```bash
firebase functions:log
```

2. **Firestore Usage:**
   - Monitor in Firebase Console
   - Set up alerts for quota limits

3. **Error Tracking:**
   - Integrate Sentry or Firebase Crashlytics
   - Log payment callback errors

## Troubleshooting

### Payment Not Working
- Check M-Pesa credentials in Cloud Functions config
- Verify callback URL is accessible
- Check Cloud Functions logs for errors
- Ensure phone number format is correct (254XXXXXXXXX)

### Images Not Uploading
- Verify Supabase credentials
- Check storage bucket permissions
- Ensure file size < 10MB

### Real-time Updates Not Working
- Check Firestore rules allow read access
- Verify user is authenticated
- Check browser console for errors

## Production Checklist

- [ ] Set production M-Pesa credentials
- [ ] Configure production callback URL
- [ ] Deploy Firestore security rules
- [ ] Deploy Cloud Functions
- [ ] Set up monitoring and alerts
- [ ] Configure Supabase storage policies
- [ ] Test end-to-end payment flow
- [ ] Set up backup and disaster recovery
- [ ] Configure rate limiting
- [ ] Enable Firebase App Check

## Support

For issues or questions:
1. Check Firebase Console logs
2. Review Cloud Functions logs
3. Check browser console for frontend errors
4. Verify environment variables are set correctly

## License

This module is part of the Crop Conduit UI project.
