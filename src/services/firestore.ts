/**
 * Firestore Service Layer
 * Handles all Firestore database operations
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  QueryConstraint,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface Crop {
  id?: string;
  name: string;
  type: string;
  plantingDate: Date | Timestamp | string;
  harvestDate: Date | Timestamp | string;
  field: string;
  estimatedYield: number;
  status: "Healthy" | "Needs Attention" | "Pest Alert" | "Harvest Ready";
  alerts?: string[];
  soilMoisture?: number;
  ndvi?: number;
  growthStage?: string;
  createdAt?: Date | Timestamp | string;
  updatedAt?: Date | Timestamp | string;
  userId?: string;
}

export interface CropActivity {
  id?: string;
  cropId: string;
  type: "irrigation" | "fertilization" | "pesticide" | "other";
  date: Date | Timestamp | string;
  description: string;
  amount?: number;
  unit?: string;
  createdAt?: Date | Timestamp | string;
}

export interface CropRecommendation {
  id?: string;
  cropId: string;
  type: "irrigation" | "fertilization" | "pesticide" | "harvest";
  priority: "high" | "medium" | "low";
  message: string;
  action?: string;
  createdAt?: Date | Timestamp | string;
}

export interface CropGrowthData {
  id?: string;
  cropId: string;
  date: Date | Timestamp | string;
  ndvi?: number;
  height?: number;
  moisture?: number;
  notes?: string;
}

// ============================================================================
// CROPS COLLECTION OPERATIONS
// ============================================================================

const CROPS_COLLECTION = "crops";
const ACTIVITIES_COLLECTION = "cropActivities";
const RECOMMENDATIONS_COLLECTION = "cropRecommendations";
const GROWTH_DATA_COLLECTION = "cropGrowthData";

/**
 * Convert Firestore Timestamp to Date
 */
const convertTimestamp = (timestamp: any): Date | undefined => {
  if (!timestamp) return undefined;
  if (timestamp instanceof Date) {
    // Check if date is valid
    return isNaN(timestamp.getTime()) ? undefined : timestamp;
  }
  if (timestamp?.toDate) {
    const date = timestamp.toDate();
    return isNaN(date.getTime()) ? undefined : date;
  }
  if (typeof timestamp === "string") {
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? undefined : date;
  }
  if (typeof timestamp === "number") {
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? undefined : date;
  }
  return undefined;
};

/**
 * Convert Crop document from Firestore
 */
const convertCropFromFirestore = (doc: any): Crop => {
  try {
    const data = doc.data();
    
    // Ensure we have a valid document
    if (!data) {
      console.error(`[convertCropFromFirestore] Document ${doc.id} has no data`);
      throw new Error(`Document ${doc.id} has no data`);
    }

    // Ensure ID is set
    const cropId = doc.id || data.id;
    if (!cropId) {
      console.error(`[convertCropFromFirestore] Document has no ID`);
      throw new Error("Document has no ID");
    }

    const plantingDate = convertTimestamp(data.plantingDate);
    const harvestDate = convertTimestamp(data.harvestDate);
    const createdAt = convertTimestamp(data.createdAt);
    const updatedAt = convertTimestamp(data.updatedAt);

    const crop: Crop = {
      id: cropId,
      name: data.name || "Unnamed Crop",
      type: data.type || "Other",
      field: data.field || "Unknown Field",
      plantingDate: plantingDate || new Date(), // Fallback to current date if invalid
      harvestDate: harvestDate || new Date(), // Fallback to current date if invalid
      estimatedYield: data.estimatedYield || 0,
      status: data.status || "Healthy",
      ...data,
      createdAt: createdAt || new Date(),
      updatedAt: updatedAt || new Date(),
    };

    console.log(`[convertCropFromFirestore] Converted crop: ${crop.id} - ${crop.name} (userId: ${crop.userId})`);
    return crop;
  } catch (error) {
    console.error(`[convertCropFromFirestore] Error converting document ${doc.id}:`, error);
    throw error;
  }
};

