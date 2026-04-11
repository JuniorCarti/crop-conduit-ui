import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscribeCompanyShipments,
  subscribeRequesterShipments,
  createTransportShipment,
  updateTransportShipment,
  subscribeCompanyVehicles,
  saveTransportVehicle,
  deleteTransportVehicle,
  subscribeCompanyBids,
  subscribeRequesterBids,
  createTransportBid,
  updateTransportBid,
} from "@/services/transportService";
import type {
  TransportShipment,
  TransportVehicle,
  TransportBid,
} from "@/types/transport";
import { toast } from "sonner";

// ── Transport Bookings (Shipments) ──────────────────────────────────────────

export function useTransportBookings() {
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState<TransportShipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.uid) { setIsLoading(false); return; }
    setIsLoading(true);
    const unsub = subscribeRequesterShipments(currentUser.uid, (data) => {
      setBookings(data);
      setIsLoading(false);
    }, () => setIsLoading(false));
    return () => unsub();
  }, [currentUser?.uid]);

  return { bookings, isLoading };
}

export function useCreateTransportBooking() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const mutate = async (booking: Omit<TransportShipment, "id" | "createdAt" | "updatedAt">) => {
    if (!currentUser?.uid) throw new Error("Not authenticated");
    setLoading(true);
    try {
      const id = await createTransportShipment({ ...booking, requesterUid: currentUser.uid });
      toast.success("Booking created");
      return id;
    } catch (e: any) {
      toast.error(e.message || "Failed to create booking");
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading };
}

export function useUpdateTransportBooking() {
  const [loading, setLoading] = useState(false);

  const mutate = async (id: string, updates: Partial<TransportShipment>) => {
    setLoading(true);
    try {
      await updateTransportShipment(id, updates);
      toast.success("Booking updated");
    } catch (e: any) {
      toast.error(e.message || "Failed to update booking");
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading };
}

export function useDeleteTransportBooking() {
  const [loading, setLoading] = useState(false);

  const mutate = async (_id: string) => {
    setLoading(true);
    try {
      await updateTransportShipment(_id, { status: "cancelled" });
      toast.success("Booking cancelled");
    } catch (e: any) {
      toast.error(e.message || "Failed to cancel booking");
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading };
}

// ── Vehicles ────────────────────────────────────────────────────────────────

export function useVehicles() {
  const { currentUser } = useAuth();
  const [vehicles, setVehicles] = useState<TransportVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.uid) { setIsLoading(false); return; }
    setIsLoading(true);
    const unsub = subscribeCompanyVehicles(currentUser.uid, (data) => {
      setVehicles(data);
      setIsLoading(false);
    }, () => setIsLoading(false));
    return () => unsub();
  }, [currentUser?.uid]);

  return { vehicles, isLoading };
}

export function useCreateVehicle() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const mutate = async (vehicle: Partial<TransportVehicle>) => {
    if (!currentUser?.uid) throw new Error("Not authenticated");
    setLoading(true);
    try {
      const id = await saveTransportVehicle(currentUser.uid, vehicle);
      toast.success("Vehicle added");
      return id;
    } catch (e: any) {
      toast.error(e.message || "Failed to add vehicle");
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading };
}

export function useUpdateVehicle() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const mutate = async (vehicleId: string, updates: Partial<TransportVehicle>) => {
    if (!currentUser?.uid) throw new Error("Not authenticated");
    setLoading(true);
    try {
      await saveTransportVehicle(currentUser.uid, updates, vehicleId);
      toast.success("Vehicle updated");
    } catch (e: any) {
      toast.error(e.message || "Failed to update vehicle");
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading };
}

export function useDeleteVehicle() {
  const [loading, setLoading] = useState(false);

  const mutate = async (vehicleId: string) => {
    setLoading(true);
    try {
      await deleteTransportVehicle(vehicleId);
      toast.success("Vehicle removed");
    } catch (e: any) {
      toast.error(e.message || "Failed to remove vehicle");
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading };
}

// ── Drivers (mapped from vehicle driver fields — no separate collection) ────

export function useDrivers() {
  const { vehicles, isLoading } = useVehicles();
  const drivers = vehicles
    .filter((v) => v.driverName)
    .map((v) => ({
      id: v.id,
      name: v.driverName!,
      phone: v.driverPhone ?? "",
      vehicleId: v.id,
      vehiclePlate: v.plateNumber,
      experienceYears: v.driverExperienceYears ?? null,
    }));
  return { drivers, isLoading };
}

export function useCreateDriver() {
  return { mutate: async () => {}, loading: false };
}
export function useUpdateDriver() {
  return { mutate: async () => {}, loading: false };
}
export function useDeleteDriver() {
  return { mutate: async () => {}, loading: false };
}

// ── Bids ────────────────────────────────────────────────────────────────────

export function useCompanyBids() {
  const { currentUser } = useAuth();
  const [bids, setBids] = useState<TransportBid[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.uid) { setIsLoading(false); return; }
    setIsLoading(true);
    const unsub = subscribeCompanyBids(currentUser.uid, (data) => {
      setBids(data);
      setIsLoading(false);
    }, () => setIsLoading(false));
    return () => unsub();
  }, [currentUser?.uid]);

  return { bids, isLoading };
}

export function useRequesterBids() {
  const { currentUser } = useAuth();
  const [bids, setBids] = useState<TransportBid[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.uid) { setIsLoading(false); return; }
    setIsLoading(true);
    const unsub = subscribeRequesterBids(currentUser.uid, (data) => {
      setBids(data);
      setIsLoading(false);
    }, () => setIsLoading(false));
    return () => unsub();
  }, [currentUser?.uid]);

  return { bids, isLoading };
}

export function useRespondToBid() {
  const [loading, setLoading] = useState(false);

  const counter = async (bidId: string, counterPrice: number, message?: string) => {
    setLoading(true);
    try {
      await updateTransportBid(bidId, { status: "countered", offeredPrice: counterPrice, message: message ?? null });
      toast.success("Counter-offer sent");
    } catch (e: any) {
      toast.error(e.message || "Failed to send counter-offer");
    } finally {
      setLoading(false);
    }
  };

  const accept = async (bidId: string) => {
    setLoading(true);
    try {
      await updateTransportBid(bidId, { status: "accepted" });
      toast.success("Bid accepted");
    } catch (e: any) {
      toast.error(e.message || "Failed to accept bid");
    } finally {
      setLoading(false);
    }
  };

  const reject = async (bidId: string) => {
    setLoading(true);
    try {
      await updateTransportBid(bidId, { status: "rejected" });
      toast.success("Bid rejected");
    } catch (e: any) {
      toast.error(e.message || "Failed to reject bid");
    } finally {
      setLoading(false);
    }
  };

  return { counter, accept, reject, loading };
}

// ── Logistics Costs (stub — costs tracked via shipment priceAgreed) ─────────

export function useLogisticsCosts() {
  return { costs: [], isLoading: false };
}

export function useAddLogisticsCost() {
  return { mutate: async () => {}, loading: false };
}
