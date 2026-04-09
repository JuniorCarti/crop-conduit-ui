import { useEffect, useMemo, useState } from "react";
import { MapPin, Truck } from "lucide-react";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { formatKsh } from "@/lib/currency";
import {
  createTransportBid,
  createTransportShipment,
  subscribeAvailableVehicles,
  subscribeRequesterShipments,
  subscribeTracking,
} from "@/services/transportService";
import type { TransportBid, TransportShipment, TransportTracking, TransportVehicle } from "@/types/transport";

const DEFAULT_CENTER: [number, number] = [-1.286389, 36.817223];
const REFRIGERATION_REQUIRED_CROPS = new Set([
  "tomato",
  "tomatoes",
  "strawberry",
  "strawberries",
  "berries",
  "leafy greens",
  "spinach",
  "lettuce",
  "flowers",
]);

const ensureLeafletIcons = () => {
  const DefaultIcon = L.icon({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });
  L.Marker.prototype.options.icon = DefaultIcon;
};

const normalizeText = (value: string) => value.trim().toLowerCase();

export default function TransportMarketplace() {
  const { currentUser, loading: authLoading } = useAuth();
  const { role } = useUserRole();
  const [vehicles, setVehicles] = useState<TransportVehicle[] | null>(null);
  const [vehicleError, setVehicleError] = useState<string | null>(null);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [shipments, setShipments] = useState<TransportShipment[]>([]);
  const [tracking, setTracking] = useState<TransportTracking | null>(null);
  const [selectedShipment, setSelectedShipment] = useState<TransportShipment | null>(null);
  const [bookingVehicle, setBookingVehicle] = useState<TransportVehicle | null>(null);
  const [bookingForm, setBookingForm] = useState({
    cropType: "",
    quantity: "",
    unit: "kg",
    isPerishable: false,
    pickupLocation: "",
    deliveryLocation: "",
    pickupTime: "",
    notes: "",
    negotiation: false,
    offerPrice: "",
  });

  useEffect(() => {
    ensureLeafletIcons();
    if (authLoading) return;

    setLoadingVehicles(true);
    setVehicleError(null);

    const unsubVehicles = subscribeAvailableVehicles(
      (items) => {
        setVehicles(items);
        setLoadingVehicles(false);
      },
      (error) => {
        console.error("Transport marketplace vehicle subscription failed:", error);
        setVehicleError(error.message || "Unable to load transport listings.");
        setLoadingVehicles(false);
      }
    );

    let unsubShipments: (() => void) | undefined;
    if (currentUser?.uid) {
      unsubShipments = subscribeRequesterShipments(currentUser.uid, setShipments, (error) => {
        console.error("Transport requester shipments subscription failed:", error);
      });
    }

    return () => {
      unsubVehicles();
      unsubShipments?.();
    };
  }, [authLoading, currentUser?.uid]);

  useEffect(() => {
    if (!selectedShipment?.id) return;
    const unsub = subscribeTracking(selectedShipment.id, setTracking);
    return () => unsub();
  }, [selectedShipment?.id]);

  const filteredVehicles = useMemo(
    () => (vehicles ?? []).filter((vehicle) => vehicle.status !== "offline"),
    [vehicles]
  );

  const openBooking = (vehicle: TransportVehicle, negotiation: boolean) => {
    setBookingVehicle(vehicle);
    setBookingForm((prev) => ({
      ...prev,
      negotiation,
      offerPrice: negotiation ? prev.offerPrice : "",
    }));
  };

  const cropRequiresRefrigeration = (crop: string, isPerishable: boolean) => {
    if (isPerishable) return true;
    return REFRIGERATION_REQUIRED_CROPS.has(normalizeText(crop));
  };

  const canBook = () => {
    if (!bookingVehicle) return false;
    if (!bookingForm.cropType || !bookingForm.pickupLocation || !bookingForm.deliveryLocation) return false;
    const needsCold = cropRequiresRefrigeration(bookingForm.cropType, bookingForm.isPerishable);
    if (needsCold && !bookingVehicle.refrigerated) return false;
    return true;
  };

  const handleBookingSubmit = async () => {
    if (!currentUser?.uid || !bookingVehicle) return;
    if (bookingForm.negotiation && !bookingForm.offerPrice) return;

    const needsCold = cropRequiresRefrigeration(bookingForm.cropType, bookingForm.isPerishable);
    const requesterRole = role === "org_admin" || role === "org_staff" ? role : "farmer";

    const shipmentPayload: TransportShipment = {
      requesterUid: currentUser.uid,
      requesterRole,
      companyId: bookingVehicle.companyId,
      vehicleId: bookingVehicle.id ?? null,
      cropType: bookingForm.cropType,
      quantity: bookingForm.quantity ? Number(bookingForm.quantity) : null,
      unit: bookingForm.unit,
      isPerishable: bookingForm.isPerishable,
      requiresRefrigeration: needsCold,
      pickupLocation: bookingForm.pickupLocation,
      deliveryLocation: bookingForm.deliveryLocation,
      pickupTime: bookingForm.pickupTime || null,
      priceAgreed: bookingForm.negotiation ? null : bookingVehicle.fixedRate || null,
      status: bookingForm.negotiation ? "quoted" : "requested",
      notes: bookingForm.notes || null,
    };

    const shipmentId = await createTransportShipment(shipmentPayload);

    if (bookingForm.negotiation && bookingForm.offerPrice) {
      const bidPayload: TransportBid = {
        shipmentId,
        requesterUid: currentUser.uid,
        companyId: bookingVehicle.companyId,
        offeredPrice: Number(bookingForm.offerPrice),
        status: "submitted",
        message: bookingForm.notes || null,
      };
      await createTransportBid(bidPayload);
    }

    setBookingVehicle(null);
    setBookingForm({
      cropType: "",
      quantity: "",
      unit: "kg",
      isPerishable: false,
      pickupLocation: "",
      deliveryLocation: "",
      pickupTime: "",
      notes: "",
      negotiation: false,
      offerPrice: "",
    });
  };

  const trackingPosition: [number, number] | null = tracking?.lat && tracking?.lng ? [tracking.lat, tracking.lng] : null;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Transport Marketplace" subtitle="Book logistics and track shipments" icon={Truck} />
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        <section className="space-y-3">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Available vehicles</h3>
            <p className="text-sm text-muted-foreground">Browse trucks, vans, pickups, and motorbikes on active routes.</p>
          </div>
          {vehicleError ? (
            <Card className="border border-border/60">
              <CardContent className="py-6 text-sm text-destructive">{vehicleError}</CardContent>
            </Card>
          ) : loadingVehicles ? (
            <Card className="border border-border/60">
              <CardContent className="py-6 text-sm text-muted-foreground">Loading transport listings...</CardContent>
            </Card>
          ) : filteredVehicles.length === 0 ? (
            <Card className="border border-border/60">
              <CardContent className="py-6 text-sm text-muted-foreground">No transport listings yet.</CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {filteredVehicles.map((vehicle) => (
                <Card key={vehicle.id} className="border border-border/60">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{vehicle.vehicleType} - {vehicle.plateNumber}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {vehicle.routeOrigin || "--"} {"->"} {vehicle.routeDestination || "--"}
                      </p>
                    </div>
                    <Badge variant="outline" className="capitalize">{vehicle.status || "available"}</Badge>
                  </CardHeader>
                  {vehicle.photos && vehicle.photos.length > 0 && (
                    <div className="px-6">
                      <img
                        src={vehicle.photos[0]}
                        alt={`${vehicle.vehicleType} ${vehicle.plateNumber}`}
                        className="h-40 w-full rounded-lg object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <CardContent className="space-y-3 text-sm">
                    {vehicle.status && vehicle.status !== "available" && (
                      <div className="rounded-lg border border-border/60 bg-muted/30 p-2 text-xs text-muted-foreground">
                        This vehicle is currently {vehicle.status}. You can still view details, but booking is disabled until it is available.
                      </div>
                    )}
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Company</p>
                        <p className="font-semibold text-foreground">{vehicle.companyName || "--"}</p>
                        <p className="text-xs text-muted-foreground">Driver: {vehicle.driverName || "--"}</p>
                        <p className="text-xs text-muted-foreground">
                          Experience: {vehicle.driverExperienceYears ? `${vehicle.driverExperienceYears} years` : "--"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Ownership: {vehicle.ownershipType === "subcontracted" ? "Subcontracted" : "Owned"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Capacity</p>
                        <p className="font-semibold text-foreground">
                          {vehicle.capacityKg ? `${vehicle.capacityKg} kg` : "--"}
                          {vehicle.capacityUnits ? ` - ${vehicle.capacityUnits} units` : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">Refrigerated: {vehicle.refrigerated ? "Yes" : "No"}</p>
                        <p className="text-xs text-muted-foreground">Perishable ready: {vehicle.perishableSupport ? "Yes" : "No"}</p>
                      </div>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Next available</p>
                        <p className="font-semibold text-foreground">{vehicle.nextAvailableAt ? vehicle.nextAvailableAt.toLocaleString() : "--"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Fixed rate</p>
                        <p className="font-semibold text-foreground">{vehicle.fixedRate ? formatKsh(vehicle.fixedRate) : "--"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Successful deliveries</p>
                        <p className="font-semibold text-foreground">{vehicle.successfulDeliveries ?? "--"}</p>
                      </div>
                    </div>
                    {vehicle.cropsSupported && (
                      <div className="rounded-lg border border-border/60 bg-muted/30 p-2 text-xs text-muted-foreground">
                        Crops supported: {Array.isArray(vehicle.cropsSupported) ? vehicle.cropsSupported.join(", ") : String(vehicle.cropsSupported)}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => openBooking(vehicle, false)} disabled={vehicle.status === "busy" || vehicle.status === "offline"}>
                        Book at fixed rate
                      </Button>
                      {vehicle.negotiable && (
                        <Button size="sm" variant="outline" onClick={() => openBooking(vehicle, true)} disabled={vehicle.status === "busy" || vehicle.status === "offline"}>
                          Request quote
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <div>
            <h3 className="text-lg font-semibold text-foreground">My shipments</h3>
            <p className="text-sm text-muted-foreground">Track your current transport bookings.</p>
          </div>
          {shipments.length === 0 ? (
            <Card className="border border-border/60">
              <CardContent className="py-6 text-sm text-muted-foreground">No shipments yet.</CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
              <div className="space-y-3">
                {shipments.map((shipment) => (
                  <Card key={shipment.id} className="border border-border/60">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-base">{shipment.cropType || "Shipment"}</CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {shipment.pickupLocation || "--"} {"->"} {shipment.deliveryLocation || "--"}
                        </p>
                      </div>
                      <Badge variant="outline" className="capitalize">{shipment.status || "requested"}</Badge>
                    </CardHeader>
                    <CardContent className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Quantity</p>
                        <p className="font-semibold text-foreground">{shipment.quantity ? `${shipment.quantity} ${shipment.unit || ""}` : "--"}</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => setSelectedShipment(shipment)}>
                        Track
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Card className="border border-border/60">
                <CardHeader>
                  <CardTitle className="text-base">Live tracking</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedShipment ? (
                    <>
                      <div className="text-sm text-muted-foreground">
                        Tracking: {selectedShipment.cropType || "Shipment"}
                      </div>
                      <div className="h-64 overflow-hidden rounded-lg border border-border/60">
                        <MapContainer center={trackingPosition || DEFAULT_CENTER} zoom={trackingPosition ? 11 : 6} className="h-full w-full">
                          <TileLayer
                            attribution="Leaflet | © OpenStreetMap contributors"
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          />
                          {trackingPosition && (
                            <Marker position={trackingPosition} />
                          )}
                        </MapContainer>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {tracking?.updatedAt
                          ? `Last update: ${tracking.updatedAt.toLocaleString()}`
                          : trackingPosition
                            ? "Last update received"
                            : "No live update yet"}
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">Select a shipment to view tracking.</div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </section>
      </div>

      <Dialog open={Boolean(bookingVehicle)} onOpenChange={(open) => !open && setBookingVehicle(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Book transport</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Crop type</Label>
                <Input value={bookingForm.cropType} onChange={(event) => setBookingForm((prev) => ({ ...prev, cropType: event.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Quantity</Label>
                <Input value={bookingForm.quantity} onChange={(event) => setBookingForm((prev) => ({ ...prev, quantity: event.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Unit</Label>
                <Select value={bookingForm.unit} onValueChange={(value) => setBookingForm((prev) => ({ ...prev, unit: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="bags">bags</SelectItem>
                    <SelectItem value="crates">crates</SelectItem>
                    <SelectItem value="units">units</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Pickup time</Label>
                <Input type="datetime-local" value={bookingForm.pickupTime} onChange={(event) => setBookingForm((prev) => ({ ...prev, pickupTime: event.target.value }))} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Pickup location</Label>
                <Input value={bookingForm.pickupLocation} onChange={(event) => setBookingForm((prev) => ({ ...prev, pickupLocation: event.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Delivery location</Label>
                <Input value={bookingForm.deliveryLocation} onChange={(event) => setBookingForm((prev) => ({ ...prev, deliveryLocation: event.target.value }))} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={bookingForm.isPerishable}
                onCheckedChange={(checked) => setBookingForm((prev) => ({ ...prev, isPerishable: Boolean(checked) }))}
              />
              <Label>Highly perishable crop</Label>
            </div>
            {bookingForm.negotiation && (
              <div className="space-y-1">
                <Label>Offer price (KES)</Label>
                <Input value={bookingForm.offerPrice} onChange={(event) => setBookingForm((prev) => ({ ...prev, offerPrice: event.target.value }))} />
              </div>
            )}
            <div className="space-y-1">
              <Label>Notes</Label>
              <Textarea value={bookingForm.notes} onChange={(event) => setBookingForm((prev) => ({ ...prev, notes: event.target.value }))} />
            </div>
            {!canBook() && bookingVehicle && (
              <p className="text-xs text-destructive">
                This shipment requires refrigeration. Select a refrigerated vehicle or remove the perishable flag.
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setBookingVehicle(null)}>Cancel</Button>
              <Button onClick={handleBookingSubmit} disabled={!canBook()}>Submit booking</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