/**
 * Convert Crop to Firestore document
 * Filters out undefined values to prevent Firebase errors
 */
const convertCropToFirestore = (crop: Partial<Crop>): any => {
  const { id, ...data } = crop;
  
  // Build clean object, filtering out undefined values
  const cleanData: any = {
    plantingDate: data.plantingDate instanceof Date 
      ? Timestamp.fromDate(data.plantingDate)
      : data.plantingDate,
    harvestDate: data.harvestDate instanceof Date
      ? Timestamp.fromDate(data.harvestDate)
      : data.harvestDate,
    updatedAt: Timestamp.now(),
  };

  // Only include fields that are not undefined
  if (data.name !== undefined) cleanData.name = data.name;
  if (data.type !== undefined) cleanData.type = data.type;
  if (data.field !== undefined) cleanData.field = data.field;
  if (data.estimatedYield !== undefined) cleanData.estimatedYield = data.estimatedYield;
  if (data.status !== undefined) cleanData.status = data.status;
  if (data.alerts !== undefined) cleanData.alerts = data.alerts;
  if (data.soilMoisture !== undefined) cleanData.soilMoisture = data.soilMoisture;
  if (data.ndvi !== undefined) cleanData.ndvi = data.ndvi;
  if (data.growthStage !== undefined) cleanData.growthStage = data.growthStage;
  if (data.userId !== undefined) cleanData.userId = data.userId;

  return cleanData;
};

/**
 * Get all crops for a user (real-time listener)
 */
export function subscribeToCrops(
  userId: string,
  callback: (crops: Crop[]) => void,
  filters?: {
    type?: string;
    status?: string;
    search?: string;
    sortBy?: "plantingDate" | "harvestDate" | "estimatedYield" | "name";
    sortOrder?: "asc" | "desc";
  }
) {
  const constraints: QueryConstraint[] = [where("userId", "==", userId)];

  if (filters?.type) {
    constraints.push(where("type", "==", filters.type));
  }

  if (filters?.status) {
    constraints.push(where("status", "==", filters.status));
  }

  const sortField = filters?.sortBy || "plantingDate";
  const sortOrder = filters?.sortOrder || "desc";
  constraints.push(orderBy(sortField, sortOrder));

  const q = query(collection(db, CROPS_COLLECTION), ...constraints);

  try {
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          // Log for debugging
          console.log(`[Firestore] Fetched ${snapshot.docs.length} crop documents for user ${userId}`);
          
          // Map all documents to crops
          let crops = snapshot.docs.map((doc) => {
            try {
              return convertCropFromFirestore(doc);
            } catch (docError) {
              console.error(`[Firestore] Error converting crop document ${doc.id}:`, docError);
              return null;
            }
          }).filter((crop): crop is Crop => crop !== null);

          // Client-side search filter (for better UX, can be moved to Firestore with proper indexing)
          if (filters?.search) {
            const searchLower = filters.search.toLowerCase();
            crops = crops.filter(
              (crop) =>
                crop.name.toLowerCase().includes(searchLower) ||
                crop.field.toLowerCase().includes(searchLower) ||
                crop.type.toLowerCase().includes(searchLower)
            );
          }

          console.log(`[Firestore] Returning ${crops.length} crops after filtering`);
          callback(crops);
        } catch (callbackError) {
          console.error("[Firestore] Error in snapshot callback:", callbackError);
          callback([]); // Return empty array on error to prevent UI crash
        }
      },
      (error) => {
        // Error callback for onSnapshot
        console.error("[Firestore] Subscription error:", error);
        console.error("[Firestore] Error code:", error.code);
        console.error("[Firestore] Error message:", error.message);
        console.error("[Firestore] Full error:", error);
        
        // Call callback with empty array on error, but log it
        callback([]);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error("[Firestore] Error setting up subscription:", error);
    // Return a no-op function if subscription setup fails
    return () => {};
  }
}

/**
 * Get a single crop by ID
 */
