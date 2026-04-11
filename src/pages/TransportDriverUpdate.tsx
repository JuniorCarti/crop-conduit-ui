import { useEffect, useMemo, useState } from "react";
import { MapPin, Play, StopCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeCompanyShipments, upsertTracking } from "@/services/transportService";
import type { TransportShipment } from "@/types/transport";

const UPDATE_INTERVAL_MS = 5 * 60 * 1000;

export default function TransportDriverUpdate() {
  const { currentUser } = useAuth();
  const [shipments, setShipments] = useState<TransportShipment[]>([]);
  const [selectedShipmentId, setSelectedShipmentId] = useState<string>("");
  const [status, setStatus] = useState<TransportShipment["status"]>("in_transit");
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [autoTracking, setAutoTracking] = useState(false);

  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsubscribe = subscribeCompanyShipments(currentUser.uid, setShipments);
    return () => unsubscribe();
  }, [currentUser?.uid]);

  useEffect(() => {
    if (!autoTracking) return;
    const interval = setInterval(() => {
      void sendUpdate();
    }, UPDATE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [autoTracking, selectedShipmentId, status, manualLat, manualLng]);

  const selectedShipment = useMemo(
    () => shipments.find((shipment) => shipment.id === selectedShipmentId) || null,
    [shipments, selectedShipmentId]
  );

  const resolveLocation = (): Promise<{ lat: number; lng: number } | null> =>
    new Promise((resolve) => {
      if (!navigator.geolocation) {
        const lat = Number(manualLat);
        const lng = Number(manualLng);
        return resolve(Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null);
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {
          const lat = Number(manualLat);
          const lng = Number(manualLng);
          resolve(Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null);
        }
      );
    });

  const sendUpdate = async () => {
    if (!currentUser?.uid || !selectedShipmentId) return;
    const location = await resolveLocation();
    if (!location) return;

    await upsertTracking(selectedShipmentId, {
      shipmentId: selectedShipmentId,
      companyId: currentUser.uid,
      vehicleId: selectedShipment?.vehicleId ?? null,
      requesterUid: selectedShipment?.requesterUid ?? null,
      lat: location.lat,
      lng: location.lng,
      status,
    });

    setLastUpdate(new Date().toLocaleString());
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Driver Tracking" subtitle="Share live location updates" icon={MapPin} />
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        <Card className="border border-border/60">
          <CardHeader>
            <CardTitle>Shipment updates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Select shipment</Label>
              <Select value={selectedShipmentId} onValueChange={setSelectedShipmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select shipment" />
                </SelectTrigger>
                <SelectContent>
                  {shipments.map((shipment) => (
                    <SelectItem key={shipment.id} value={shipment.id || ""}>
                      {shipment.cropType || "Shipment"} - {shipment.pickupLocation || "--"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={status || "in_transit"} onValueChange={(value) => setStatus(value as TransportShipment["status"])}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="in_transit">In transit</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Manual latitude (fallback)</Label>
                <Input value={manualLat} onChange={(event) => setManualLat(event.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Manual longitude (fallback)</Label>
                <Input value={manualLng} onChange={(event) => setManualLng(event.target.value)} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={sendUpdate} disabled={!selectedShipmentId}>Send update</Button>
              <Button
                variant={autoTracking ? "destructive" : "outline"}
                onClick={() => setAutoTracking((prev) => !prev)}
                className="gap-2"
                disabled={!selectedShipmentId}
              >
                {autoTracking ? <StopCircle className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {autoTracking ? "Stop auto updates" : "Start auto updates"}
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              Auto updates send every 5 minutes. Last update: {lastUpdate || "--"}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
