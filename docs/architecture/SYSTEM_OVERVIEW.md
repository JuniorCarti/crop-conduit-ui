# AgriSmart Kenya — System Architecture Overview

## Cloud Infrastructure

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                       │
│              Firebase Hosting: agrismartkenya.com                │
│              Capacitor: Android/iOS mobile wrapper               │
└────────────────────────┬────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
    ┌───▼────┐      ┌───▼────┐      ┌───▼────┐
    │Firebase │      │  AWS   │      │Cloudflare│
    │         │      │Backend │      │Workers   │
    │• Auth   │      │        │      │          │
    │• Firestore│    │• Lambda│      │• Advisory│
    │• Functions│    │• DDB   │      │• Buyer   │
    │• Storage │     │• S3    │      │• D1 DB   │
    │• Hosting │     │• API GW│      │• Weather │
    └────────┘      └────────┘      └────────┘
        │                │                │
        └────────────────┼────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
    ┌───▼────┐      ┌───▼────┐      ┌───▼────┐
    │M-Pesa  │      │Azure   │      │Render  │
    │Payment │      │OpenAI  │      │Market  │
    │Gateway │      │Speech  │      │Forecast│
    └────────┘      └────────┘      └────────┘
```

## Services

| Service | Provider | Purpose |
|---------|----------|---------|
| Web Frontend | Firebase Hosting | React SPA |
| Authentication | Firebase Auth | Email, Google, Phone |
| Database (primary) | Firestore | User data, farms, orders |
| Database (community) | AWS DynamoDB | Posts, DMs, bids |
| File Storage | Firebase Storage + S3 | Media, documents |
| Cloud Functions | Firebase Functions | M-Pesa payments |
| API Backend | AWS Lambda + API Gateway | Community, ASHA, Trade |
| Advisory AI | Cloudflare Workers + D1 | AI chat, session state |
| Buyer API | Cloudflare Workers | Buyer profiles, premium |
| Weather Proxy | Cloudflare Workers | Climate data proxy |
| Market Forecaster | Render | Price prediction ML model |
| Voice AI | Azure OpenAI + Speech | STT/TTS for ASHA |
| Payments | Safaricom M-Pesa | STK Push payments |

## User Roles

| Role | Access |
|------|--------|
| farmer | Dashboard, Market, Climate, Harvest, Asha, Community |
| buyer | Marketplace, Trade, Analytics, Logistics |
| org_admin | Cooperative management, Members, Training |
| transport_admin | Fleet, Shipments, Bids, Tracking |
| gov_admin | National stats, Markets, Food security |
| partner | Sponsorships, Impact, Reports |
| superadmin | Full system access |

## Deployment

- **Frontend**: `npm run build` → `firebase deploy --only hosting`
- **Functions**: `firebase deploy --only functions`
- **AWS Backend**: `sam build && sam deploy` (us-east-2)
- **Workers**: `wrangler deploy` (per worker)

## Environment

- Production: agrismartkenya.com
- Firebase Project: crop-conduit-ui
- AWS Region: us-east-2
- Cloudflare: ridgejunior204.workers.dev
