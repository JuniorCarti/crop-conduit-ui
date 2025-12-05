/**
 * Firestore Service for Logistics Manager
 * Handles all logistics-related database operations
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
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  TransportBooking,
  Vehicle,
  Driver,
  LogisticsCost,
} from "./firestore";

const TRANSPORT_BOOKINGS_COLLECTION = "transportBookings";
const VEHICLES_COLLECTION = "vehicles";
const DRIVERS_COLLECTION = "drivers";
const LOGISTICS_COSTS_COLLECTION = "logisticsCosts";

// Helper function to convert Firestore timestamps
const convertTimestamp = (timestamp: any): Date => {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  if (timestamp?.toDate) return timestamp.toDate();
  if (typeof timestamp === "string") return new Date(timestamp);
  return new Date();
};

// ============================================================================
// TRANSPORT BOOKING OPERATIONS
// ============================================================================

/**
 * Subscribe to transport bookings for a user
 */
export function subscribeToTransportBookings(
  userId: string,
  callback: (bookings: TransportBooking[]) => void
) {
  const q = query(
    collection(db, TRANSPORT_BOOKINGS_COLLECTION),
    where("userId", "==", userId),
    orderBy("scheduledDate", "asc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const bookings = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          scheduledDate: convertTimestamp(data.scheduledDate),
          deliveryDate: convertTimestamp(data.deliveryDate),
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt),
        } as TransportBooking;
      });
      callback(bookings);
    },
    (error) => {
      console.error("Error subscribing to transport bookings:", error);
      callback([]);
    }
  );
}

/**
 * Create a new transport booking
 */
export async function createTransportBooking(
  booking: Omit<TransportBooking, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  try {
    const bookingData = {
      ...booking,
      scheduledDate:
        booking.scheduledDate instanceof Date
          ? Timestamp.fromDate(booking.scheduledDate)
          : booking.scheduledDate,
      deliveryDate: booking.deliveryDate
        ? booking.deliveryDate instanceof Date
          ? Timestamp.fromDate(booking.deliveryDate)
          : booking.deliveryDate
        : undefined,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const cleanData = Object.fromEntries(
      Object.entries(bookingData).filter(([_, value]) => value !== undefined)
    ) as any;

    const docRef = await addDoc(collection(db, TRANSPORT_BOOKINGS_COLLECTION), cleanData);
    return docRef.id;
  } catch (error) {
    console.error("Error creating transport booking:", error);
    throw error;
  }
}

/**
 * Update a transport booking
 */
export async function updateTransportBooking(
  id: string,
  updates: Partial<TransportBooking>
): Promise<void> {
  try {
    const docRef = doc(db, TRANSPORT_BOOKINGS_COLLECTION, id);
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now(),
    };

    if (updateData.scheduledDate instanceof Date) {
      updateData.scheduledDate = Timestamp.fromDate(updateData.scheduledDate);
    }
    if (updateData.deliveryDate instanceof Date) {
      updateData.deliveryDate = Timestamp.fromDate(updateData.deliveryDate);
    }

    const cleanData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    await updateDoc(docRef, cleanData);
  } catch (error) {
    console.error("Error updating transport booking:", error);
    throw error;
  }
}

/**
 * Delete a transport booking
 */
export async function deleteTransportBooking(id: string): Promise<void> {
  try {
    const docRef = doc(db, TRANSPORT_BOOKINGS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting transport booking:", error);
    throw error;
  }
}

// ============================================================================
// VEHICLE OPERATIONS
// ============================================================================

/**
 * Subscribe to vehicles for a user
 */
export function subscribeToVehicles(
  userId: string,
  callback: (vehicles: Vehicle[]) => void
) {
  const q = query(
    collection(db, VEHICLES_COLLECTION),
    where("userId", "==", userId),
    orderBy("name", "asc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const vehicles = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          lastMaintenance: convertTimestamp(data.lastMaintenance),
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt),
        } as Vehicle;
      });
      callback(vehicles);
    },
    (error) => {
      console.error("Error subscribing to vehicles:", error);
      callback([]);
    }
  );
}

/**
 * Create a new vehicle
 */