export async function getCrop(cropId: string): Promise<Crop | null> {
  try {
    const docRef = doc(db, CROPS_COLLECTION, cropId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return convertCropFromFirestore(docSnap);
    }
    return null;
  } catch (error) {
    console.error("Error getting crop:", error);
    throw error;
  }
}

/**
 * Create a new crop
 */
export async function createCrop(crop: Omit<Crop, "id" | "createdAt" | "updatedAt">): Promise<string> {
  try {
    const cropData = {
      ...convertCropToFirestore(crop),
      createdAt: Timestamp.now(),
    };

    // Debug log to show what's being sent to Firebase
    console.log("[createCrop] Crop data being sent to Firestore:", cropData);
    console.log("[createCrop] Checking for undefined values:", Object.keys(cropData).filter(key => cropData[key] === undefined));

    // Final safety check: remove any undefined values that might have slipped through
    const finalData: any = {};
    Object.keys(cropData).forEach(key => {
      if (cropData[key] !== undefined) {
        finalData[key] = cropData[key];
      }
    });

    console.log("[createCrop] Final data after filtering undefined:", finalData);

    const docRef = await addDoc(collection(db, CROPS_COLLECTION), finalData);
    console.log("[createCrop] Crop created successfully with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("[createCrop] Error creating crop:", error);
    throw error;
  }
}

/**
 * Update an existing crop
 */
export async function updateCrop(cropId: string, updates: Partial<Crop>): Promise<void> {
  try {
    const docRef = doc(db, CROPS_COLLECTION, cropId);
    const updateData = convertCropToFirestore(updates);
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error("Error updating crop:", error);
    throw error;
  }
}

/**
 * Delete a crop
 */
export async function deleteCrop(cropId: string): Promise<void> {
  try {
    const docRef = doc(db, CROPS_COLLECTION, cropId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting crop:", error);
    throw error;
  }
}

// ============================================================================
// CROP ACTIVITIES OPERATIONS
// ============================================================================

/**
 * Get activities for a crop
 */
export function subscribeToCropActivities(
  cropId: string,
  callback: (activities: CropActivity[]) => void
) {
  const q = query(
    collection(db, ACTIVITIES_COLLECTION),
    where("cropId", "==", cropId),
    orderBy("date", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const activities = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: convertTimestamp(data.date),
        createdAt: convertTimestamp(data.createdAt),
      } as CropActivity;
    });
    callback(activities);
  });
}

/**
 * Add a crop activity
 */
export async function addCropActivity(
  activity: Omit<CropActivity, "id" | "createdAt">
): Promise<string> {
  try {
    const activityData = {
      ...activity,
      date: activity.date instanceof Date
        ? Timestamp.fromDate(activity.date)
        : activity.date,
      createdAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, ACTIVITIES_COLLECTION), activityData);
    return docRef.id;
  } catch (error) {
    console.error("Error adding crop activity:", error);
    throw error;
  }
}

// ============================================================================
// CROP RECOMMENDATIONS OPERATIONS
// ============================================================================

/**
 * Get recommendations for a crop
 */
export function subscribeToCropRecommendations(
  cropId: string,
  callback: (recommendations: CropRecommendation[]) => void
) {
  // Note: Firestore requires a composite index for multiple orderBy clauses
  // For now, we'll sort by priority only and handle createdAt sorting client-side if needed
  const q = query(
    collection(db, RECOMMENDATIONS_COLLECTION),
    where("cropId", "==", cropId),
    orderBy("priority", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const recommendations = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: convertTimestamp(data.createdAt),
      } as CropRecommendation;
    });
    callback(recommendations);
  });
}

/**
 * Add a recommendation
 */
export async function addCropRecommendation(
  recommendation: Omit<CropRecommendation, "id" | "createdAt">
): Promise<string> {
  try {
    const recData = {
      ...recommendation,
      createdAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, RECOMMENDATIONS_COLLECTION), recData);
    return docRef.id;
  } catch (error) {
    console.error("Error adding recommendation:", error);
    throw error;
  }
}

