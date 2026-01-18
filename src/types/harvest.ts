/**
 * Harvest Module TypeScript Interfaces
 * 
 * Defines types for Harvest Schedules, Workers, and Deliveries
 * All timestamps are Firebase Timestamp objects or Date strings
 */

import { Timestamp } from "firebase/firestore";

/**
 * Harvest Schedule
 * Represents a planned harvest for a specific crop/field
 */
export interface HarvestSchedule {
    id: string;
    userId: string; // UID of farm owner (tenant identifier)
    cropId: string;
    farmId: string;
    cropName: string;
    field: string;
    plantedDate: Timestamp | Date | string;
    estimatedReadyDate: Timestamp | Date | string;
    optimalDate: string; // ISO date string for display
    status: "Pending" | "Ready" | "InProgress" | "Harvested" | "Cancelled";
    expectedYield: number; // in quantityUnit
    yieldUnit: "kg" | "tons" | "bags" | "bundles";
    notes?: string;
    createdAt: Timestamp | Date;
    updatedAt: Timestamp | Date;
}

/**
 * Harvest Schedule for form submissions (no timestamps initially)
 */
export interface CreateHarvestScheduleInput {
    cropId: string;
    farmId: string;
    cropName: string;
    field: string;
    plantedDate: string | Date;
    estimatedReadyDate: string | Date;
    optimalDate: string;
    expectedYield: number;
    yieldUnit: "kg" | "tons" | "bags" | "bundles";
    notes?: string;
}

/**
 * Worker
 * Represents a farm worker assigned to harvest operations
 */
export interface Worker {
    id: string;
    userId: string; // UID of farm owner (tenant identifier)
    name: string;
    role: "Harvester" | "Supervisor" | "Transporter" | "Quality Inspector";
    phone: string;
    email?: string;
    status: "Active" | "Inactive";
    assignedScheduleIds: string[]; // References to HarvestSchedule IDs
    experience?: string; // e.g., "5 years"
    emergencyContact?: {
        name: string;
        relationship: string;
        phone: string;
    };
    createdAt: Timestamp | Date;
    updatedAt: Timestamp | Date;
}

/**
 * Worker for form submissions
 */
export interface CreateWorkerInput {
    name: string;
    role: "Harvester" | "Supervisor" | "Transporter" | "Quality Inspector";
    phone: string;
    email?: string;
    experience?: string;
    emergencyContact?: {
        name: string;
        relationship: string;
        phone: string;
    };
}

/**
 * Delivery
 * Represents a harvest delivery/logistics record
 */
export interface Delivery {
    id: string;
    userId: string; // UID of farm owner (tenant identifier)
    scheduleId: string; // Reference to HarvestSchedule
    assignedWorkerId: string; // Reference to Worker
    destination: "Market" | "Warehouse" | "Buyer" | "Processor" | "Other";
    destinationAddress: string;
    quantity: number; // in quantityUnit
    quantityUnit: "kg" | "tons" | "bags" | "bundles";
    scheduledDate: Timestamp | Date | string;
    status: "Pending" | "InTransit" | "Delivered" | "Cancelled" | "Delayed";
    vehicleType: "Truck" | "Van" | "Motorbike" | "Bicycle" | "Other";
    transportCost?: number;
    actualDeliveryDate?: Timestamp | Date | string;
    notes?: string;
    createdAt: Timestamp | Date;
    updatedAt: Timestamp | Date;
}

/**
 * Delivery for form submissions
 */
export interface CreateDeliveryInput {
    scheduleId: string;
    assignedWorkerId: string;
    destination: "Market" | "Warehouse" | "Buyer" | "Processor" | "Other";
    destinationAddress: string;
    quantity: number;
    quantityUnit: "kg" | "tons" | "bags" | "bundles";
    scheduledDate: string | Date;
    vehicleType: "Truck" | "Van" | "Motorbike" | "Bicycle" | "Other";
    transportCost?: number;
    notes?: string;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
    data: T | null;
    loading: boolean;
    error: Error | null;
}

/**
 * Hook return type for collections
 */
export interface CollectionHookReturn<T> {
    data: T[];
    loading: boolean;
    error: Error | null;
}

/**
 * Hook return type for single document
 */
export interface DocumentHookReturn<T> {
    data: T | null;
    loading: boolean;
    error: Error | null;
}

/**
 * Combined harvest module state for easier passing to components
 */
export interface HarvestModuleState {
    schedules: HarvestSchedule[];
    workers: Worker[];
    deliveries: Delivery[];
    schedulesLoading: boolean;
    workersLoading: boolean;
    deliveriesLoading: boolean;
    error: Error | null;
}
