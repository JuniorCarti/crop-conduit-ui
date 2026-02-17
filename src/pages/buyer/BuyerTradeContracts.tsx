import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { BUYER_TRADE_ENABLED, listBuyerContracts, setBuyerContractDeliveryStatus, type ContractDoc } from "@/services/buyerTradeService";

const parseDate = (value: any) => {
  const date = value?.toDate?.() ?? (value ? new Date(value) : null);
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleString() : "--";
};

const statusVariant = (value: ContractDoc["deliveryStatus"]) => {
  if (value === "confirmed") return "default";
  if (value === "scheduled" || value === "in_transit") return "secondary";
  return "outline";
};

export default function BuyerTradeContracts() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ContractDoc[]>([]);
  const [selected, setSelected] = useState<ContractDoc | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = async () => {
    if (!currentUser?.uid) return;
    setLoading(true);
    try {
      const contracts = await listBuyerContracts(currentUser.uid);
      setRows(contracts);
    } catch (error: any) {
      toast.error(error?.message || "Failed to load contracts.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => undefined);
  }, [currentUser?.uid]);

  const summary = useMemo(() => ({
    total: rows.length,
    scheduled: rows.filter((x) => x.deliveryStatus === "scheduled").length,
    inTransit: rows.filter((x) => x.deliveryStatus === "in_transit").length,
    delivered: rows.filter((x) => x.deliveryStatus === "delivered" || x.deliveryStatus === "confirmed").length,
  }), [rows]);

  const updateDeliveryStatus = async (contractId: string, status: ContractDoc["deliveryStatus"]) => {
    if (!currentUser?.uid) return;
    setUpdatingId(contractId);
    try {
      await setBuyerContractDeliveryStatus(contractId, currentUser.uid, status);
      await load();
      toast.success("Contract updated.");
    } catch (error: any) {
      toast.error(error?.message || "Failed to update contract.");
    } finally {
      setUpdatingId(null);
    }
  };

  if (!BUYER_TRADE_ENABLED) {
    return (
      <Card className="border-border/60">
        <CardHeader><CardTitle>Contracts & Deliveries</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">Buyer trade module is disabled.</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Contracts & Deliveries</h2>
        <p className="text-sm text-muted-foreground">Track accepted bids through delivery and confirmation.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/60"><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Contracts</p><p className="text-2xl font-semibold">{summary.total}</p></CardContent></Card>
        <Card className="border-border/60"><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Scheduled</p><p className="text-2xl font-semibold">{summary.scheduled}</p></CardContent></Card>
        <Card className="border-border/60"><CardContent className="pt-6"><p className="text-xs text-muted-foreground">In Transit</p><p className="text-2xl font-semibold">{summary.inTransit}</p></CardContent></Card>
        <Card className="border-border/60"><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Delivered</p><p className="text-2xl font-semibold">{summary.delivered}</p></CardContent></Card>
      </div>

      <Card className="border-border/60">
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contract</TableHead>
                <TableHead>Commodity</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Deposit Paid</TableHead>
                <TableHead>Balance Due</TableHead>
                <TableHead>Delivery</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8}>Loading contracts...</TableCell></TableRow>
              ) : rows.length === 0 ? (
                <TableRow><TableCell colSpan={8}>No contracts yet.</TableCell></TableRow>
              ) : rows.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell><code className="text-xs">{contract.id.slice(0, 10)}</code></TableCell>
                  <TableCell>{contract.commodity || "--"}</TableCell>
                  <TableCell>KES {Number(contract.totalValue || 0).toLocaleString()}</TableCell>
                  <TableCell>KES {Number(contract.depositPaid || 0).toLocaleString()}</TableCell>
                  <TableCell>KES {Number(contract.balanceDue || 0).toLocaleString()}</TableCell>
                  <TableCell><Badge variant={statusVariant(contract.deliveryStatus)}>{contract.deliveryStatus}</Badge></TableCell>
                  <TableCell>{parseDate(contract.updatedAt || contract.createdAt)}</TableCell>
                  <TableCell className="text-right"><Button size="sm" variant="outline" onClick={() => setSelected(contract)}>View</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle>Contract Details</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <p><span className="text-muted-foreground">Contract ID:</span> {selected.id}</p>
              <p><span className="text-muted-foreground">Bid ID:</span> {selected.bidId}</p>
              <p><span className="text-muted-foreground">Delivery status:</span> {selected.deliveryStatus}</p>
              <p><span className="text-muted-foreground">Total value:</span> KES {Number(selected.totalValue || 0).toLocaleString()}</p>
              <p><span className="text-muted-foreground">Balance due:</span> KES {Number(selected.balanceDue || 0).toLocaleString()}</p>
              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="outline" onClick={() => toast.message("Balance payment integration coming soon.")}>Pay Balance</Button>
                {selected.deliveryStatus === "delivered" && (
                  <Button onClick={() => updateDeliveryStatus(selected.id, "confirmed")} disabled={updatingId === selected.id}>
                    Confirm Delivery
                  </Button>
                )}
                <Button variant="outline" onClick={() => toast.message("Dispute workflow will be available soon.")}>Raise Dispute</Button>
                <Button variant="outline" onClick={() => toast.message("Invoice viewer coming soon.")}>View Invoice</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
