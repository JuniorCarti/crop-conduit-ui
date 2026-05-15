# Harvest Module Implementation Checklist

## 📋 TASK CHECKLIST

### Phase 1: Preparation (Day 1)
- [ ] Review `HARVEST_FIRESTORE_GUIDE.md` (this directory)
- [ ] Review `HARVEST_QUICK_REFERENCE.md` (this directory)
- [ ] Backup current Harvest.tsx
- [ ] Create feature branch: `git checkout -b feature/firestore-harvest`

### Phase 2: Firebase Setup (Day 1-2)
- [ ] Open Firebase Console
- [ ] Go to Firestore Database
- [ ] Set database location (closest region)
- [ ] Go to Rules tab
- [ ] Copy content from `firestore.harvest.rules`
- [ ] Deploy rules with "Publish" button
- [ ] Test rules in console (try reading/writing as user)

### Phase 3: Code Integration (Day 2-3)

#### Step 1: Verify Auth Context
- [ ] Check `src/contexts/AuthContext.tsx` exports:
  ```tsx
  - currentUser: User | null
  - loading: boolean
  ```

#### Step 2: Create Types
- [ ] File: `src/types/harvest.ts` (✅ Already created)
- [ ] Contains: HarvestSchedule, Worker, Delivery interfaces
- [ ] Contains: CreateX Input types
- [ ] Run: `npm run build` to verify no TS errors

#### Step 3: Create Service Layer
- [ ] File: `src/services/firestore-harvest.ts` (✅ Already updated)
- [ ] Contains: All CRUD functions
- [ ] Contains: Subscription functions with `onSnapshot`
- [ ] Contains: Batch operations
- [ ] Verify imports from `src/types/harvest`

#### Step 4: Create React Hooks
- [ ] File: `src/hooks/useHarvest.ts` (✅ Already updated)
- [ ] Exports: useHarvestSchedules, useWorkers, useDeliveries
- [ ] Exports: Helper hooks (useScheduleWorkers, etc.)
- [ ] Each hook handles: loading, error, CRUD callbacks
- [ ] Cleanup: unsubscribe on unmount

#### Step 5: Create Tab Components
- [ ] File: `src/components/harvest/ScheduleTab.tsx` (✅ Already created)
- [ ] File: `src/components/harvest/WorkersTab.tsx` (✅ Already created)
- [ ] File: `src/components/harvest/DeliveryTab.tsx` (✅ Already created)
- [ ] Each component has: delete with confirmation
- [ ] Each component shows: list of items or empty state
- [ ] All components are loading-aware

#### Step 6: Refactor Harvest Page
- [ ] File: `src/pages/Harvest.tsx` (update with Firestore version)
- [ ] Imports: useHarvestSchedules, useWorkers, useDeliveries hooks
- [ ] Guard: Check for auth loading and currentUser
- [ ] Layout: 3 tabs (Schedule, Workers, Delivery)
- [ ] States: Loading → Display → Error handling
- [ ] Modals: Add placeholders for form modals
- [ ] Props: Pass data and callbacks to tab components

#### Step 7: Verify Imports
- [ ] Search for old imports like `useWorkers` from `useApi.ts`
- [ ] Replace with new import: `useWorkers` from `useHarvest.ts`
- [ ] Verify all import paths resolve correctly

### Phase 4: Testing (Day 3-4)

#### Functional Testing
- [ ] [ ] Login with test account
- [ ] [ ] Verify page loads (no auth errors)
- [ ] [ ] Check "No workers added yet" empty state
- [ ] [ ] Create a harvest schedule
  - [ ] Verify in Firestore console
  - [ ] Check schedule appears in UI
  - [ ] Verify createdAt/updatedAt timestamps
  - [ ] Check userId matches logged-in user
- [ ] [ ] Add a worker
  - [ ] Verify data structure in Firestore
  - [ ] Check all fields saved correctly
  - [ ] Status defaults to "Active"
- [ ] [ ] Create a delivery
  - [ ] Verify scheduleId and workerId are set
  - [ ] Check status defaults to "Pending"
  - [ ] Verify references resolve (schedule name, worker name show in UI)
