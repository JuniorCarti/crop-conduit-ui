export type TransportApprovalStatus = "pending" | "approved" | "rejected";
export type TransportFleetMode = "owned" | "subcontracted" | "mixed";
export type TransportVehicleType = "Truck" | "Van" | "Pickup" | "Motorbike";
export type TransportVehicleStatus = "available" | "busy" | "offline";
export type TransportShipmentStatus = "requested" | "quoted" | "accepted" | "in_transit" | "delivered" | "cancelled";
export type TransportBidStatus = "submitted" | "countered" | "accepted" | "rejected";

export interface TransportCompany {
  id?: string;
  ownerUid: string;
  companyName: string;
  contactName?: string | null;
  contactPhone: string;
  contactEmail?: string | null;
  county?: string | null;
  serviceRegions?: string[];
  fleetMode?: TransportFleetMode;
  notes?: string | null;
  approvalStatus?: TransportApprovalStatus;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface TransportVehicle {
  id?: string;
  companyId: string;
  companyName?: string | null;
  vehicleType: TransportVehicleType;
  plateNumber: string;
  makeModel?: string | null;
  year?: string | number | null;
  capacityKg?: number | null;
  capacityUnits?: number | null;
  refrigerated?: boolean;
  temperatureRange?: string | null;
  perishableSupport?: boolean;
  cropsSupported?: string[];
  ownershipType?: "owned" | "subcontracted";
  driverName?: string | null;
  driverPhone?: string | null;
  driverExperienceYears?: number | null;
  routeName?: string | null;
  routeOrigin?: string | null;
  routeDestination?: string | null;
  nextAvailableAt?: Date | null;
  fixedRate?: number | null;
  pricePerKm?: number | null;
  pricePerKg?: number | null;
  negotiable?: boolean;
  status?: TransportVehicleStatus;
  photos?: string[];
  successfulDeliveries?: number | null;
  lastLocationLat?: number | null;
  lastLocationLng?: number | null;
  lastLocationAt?: Date | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface TransportShipment {
  id?: string;
  requesterUid: string;
  requesterRole: "farmer" | "org_admin" | "org_staff";
  companyId: string;
  vehicleId?: string | null;
  cropType?: string | null;
  quantity?: number | null;
  unit?: string | null;
  isPerishable?: boolean;
  requiresRefrigeration?: boolean;
  pickupLocation?: string | null;
  deliveryLocation?: string | null;
  pickupTime?: string | null;
  deliveryTime?: string | null;
  priceAgreed?: number | null;
  paymentStatus?: "pending" | "paid" | "on_delivery";
  status?: TransportShipmentStatus;
  notes?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface TransportBid {
  id?: string;
  shipmentId: string;
  requesterUid: string;
  companyId: string;
  offeredPrice: number;
  status?: TransportBidStatus;
  message?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface TransportTracking {
  id?: string;
  shipmentId: string;
  companyId: string;
  vehicleId?: string | null;
  requesterUid?: string | null;
  lat: number;
  lng: number;
  status?: TransportShipmentStatus;
  updatedAt?: Date | null;
}
