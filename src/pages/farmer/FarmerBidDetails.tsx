import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { getFarmerBidDetails, type FarmerBid, type FarmerBidOffer } from "@/services/farmerBidsService";
import { toast } from "sonner";

const formatDate = (value: any) => {
  const date = value?.toDate?.() ?? (value ? new Date(value) : null);
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleString() : "--";
};

export default function FarmerBidDetails() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { orgId = "", bidId = "" } = useParams();
  const [loading, setLoading] = useState(true);
  const [bid, setBid] = useState<FarmerBid | null>(null);
  const [offers, setOffers] = useState<FarmerBidOffer[]>([]);

  useEffect(() => {
    if (!currentUser?.uid || !orgId || !bidId) return;
    setLoading(true);
    getFarmerBidDetails(currentUser.uid, orgId, bidId)
      .then((result) => {
        setBid(result?.bid ?? null);
        setOffers(result?.offers ?? []);
      })
      .catch((error: any) => {
        toast.error(error?.message || "Failed to load bid details.");
        setBid(null);
      })
      .finally(() => setLoading(false));
  }, [currentUser?.uid, orgId, bidId]);

  if (loading) {
    return <Card className="border-border/60"><CardContent className="p-6 text-sm text-muted-foreground">Loading bid details...</CardContent></Card>;
  }

  if (!bid) {
    return (
      <Card className="border-border/60">
        <CardHeader><CardTitle>Bid not found</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">This bid is unavailable or you are not eligible to view it.</p>
          <Button variant="outline" onClick={() => navigate("/farmer/bids")}>Back to Bids</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{bid.commodity} Bid</h2>
          <p className="text-sm text-muted-foreground">{bid.orgName}</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/farmer/bids")}>Back</Button>
      </div>

      <Card className="border-border/60">
        <CardHeader><CardTitle className="text-base">Bid Timeline</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><span className="text-muted-foreground">Opened:</span> {formatDate(bid.opensAt || bid.createdAt)}</p>
          <p><span className="text-muted-foreground">Closing:</span> {formatDate(bid.closesAt)}</p>
          <p><span className="text-muted-foreground">Status:</span> <Badge variant={bid.status === "open" ? "default" : "secondary"}>{bid.status.toUpperCase()}</Badge></p>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader><CardTitle className="text-base">Requirements</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><span className="text-muted-foreground">Requested quantity:</span> {bid.requestedQty.toLocaleString()} {bid.unit}</p>
          <p><span className="text-muted-foreground">Category:</span> {bid.category}</p>
          <p><span className="text-muted-foreground">Visibility:</span> {bid.visibilityMode || "eligible_only"}</p>
          <p><span className="text-muted-foreground">Transparency:</span> {bid.transparencyMode || "top_only"}</p>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader><CardTitle className="text-base">Leaderboard</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {offers.length === 0 ? (
            <p className="text-muted-foreground">No bids recorded yet.</p>
          ) : offers.map((offer, index) => (
            <div key={offer.id} className="flex items-center justify-between rounded border border-border/60 p-2">
              <p>{offer.buyerLabel}</p>
              <p className="font-medium">{offer.currency} {offer.pricePerUnit.toLocaleString()}/{bid.unit}</p>
            </div>
          ))}
          {bid.transparencyMode !== "full_list" && (
            <p className="text-xs text-muted-foreground">Showing top prices only.</p>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader><CardTitle className="text-base">Your Eligibility</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><span className="text-muted-foreground">Eligible:</span> {bid.eligible ? "Yes" : "No"}</p>
          <p><span className="text-muted-foreground">You contributed:</span> {bid.myContributionQty.toLocaleString()} {bid.myContributionUnit}</p>
        </CardContent>
      </Card>

      {bid.status === "closed" && (
        <Card className="border-border/60">
          <CardHeader><CardTitle className="text-base">Results</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Winning buyer:</span> {bid.winningBuyerLabel || "Buyer (masked)"}</p>
            <p><span className="text-muted-foreground">Winning price:</span> KES {Number(bid.winningPrice || 0).toLocaleString()}/{bid.unit}</p>
            <p><span className="text-muted-foreground">Expected payment timeline:</span> Await cooperative confirmation.</p>
            <p className="text-muted-foreground">Next step: Wait for cooperative delivery and settlement schedule.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

