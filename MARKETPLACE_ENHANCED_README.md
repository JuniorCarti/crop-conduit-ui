# Marketplace Module - Enhanced Implementation

## 🎯 New Features Implemented

### ✅ Live Star Ratings
- Real-time rating updates using Firestore listeners
- Aggregated ratings on seller profiles
- Optimistic UI with pending states
- Duplicate rating protection

### ✅ Real-time Chat with Presence
- One-to-one and group chat support
- Online/offline presence indicators
- Typing indicators
- Read receipts
- Offline message queuing
- FCM push notifications for new messages

### ✅ Multiple Payment Options
- **M-Pesa STK Push**: Full integration with sandbox/production support
- **Airtel Money**: Integration with mock mode
- **Stripe Card Payments**: Payment intent creation
- Unified payment modal with method selection

### ✅ Firebase Storage Integration
- Image uploads to Firebase Storage
- Document uploads for chat attachments and dispute evidence
- Automatic URL generation and storage

### ✅ Map & Geolocation
- Farmer proximity counting within radius
- Real-time farmer location updates
- Map view and list view toggle
- Distance calculation using Haversine formula

### ✅ FCM Notifications
- Push notifications for:
  - New messages
  - Order status changes
  - Payment confirmations
  - New ratings
- Token registration and management

## 📁 New Files Created

### Services
- `src/features/marketplace/services/PresenceService.ts` - User online/offline status
- `src/features/marketplace/services/GeolocationService.ts` - Farmer proximity and geohash
- `src/features/marketplace/services/StorageService.ts` - Firebase Storage uploads
- `src/features/marketplace/services/NotificationService.ts` - FCM token management

### Components
- `src/features/marketplace/components/StarRating.tsx` - Interactive star rating component
- `src/features/marketplace/components/EnhancedChatWindow.tsx` - Chat with presence
- `src/features/marketplace/components/PaymentModal.tsx` - Multi-payment method modal
- `src/features/marketplace/components/MapView.tsx` - Map with farmer markers

### Hooks
- `src/features/marketplace/hooks/useRatings.ts` - Real-time rating hooks

### Cloud Functions
- `cloud/functions/marketplace/payments.ts` - All payment providers
- `cloud/functions/marketplace/notifications.ts` - FCM notification triggers
- `cloud/functions/marketplace/seedData.ts` - Data seeding functions

### Data
- `src/features/marketplace/data/horticulturalCrops.ts` - Seed data for crops

## 🚀 Setup Instructions

### 1. Environment Variables

Add to `.env`:

```env
# Firebase Realtime Database (for presence)
VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com

# FCM VAPID Key (from Firebase Console > Cloud Messaging)
VITE_FCM_VAPID_KEY=your-vapid-key

# Payment Mock Modes
VITE_MPESA_MOCK_MODE=true
VITE_AIRTEL_MOCK_MODE=true
VITE_STRIPE_MOCK_MODE=true

# Stripe (for card payments)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 2. Firebase Realtime Database Setup

1. Enable Realtime Database in Firebase Console
2. Add database URL to `.env`
3. Set up security rules:

```json
{
  "rules": {
    "status": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    }
  }
}
```

### 3. Firebase Cloud Messaging Setup

1. Go to Firebase Console > Project Settings > Cloud Messaging
2. Generate Web Push certificate
3. Copy VAPID key to `.env`
4. Add `firebase-messaging-sw.js` to `public/`:

```javascript
// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
});

const messaging = firebase.messaging();
```

### 4. Deploy Cloud Functions

```bash
cd cloud/functions/marketplace
npm install
firebase deploy --only functions
```

### 5. Seed Horticultural Crops Data

```typescript
// Call from frontend or Cloud Function
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";

const seedCrops = httpsCallable(functions, "marketplace-seedHorticulturalCrops");
await seedCrops({ count: 20, userId: currentUser.uid });
```

## 🔧 Usage Examples

### Live Ratings

```typescript
import { useListingRatings, useSellerRatingSummary } from "@/features/marketplace/hooks/useRatings";
import { StarRating } from "@/features/marketplace/components/StarRating";

function ListingDetail({ listingId, sellerId }) {
  const { ratings } = useListingRatings(listingId);
  const { summary } = useSellerRatingSummary(sellerId);
  
  return (
    <StarRating
      rating={summary.avg}
      count={summary.count}
      size="lg"
    />
  );
}
```

### Real-time Chat with Presence

```typescript
import { EnhancedChatWindow } from "@/features/marketplace/components/EnhancedChatWindow";