// ============================================================================
// CROP GROWTH DATA OPERATIONS
// ============================================================================

/**
 * Get growth data for a crop (for charts)
 */
export function subscribeToCropGrowthData(
  cropId: string,
  callback: (data: CropGrowthData[]) => void
) {
  const q = query(
    collection(db, GROWTH_DATA_COLLECTION),
    where("cropId", "==", cropId),
    orderBy("date", "asc")
  );

  return onSnapshot(q, (snapshot) => {
    const growthData = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: convertTimestamp(data.date),
      } as CropGrowthData;
    });
    callback(growthData);
  });
}

/**
 * Add growth data point
 */
export async function addCropGrowthData(
  data: Omit<CropGrowthData, "id">
): Promise<string> {
  try {
    const dataPoint = {
      ...data,
      date: data.date instanceof Date
        ? Timestamp.fromDate(data.date)
        : data.date,
    };

    const docRef = await addDoc(collection(db, GROWTH_DATA_COLLECTION), dataPoint);
    return docRef.id;
  } catch (error) {
    console.error("Error adding growth data:", error);
    throw error;
  }
}

// ============================================================================
// RESOURCES OPERATIONS (Quartermaster Agent)
// ============================================================================

export interface Resource {
  id?: string;
  name: string;
  type: "fertilizer" | "seed" | "pesticide" | "water" | "other" | "Fertilizer" | "Chemicals" | "Seeds" | "Tools" | "Other";
  recommendedQuantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  applicationDate?: Date | Timestamp | string;
  cropId?: string; // Optional: link to specific crop
  cropName?: string; // Optional: for display
  supplier?: string;
  supplierContact?: string;
  notes?: string;
  stockLevel?: number; // Current stock
  reorderLevel?: number; // Alert when stock falls below this
  lastRestocked?: Date | Timestamp | string;
  createdAt?: Date | Timestamp | string;
  updatedAt?: Date | Timestamp | string;
  userId?: string;
}

export interface ResourceUsage {
  id?: string;
  resourceId: string;
  date: Date | Timestamp | string;
  quantity: number;
  unit: string;
  cost: number;
  cropId?: string;
  notes?: string;
  createdAt?: Date | Timestamp | string;
}

export interface Supplier {
  id?: string;
  name: string;
  contact: string;
  email?: string;
  address?: string;
  products: string[]; // Types of products they supply
  rating?: number;
  notes?: string;
  createdAt?: Date | Timestamp | string;
  userId?: string;
}

const RESOURCES_COLLECTION = "resources";
const RESOURCE_USAGE_COLLECTION = "resourceUsage";
const SUPPLIERS_COLLECTION = "suppliers";

/**
 * Convert Resource document from Firestore
 */
const convertResourceFromFirestore = (doc: any): Resource => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    applicationDate: data.applicationDate ? convertTimestamp(data.applicationDate) : undefined,
    lastRestocked: data.lastRestocked ? convertTimestamp(data.lastRestocked) : undefined,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
  };
};

/**
 * Convert Resource to Firestore document
 * Removes undefined values and ensures all fields are valid
 */
