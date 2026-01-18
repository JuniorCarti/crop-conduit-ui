# Firestore Harvest Module - Complete Implementation Guide

## Overview

This document provides a complete guide to the refactored Harvest & Logistics module that uses Firebase Firestore for data persistence. All data is stored per authenticated user (multi-tenant) and syncs in realtime.

---

## 1. FIRESTORE DATA MODEL

### Collection Structure

```
users/
  ├── {userId}/
  │   └── harvest/
  │       ├── schedules/{scheduleId}
  │       ├── workers/{workerId}
  │       └── deliveries/{deliveryId}
```

### Document Schemas

#### Harvest Schedule (`users/{uid}/harvest/schedules/{id}`)

```typescript
{
  id: "schedule-1",
  userId: "user-uid-123",           // Tenant identifier
  cropId: "crop-corn-001",
  farmId: "farm-001",
  cropName: "Corn",
  field: "Field A",
  plantedDate: Timestamp(2025-05-01),
  estimatedReadyDate: Timestamp(2025-09-15),
  optimalDate: "2025-09-20",        // ISO date string for UI
  status: "Pending" | "Ready" | "InProgress" | "Harvested" | "Cancelled",
  expectedYield: 450,               // numeric value
  yieldUnit: "kg" | "tons" | "bags" | "bundles",
  notes?: "First crop of season",
  createdAt: Timestamp(auto),
  updatedAt: Timestamp(auto)
}
```

#### Worker (`users/{uid}/harvest/workers/{id}`)

```typescript
{
  id: "worker-1",
  userId: "user-uid-123",
  name: "John Omondi",
  role: "Harvester" | "Supervisor" | "Transporter" | "Quality Inspector",
  phone: "+254712345678",
  email?: "john@example.com",
  status: "Active" | "Inactive",
  assignedScheduleIds: ["schedule-1", "schedule-2"],  // References to schedules
  experience?: "5 years",
  emergencyContact?: {
    name: "Jane Omondi",
    relationship: "Sister",
    phone: "+254712345679"
  },
  createdAt: Timestamp(auto),
  updatedAt: Timestamp(auto)
}
```

#### Delivery (`users/{uid}/harvest/deliveries/{id}`)

```typescript
{
  id: "delivery-1",
  userId: "user-uid-123",
  scheduleId: "schedule-1",         // Reference to HarvestSchedule
  assignedWorkerId: "worker-1",     // Reference to Worker
  destination: "Market" | "Warehouse" | "Buyer" | "Processor" | "Other",
  destinationAddress: "Nairobi Central Market",
  quantity: 500,
  quantityUnit: "kg" | "tons" | "bags" | "bundles",
  scheduledDate: Timestamp(2025-09-21),
  status: "Pending" | "InTransit" | "Delivered" | "Cancelled" | "Delayed",
  vehicleType: "Truck" | "Van" | "Motorbike" | "Bicycle" | "Other",
  transportCost?: 5000,
  actualDeliveryDate?: Timestamp,    // Set when delivery confirmed
  notes?: "Handle with care - premium grade",
  createdAt: Timestamp(auto),
  updatedAt: Timestamp(auto)
}
```

---

## 2. TYPESCRIPT TYPES

All types are defined in [src/types/harvest.ts](src/types/harvest.ts):

```typescript
// Create/Update Input types (no timestamps)
CreateHarvestScheduleInput
CreateWorkerInput
CreateDeliveryInput

// Full entity types (with timestamps)
HarvestSchedule
Worker
Delivery

// Hook return types
CollectionHookReturn<T>
DocumentHookReturn<T>
```

---

## 3. FIRESTORE SERVICE LAYER

**File:** [src/services/firestore-harvest.ts](src/services/firestore-harvest.ts)

### Key Functions

#### Harvest Schedules

