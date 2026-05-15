# AgriSmart Kenya — Production Readiness Checklist

## Deployment Checklist

### Pre-Deployment
- [ ] All environment variables configured in CI/CD secrets
- [ ] `VITE_ENABLE_TEST_DEPOSIT=false` confirmed
- [ ] `VITE_MPESA_MOCK_MODE=false` confirmed
- [ ] Firebase API key rotated (if compromised)
- [ ] M-Pesa credentials rotated (if compromised)
- [ ] `npm run build` passes without errors
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] No critical npm audit vulnerabilities

### Deployment Steps
1. `npm run build` — Build frontend
2. `firebase deploy --only hosting` — Deploy to Firebase Hosting
3. `firebase deploy --only functions` — Deploy Cloud Functions (if changed)
4. `sam build && sam deploy` — Deploy AWS backend (if changed)
5. `wrangler deploy` — Deploy Cloudflare Workers (if changed)

### Post-Deployment
- [ ] Verify homepage loads at agrismartkenya.com
- [ ] Verify login works (email + Google)
- [ ] Verify farmer dashboard loads
- [ ] Verify marketplace loads
- [ ] Verify M-Pesa payment flow (sandbox)
- [ ] Check browser console for errors
- [ ] Verify ASHA voice assistant responds

## Rollback Procedure

### Firebase Hosting
```bash
# List recent deployments
firebase hosting:channel:list

# Rollback to previous version
firebase hosting:rollback
```

### AWS Backend
```bash
# Rollback CloudFormation stack
aws cloudformation rollback-stack --stack-name agrismart-community --region us-east-2
```

### Cloudflare Workers
```bash
# Rollback to previous version (via Cloudflare dashboard)
# Workers > agrismart-advisory > Deployments > Rollback
```

## Incident Response

### Severity Levels
- **P1 (Critical)**: Site down, payments broken, data loss
- **P2 (High)**: Major feature broken, auth issues
- **P3 (Medium)**: Minor feature broken, UI issues
- **P4 (Low)**: Cosmetic issues, non-blocking bugs

### P1 Response
1. Identify affected service (Firebase/AWS/Cloudflare)
2. Check service status pages
3. Rollback last deployment if recent
4. Notify stakeholders
5. Investigate root cause
6. Deploy fix
7. Post-mortem within 24 hours

## Monitoring Endpoints

| Service | Health Check | Status |
|---------|-------------|--------|
| Firebase Hosting | https://agrismartkenya.com | Manual |
| AWS API | https://6cxhk3brli.execute-api.us-east-2.amazonaws.com/health | Auto |
| Advisory Worker | https://agrismart-advisory.ridgejunior204.workers.dev/health | Auto |
| Market Forecaster | https://market-forecaster-kenyan-agro-market-621a.onrender.com/health | Auto |

## Security Checklist

- [ ] No secrets in git history
- [ ] `.env` files gitignored
- [ ] Firebase App Check enabled
- [ ] Firestore rules deployed and tested
- [ ] Storage rules deployed
- [ ] CORS configured correctly on all APIs
- [ ] Rate limiting active on AI endpoints
- [ ] M-Pesa callback verification enabled
- [ ] DynamoDB encryption at rest enabled
- [ ] S3 bucket not publicly accessible

## Scalability Concerns

| Component | Current Limit | Action Needed |
|-----------|---------------|---------------|
| Firestore reads | 50K/day (free tier) | Monitor usage |
| Lambda concurrency | 1000 (default) | Request increase if needed |
| Cloudflare Workers | 100K requests/day (free) | Upgrade plan if needed |
| Firebase Hosting | 10GB/month (free) | Monitor bandwidth |
| DynamoDB | PAY_PER_REQUEST | Monitor costs |
| Render (Market API) | Free tier — sleeps after 15min | Upgrade for production |
