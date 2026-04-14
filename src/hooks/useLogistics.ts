/**
 * Logistics hooks — unified over transportService (Firestore)
 * Replaces the old firestore-logistics.ts duplicate model.
 */

export {
  useTransportBookings,
  useCreateTransportBooking,
  useUpdateTransportBooking,
  useDeleteTransportBooking,
  useVehicles,
  useCreateVehicle,
  useUpdateVehicle,
  useDeleteVehicle,
  useDrivers,
  useCreateDriver,
  useUpdateDriver,
  useDeleteDriver,
  useLogisticsCosts,
  useAddLogisticsCost,
} from "./useLogisticsInternal";
