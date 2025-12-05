/**
 * React hooks for Firestore Logistics Manager
 */

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscribeToTransportBookings,
  createTransportBooking,
  updateTransportBooking,
  deleteTransportBooking,
  subscribeToVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  subscribeToDrivers,
  createDriver,
  updateDriver,
  deleteDriver,
  subscribeToLogisticsCosts,
  addLogisticsCost,
  type TransportBooking,
  type Vehicle,
  type Driver,
  type LogisticsCost,
} from "@/services/firestore-logistics";
import { toast } from "sonner";

// ============================================================================
// TRANSPORT BOOKING HOOKS
// ============================================================================

export function useTransportBookings() {
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState<TransportBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!currentUser?.uid) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = subscribeToTransportBookings(
      currentUser.uid,
      (data) => {
        setBookings(data);
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [currentUser?.uid]);

  return { bookings, isLoading, error };
}

export function useCreateTransportBooking() {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (booking: Omit<TransportBooking, "id" | "createdAt" | "updatedAt" | "userId">) => {
      if (!currentUser?.uid) {
        throw new Error("User not authenticated");
      }
      return createTransportBooking({
        ...booking,
        userId: currentUser.uid,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transportBookings"] });
      toast.success("Transport booking created successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create transport booking");
    },
  });
}

export function useUpdateTransportBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<TransportBooking> }) => {
      return updateTransportBooking(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transportBookings"] });
      toast.success("Transport booking updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update transport booking");
    },
  });
}

export function useDeleteTransportBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return deleteTransportBooking(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transportBookings"] });
      toast.success("Transport booking deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete transport booking");
    },
  });
}

// ============================================================================
// VEHICLE HOOKS
// ============================================================================

export function useVehicles() {
  const { currentUser } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!currentUser?.uid) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = subscribeToVehicles(
      currentUser.uid,
      (data) => {
        setVehicles(data);
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [currentUser?.uid]);

  return { vehicles, isLoading, error };
}

export function useCreateVehicle() {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vehicle: Omit<Vehicle, "id" | "createdAt" | "updatedAt" | "userId">) => {
      if (!currentUser?.uid) {
        throw new Error("User not authenticated");
      }
      return createVehicle({
        ...vehicle,
        userId: currentUser.uid,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      toast.success("Vehicle added successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add vehicle");
    },
  });
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Vehicle> }) => {
      return updateVehicle(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      toast.success("Vehicle updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update vehicle");
    },
  });
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return deleteVehicle(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      toast.success("Vehicle deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete vehicle");
    },
  });
}

// ============================================================================
// DRIVER HOOKS
// ============================================================================

export function useDrivers() {
  const { currentUser } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!currentUser?.uid) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = subscribeToDrivers(
      currentUser.uid,
      (data) => {
        setDrivers(data);
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [currentUser?.uid]);

  return { drivers, isLoading, error };
}

export function useCreateDriver() {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (driver: Omit<Driver, "id" | "createdAt" | "updatedAt" | "userId">) => {
      if (!currentUser?.uid) {
        throw new Error("User not authenticated");
      }
      return createDriver({
        ...driver,
        userId: currentUser.uid,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      toast.success("Driver added successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add driver");
    },
  });
}

export function useUpdateDriver() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Driver> }) => {
      return updateDriver(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      toast.success("Driver updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update driver");
    },
  });
}

export function useDeleteDriver() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return deleteDriver(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      toast.success("Driver deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete driver");
    },
  });
}

// ============================================================================
// LOGISTICS COST HOOKS
// ============================================================================

export function useLogisticsCosts(transportBookingId?: string) {
  const { currentUser } = useAuth();
  const [costs, setCosts] = useState<LogisticsCost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!currentUser?.uid) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = subscribeToLogisticsCosts(
      currentUser.uid,
      transportBookingId,
      (data) => {
        setCosts(data);
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [currentUser?.uid, transportBookingId]);

  return { costs, isLoading, error };
}

export function useAddLogisticsCost() {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cost: Omit<LogisticsCost, "id" | "createdAt" | "userId">) => {
      if (!currentUser?.uid) {
        throw new Error("User not authenticated");
      }
      return addLogisticsCost({
        ...cost,
        userId: currentUser.uid,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["logisticsCosts"] });
      toast.success("Cost recorded successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to record cost");
    },
  });
}

