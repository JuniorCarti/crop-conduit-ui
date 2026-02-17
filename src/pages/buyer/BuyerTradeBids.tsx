import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { BUYER_TRADE_ENABLED, listBuyerBids, setBuyerBidStatus, type BuyerBidDoc, type BuyerBidStatus } from "@/services/buyerTradeService";

const DEV_MARK_PAID = String((import.meta as any).env?.VITE_ENABLE_TEST_DEPOSIT ?? "false").toLowerCase() === "true";

const statusOrder: BuyerBidStatus[] = ["draft", "pending_deposit", "submitted", "accepted", "rejected", "expired", "cancelled"];
const toDateTime = (value: any) => {
  const date = value?.toDate?.() ?? (value ? new Date(value) : null);
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleString() : "--";
};

const statusBadgeVariant = (status: BuyerBidStatus) => {
  if (status === "accepted") return "default";
  if (status === "pending_deposit" || status === "submitted" || status === "draft") return "secondary";
  return "outline";
};

export default function BuyerTradeBids() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<BuyerBidDoc[]>([]);
  const [tab, setTab] = useState<BuyerBidStatus>("pending_deposit");
  const [selected, setSelected] = useState<BuyerBidDoc | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = async () => {
    if (!currentUser?.uid) return;
    setLoading(true);
    try {
      const bids = await listBuyerBids(currentUser.uid);
      setRows(bids);
    } catch (error: any) {
      toast.error(error?.message || "Failed to load bids.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => undefined);
  }, [currentUser?.uid]);

  const filteredRows = useMemo(() => rows.filter((row) => row.status === tab), [rows, tab]);

  const updateBid = async (bidId: string, patch: Partial<BuyerBidDoc>) => {
    if (!currentUser?.uid) return;
    setUpdatingId(bidId);
    try {
      await setBuyerBidStatus(bidId, currentUser.uid, patch);
      await load();
      toast.success("Bid updated.");
      if (selected?.id === bidId) {
        setSelected((prev) => (prev ? { ...prev, ...patch } : prev));
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to update bid.");
    } finally {
      setUpdatingId(null);
    }
  };

  if (!BUYER_TRADE_ENABLED) {
    return (
      <Card className="border-border/60">
        <CardHeader><CardTitle>My Bids</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">Buyer trade module is disabled.</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">My Bids</h2>
        <p className="text-sm text-muted-foreground">Track bid status, deposits, and contract conversion.</p>
      </div>

      <Tabs value={tab} onValueChange={(value) => setTab(value as BuyerBidStatus)}>
        <TabsList className="flex h-auto flex-wrap">
          {statusOrder.map((status) => (
            <TabsTrigger key={status} value={status}>{status.replace("_", " ")}</TabsTrigger>
          ))}
        </TabsList>

        {statusOrder.map((status) => (
          <TabsContent key={status} value={status}>
            <Card className="border-border/60">
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bid ID</TableHead>
                      <TableHead>Coop + Commodity</TableHead>
                      <TableHead>Qty + Price</TableHead>
                      <TableHead>Deposit</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={7}>Loading bids...</TableCell></TableRow>
                    ) : filteredRows.length === 0 ? (
                      <TableRow><TableCell colSpan={7}>No bids yet in this state.</TableCell></TableRow>
                    ) : filteredRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="text-xs">{row.id.slice(0, 8)}</code>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(row.id).catch(() => undefined);
                                toast.success("Bid ID copied.");
                              }}
                            >
                              Copy
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>{row.orgId} • {row.commodity}</TableCell>
                        <TableCell>{Number(row.qty).toLocaleString()} @ KES {Number(row.unitPrice).toLocaleString()}</TableCell>
                        <TableCell>KES {Number(row.depositAmount || 0).toLocaleString()} ({row.depositStatus || "unpaid"})</TableCell>
                        <TableCell><Badge variant={statusBadgeVariant(row.status)}>{row.status}</Badge></TableCell>
                        <TableCell>{toDateTime(row.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => setSelected(row)}>View details</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>Bid Details</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <p><span className="text-muted-foreground">Bid ID:</span> {selected.id}</p>
                <p><span className="text-muted-foreground">Status:</span> {selected.status}</p>
                <p><span className="text-muted-foreground">Cooperative:</span> {selected.orgId}</p>
                <p><span className="text-muted-foreground">Commodity:</span> {selected.commodity}</p>
                <p><span className="text-muted-foreground">Quantity:</span> {selected.qty}</p>
                <p><span className="text-muted-foreground">Total value:</span> KES {Number(selected.totalValue || 0).toLocaleString()}</p>
                <p><span className="text-muted-foreground">Deposit:</span> KES {Number(selected.depositAmount || 0).toLocaleString()}</p>
                <p><span className="text-muted-foreground">Created:</span> {toDateTime(selected.createdAt)}</p>
              </div>

              <div className="rounded border border-border/60 p-3">
                <p className="font-medium mb-2">Timeline</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>Created • {toDateTime(selected.createdAt)}</li>
                  <li>Deposit status • {selected.depositStatus}</li>
                  <li>Bid status • {selected.status}</li>
                  <li>Contract generation • {selected.status === "accepted" ? "Ready" : "Pending coop acceptance"}</li>
                </ul>
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                {selected.status === "pending_deposit" && (
                  <>
                    <Button variant="outline" onClick={() => toast.message("M-PESA deposit integration coming soon.")}>Pay deposit</Button>
                    {DEV_MARK_PAID && (
                      <Button
                        onClick={() => updateBid(selected.id, { depositStatus: "paid", status: "submitted" })}
                        disabled={updatingId === selected.id}
                      >
                        Mark as paid (Admin Test)
                      </Button>
                    )}
                  </>
                )}
                {selected.status !== "accepted" && selected.status !== "cancelled" && (
                  <Button
                    variant="outline"
                    onClick={() => updateBid(selected.id, { status: "cancelled" })}
                    disabled={updatingId === selected.id}
                  >
                    Cancel bid
                  </Button>
                )}
                <Button variant="outline" onClick={() => toast.message("Summary PDF export will be available soon.")}>Download summary</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