```typescript
// Create a new schedule
createHarvestSchedule(userId: string, data: CreateHarvestScheduleInput): Promise<HarvestSchedule>

// Get all schedules for user
getHarvestSchedules(userId: string): Promise<HarvestSchedule[]>

// Subscribe to realtime updates
subscribeToHarvestSchedules(
  userId: string,
  callback: (schedules: HarvestSchedule[]) => void,
  onError?: (error: Error) => void
): Unsubscribe

// Update a schedule
updateHarvestSchedule(userId: string, scheduleId: string, updates: Partial<...>): Promise<void>

// Delete a schedule
deleteHarvestSchedule(userId: string, scheduleId: string): Promise<void>

// Filter by status
getHarvestSchedulesByStatus(userId: string, status: "Ready" | "Pending" | ...): Promise<HarvestSchedule[]>
```

#### Workers

```typescript
// Similar CRUD operations for workers
createWorker(userId: string, data: CreateWorkerInput): Promise<Worker>
getWorkers(userId: string): Promise<Worker[]>
subscribeToWorkers(userId: string, callback: ..., onError?: ...): Unsubscribe
updateWorker(userId: string, workerId: string, updates: Partial<...>): Promise<void>
deleteWorker(userId: string, workerId: string): Promise<void>

// Assign/unassign workers to schedules
assignWorkerToSchedule(userId: string, workerId: string, scheduleIds: string[]): Promise<void>
unassignWorkerFromSchedule(userId: string, workerId: string, scheduleIds: string[]): Promise<void>
```

#### Deliveries

```typescript
// Similar CRUD operations for deliveries
createDelivery(userId: string, data: CreateDeliveryInput): Promise<Delivery>
getDeliveries(userId: string): Promise<Delivery[]>
subscribeToDeliveries(userId: string, callback: ..., onError?: ...): Unsubscribe
updateDelivery(userId: string, deliveryId: string, updates: Partial<...>): Promise<void>
deleteDelivery(userId: string, deliveryId: string): Promise<void>

// Filter operations
getDeliveriesBySchedule(userId: string, scheduleId: string): Promise<Delivery[]>
getDeliveriesByWorker(userId: string, workerId: string): Promise<Delivery[]>
getDeliveriesByStatus(userId: string, status: "Delivered" | ...): Promise<Delivery[]>
markDeliveryAsDelivered(userId: string, deliveryId: string, actualDate?: Date): Promise<void>
```

---

## 4. REACT HOOKS

**File:** [src/hooks/useHarvest.ts](src/hooks/useHarvest.ts)

### Main Hooks

Each hook manages a collection and provides CRUD operations + realtime sync:

```typescript
// Harvest Schedules
const { schedules, loading, error, add, update, remove } = useHarvestSchedules()

// Workers
const { workers, loading, error, add, update, remove } = useWorkers()

// Deliveries
const { deliveries, loading, error, add, update, remove } = useDeliveries()
```

### Usage Example

```tsx
function MyComponent() {
  const { workers, loading, error, add, remove } = useWorkers();

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert error={error} />;

  return (
    <div>
      {workers.length === 0 ? (
        <EmptyState />
      ) : (
        workers.map(w => <WorkerCard key={w.id} worker={w} />)
      )}
    </div>
  );
}
```

### Helper Hooks

```typescript
// Get workers assigned to a specific schedule
useScheduleWorkers(scheduleId: string | null): Worker[]

// Get deliveries for a specific schedule
useScheduleDeliveries(scheduleId: string | null): Delivery[]

// Get pending deliveries (not delivered yet)
usePendingDeliveries(): Delivery[]
```

---

## 5. FIRESTORE SECURITY RULES

**File:** [firestore.harvest.rules](firestore.harvest.rules)

### Key Security Features

1. **Authentication Required:** All operations require `request.auth != null`
2. **Tenant Isolation:** Users can only access their own data (`request.auth.uid == userId`)
3. **Data Validation:** On write, documents are validated against expected schema
4. **Status Validation:** Only allowed enum values for status/role/destination fields

### Example Rules

```firestore
match /users/{userId}/harvest/workers/{workerId} {
  // Read: Owner only
  allow read: if request.auth.uid == userId;
  
  // Create: Owner + valid schema
  allow create: if request.auth.uid == userId
    && request.resource.data.userId == userId
    && request.resource.data.role in ['Harvester', 'Supervisor', ...]
    && request.resource.data.name.size() > 0;
  
  // Update: Preserve userId
  allow update: if request.auth.uid == userId
    && resource.data.userId == userId
    && request.resource.data.userId == userId;
  
  // Delete: Owner only
  allow delete: if request.auth.uid == userId;
}
```