const convertResourceToFirestore = (resource: Partial<Resource>): any => {
  const { id, ...data } = resource;
  
  // Clean data: remove undefined values and replace with empty strings for optional string fields
  const cleanData: any = {};
  
  // Required fields
  if (data.name !== undefined) cleanData.name = data.name;
  if (data.type !== undefined) cleanData.type = data.type;
  if (data.recommendedQuantity !== undefined) cleanData.recommendedQuantity = data.recommendedQuantity;
  if (data.unit !== undefined) cleanData.unit = data.unit;
  if (data.unitCost !== undefined) cleanData.unitCost = data.unitCost;
  if (data.totalCost !== undefined) cleanData.totalCost = data.totalCost;
  
  // Optional fields - use empty string instead of undefined
  cleanData.cropName = data.cropName ?? "";
  cleanData.supplier = data.supplier ?? "";
  cleanData.supplierContact = data.supplierContact ?? "";
  cleanData.notes = data.notes ?? ""; // Always ensure notes is a string, never undefined
  
  // Optional numeric fields
  if (data.stockLevel !== undefined) cleanData.stockLevel = data.stockLevel;
  if (data.reorderLevel !== undefined) cleanData.reorderLevel = data.reorderLevel;
  
  // Optional date fields
  if (data.applicationDate) {
    cleanData.applicationDate = data.applicationDate instanceof Date
      ? Timestamp.fromDate(data.applicationDate)
      : data.applicationDate;
  }
  if (data.lastRestocked) {
    cleanData.lastRestocked = data.lastRestocked instanceof Date
      ? Timestamp.fromDate(data.lastRestocked)
      : data.lastRestocked;
  }
  
  // Optional ID fields
  if (data.cropId !== undefined) cleanData.cropId = data.cropId ?? "";
  if (data.userId !== undefined) cleanData.userId = data.userId;
  
  cleanData.updatedAt = Timestamp.now();
  
  return cleanData;
};

/**
 * Get all resources for a user (real-time listener)
 */
export function subscribeToResources(
  userId: string,
  callback: (resources: Resource[]) => void,
  filters?: {
    type?: string;
    cropId?: string;
    search?: string;
    sortBy?: "name" | "unitCost" | "totalCost" | "applicationDate" | "recommendedQuantity";
    sortOrder?: "asc" | "desc";
  }
) {
  const constraints: QueryConstraint[] = [where("userId", "==", userId)];

  if (filters?.type) {
    constraints.push(where("type", "==", filters.type));
  }

  if (filters?.cropId) {
    constraints.push(where("cropId", "==", filters.cropId));
  }

  const sortField = filters?.sortBy || "name";
  const sortOrder = filters?.sortOrder || "asc";
  constraints.push(orderBy(sortField, sortOrder));

  const q = query(collection(db, RESOURCES_COLLECTION), ...constraints);

  return onSnapshot(q, (snapshot) => {
    let resources = snapshot.docs.map(convertResourceFromFirestore);

    // Client-side search filter
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      resources = resources.filter(
        (resource) =>
          resource.name.toLowerCase().includes(searchLower) ||
          resource.type.toLowerCase().includes(searchLower) ||
          resource.cropName?.toLowerCase().includes(searchLower) ||
          resource.supplier?.toLowerCase().includes(searchLower)
      );
    }

    callback(resources);
  });
}

/**
 * Get a single resource by ID
 */
export async function getResource(resourceId: string): Promise<Resource | null> {
  try {
    const docRef = doc(db, RESOURCES_COLLECTION, resourceId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return convertResourceFromFirestore(docSnap);
    }
    return null;
  } catch (error) {
    console.error("Error getting resource:", error);
    throw error;
  }
}

/**
 * Create a new resource
 */
export async function createResource(resource: Omit<Resource, "id" | "createdAt" | "updatedAt">): Promise<string> {
  try {
    // Convert to Firestore format (this already handles undefined values)
    const firestoreData = convertResourceToFirestore(resource);
    
    // Add timestamp
    firestoreData.createdAt = Timestamp.now();
    
    // Final cleanup: remove any remaining undefined values
    const cleanData = Object.fromEntries(
      Object.entries(firestoreData).filter(([_, value]) => value !== undefined)
    ) as any;
    
    // Ensure notes is always a string (never undefined)
    if (cleanData.notes === undefined) {
      cleanData.notes = "";
    }

    const docRef = await addDoc(collection(db, RESOURCES_COLLECTION), cleanData);
    return docRef.id;
  } catch (error) {
    console.error("Error creating resource:", error);
    throw error;
  }
}

/**
 * Update an existing resource
 */
export async function updateResource(resourceId: string, updates: Partial<Resource>): Promise<void> {
  try {
    const docRef = doc(db, RESOURCES_COLLECTION, resourceId);
    const updateData = convertResourceToFirestore(updates);
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error("Error updating resource:", error);
    throw error;
  }
}

