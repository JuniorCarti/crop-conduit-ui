# Harvest Module - Firebase Firestore Integration Summary

## 📋 QUICK REFERENCE

### Data Model
```
users/{uid}/harvest/
  ├── schedules/{id}      → HarvestSchedule
  ├── workers/{id}        → Worker
  └── deliveries/{id}     → Delivery
```

### TypeScript Types
- **Input Types:** `CreateHarvestScheduleInput`, `CreateWorkerInput`, `CreateDeliveryInput`
- **Entity Types:** `HarvestSchedule`, `Worker`, `Delivery`
- **File:** `src/types/harvest.ts`

---

## 🔧 SERVICE LAYER

**File:** `src/services/firestore-harvest.ts`

### Functions by Entity

#### Schedules
```typescript
createHarvestSchedule(uid, data)
getHarvestSchedules(uid)
subscribeToHarvestSchedules(uid, callback, onError)
updateHarvestSchedule(uid, scheduleId, updates)
deleteHarvestSchedule(uid, scheduleId)
getHarvestSchedulesByStatus(uid, status)
```

#### Workers
```typescript
createWorker(uid, data)
getWorkers(uid)
subscribeToWorkers(uid, callback, onError)
updateWorker(uid, workerId, updates)
deleteWorker(uid, workerId)
assignWorkerToSchedule(uid, workerId, scheduleIds)
unassignWorkerFromSchedule(uid, workerId, scheduleIds)
```

#### Deliveries
```typescript
createDelivery(uid, data)
getDeliveries(uid)
subscribeToDeliveries(uid, callback, onError)
updateDelivery(uid, deliveryId, updates)
deleteDelivery(uid, deliveryId)
getDeliveriesBySchedule(uid, scheduleId)
getDeliveriesByWorker(uid, workerId)
getDeliveriesByStatus(uid, status)
markDeliveryAsDelivered(uid, deliveryId, actualDate?)
```

---

## ⚛️ REACT HOOKS

**File:** `src/hooks/useHarvest.ts`

### Main Hooks
```typescript
const { schedules, loading, error, add, update, remove } = useHarvestSchedules()
const { workers, loading, error, add, update, remove } = useWorkers()
const { deliveries, loading, error, add, update, remove } = useDeliveries()
```

### Helper Hooks
```typescript
useScheduleWorkers(scheduleId)        // Filter workers for schedule
useScheduleDeliveries(scheduleId)     // Filter deliveries for schedule
usePendingDeliveries()                // Filter non-delivered deliveries
```

### Hook Return Shape
```typescript
{
  data: T[],              // Schedule[], Worker[], or Delivery[]
  loading: boolean,       // true while fetching
  error: Error | null,    // null if no error
  add: (data) => Promise<T>,          // Create
  update: (id, data) => Promise<void>, // Update
  remove: (id) => Promise<void>        // Delete
}
```

---

## 🛡️ SECURITY RULES

**File:** `firestore.harvest.rules`

### Principles
- ✅ Authentication required
- ✅ Tenant isolation (uid-based)
- ✅ Schema validation on write
- ✅ Status/role enum validation
- ✅ Timestamp auto-management

### Key Rule Pattern
```firestore
match /users/{userId}/harvest/{collection}/{docId} {
  allow read: if request.auth.uid == userId;
  allow create: if request.auth.uid == userId 
    && request.resource.data.userId == userId
    && [schema validations];
  allow update: if request.auth.uid == userId
    && request.resource.data.userId == userId;
  allow delete: if request.auth.uid == userId;
}
```

---

## 🎨 UI COMPONENTS

### Tab Components
- **ScheduleTab** (`src/components/harvest/ScheduleTab.tsx`)
  - Displays schedules with status indicators
  - Shows crop/field/dates/yield
  - Delete with confirmation

- **WorkersTab** (`src/components/harvest/WorkersTab.tsx`)
  - Displays workers with role badges
  - Shows contact & assignment info
  - Delete with confirmation

- **DeliveryTab** (`src/components/harvest/DeliveryTab.tsx`)
  - Displays deliveries with status
  - Shows destination, worker, vehicle type
  - Delete with confirmation

### Main Page
- **Harvest.tsx** (Refactored)
  - Tabs for schedule/workers/delivery
  - Auth guard + loading states
  - Empty states for each tab
  - Ready harvest alert
  - Modal hooks for add/edit/delete

---

## 📦 USAGE EXAMPLE

### In a React Component