<EnhancedChatWindow
  chatId={chatId}
  otherUserId={sellerId}
  otherUserName="John Doe"
/>
```

### Multiple Payment Methods

```typescript
import { PaymentModal } from "@/features/marketplace/components/PaymentModal";

<PaymentModal
  order={order}
  onSuccess={() => console.log("Payment successful")}
  onCancel={() => console.log("Cancelled")}
/>
```

### Map with Farmer Proximity

```typescript
import { MapView } from "@/features/marketplace/components/MapView";

<MapView
  centerLat={-1.2921}
  centerLng={36.8219}
  radiusKm={10}
  onFarmerSelect={(farmer) => console.log(farmer)}
/>
```

## 📊 Data Model Updates

### Users Collection
```typescript
{
  uid: string;
  displayName: string;
  role: "farmer" | "buyer" | "supplier" | "admin";
  ratingSummary: {
    avg: number; // 1-5
    count: number;
  };
  location: {
    lat: number;
    lng: number;
    geohash?: string; // For proximity queries
    county: string;
  };
  presence: {
    isOnline: boolean;
    lastSeen: Date;
  };
  fcmTokens: string[]; // For push notifications
}
```

### Listings Collection
```typescript
{
  // ... existing fields
  ratingSummary: {
    avg: number;
    count: number;
  };
  images: string[]; // Firebase Storage URLs
}
```

### Chats Collection
```typescript
{
  participants: string[];
  typing: {
    [userId: string]: Timestamp | null;
  };
  unreadCount: {
    [userId: string]: number;
  };
}
```

## 🔔 Notification Events

The following events trigger FCM push notifications:

1. **New Message**: When someone sends a chat message
2. **Order Status Change**: When order moves to paid_in_escrow, shipped, delivered, completed
3. **New Rating**: When seller receives a rating
4. **Payment Success**: When payment is confirmed
5. **Payment Failure**: When payment fails

## 🗺️ Map Integration

For full map functionality, integrate one of:

1. **Google Maps**: Add `@react-google-maps/api`
2. **Mapbox**: Add `react-map-gl`

Example with Google Maps:

```typescript
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";

const libraries = ["places"];
const mapContainerStyle = { width: "100%", height: "400px" };

function MapComponent({ center, farmers }) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  if (!isLoaded) return <div>Loading map...</div>;

  return (
    <GoogleMap zoom={10} center={center} mapContainerStyle={mapContainerStyle}>
      {farmers.map((farmer) => (
        <Marker
          key={farmer.uid}
          position={{ lat: farmer.location.lat, lng: farmer.location.lng }}
          title={farmer.displayName}
        />
      ))}
    </GoogleMap>
  );
}
```

## 🧪 Testing

### Test Ratings
```bash
# Create a rating
const rating = await createRating({
  orderId: "order123",
  listingId: "listing456",
  fromUserId: "user1",
  toUserId: "user2",
  rating: 5,
  comment: "Excellent seller!"
});
```

### Test Chat
```bash
# Send message
await sendMessage(chatId, {
  senderId: "user1",
  receiverIds: ["user2"],
  text: "Hello!",
});
```

### Test Payments
- M-Pesa: Use test number `254708374149` in sandbox mode
- Airtel: Mock mode auto-completes
- Stripe: Use test card `4242 4242 4242 4242`

## 📝 Production Checklist

- [ ] Configure production M-Pesa credentials
- [ ] Configure Airtel Money production API
- [ ] Set up Stripe production keys
- [ ] Enable Firebase Realtime Database
- [ ] Configure FCM VAPID key
- [ ] Set up Google Maps/Mapbox API key
- [ ] Deploy all Cloud Functions
- [ ] Test all payment methods
- [ ] Verify FCM notifications work
- [ ] Test offline functionality
- [ ] Verify presence system
- [ ] Test rating aggregation
- [ ] Verify geolocation queries

## 🔒 Security Notes

1. **Payment Credentials**: Never expose in client code
2. **FCM Tokens**: Store securely, validate on server
3. **Geolocation**: Request permission, handle gracefully
4. **Presence**: Use Realtime DB for better performance
5. **Ratings**: Validate order ownership before allowing rating

## 📚 Additional Resources

- [Firebase Realtime Database Docs](https://firebase.google.com/docs/database)
- [FCM Web Setup](https://firebase.google.com/docs/cloud-messaging/js/client)
- [Google Maps React](https://github.com/JustFly1984/react-google-maps-api)
- [Stripe React](https://stripe.com/docs/stripe-js/react)

---

**Status**: ✅ All enhanced features implemented and ready for integration
