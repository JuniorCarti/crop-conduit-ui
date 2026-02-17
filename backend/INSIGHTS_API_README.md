# AgriSmart Insights API (AWS Option 2)

This backend is additive to the live Firebase app. It does not replace Firebase Auth or Firestore.

## Endpoints

- `POST /coop/snapshots`
- `GET /coop/snapshots?periodId=2026-02`
- `POST /gov/compute?periodId=2026-02`
- `GET /gov/insights?scope=NATIONAL&periodId=2026-02`
- `GET /gov/insights?scope=COUNTY#Nakuru&periodId=2026-02`

## Auth

Send Firebase ID token:

```http
Authorization: Bearer <firebase_id_token>
```

Backend verifies token and loads `/users/{uid}` from Firestore to apply RBAC.

## Required env vars

- `FIREBASE_PROJECT_ID`
- `FIRESTORE_SERVICE_ACCOUNT_SECRET_ARN` (Secrets Manager ARN containing Firebase service account JSON)
- `COOP_SNAPSHOTS_TABLE`
- `GOV_AGGREGATES_TABLE`
- `API_AUDIT_LOG_TABLE`

## Deploy with SAM

```bash
cd backend
npm install
sam build
sam deploy --guided
```

During guided deploy set:

- `FirebaseProjectId`
- `FirestoreServiceAccountSecretArn`
- Table name parameters (or keep defaults)
- `CoopSnapshotRateLimitPerMinute`

## Example requests

```bash
curl -X POST "$API_BASE/coop/snapshots" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "periodId":"2026-02",
    "county":"Uasin Gishu",
    "subCounty":"Turbo",
    "activeMembers":240,
    "pendingMembers":12,
    "sponsoredMembers":80,
    "paidMembers":160,
    "groupSalesVolumeKg":12000,
    "groupSalesValueKES":3600000,
    "avgFarmGatePrice":60,
    "trainingsHeld":3,
    "attendanceCount":180
  }'
```

```bash
curl "$API_BASE/gov/insights?scope=NATIONAL&periodId=2026-02" \
  -H "Authorization: Bearer $ID_TOKEN"
```

## Notes

- No farmer PII is stored in DynamoDB.
- Government endpoints return aggregates only.
- Audit logs are stored in `ApiAuditLog` table.