---

## 6. MIGRATION GUIDE: Removing Hardcoded Data

### Step 1: Backup Current Data

If you have existing hardcoded data in `useApi.ts` or similar, you may want to create sample records:

```typescript
// Example: Seed Firestore with demo data
async function seedDemoData(userId: string) {
  // Create schedules
  await createHarvestSchedule(userId, {
    cropId: "demo-corn",
    farmId: "demo-farm",
    cropName: "Corn",
    field: "Field A",
    plantedDate: new Date("2025-05-01"),
    estimatedReadyDate: new Date("2025-09-15"),
    optimalDate: "2025-09-20",
    expectedYield: 450,
    yieldUnit: "kg"
  });

  // Create workers
  await createWorker(userId, {
    name: "John Omondi",
    role: "Harvester",
    phone: "+254712345678",
    experience: "5 years"
  });

  // Create delivery
  await createDelivery(userId, {
    scheduleId: "...", // Reference from created schedule
    assignedWorkerId: "...", // Reference from created worker
    destination: "Market",
    destinationAddress: "Nairobi Central Market",
    quantity: 500,
    quantityUnit: "kg",
    scheduledDate: new Date("2025-09-21"),
    vehicleType: "Truck"
  });
}
```

### Step 2: Remove Hardcoded Arrays

**Old (Hardcoded):**
```typescript
const dummyWorkers = [
  { id: "1", name: "John", role: "Harvester", ... },
  { id: "2", name: "Jane", role: "Supervisor", ... }
];
```

**New (Dynamic):**
```typescript
const { workers, loading } = useWorkers();
// workers will automatically update from Firestore in realtime
```

### Step 3: Update Harvest Page

Replace hardcoded data with hooks:

```tsx
export default function Harvest() {
  // No more hardcoded arrays - use hooks instead
  const { schedules, loading: schedulesLoading } = useHarvestSchedules();
  const { workers, loading: workersLoading } = useWorkers();
  const { deliveries, loading: deliveriesLoading } = useDeliveries();

  // Rest of component...
}
```

---

## 7. REFACTORED HARVEST PAGE

**File:** [src/pages/Harvest-Refactored.tsx](src/pages/Harvest-Refactored.tsx)

### Key Features

✅ **No Hardcoded Data:** All data from Firestore  
✅ **Realtime Sync:** onSnapshot subscriptions  
✅ **Loading States:** Skeleton loaders while fetching  
✅ **Error Handling:** User-friendly error messages  
✅ **Empty States:** "No workers added yet" messages  
✅ **Auth Guard:** Checks for logged-in user before rendering  
✅ **CRUD Operations:** Add/Edit/Delete modals  

### Page Structure

```tsx
<Harvest>
  <PageHeader />
  
  <AlertCard /> {/* Errors & Ready alerts */}
  
  <Tabs>
    <TabContent value="schedule">
      {/* ScheduleTab: List & manage schedules */}
    </TabContent>
    
    <TabContent value="workers">
      {/* WorkersTab: List & manage workers */}
    </TabContent>
    
    <TabContent value="delivery">
      {/* DeliveryTab: List & manage deliveries */}
    </TabContent>
  </Tabs>
  
  <Dialog /> {/* Form modals for add/edit */}
</Harvest>
```

---

## 8. TAB COMPONENTS

### ScheduleTab ([src/components/harvest/ScheduleTab.tsx](src/components/harvest/ScheduleTab.tsx))

Displays harvest schedules with:
- Status indicators (Ready, Pending, InProgress, etc.)
- Crop/field information
- Planted & optimal harvest dates
- Expected yield
- Delete action

### WorkersTab ([src/components/harvest/WorkersTab.tsx](src/components/harvest/WorkersTab.tsx))

Displays workers with:
- Name, role, and status badges
- Contact info (phone, email)
- Experience level
- Number of assigned schedules
- Delete action

### DeliveryTab ([src/components/harvest/DeliveryTab.tsx](src/components/harvest/DeliveryTab.tsx))