/**
 * Delete a resource
 */
export async function deleteResource(resourceId: string): Promise<void> {
  try {
    const docRef = doc(db, RESOURCES_COLLECTION, resourceId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting resource:", error);
    throw error;
  }
}

/**
 * Get resource usage history (for charts)
 */
export function subscribeToResourceUsage(
  userId: string,
  resourceId?: string,
  callback?: (usage: ResourceUsage[]) => void
) {
  const constraints: QueryConstraint[] = [];

  if (resourceId) {
    constraints.push(where("resourceId", "==", resourceId));
  }

  constraints.push(orderBy("date", "desc"));

  const q = query(collection(db, RESOURCE_USAGE_COLLECTION), ...constraints);

  if (callback) {
    return onSnapshot(q, (snapshot) => {
      const usage = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: convertTimestamp(data.date),
          createdAt: convertTimestamp(data.createdAt),
        } as ResourceUsage;
      });
      callback(usage);
    });
  }

  return () => {};
}

/**
 * Record resource usage
 */
export async function addResourceUsage(
  usage: Omit<ResourceUsage, "id" | "createdAt">
): Promise<string> {
  try {
    const usageData = {
      ...usage,
      date: usage.date instanceof Date
        ? Timestamp.fromDate(usage.date)
        : usage.date,
      createdAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, RESOURCE_USAGE_COLLECTION), usageData);
    return docRef.id;
  } catch (error) {
    console.error("Error adding resource usage:", error);
    throw error;
  }
}

/**
 * Get all suppliers for a user
 */
export function subscribeToSuppliers(
  userId: string,
  callback: (suppliers: Supplier[]) => void
) {
  const q = query(
    collection(db, SUPPLIERS_COLLECTION),
    where("userId", "==", userId),
    orderBy("name", "asc")
  );

  return onSnapshot(q, (snapshot) => {
    const suppliers = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: convertTimestamp(data.createdAt),
      } as Supplier;
    });
    callback(suppliers);
  });
}

/**
 * Create a new supplier
 */
export async function createSupplier(supplier: Omit<Supplier, "id" | "createdAt">): Promise<string> {
  try {
    const supplierData = {
      ...supplier,
      createdAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, SUPPLIERS_COLLECTION), supplierData);
    return docRef.id;
  } catch (error) {
    console.error("Error creating supplier:", error);
    throw error;
  }
}

// ============================================================================
// IRRIGATION SCHEDULER OPERATIONS
// ============================================================================

export interface IrrigationSchedule {
  id?: string;
  cropId: string;
  cropName?: string;
  field: string;
  scheduledDate: Date | Timestamp | string;
  duration: number; // minutes
  waterAmount: number; // liters
  method: "drip" | "sprinkler" | "flood" | "manual";
  status: "scheduled" | "completed" | "skipped" | "cancelled";
  soilMoistureBefore?: number;
  soilMoistureAfter?: number;
  weatherForecast?: {
    temperature: number;
    humidity: number;
    rainfall: number;
    windSpeed: number;
  };
  cost?: number;
  notes?: string;
  // Supabase Storage URLs (replaces Firebase Storage paths)
  weatherChartUrl?: string; // URL to weather forecast chart/image stored in Supabase
  sensorDataUrl?: string; // URL to IoT sensor data logs/images stored in Supabase
  reportUrl?: string; // URL to irrigation report/document stored in Supabase
  attachments?: string[]; // Array of Supabase URLs for additional files (images, documents)
  createdAt?: Date | Timestamp | string;
  updatedAt?: Date | Timestamp | string;
  userId?: string;
}

