# agrismart-buyer-api

Cloudflare Worker backend for buyer approval, tiering, premium status, and KES billing metadata.

## Setup

```bash
cd worker-buyer-api
npm install
```

## Secrets

```bash
wrangler secret put FIREBASE_PROJECT_ID
wrangler secret put FIREBASE_CLIENT_EMAIL
wrangler secret put FIREBASE_PRIVATE_KEY
wrangler secret put SUPERADMIN_EMAILS
wrangler secret put SUPERADMIN_UIDS
wrangler secret put CORS_ALLOW_ORIGINS
```

## Dev

```bash
npm run dev
```

## Deploy

```bash
npm run deploy
```

## Endpoints

- `GET /health`
- `GET /buyers/me`
- `POST /buyers/createProfile`
- `POST /buyers/requestPremiumUpgrade`
- `POST /buyers/commitPurchase`
- `POST /buyers/recordPurchaseCompleted` (compat alias)
- `GET /admin/buyers?status=PENDING|APPROVED|REJECTED`
- `POST /admin/buyers/:uid/approve`
- `POST /admin/buyers/:uid/reject`
- `POST /admin/buyers/:uid/setTier`
- `POST /admin/buyers/:uid/setPremium`

All protected endpoints require `Authorization: Bearer <Firebase ID Token>`.

## Curl examples

```bash
curl -H "Authorization: Bearer <FIREBASE_ID_TOKEN>" \
  https://<worker-domain>/buyers/me
```

```bash
curl -X POST -H "Authorization: Bearer <FIREBASE_ID_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"companyName":"Acme Exports","buyerType":"INTERNATIONAL"}' \
  https://<worker-domain>/buyers/createProfile
```

```bash
curl -X POST -H "Authorization: Bearer <SUPERADMIN_FIREBASE_ID_TOKEN>" \
  -H "Content-Type: application/json" \
  https://<worker-domain>/admin/buyers/<uid>/approve
```