- [ ] [ ] Delete operations
  - [ ] Confirm alert dialog appears
  - [ ] Verify deletion from Firestore after confirmation
  - [ ] Check UI updates immediately

#### Data Persistence Testing
- [ ] [ ] Create 2-3 records
- [ ] [ ] Refresh page (F5)
- [ ] [ ] Verify data still appears (from Firestore, not localStorage)
- [ ] [ ] Close browser tab completely
- [ ] [ ] Reopen and login
- [ ] [ ] Data should still be there

#### Multi-Tenant Testing
- [ ] [ ] Create data as User A
- [ ] [ ] Logout
- [ ] [ ] Login as User B
- [ ] [ ] Verify User B sees empty state (not User A's data)
- [ ] [ ] Create data as User B
- [ ] [ ] Logout and login as User A
- [ ] [ ] Verify User A still sees original data
- [ ] [ ] Verify User A cannot see User B's data

#### Error Handling Testing
- [ ] [ ] Simulate network error (DevTools Network tab → Offline)
- [ ] [ ] Try to load page → should show loading state
- [ ] [ ] Re-enable network
- [ ] [ ] Page should recover

#### Loading States Testing
- [ ] [ ] Slow 3G network (DevTools Network tab → Slow 3G)
- [ ] [ ] Load page
- [ ] [ ] Verify skeleton loaders appear
- [ ] [ ] Wait for data
- [ ] [ ] Verify data replaces skeletons

### Phase 5: Optional Enhancements (Day 4-5)

#### Create Form Components
- [ ] [ ] `src/components/harvest/ScheduleForm.tsx`
  - [ ] Fields: cropId, farmId, field, dates, expectedYield, notes
  - [ ] Validation: All required fields
  - [ ] Submit: Calls `add()` hook
  - [ ] Success: Toast + close modal
- [ ] [ ] `src/components/harvest/WorkerForm.tsx`
  - [ ] Fields: name, role, phone, email, experience
  - [ ] Validation: name & phone required
  - [ ] Submit: Calls `add()` hook
- [ ] [ ] `src/components/harvest/DeliveryForm.tsx`
  - [ ] Fields: schedule, worker, destination, quantity, date, vehicle
  - [ ] Validation: All required fields
  - [ ] Submit: Calls `add()` hook

#### Wire Forms to Modals
- [ ] [ ] Import ScheduleForm in Harvest.tsx
- [ ] [ ] Pass to Dialog for "New Schedule"
- [ ] [ ] Pass onSuccess callback to close modal
- [ ] [ ] Repeat for WorkerForm and DeliveryForm

#### Add Edit Functionality
- [ ] [ ] Add `selectedItem` state to track edit target
- [ ] [ ] Pass to form as `initialData`
- [ ] [ ] Form detects edit mode and calls `update()` instead of `add()`
- [ ] [ ] Add edit button to each tab component

#### Add Filtering
- [ ] [ ] Schedule tab: Filter by status dropdown
- [ ] [ ] Workers tab: Filter by role dropdown
- [ ] [ ] Delivery tab: Filter by status dropdown

#### Add Export
- [ ] [ ] Add "Export to CSV" button
- [ ] [ ] Use `src/lib/export.ts` functions
- [ ] [ ] Export format: Schedule/Worker/Delivery data

### Phase 6: Demo Data (Optional)

#### Seed Demo Data
- [ ] [ ] Import `seedDemoData` from `src/utils/seedDemoData.ts`
- [ ] [ ] Add "Seed Demo Data" button to development environment only
- [ ] [ ] Call `seedDemoData(currentUser.uid)` on click
- [ ] [ ] Verify 3 schedules, 4 workers, 6 deliveries created
- [ ] [ ] Test all UI features with demo data

### Phase 7: Documentation & Cleanup

#### Documentation
- [ ] [ ] Add code comments to complex functions
- [ ] [ ] Update README.md with Harvest module section
- [ ] [ ] Link to HARVEST_FIRESTORE_GUIDE.md
- [ ] [ ] Document new hooks and services

#### Code Quality
- [ ] [ ] Run TypeScript check: `npm run type-check`
- [ ] [ ] Run ESLint: `npm run lint`
- [ ] [ ] Fix any errors/warnings
- [ ] [ ] Format code: `npm run format`

#### Version Control
- [ ] [ ] Commit all changes: `git add . && git commit -m "feat: Firestore Harvest module"`
- [ ] [ ] Push branch: `git push origin feature/firestore-harvest`
- [ ] [ ] Create Pull Request
- [ ] [ ] Request code review

---

## 🚀 DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] No console errors/warnings
- [ ] Firestore rules deployed and tested
- [ ] Environment variables correct (.env)

### Deployment Steps
1. [ ] Merge PR to main branch
2. [ ] Deploy Firestore rules (if not already done)
3. [ ] Deploy app (Vercel/Firebase Hosting)
4. [ ] Smoke test in production
5. [ ] Monitor error logs

### Post-Deployment
- [ ] [ ] Verify all tabs load
- [ ] [ ] Test create/update/delete operations
- [ ] [ ] Check Firestore for created documents
- [ ] [ ] Monitor for errors in console

---

## 📁 FILES CREATED/MODIFIED

### Created Files
```
✅ src/types/harvest.ts
✅ src/services/firestore-harvest.ts (UPDATED)
✅ src/hooks/useHarvest.ts (UPDATED)
✅ src/components/harvest/ScheduleTab.tsx
✅ src/components/harvest/WorkersTab.tsx
✅ src/components/harvest/DeliveryTab.tsx
✅ src/pages/Harvest-Refactored.tsx
✅ src/utils/seedDemoData.ts
✅ firestore.harvest.rules
✅ HARVEST_FIRESTORE_GUIDE.md
✅ HARVEST_QUICK_REFERENCE.md
✅ HARVEST_IMPLEMENTATION.md (this file)
```

### Modified Files
```
📝 src/pages/Harvest.tsx (replace with Harvest-Refactored.tsx)
```

### Files NOT Changed
```
- src/contexts/AuthContext.tsx (working as-is)
- src/lib/firebase.ts (working as-is)
- package.json (no new dependencies needed)
```

---

## 🆘 TROUBLESHOOTING

### Issue: "useAuth must be used within AuthProvider"
**Solution:** Ensure Harvest.tsx is rendered inside `<AuthProvider>` wrapper

### Issue: "Cannot read property 'uid' of null"
**Solution:** Add auth guard before using `currentUser.uid`:
```tsx
if (!currentUser?.uid) return <AuthRequired />;
```

### Issue: Data not appearing after create
**Solution:** Check:
1. No TypeScript errors preventing execution
2. Firestore rules allow write for your user
3. Document path is `users/{uid}/harvest/{collection}/{docId}`
4. Subscription is active (check for unsubscribe bugs)

### Issue: Stale data after delete
**Solution:** Verify hook cleanup:
```tsx
useEffect(() => {
  // subscription
  return () => unsubscribe(); // ← cleanup must run
}, [deps])
```

### Issue: "Access denied" in Firestore
**Solution:** 
1. Check security rules deployed
2. Verify user is authenticated
3. Test rules in Firestore console

### Issue: Forms show "Form implementation pending"
**Solution:** Create ScheduleForm, WorkerForm, DeliveryForm components (Phase 5)

---

## 📞 SUPPORT REFERENCES

- **Guide:** [HARVEST_FIRESTORE_GUIDE.md](HARVEST_FIRESTORE_GUIDE.md)
- **Quick Ref:** [HARVEST_QUICK_REFERENCE.md](HARVEST_QUICK_REFERENCE.md)
- **Firebase Docs:** https://firebase.google.com/docs/firestore
- **React Docs:** https://react.dev

---

## ✅ SIGN-OFF

When complete, verify:
- [ ] All checklist items checked
- [ ] Tests passing
- [ ] Code reviewed
- [ ] Deployed to production
- [ ] Monitoring enabled

**Completed by:** _______________  
**Date:** _______________  
**Notes:** _______________

---

**Version:** 1.0  
**Last Updated:** 2026-01-18  
**Status:** Production-Ready
