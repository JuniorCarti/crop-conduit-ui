import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { exportPartnersMock } from "@/data/exportPartners.mock";
import { listPartnerRequests, type PartnerRequestRecord } from "@/services/partnerRequestService";
import { PartnershipRequestModal } from "./PartnershipRequestModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ExportPartnersSection({
  orgId,
  orgName,
  selectedCrop,
}: {
  orgId: string;
  orgName: string;
  selectedCrop: string;
}) {
  const [openModal, setOpenModal] = useState(false);
  const [requests, setRequests] = useState<PartnerRequestRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const loadRequests = async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const { records, fromFallback } = await listPartnerRequests(orgId);
      setRequests(records);
      if (fromFallback && records.length) {
        toast.warning("Showing locally saved requests due to permission limits.");
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to load partnership requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests().catch(() => undefined);
  }, [orgId]);

  const filtered = useMemo(
    () => requests.filter((row) => statusFilter === "all" || row.status === statusFilter),
    [requests, statusFilter]
  );

  return (
    <div className="space-y-4">
      <Card className="border-border/60">
        <CardHeader><CardTitle className="text-base">Partner with Export Companies</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {exportPartnersMock.map((partner) => (
            <div key={partner.id} className="rounded-lg border border-border/60 p-3 text-sm">
              <p className="font-semibold">{partner.companyName}</p>
              <p className="text-xs text-muted-foreground">Crops: {partner.cropsAccepted.join(", ")}</p>
              <p className="text-xs text-muted-foreground">Markets: {partner.targetMarkets.join(", ")}</p>
              <p className="text-xs text-muted-foreground">MOQ: {partner.moqKg.toLocaleString()} kg</p>
              <p className="text-xs text-muted-foreground">Certifications: {partner.certifications.join(", ")}</p>
              <p className="text-xs text-muted-foreground">Lead time: {partner.leadTimeDays} days</p>
              <p className="text-xs text-muted-foreground">{partner.packaging}</p>
              <Button size="sm" variant="outline" className="mt-2" onClick={() => setOpenModal(true)}>{partner.contactLabel}</Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">My Partnership Requests</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" onClick={() => setOpenModal(true)}>Request partnership</Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading requests...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No partnership requests yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead>Crops</TableHead>
                  <TableHead>Volume</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.contactPerson}</TableCell>
                    <TableCell>{row.crops.join(", ")}</TableCell>
                    <TableCell>{row.monthlyVolume.toLocaleString()} kg</TableCell>
                    <TableCell>{row.status}</TableCell>
                    <TableCell>{new Date(row.createdAt?.toDate?.() ?? row.createdAt ?? Date.now()).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <PartnershipRequestModal
        open={openModal}
        onOpenChange={setOpenModal}
        orgId={orgId}
        orgName={orgName}
        initialCrops={selectedCrop ? [selectedCrop] : []}
        onCreated={loadRequests}
      />
    </div>
  );
}
