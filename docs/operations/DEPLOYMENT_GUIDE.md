# AgriSmart Kenya — Deployment Guide

## Prerequisites

- Node.js 20+
- Firebase CLI (`npm install -g firebase-tools`)
- AWS SAM CLI (`pip install aws-sam-cli`)
- Wrangler CLI (`npm install -g wrangler`)
- GitHub CLI (`gh`)

## Environment Setup

### 1. Clone and Install
```bash
git clone https://github.com/JuniorCarti/crop-conduit-ui.git
cd crop-conduit-ui
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env.local
# Edit .env.local with your Firebase credentials
```

### 3. Local Development
```bash
npm run dev
# Opens at http://localhost:8080
```

## Deployment Targets

### Firebase Hosting (Frontend)
```bash
npm run build
firebase deploy --only hosting
```

### Firebase Functions (M-Pesa)
```bash
cd functions
npm install
firebase deploy --only functions
```

### AWS Backend (Community + ASHA + Trade)
```bash
cd backend
npm install
sam build
sam deploy --region us-east-2 --stack-name agrismart-community \
  --capabilities CAPABILITY_IAM --resolve-s3 \
  --parameter-overrides FirebaseProjectId=crop-conduit-ui
```

### Cloudflare Workers

#### Advisory Worker
```bash
cd agrismart-advisory
npm install
wrangler deploy
```

#### Buyer API Worker
```bash
cd worker-buyer-api
npm install
wrangler deploy
```

## Environment Variables

### Frontend (VITE_* — embedded at build time)
These are safe to include in the bundle (public Firebase config):
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_AUTH_DOMAIN`

### Backend Secrets (NEVER in frontend)
- M-Pesa credentials → Firebase Functions config
- Azure OpenAI keys → AWS Secrets Manager
- Firebase service account → AWS Secrets Manager

## Branch Strategy

| Branch | Purpose | Deploys To |
|--------|---------|------------|
| `main` | Production | agrismartkenya.com |
| `develop` | Development | Local only |
| `staging` | Pre-production | staging URL (future) |
| `feature/*` | Feature branches | PR previews |

## CI/CD Pipeline

GitHub Actions runs on every push to `main`:
1. Install dependencies
2. Type check
3. Lint
4. Build
5. Deploy to Firebase Hosting (main only)