export interface WaterSource {
  id?: string;
  name: string;
  type: "reservoir" | "well" | "river" | "borehole" | "tank";
  capacity: number; // liters
  currentLevel: number; // liters
  location?: string;
  status: "available" | "low" | "empty" | "maintenance";
  lastRefilled?: Date | Timestamp | string;
  refillCost?: number;
  notes?: string;
  // Supabase Storage URLs (replaces Firebase Storage paths)
  photoUrl?: string; // URL to water source photo stored in Supabase
  documentUrl?: string; // URL to water source documents (permits, certificates) stored in Supabase
  sensorLogUrl?: string; // URL to sensor data logs stored in Supabase
  maintenanceLogUrl?: string; // URL to maintenance records stored in Supabase
  attachments?: string[]; // Array of Supabase URLs for additional files
  createdAt?: Date | Timestamp | string;
  updatedAt?: Date | Timestamp | string;
  userId?: string;
}

export interface IrrigationEfficiency {
  id?: string;
  cropId: string;
  date: Date | Timestamp | string;
  waterUsed: number;
  yieldIncrease?: number;
  costPerLiter: number;
  efficiency: number; // percentage
  notes?: string;
  // Supabase Storage URLs (replaces Firebase Storage paths)
  chartUrl?: string; // URL to efficiency chart/image stored in Supabase
  reportUrl?: string; // URL to efficiency analysis report stored in Supabase
  dataExportUrl?: string; // URL to exported data file (CSV, PDF) stored in Supabase
  createdAt?: Date | Timestamp | string;
  userId?: string;
}

const IRRIGATION_SCHEDULE_COLLECTION = "irrigationSchedules";
const WATER_SOURCES_COLLECTION = "waterSources";
const IRRIGATION_EFFICIENCY_COLLECTION = "irrigationEfficiency";

// ============================================================================
// HARVEST PLANNER OPERATIONS
// ============================================================================

export interface HarvestPlan {
  id?: string;
  cropId: string;
  cropName: string;
  field: string;
  plantingDate: Date | Timestamp | string;
  estimatedHarvestDate: Date | Timestamp | string;
  actualHarvestDate?: Date | Timestamp | string;
  cropType: string;
  estimatedYield: number; // tons
  actualYield?: number; // tons
  status: "planned" | "ready" | "in-progress" | "completed" | "cancelled";
  priority: "high" | "medium" | "low";
  weatherForecast?: {
    temperature: number;
    humidity: number;
    rainfall: number;
    windSpeed: number;
  };
  teamSize?: number;
  equipment?: string[];
  notes?: string;
  createdAt?: Date | Timestamp | string;
  updatedAt?: Date | Timestamp | string;
  userId?: string;
}

export interface HarvestTask {
  id?: string;
  harvestPlanId: string;
  title: string;
  description: string;
  assignedTo?: string;
  assignedToName?: string;
  status: "pending" | "in-progress" | "completed" | "blocked";
  priority: "high" | "medium" | "low";
  dueDate?: Date | Timestamp | string;
  completedAt?: Date | Timestamp | string;
  notes?: string;
  createdAt?: Date | Timestamp | string;
  updatedAt?: Date | Timestamp | string;
  userId?: string;
}

export interface EquipmentItem {
  id?: string;
  name: string;
  type: "tool" | "machine" | "container" | "vehicle" | "other";
  quantity: number;
  available: number;
  location?: string;
  condition: "excellent" | "good" | "fair" | "poor" | "needs-repair";
  lastMaintenance?: Date | Timestamp | string;
  nextMaintenance?: Date | Timestamp | string;
  notes?: string;
  createdAt?: Date | Timestamp | string;
  updatedAt?: Date | Timestamp | string;
  userId?: string;
}

const HARVEST_PLANS_COLLECTION = "harvestPlans";
const HARVEST_TASKS_COLLECTION = "harvestTasks";
const EQUIPMENT_COLLECTION = "equipment";

// ============================================================================
// LOGISTICS MANAGER OPERATIONS
// ============================================================================

export interface TransportBooking {
  id?: string;
  harvestPlanId?: string;
  cropId?: string;
  cropName: string;
  origin: string;
  destination: string;
  scheduledDate: Date | Timestamp | string;
  deliveryDate?: Date | Timestamp | string;
  vehicleId?: string;
  vehicleType?: string;
  driverId?: string;
  driverName?: string;
  quantity: number; // tons or units
  status: "pending" | "assigned" | "in-transit" | "delivered" | "cancelled";
  requiresColdChain: boolean;
  temperature?: number;
  cost: number;
  notes?: string;
  createdAt?: Date | Timestamp | string;
  updatedAt?: Date | Timestamp | string;
  userId?: string;
}