```tsx
import { useWorkers } from '@/hooks/useHarvest';
import { toast } from 'sonner';

export function WorkerManager() {
  const { workers, loading, error, add, remove } = useWorkers();

  // Render empty state
  if (!loading && workers.length === 0) {
    return <div>No workers. Create your first one!</div>;
  }

  // Render loading
  if (loading) {
    return <LoadingSpinner />;
  }

  // Render error
  if (error) {
    return <ErrorAlert error={error} />;
  }

  // Handle add
  const handleAdd = async (name, role, phone) => {
    try {
      await add({ name, role, phone });
      toast.success('Worker added!');
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Handle delete
  const handleDelete = async (workerId) => {
    try {
      await remove(workerId);
      toast.success('Worker removed');
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Render workers
  return (
    <div>
      {workers.map(w => (
        <WorkerCard 
          key={w.id} 
          worker={w}
          onDelete={() => handleDelete(w.id)}
        />
      ))}
    </div>
  );
}
```

---

## 🚀 SETUP STEPS

### 1. Firestore Rules
```bash
# In Firebase Console → Firestore → Rules
# Copy contents of firestore.harvest.rules
# Deploy rules
```

### 2. Import Types
```typescript
import { HarvestSchedule, Worker, Delivery } from '@/types/harvest';
```

### 3. Use Hooks
```typescript
const { schedules, loading, error } = useHarvestSchedules();
```

### 4. Handle Data
```typescript
if (loading) return <Loader />;
if (error) return <Error message={error.message} />;
if (schedules.length === 0) return <Empty />;
return <ScheduleList schedules={schedules} />;
```

---

## 🔄 DATA FLOW

```
React Component
       ↓
useHarvestSchedules() Hook
       ↓
subscribeToHarvestSchedules() [Firestore service]
       ↓
Firebase Firestore (users/{uid}/harvest/schedules)
       ↓
[Realtime onSnapshot listener]
       ↓
Callback fires → State updates → Component re-renders
```

---

## ⚠️ COMMON MISTAKES

### ❌ Not Checking Auth Loading
```tsx
// WRONG - will crash if currentUser not loaded
const { currentUser } = useAuth();
const schedules = useHarvestSchedules();

// CORRECT
const { currentUser, loading: authLoading } = useAuth();
if (authLoading) return <Loader />;
if (!currentUser?.uid) return <AuthRequired />;
```

### ❌ Forgetting Empty States
```tsx
// WRONG - shows nothing when no data
{schedules.map(s => <Card key={s.id} schedule={s} />)}

// CORRECT
{schedules.length === 0 ? (
  <EmptyState message="No schedules" />
) : (
  schedules.map(s => <Card key={s.id} schedule={s} />)
)}
```

### ❌ Not Handling Errors
```tsx
// WRONG - no error UI
const { data } = useHarvestSchedules();

// CORRECT
const { data, error } = useHarvestSchedules();
if (error) return <AlertCard type="danger" message={error.message} />;
```

### ❌ Calling Service Directly in Components
```tsx
// WRONG - won't subscribe to updates
const schedules = await getHarvestSchedules(uid);

// CORRECT - use hook
const { schedules } = useHarvestSchedules();
```

---

## 📊 STATUS ENUMS

### Harvest Schedule Status
- `Pending` - Not yet ready
- `Ready` - Ready for harvest
- `InProgress` - Harvest in progress
- `Harvested` - Completed
- `Cancelled` - Cancelled

### Worker Status
- `Active` - Available for work
- `Inactive` - Not available

### Worker Role
- `Harvester` - Field worker
- `Supervisor` - Oversees operations
- `Transporter` - Handles logistics
- `Quality Inspector` - QA verification

### Delivery Status
- `Pending` - Scheduled
- `InTransit` - On the way
- `Delivered` - Completed
- `Cancelled` - Cancelled
- `Delayed` - Running late

---

## 🧪 TESTING CHECKLIST

- [ ] Login required before accessing data
- [ ] Create schedule → appears in Firestore
- [ ] Add worker → visible in Workers tab
- [ ] Create delivery → references resolve correctly
- [ ] Delete operation → removes from Firestore
- [ ] Refresh page → data persists
- [ ] Logout/login as different user → data is isolated
- [ ] Slow network → loading spinners show
- [ ] Error state → alert appears
- [ ] Empty state → message displays

---

## 📞 SUPPORT

For issues:
1. Check `HARVEST_FIRESTORE_GUIDE.md` for detailed docs
2. Verify Firestore rules are deployed
3. Check browser console for errors
4. Confirm `currentUser.uid` is accessible
5. Test with demo data using `seedDemoData(uid)`

---

**Last Updated:** 2026-01-18  
**Version:** 1.0 Production  
**Status:** ✅ Ready