export async function createVehicle(
  vehicle: Omit<Vehicle, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  try {
    const vehicleData = {
      ...vehicle,
      lastMaintenance: vehicle.lastMaintenance
        ? vehicle.lastMaintenance instanceof Date
          ? Timestamp.fromDate(vehicle.lastMaintenance)
          : vehicle.lastMaintenance
        : undefined,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const cleanData = Object.fromEntries(
      Object.entries(vehicleData).filter(([_, value]) => value !== undefined)
    ) as any;

    const docRef = await addDoc(collection(db, VEHICLES_COLLECTION), cleanData);
    return docRef.id;
  } catch (error) {
    console.error("Error creating vehicle:", error);
    throw error;
  }
}

/**
 * Update a vehicle
 */
export async function updateVehicle(
  id: string,
  updates: Partial<Vehicle>
): Promise<void> {
  try {
    const docRef = doc(db, VEHICLES_COLLECTION, id);
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now(),
    };

    if (updateData.lastMaintenance instanceof Date) {
      updateData.lastMaintenance = Timestamp.fromDate(updateData.lastMaintenance);
    }

    const cleanData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    await updateDoc(docRef, cleanData);
  } catch (error) {
    console.error("Error updating vehicle:", error);
    throw error;
  }
}

/**
 * Delete a vehicle
 */
export async function deleteVehicle(id: string): Promise<void> {
  try {
    const docRef = doc(db, VEHICLES_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting vehicle:", error);
    throw error;
  }
}

// ============================================================================
// DRIVER OPERATIONS
// ============================================================================

/**
 * Subscribe to drivers for a user
 */
export function subscribeToDrivers(
  userId: string,
  callback: (drivers: Driver[]) => void
) {
  const q = query(
    collection(db, DRIVERS_COLLECTION),
    where("userId", "==", userId),
    orderBy("name", "asc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const drivers = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          licenseExpiry: convertTimestamp(data.licenseExpiry),
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt),
        } as Driver;
      });
      callback(drivers);
    },
    (error) => {
      console.error("Error subscribing to drivers:", error);
      callback([]);
    }
  );
}

/**
 * Create a new driver
 */
export async function createDriver(
  driver: Omit<Driver, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  try {
    const driverData = {
      ...driver,
      licenseExpiry: driver.licenseExpiry
        ? driver.licenseExpiry instanceof Date
          ? Timestamp.fromDate(driver.licenseExpiry)
          : driver.licenseExpiry
        : undefined,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const cleanData = Object.fromEntries(
      Object.entries(driverData).filter(([_, value]) => value !== undefined)
    ) as any;

    const docRef = await addDoc(collection(db, DRIVERS_COLLECTION), cleanData);
    return docRef.id;
  } catch (error) {
    console.error("Error creating driver:", error);
    throw error;
  }
}

/**
 * Update a driver
 */
export async function updateDriver(
  id: string,
  updates: Partial<Driver>
): Promise<void> {
  try {
    const docRef = doc(db, DRIVERS_COLLECTION, id);
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now(),
    };

    if (updateData.licenseExpiry instanceof Date) {
      updateData.licenseExpiry = Timestamp.fromDate(updateData.licenseExpiry);
    }

    const cleanData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    await updateDoc(docRef, cleanData);
  } catch (error) {
    console.error("Error updating driver:", error);
    throw error;
  }
}

/**
 * Delete a driver
 */
export async function deleteDriver(id: string): Promise<void> {
  try {
    const docRef = doc(db, DRIVERS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting driver:", error);
    throw error;
  }
}

// ============================================================================
// LOGISTICS COST OPERATIONS
// ============================================================================

/**
 * Subscribe to logistics costs for a user
 */
export function subscribeToLogisticsCosts(
  userId: string,
  transportBookingId?: string,
  callback?: (costs: LogisticsCost[]) => void
) {
  const constraints: any[] = [where("userId", "==", userId)];

  if (transportBookingId) {
    constraints.push(where("transportBookingId", "==", transportBookingId));
  }

  constraints.push(orderBy("date", "desc"));

  const q = query(collection(db, LOGISTICS_COSTS_COLLECTION), ...constraints);

  if (callback) {
    return onSnapshot(
      q,
      (snapshot) => {
        const costs = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            date: convertTimestamp(data.date),
            createdAt: convertTimestamp(data.createdAt),
          } as LogisticsCost;
        });
        callback(costs);
      },
      (error) => {
        console.error("Error subscribing to logistics costs:", error);
        if (callback) callback([]);
      }
    );
  }

  return () => {};
}

/**
 * Record logistics cost
 */
export async function addLogisticsCost(
  cost: Omit<LogisticsCost, "id" | "createdAt">
): Promise<string> {
  try {
    const costData = {
      ...cost,
      date: cost.date instanceof Date ? Timestamp.fromDate(cost.date) : cost.date,
      createdAt: Timestamp.now(),
    };

    const cleanData = Object.fromEntries(
      Object.entries(costData).filter(([_, value]) => value !== undefined)
    ) as any;

    const docRef = await addDoc(collection(db, LOGISTICS_COSTS_COLLECTION), cleanData);
    return docRef.id;
  } catch (error) {
    console.error("Error adding logistics cost:", error);
    throw error;
  }
}