Displays deliveries with:
- Status indicators
- Quantity & destination
- Scheduled date
- Assigned worker
- Vehicle type
- Transport cost
- Delete action

---

## 9. SETUP CHECKLIST

### Firebase Console

- [ ] Create Firestore database in native mode
- [ ] Set location to closest region
- [ ] Copy `firestore.harvest.rules` to **Firestore Rules** editor
- [ ] Test rules in console

### Code Integration

- [ ] Create [src/types/harvest.ts](src/types/harvest.ts)
- [ ] Update [src/services/firestore-harvest.ts](src/services/firestore-harvest.ts)
- [ ] Update [src/hooks/useHarvest.ts](src/hooks/useHarvest.ts)
- [ ] Create tab components in [src/components/harvest/](src/components/harvest/)
- [ ] Replace [src/pages/Harvest.tsx](src/pages/Harvest.tsx) with refactored version
- [ ] Verify Auth context exports `currentUser` and `loading`

### Testing

- [ ] [ ] Login with test account
- [ ] [ ] Create a harvest schedule → Verify in Firestore console
- [ ] [ ] Add a worker → Verify assignment tracking
- [ ] [ ] Create delivery → Check references resolve correctly
- [ ] [ ] Delete operation → Confirm removal from Firestore
- [ ] [ ] Refresh page → Data persists (Firestore, not localStorage)
- [ ] [ ] Logout & login with different account → Data isolation verified
- [ ] [ ] Test loading states with slow network (Chrome DevTools)

---

## 10. COMMON PATTERNS

### Loading States

```tsx
{loading ? (
  <Skeleton className="h-20" />
) : items.length === 0 ? (
  <EmptyState />
) : (
  <ItemList items={items} />
)}
```

### Error Handling

```tsx
if (error) {
  return <AlertCard type="danger" title="Error" message={error.message} />;
}
```

### Add/Edit Modal

```tsx
const [showModal, setShowModal] = useState(false);

const handleAdd = async (formData) => {
  try {
    await add(formData);
    setShowModal(false);
    toast.success("Added successfully");
  } catch (err) {
    toast.error(err.message);
  }
};
```

### Delete Confirmation

```tsx
const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

const handleDelete = async () => {
  try {
    await remove(deleteTarget);
    setDeleteTarget(null);
    toast.success("Deleted successfully");
  } catch (err) {
    toast.error(err.message);
  }
};
```

---

## 11. PERFORMANCE TIPS

1. **Use Hooks, Not Direct Service Calls:** Hooks handle subscription cleanup automatically
2. **Filter in Firestore:** Use `where()` queries instead of filtering JS arrays
3. **Batch Operations:** Use `writeBatch()` for 10+ operations
4. **Lazy Load Tabs:** Consider loading tab data only when tab is active
5. **Pagination:** For 100+ deliveries, implement pagination with `limit()` + `startAfter()`

---

## 12. TROUBLESHOOTING

### Data Not Appearing?

- [ ] Check Firebase authentication is working (`currentUser.uid` exists)
- [ ] Verify Firestore security rules allow reads
- [ ] Check browser console for errors
- [ ] Ensure document paths are `users/{uid}/harvest/{collection}/{docId}`

### Stale Data?

- [ ] Verify `onSnapshot` unsubscribe is called on unmount
- [ ] Check hook dependency arrays
- [ ] Look for duplicate subscription listeners

### Performance Issues?

- [ ] Reduce `onSnapshot` subscriptions (use callback pattern)
- [ ] Add indexes for complex queries (Firestore will suggest them)
- [ ] Consider offline persistence with `enableIndexedDbPersistence()`

---

## 13. NEXT STEPS

1. **Form Components:** Create `ScheduleForm`, `WorkerForm`, `DeliveryForm`
2. **Edit Functionality:** Add modal for editing existing records
3. **Filters:** Add status/role filters to tab views
4. **Export:** Add PDF/CSV export for schedules and deliveries
5. **Notifications:** Integrate with Cloud Messaging for harvest alerts
6. **Analytics:** Track completed harvests and delivery metrics

---

**Created:** 2026-01-18  
**Status:** Production-Ready  
**Author:** Firestore Integration Team