export interface Vehicle {
  id?: string;
  name: string;
  type: "truck" | "van" | "tractor" | "trailer" | "other";
  registrationNumber: string;
  capacity: number; // tons
  hasColdChain: boolean;
  currentLocation?: {
    lat: number;
    lng: number;
    address?: string;
  };
  status: "available" | "in-use" | "maintenance" | "unavailable";
  driverId?: string;
  driverName?: string;
  fuelLevel?: number; // percentage
  lastMaintenance?: Date | Timestamp | string;
  notes?: string;
  createdAt?: Date | Timestamp | string;
  updatedAt?: Date | Timestamp | string;
  userId?: string;
}

export interface Driver {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  licenseNumber: string;
  licenseExpiry?: Date | Timestamp | string;
  status: "available" | "on-trip" | "off-duty" | "unavailable";
  vehicleId?: string;
  rating?: number;
  notes?: string;
  createdAt?: Date | Timestamp | string;
  updatedAt?: Date | Timestamp | string;
  userId?: string;
}

export interface LogisticsCost {
  id?: string;
  transportBookingId: string;
  fuelCost: number;
  laborCost: number;
  storageCost: number;
  otherCosts: number;
  totalCost: number;
  date: Date | Timestamp | string;
  notes?: string;
  createdAt?: Date | Timestamp | string;
  userId?: string;
}

const TRANSPORT_BOOKINGS_COLLECTION = "transportBookings";
const VEHICLES_COLLECTION = "vehicles";
const DRIVERS_COLLECTION = "drivers";
const LOGISTICS_COSTS_COLLECTION = "logisticsCosts";

// ============================================================================
// STORAGE OPTIMIZER OPERATIONS
// ============================================================================

export interface StorageUnit {
  id?: string;
  name: string;
  type: "warehouse" | "silo" | "cold-room" | "shed" | "container";
  capacity: number; // tons or cubic meters
  currentCapacity: number;
  location?: string;
  conditions: {
    temperature?: number; // Celsius
    humidity?: number; // percentage
    ventilation?: "good" | "fair" | "poor";
  };
  status: "available" | "full" | "maintenance" | "unavailable";
  costPerMonth?: number;
  notes?: string;
  createdAt?: Date | Timestamp | string;
  updatedAt?: Date | Timestamp | string;
  userId?: string;
}

export interface StoredCrop {
  id?: string;
  cropId: string;
  cropName: string;
  storageUnitId: string;
  storageUnitName?: string;
  quantity: number; // tons
  storageMethod: "bulk" | "bags" | "crates" | "pallets" | "other";
  storedDate: Date | Timestamp | string;
  expectedShelfLife: number; // days
  remainingShelfLife?: number; // days
  currentConditions: {
    temperature?: number;
    humidity?: number;
  };
  qualityStatus: "excellent" | "good" | "fair" | "poor" | "spoiled";
  estimatedLoss?: number; // percentage
  releaseDate?: Date | Timestamp | string;
  notes?: string;
  createdAt?: Date | Timestamp | string;
  updatedAt?: Date | Timestamp | string;
  userId?: string;
}

export interface StorageAlert {
  id?: string;
  storedCropId: string;
  type: "temperature" | "humidity" | "shelf-life" | "capacity" | "quality";
  severity: "critical" | "warning" | "info";
  message: string;
  resolved: boolean;
  resolvedAt?: Date | Timestamp | string;
  createdAt?: Date | Timestamp | string;
  userId?: string;
}

const STORAGE_UNITS_COLLECTION = "storageUnits";
const STORED_CROPS_COLLECTION = "storedCrops";
const STORAGE_ALERTS_COLLECTION = "storageAlerts";

