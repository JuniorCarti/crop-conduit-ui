import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { BUYER_TRADE_ENABLED, createBuyerBid, getMarketplaceListingById, setBuyerBidStatus, type ListingDoc } from "@/services/buyerTradeService";

const DEV_MARK_PAID = String((import.meta as any).env?.VITE_ENABLE_TEST_DEPOSIT ?? "false").toLowerCase() === "true";

const parseDate = (value: any) => {
  const date = value?.toDate?.() ?? (value ? new Date(value) : null);
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleString() : "--";
};

export default function BuyerTradeListingDetails() {
  const { listingId = "" } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [listing, setListing] = useState<ListingDoc | null>(null);
  const [step, setStep] = useState(1);
  const [qty, setQty] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [deliveryOption, setDeliveryOption] = useState<"pickup" | "delivery">("pickup");
  const [deliveryWindow, setDeliveryWindow] = useState("");
  const [notes, setNotes] = useState("");
  const [depositPercent, setDepositPercent] = useState("10");
  const [submitting, setSubmitting] = useState(false);
  const [pendingBid, setPendingBid] = useState<{ bidId: string; total: number; deposit: number } | null>(null);
  const [depositModalOpen, setDepositModalOpen] = useState(false);

  useEffect(() => {
    if (!listingId) return;
    setLoading(true);
    getMarketplaceListingById(listingId)
      .then((result) => {
        setListing(result);
        if (result?.indicativePrice) {
          setUnitPrice(String(result.indicativePrice));
        }
      })
      .catch(() => setListing(null))
      .finally(() => setLoading(false));
  }, [listingId]);

  const totalValue = useMemo(() => Number(qty || 0) * Number(unitPrice || 0), [qty, unitPrice]);
  const depositAmount = useMemo(() => totalValue * (Number(depositPercent || 0) / 100), [totalValue, depositPercent]);
  const platformFee = useMemo(() => (totalValue > 0 ? 150 : 0), [totalValue]);

  const validateTerms = () => {
    const parsedQty = Number(qty);
    const parsedPrice = Number(unitPrice);
    const minOrder = Number(listing?.minOrderQty || 0);
    const available = Number(listing?.quantityAvailable || 0);
    if (!Number.isFinite(parsedQty) || parsedQty <= 0) return "Enter a valid quantity.";
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) return "Enter a valid price.";
    if (minOrder > 0 && parsedQty < minOrder) return `Minimum order is ${minOrder}.`;
    if (available > 0 && parsedQty > available) return `Only ${available} available.`;
    if (!deliveryWindow.trim()) return "Enter delivery date window.";
    return null;
  };

  const submitBid = async () => {
    if (!currentUser?.uid || !listing) return;
    const validationError = validateTerms();
    if (validationError) {
      toast.error(validationError);
      return;
    }
    const parsedDepositPercent = Number(depositPercent || 0);
    if (parsedDepositPercent < 5 || parsedDepositPercent > 20) {
      toast.error("Deposit percentage must be between 5% and 20%.");
      return;
    }
    setSubmitting(true);
    try {
      const bidId = await createBuyerBid({
        buyerUid: currentUser.uid,
        orgId: String(listing.orgId || ""),
        listingId: listing.id,
        commodity: String(listing.commodity || "Produce"),
        qty: Number(qty),
        unitPrice: Number(unitPrice),
        totalValue,
        depositPercent: parsedDepositPercent,
        depositAmount,
        platformFeeAmount: platformFee,
        deliveryOption,
        deliveryWindow: deliveryWindow.trim(),
        notes: notes.trim() || undefined,
        status: "pending_deposit",
        depositStatus: "unpaid",
      });
      setPendingBid({ bidId, total: totalValue, deposit: depositAmount });
      setDepositModalOpen(true);
      toast.success("Bid created. Complete deposit to submit.");
    } catch (error: any) {
      toast.error(error?.message || "Failed to create bid.");
    } finally {
      setSubmitting(false);
    }
  };

  const markDepositPaid = async () => {
    if (!currentUser?.uid || !pendingBid) return;
    try {
      await setBuyerBidStatus(pendingBid.bidId, currentUser.uid, {
        depositStatus: "paid",
        status: "submitted",
      });
      toast.success("Deposit marked as paid. Bid submitted.");
      setDepositModalOpen(false);
      navigate("/buyer/trade/bids");
    } catch (error: any) {
      toast.error(error?.message || "Failed to mark deposit paid.");
    }
  };

  if (!BUYER_TRADE_ENABLED) {
    return (
      <Card className="border-border/60">
        <CardHeader><CardTitle>Trade & Exchange</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">Buyer trade module is disabled.</CardContent>
      </Card>
    );
  }

  if (loading) {
    return <Card className="border-border/60"><CardContent className="p-6 text-sm text-muted-foreground">Loading listing...</CardContent></Card>;
  }

  if (!listing) {
    return (
      <Card className="border-border/60">
        <CardHeader><CardTitle>Listing unavailable</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">This listing may have been removed or paused.</p>
          <Button variant="outline" onClick={() => navigate("/buyer/trade")}>Back to Trade Home</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Listing Details</h2>
          <p className="text-sm text-muted-foreground">Review supply terms and place your bid.</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/buyer/trade")}>Back to Market</Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <Card className="border-border/60">
          <CardHeader><CardTitle className="text-base">{listing.commodity} {listing.grade ? `• Grade ${listing.grade}` : ""}</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <p className="font-medium">{listing.orgName || "Cooperative"}</p>
              {listing.verifiedOrg && <Badge variant="verified">Verified</Badge>}
            </div>
            <p><span className="text-muted-foreground">Quantity available:</span> {Number(listing.quantityAvailable || 0).toLocaleString()} {listing.unit || "kg"}</p>
            <p><span className="text-muted-foreground">Min order:</span> {Number(listing.minOrderQty || 0) || "--"}</p>
            <p><span className="text-muted-foreground">Indicative price:</span> KES {Number(listing.indicativePrice || 0).toLocaleString()}</p>
            <p><span className="text-muted-foreground">Delivery options:</span> {(listing.deliveryOptions || []).join(", ") || "--"}</p>
            <p><span className="text-muted-foreground">Location:</span> {listing.location?.county || "--"}{listing.location?.subcounty ? `, ${listing.location.subcounty}` : ""}</p>
            <p><span className="text-muted-foreground">Reliability:</span> {listing.reliabilityScore ? `${listing.reliabilityScore}%` : "--"}</p>
            <p><span className="text-muted-foreground">Last updated:</span> {parseDate(listing.updatedAt)}</p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader><CardTitle className="text-base">Place Bid</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 text-xs">
              <Badge variant={step === 1 ? "default" : "secondary"}>Step 1: Terms</Badge>
              <Badge variant={step === 2 ? "default" : "secondary"}>Step 2: Deposit</Badge>
              <Badge variant={step === 3 ? "default" : "secondary"}>Step 3: Confirm</Badge>
            </div>

            {step === 1 && (
              <div className="space-y-3">
                <div><Label>Quantity requested</Label><Input value={qty} onChange={(event) => setQty(event.target.value)} /></div>
                <div><Label>Price per unit (KES)</Label><Input value={unitPrice} onChange={(event) => setUnitPrice(event.target.value)} /></div>
                <div><Label>Delivery option</Label><Select value={deliveryOption} onValueChange={(value) => setDeliveryOption(value as "pickup" | "delivery")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pickup">pickup</SelectItem><SelectItem value="delivery">delivery</SelectItem></SelectContent></Select></div>
                <div><Label>Delivery date window</Label><Input value={deliveryWindow} onChange={(event) => setDeliveryWindow(event.target.value)} placeholder="e.g. 2026-03-01 to 2026-03-05" /></div>
                <div><Label>Notes to cooperative</Label><Textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} /></div>
                <p className="text-sm"><span className="text-muted-foreground">Total value:</span> KES {totalValue.toLocaleString()}</p>
                <div className="flex justify-end"><Button onClick={() => setStep(2)}>Continue</Button></div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3 text-sm">
                <div><Label>Deposit percent</Label><Select value={depositPercent} onValueChange={setDepositPercent}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="5">5%</SelectItem><SelectItem value="10">10%</SelectItem><SelectItem value="15">15%</SelectItem><SelectItem value="20">20%</SelectItem></SelectContent></Select></div>
                <p className="text-muted-foreground">Deposit confirms seriousness. Fully refundable if cooperative rejects.</p>
                <div className="rounded-lg border border-border/60 p-3 space-y-1">
                  <p>Deposit amount: <span className="font-medium">KES {depositAmount.toLocaleString()}</span></p>
                  <p>Platform fee: <span className="font-medium">KES {platformFee.toLocaleString()}</span></p>
                  <p>Total payable now: <span className="font-semibold">KES {(depositAmount + platformFee).toLocaleString()}</span></p>
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                  <Button onClick={() => setStep(3)}>Continue</Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3 text-sm">
                <p className="font-medium">Bid Summary</p>
                <p>Quantity: {qty} {listing.unit || "kg"}</p>
                <p>Unit price: KES {Number(unitPrice || 0).toLocaleString()}</p>
                <p>Total value: KES {totalValue.toLocaleString()}</p>
                <p>Deposit: KES {depositAmount.toLocaleString()} ({depositPercent}%)</p>
                <p>Delivery: {deliveryOption} • {deliveryWindow || "--"}</p>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                  <Button onClick={submitBid} disabled={submitting}>{submitting ? "Submitting..." : "Submit Bid"}</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={depositModalOpen} onOpenChange={setDepositModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Next: Pay Deposit</DialogTitle></DialogHeader>
          <div className="space-y-3 text-sm">
            <p className="font-medium">Bid ID: {pendingBid?.bidId}</p>
            <p>Total value: KES {Number(pendingBid?.total || 0).toLocaleString()}</p>
            <p>Deposit amount: KES {Number(pendingBid?.deposit || 0).toLocaleString()}</p>
            <div className="rounded border border-amber-200 bg-amber-50 text-amber-800 px-3 py-2 text-xs">
              Deposit payment pipeline is ready. M-PESA integration is coming soon.
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" onClick={() => toast.message("M-PESA integration coming soon. Bid remains pending deposit.")}>Pay Deposit (M-PESA)</Button>
              {DEV_MARK_PAID && <Button onClick={markDepositPaid}>Mark as paid (Admin Test)</Button>}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
