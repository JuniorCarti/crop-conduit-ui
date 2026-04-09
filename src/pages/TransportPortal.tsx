import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Plus, Truck } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { formatKsh } from "@/lib/currency";
import { uploadToR2 } from "@/services/marketplaceService";
import {
  subscribeCompanyShipments,
  subscribeCompanyVehicles,
  subscribeTransportCompany,
  saveTransportVehicle,
  deleteTransportVehicle,
  upsertTransportCompany,
  updateTransportShipment,
} from "@/services/transportService";
import type { TransportCompany, TransportShipment, TransportVehicle } from "@/types/transport";

const VEHICLE_TYPES: TransportVehicle["vehicleType"][] = ["Truck", "Van", "Pickup", "Motorbike"];
const VEHICLE_STATUSES: NonNullable<TransportVehicle["status"]>[] = ["available", "busy", "offline"];

const toInputDateTime = (value?: Date | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
};

const toDateTimeValue = (value: string) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export default function TransportPortal() {
  const { currentUser } = useAuth();
  const [company, setCompany] = useState<TransportCompany | null>(null);
  const [vehicles, setVehicles] = useState<TransportVehicle[]>([]);
  const [shipments, setShipments] = useState<TransportShipment[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [savingVehicle, setSavingVehicle] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<TransportVehicle | null>(null);
  const [vehiclePhotos, setVehiclePhotos] = useState<File[]>([]);

  const [companyForm, setCompanyForm] = useState({
    companyName: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    county: "",
    serviceRegions: "",
    fleetMode: "owned",
    notes: "",
  });

  const [vehicleForm, setVehicleForm] = useState({
    vehicleType: "Truck" as TransportVehicle["vehicleType"],
    plateNumber: "",
    makeModel: "",
    year: "",
    capacityKg: "",
    capacityUnits: "",
    refrigerated: false,
    temperatureRange: "",
    perishableSupport: false,
    cropsSupported: "",
    ownershipType: "owned" as "owned" | "subcontracted",
    driverName: "",
    driverPhone: "",
    driverExperienceYears: "",
    routeName: "",
    routeOrigin: "",
    routeDestination: "",
    nextAvailableAt: "",
    fixedRate: "",
    pricePerKm: "",
    pricePerKg: "",
    negotiable: true,
    status: "available" as NonNullable<TransportVehicle["status"]>,
    successfulDeliveries: "",
    photos: [] as string[],
  });

  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsubscribeCompany = subscribeTransportCompany(currentUser.uid, (data) => {
      setCompany(data);
      if (data) {
        setCompanyForm({
          companyName: data.companyName || "",
          contactName: data.contactName || "",
          contactPhone: data.contactPhone || "",
          contactEmail: data.contactEmail || "",
          county: data.county || "",
          serviceRegions: Array.isArray(data.serviceRegions) ? data.serviceRegions.join(", ") : "",
          fleetMode: data.fleetMode || "owned",
          notes: data.notes || "",
        });
      }
    });
    const unsubscribeVehicles = subscribeCompanyVehicles(
      currentUser.uid,
      (rows) => {
        setVehicles(rows);
        setLoadingVehicles(false);
      },
      () => setLoadingVehicles(false)
    );
    const unsubscribeShipments = subscribeCompanyShipments(currentUser.uid, setShipments);

    return () => {
      unsubscribeCompany();
      unsubscribeVehicles();
      unsubscribeShipments();
    };
  }, [currentUser?.uid]);

  const approvalStatus = company?.approvalStatus || "pending";
  const approvalBadge =
    approvalStatus === "approved"
      ? "bg-success/10 text-success border-success/30"
      : approvalStatus === "rejected"
        ? "bg-destructive/10 text-destructive border-destructive/30"
        : "bg-warning/10 text-warning border-warning/30";

  const openVehicleModal = (vehicle?: TransportVehicle) => {
    if (vehicle) {
      setEditingVehicle(vehicle);
      setVehicleForm({
        vehicleType: vehicle.vehicleType || "Truck",
        plateNumber: vehicle.plateNumber || "",
        makeModel: vehicle.makeModel || "",
        year: vehicle.year ? String(vehicle.year) : "",
        capacityKg: vehicle.capacityKg ? String(vehicle.capacityKg) : "",
        capacityUnits: vehicle.capacityUnits ? String(vehicle.capacityUnits) : "",
        refrigerated: Boolean(vehicle.refrigerated),
        temperatureRange: vehicle.temperatureRange || "",
        perishableSupport: Boolean(vehicle.perishableSupport),
        cropsSupported: vehicle.cropsSupported?.join(", ") || "",
        ownershipType: vehicle.ownershipType || "owned",
        driverName: vehicle.driverName || "",
        driverPhone: vehicle.driverPhone || "",
        driverExperienceYears: vehicle.driverExperienceYears ? String(vehicle.driverExperienceYears) : "",
        routeName: vehicle.routeName || "",
        routeOrigin: vehicle.routeOrigin || "",
        routeDestination: vehicle.routeDestination || "",
        nextAvailableAt: toInputDateTime(vehicle.nextAvailableAt || null),
        fixedRate: vehicle.fixedRate ? String(vehicle.fixedRate) : "",
        pricePerKm: vehicle.pricePerKm ? String(vehicle.pricePerKm) : "",
        pricePerKg: vehicle.pricePerKg ? String(vehicle.pricePerKg) : "",
        negotiable: vehicle.negotiable ?? true,
        status: vehicle.status || "available",
        successfulDeliveries: vehicle.successfulDeliveries ? String(vehicle.successfulDeliveries) : "",
        photos: vehicle.photos || [],
      });
    } else {
      setEditingVehicle(null);
      setVehicleForm({
        vehicleType: "Truck",
        plateNumber: "",
        makeModel: "",
        year: "",
        capacityKg: "",
        capacityUnits: "",
        refrigerated: false,
        temperatureRange: "",
        perishableSupport: false,
        cropsSupported: "",
        ownershipType: "owned",
        driverName: "",
        driverPhone: "",
        driverExperienceYears: "",
        routeName: "",
        routeOrigin: "",
        routeDestination: "",
        nextAvailableAt: "",
        fixedRate: "",
        pricePerKm: "",
        pricePerKg: "",
        negotiable: true,
        status: "available",
        successfulDeliveries: "",
        photos: [],
      });
    }
    setVehiclePhotos([]);
    setShowVehicleModal(true);
  };

  const handleVehicleSave = async () => {
    if (!currentUser?.uid) return;
    if (!vehicleForm.plateNumber.trim()) return;

    setSavingVehicle(true);
    try {
      const uploadedUrls = vehiclePhotos.length ? await uploadToR2(vehiclePhotos) : [];
      const cropsSupported = vehicleForm.cropsSupported
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const payload: Partial<TransportVehicle> = {
        companyId: currentUser.uid,
        companyName: company?.companyName || currentUser.displayName || "",
        vehicleType: vehicleForm.vehicleType,
        plateNumber: vehicleForm.plateNumber.trim(),
        makeModel: vehicleForm.makeModel.trim() || null,
        year: vehicleForm.year ? vehicleForm.year.trim() : null,
        capacityKg: vehicleForm.capacityKg ? Number(vehicleForm.capacityKg) : null,
        capacityUnits: vehicleForm.capacityUnits ? Number(vehicleForm.capacityUnits) : null,
        refrigerated: vehicleForm.refrigerated,
        temperatureRange: vehicleForm.temperatureRange.trim() || null,
        perishableSupport: vehicleForm.perishableSupport,
        cropsSupported,
        ownershipType: vehicleForm.ownershipType,
        driverName: vehicleForm.driverName.trim() || null,
        driverPhone: vehicleForm.driverPhone.trim() || null,
        driverExperienceYears: vehicleForm.driverExperienceYears ? Number(vehicleForm.driverExperienceYears) : null,
        routeName: vehicleForm.routeName.trim() || null,
        routeOrigin: vehicleForm.routeOrigin.trim() || null,
        routeDestination: vehicleForm.routeDestination.trim() || null,
        nextAvailableAt: toDateTimeValue(vehicleForm.nextAvailableAt),
        fixedRate: vehicleForm.fixedRate ? Number(vehicleForm.fixedRate) : null,
        pricePerKm: vehicleForm.pricePerKm ? Number(vehicleForm.pricePerKm) : null,
        pricePerKg: vehicleForm.pricePerKg ? Number(vehicleForm.pricePerKg) : null,
        negotiable: vehicleForm.negotiable,
        status: vehicleForm.status,
        successfulDeliveries: vehicleForm.successfulDeliveries ? Number(vehicleForm.successfulDeliveries) : null,
        photos: [...(vehicleForm.photos || []), ...uploadedUrls],
      };

      await saveTransportVehicle(currentUser.uid, payload, editingVehicle?.id);
      setShowVehicleModal(false);
    } finally {
      setSavingVehicle(false);
    }
  };

  const handleCompanySave = async () => {
    if (!currentUser?.uid) return;
    await upsertTransportCompany(currentUser.uid, {
      companyName: companyForm.companyName.trim(),
      contactName: companyForm.contactName.trim() || null,
      contactPhone: companyForm.contactPhone.trim(),
      contactEmail: companyForm.contactEmail.trim() || null,
      county: companyForm.county.trim() || null,
      serviceRegions: companyForm.serviceRegions
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      fleetMode: companyForm.fleetMode as TransportCompany["fleetMode"],
      notes: companyForm.notes.trim() || null,
    });
    setShowCompanyModal(false);
  };

  const updateShipmentStatus = async (shipmentId: string, status: TransportShipment["status"]) => {
    await updateTransportShipment(shipmentId, { status });
  };

  const vehicleCount = vehicles.length;
  const availableCount = vehicles.filter((vehicle) => vehicle.status === "available").length;

  const sortedShipments = useMemo(
    () => [...shipments].sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)),
    [shipments]
  );

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Transport Portal" subtitle="Logistics Control Center" icon={Truck} />
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        <Card className="border border-border/60">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg">Company status</CardTitle>
              <p className="text-sm text-muted-foreground">Approval status for your transport company.</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={approvalBadge}>{approvalStatus}</Badge>
              <Button size="sm" variant="outline" onClick={() => setShowCompanyModal(true)}>Edit profile</Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border/60 bg-background p-3">
              <p className="text-xs text-muted-foreground">Company</p>
              <p className="font-semibold text-foreground">{company?.companyName || "--"}</p>
            </div>
            <div className="rounded-lg border border-border/60 bg-background p-3">
              <p className="text-xs text-muted-foreground">Fleet</p>
              <p className="font-semibold text-foreground">{vehicleCount} vehicles</p>
            </div>
            <div className="rounded-lg border border-border/60 bg-background p-3">
              <p className="text-xs text-muted-foreground">Available now</p>
              <p className="font-semibold text-foreground">{availableCount} vehicles</p>
            </div>
          </CardContent>
        </Card>

        {approvalStatus !== "approved" && (
          <Card className="border border-border/60">
            <CardContent className="flex items-center gap-3 py-4 text-sm text-muted-foreground">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Your company is pending approval. You can keep adding fleet details while we review.
            </CardContent>
          </Card>
        )}

        <section className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Fleet and Vehicles</h3>
              <p className="text-sm text-muted-foreground">Manage trucks, vans, pickups, and motorbikes.</p>
            </div>
            <Button size="sm" onClick={() => openVehicleModal()} className="gap-2">
              <Plus className="h-4 w-4" />
              Add vehicle
            </Button>
          </div>

          {loadingVehicles ? (
            <Card className="border border-border/60">
              <CardContent className="py-6 text-sm text-muted-foreground">Loading vehicles...</CardContent>
            </Card>
          ) : vehicleCount === 0 ? (
            <Card className="border border-border/60">
              <CardContent className="py-6 text-sm text-muted-foreground">No vehicles yet. Add your first fleet vehicle.</CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {vehicles.map((vehicle) => (
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
                  <CardContent className="space-y-3 text-sm">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Driver</p>
                        <p className="font-semibold text-foreground">{vehicle.driverName || "--"}</p>
                        <p className="text-xs text-muted-foreground">{vehicle.driverExperienceYears ? `${vehicle.driverExperienceYears} yrs exp` : "Experience N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Capacity</p>
                        <p className="font-semibold text-foreground">
                          {vehicle.capacityKg ? `${vehicle.capacityKg} kg` : "--"}
                          {vehicle.capacityUnits ? ` - ${vehicle.capacityUnits} units` : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">Refrigerated: {vehicle.refrigerated ? "Yes" : "No"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Available at</p>
                        <p className="font-semibold text-foreground">{vehicle.nextAvailableAt ? vehicle.nextAvailableAt.toLocaleString() : "--"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Pricing</p>
                        <p className="font-semibold text-foreground">
                          {vehicle.fixedRate ? formatKsh(vehicle.fixedRate) : "--"}
                        </p>
                        <p className="text-xs text-muted-foreground">Negotiable: {vehicle.negotiable ? "Yes" : "No"}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => openVehicleModal(vehicle)}>Edit</Button>
                      <Button size="sm" variant="ghost" onClick={() => vehicle.id && deleteTransportVehicle(vehicle.id)}>Remove</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Active shipments</h3>
            <p className="text-sm text-muted-foreground">Track farmer and cooperative bookings.</p>
          </div>
          {sortedShipments.length === 0 ? (
            <Card className="border border-border/60">
              <CardContent className="py-6 text-sm text-muted-foreground">No shipments yet.</CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {sortedShipments.map((shipment) => (
                <Card key={shipment.id} className="border border-border/60">
                  <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="text-base">{shipment.cropType || "Shipment"}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {shipment.pickupLocation || "--"} {"->"} {shipment.deliveryLocation || "--"}
                      </p>
                    </div>
                    <Badge variant="outline" className="capitalize">{shipment.status || "requested"}</Badge>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="grid gap-2 sm:grid-cols-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Quantity</p>
                        <p className="font-semibold text-foreground">{shipment.quantity ? `${shipment.quantity} ${shipment.unit || ""}` : "--"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Price</p>
                        <p className="font-semibold text-foreground">{shipment.priceAgreed ? formatKsh(shipment.priceAgreed) : "--"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Perishable</p>
                        <p className="font-semibold text-foreground">{shipment.isPerishable ? "Yes" : "No"}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => shipment.id && updateShipmentStatus(shipment.id, "accepted")}>Accept</Button>
                      <Button size="sm" variant="outline" onClick={() => shipment.id && updateShipmentStatus(shipment.id, "in_transit")}>In transit</Button>
                      <Button size="sm" onClick={() => shipment.id && updateShipmentStatus(shipment.id, "delivered")}>Delivered</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>

      <Dialog open={showCompanyModal} onOpenChange={(open) => !open && setShowCompanyModal(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit company profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Company name</Label>
              <Input value={companyForm.companyName} onChange={(event) => setCompanyForm((prev) => ({ ...prev, companyName: event.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Contact name</Label>
              <Input value={companyForm.contactName} onChange={(event) => setCompanyForm((prev) => ({ ...prev, contactName: event.target.value }))} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Contact phone</Label>
                <Input value={companyForm.contactPhone} onChange={(event) => setCompanyForm((prev) => ({ ...prev, contactPhone: event.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Contact email</Label>
                <Input value={companyForm.contactEmail} onChange={(event) => setCompanyForm((prev) => ({ ...prev, contactEmail: event.target.value }))} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>County / HQ</Label>
                <Input value={companyForm.county} onChange={(event) => setCompanyForm((prev) => ({ ...prev, county: event.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Service regions</Label>
                <Input value={companyForm.serviceRegions} onChange={(event) => setCompanyForm((prev) => ({ ...prev, serviceRegions: event.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Fleet mode</Label>
              <Select value={companyForm.fleetMode} onValueChange={(value) => setCompanyForm((prev) => ({ ...prev, fleetMode: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select fleet mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owned">Owned fleet</SelectItem>
                  <SelectItem value="subcontracted">Subcontracted fleet</SelectItem>
                  <SelectItem value="mixed">Mixed fleet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Textarea value={companyForm.notes} onChange={(event) => setCompanyForm((prev) => ({ ...prev, notes: event.target.value }))} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCompanyModal(false)}>Cancel</Button>
              <Button onClick={handleCompanySave}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showVehicleModal} onOpenChange={(open) => !open && setShowVehicleModal(false)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingVehicle ? "Edit vehicle" : "Add vehicle"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-3">Vehicle Details</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Vehicle type</Label>
                  <Select value={vehicleForm.vehicleType} onValueChange={(value) => setVehicleForm((prev) => ({ ...prev, vehicleType: value as TransportVehicle["vehicleType"] }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {VEHICLE_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Plate number</Label>
                  <Input value={vehicleForm.plateNumber} onChange={(event) => setVehicleForm((prev) => ({ ...prev, plateNumber: event.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Make / model</Label>
                  <Input value={vehicleForm.makeModel} onChange={(event) => setVehicleForm((prev) => ({ ...prev, makeModel: event.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Year</Label>
                  <Input value={vehicleForm.year} onChange={(event) => setVehicleForm((prev) => ({ ...prev, year: event.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Capacity (kg)</Label>
                  <Input value={vehicleForm.capacityKg} onChange={(event) => setVehicleForm((prev) => ({ ...prev, capacityKg: event.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Capacity (units)</Label>
                  <Input value={vehicleForm.capacityUnits} onChange={(event) => setVehicleForm((prev) => ({ ...prev, capacityUnits: event.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Ownership type</Label>
                  <Select value={vehicleForm.ownershipType} onValueChange={(value) => setVehicleForm((prev) => ({ ...prev, ownershipType: value as "owned" | "subcontracted" }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select ownership" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owned">Owned fleet</SelectItem>
                      <SelectItem value="subcontracted">Subcontracted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Status</Label>
                  <Select value={vehicleForm.status} onValueChange={(value) => setVehicleForm((prev) => ({ ...prev, status: value as TransportVehicle["status"] }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {VEHICLE_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3">Driver Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Driver name</Label>
                  <Input value={vehicleForm.driverName} onChange={(event) => setVehicleForm((prev) => ({ ...prev, driverName: event.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Driver experience (years)</Label>
                  <Input value={vehicleForm.driverExperienceYears} onChange={(event) => setVehicleForm((prev) => ({ ...prev, driverExperienceYears: event.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Driver phone</Label>
                  <Input value={vehicleForm.driverPhone} onChange={(event) => setVehicleForm((prev) => ({ ...prev, driverPhone: event.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Successful deliveries</Label>
                  <Input value={vehicleForm.successfulDeliveries} onChange={(event) => setVehicleForm((prev) => ({ ...prev, successfulDeliveries: event.target.value }))} />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3">Route & Availability</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Route name</Label>
                  <Input value={vehicleForm.routeName} onChange={(event) => setVehicleForm((prev) => ({ ...prev, routeName: event.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Route origin</Label>
                  <Input value={vehicleForm.routeOrigin} onChange={(event) => setVehicleForm((prev) => ({ ...prev, routeOrigin: event.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Route destination</Label>
                  <Input value={vehicleForm.routeDestination} onChange={(event) => setVehicleForm((prev) => ({ ...prev, routeDestination: event.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Next available</Label>
                  <Input
                    type="datetime-local"
                    value={vehicleForm.nextAvailableAt}
                    onChange={(event) => setVehicleForm((prev) => ({ ...prev, nextAvailableAt: event.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3">Pricing</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Fixed rate (KES)</Label>
                  <Input value={vehicleForm.fixedRate} onChange={(event) => setVehicleForm((prev) => ({ ...prev, fixedRate: event.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Price per km (KES)</Label>
                  <Input value={vehicleForm.pricePerKm} onChange={(event) => setVehicleForm((prev) => ({ ...prev, pricePerKm: event.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Price per kg (KES)</Label>
                  <Input value={vehicleForm.pricePerKg} onChange={(event) => setVehicleForm((prev) => ({ ...prev, pricePerKg: event.target.value }))} />
                </div>
                <div className="space-y-1 flex items-center gap-2">
                  <Checkbox
                    checked={vehicleForm.negotiable}
                    onCheckedChange={(checked) => setVehicleForm((prev) => ({ ...prev, negotiable: Boolean(checked) }))}
                  />
                  <Label>Allow price negotiation</Label>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3">Features & Capabilities</h3>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label>Crops supported</Label>
                    <Input value={vehicleForm.cropsSupported} onChange={(event) => setVehicleForm((prev) => ({ ...prev, cropsSupported: event.target.value }))} placeholder="e.g., tomatoes, onions" />
                  </div>
                  <div className="space-y-1">
                    <Label>Vehicle photos</Label>
                    <Input type="file" multiple onChange={(event) => setVehiclePhotos(Array.from(event.target.files || []))} />
                    {vehicleForm.photos.length > 0 && (
                      <p className="text-xs text-muted-foreground">{vehicleForm.photos.length} photo(s) already uploaded.</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={vehicleForm.refrigerated}
                      onCheckedChange={(checked) => setVehicleForm((prev) => ({ ...prev, refrigerated: Boolean(checked) }))}
                    />
                    <Label>Refrigerated</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={vehicleForm.perishableSupport}
                      onCheckedChange={(checked) => setVehicleForm((prev) => ({ ...prev, perishableSupport: Boolean(checked) }))}
                    />
                    <Label>Supports highly perishable goods</Label>
                  </div>
                  {vehicleForm.refrigerated && (
                    <div className="space-y-1">
                      <Label>Temperature range</Label>
                      <Input
                        placeholder="Temperature range"
                        value={vehicleForm.temperatureRange}
                        onChange={(event) => setVehicleForm((prev) => ({ ...prev, temperatureRange: event.target.value }))}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowVehicleModal(false)}>Cancel</Button>
            <Button onClick={handleVehicleSave} disabled={savingVehicle} className="gap-2">
              {savingVehicle ? "Saving..." : "Save vehicle"}
              {!savingVehicle && <CheckCircle2 className="h-4 w-4" />}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
