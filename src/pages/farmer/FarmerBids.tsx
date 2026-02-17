import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { listFarmerBids, type FarmerBid, type FarmerContribution } from "@/services/farmerBidsService";
import { toast } from "sonner";

const formatDate = (value: any) => {
  const date = value?.toDate?.() ?? (value ? new Date(value) : null);
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleString() : "--";
};

const getCountdown = (value: any) => {
  const date = value?.toDate?.() ?? (value ? new Date(value) : null);
  if (!date || Number.isNaN(date.getTime())) return "--";
  const diff = date.getTime() - Date.now();
  if (diff <= 0) return "Closed";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  return `${hours}h ${mins}m`;
};

const renderTopPrice = (bid: FarmerBid) => {
  const top = bid.topPrices[0];
  if (top) return `KES ${top.toLocaleString()}/${bid.unit}`;
  if (bid.winningPrice) return `KES ${Number(bid.winningPrice).toLocaleString()}/${bid.unit}`;
  return "--";
};

export default function FarmerBids() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeBids, setActiveBids] = useState<FarmerBid[]>([]);
  const [closedBids, setClosedBids] = useState<FarmerBid[]>([]);
  const [contributions, setContributions] = useState<FarmerContribution[]>([]);
  const [tab, setTab] = useState("active");
  const [search, setSearch] = useState("");
  const [commodity, setCommodity] = useState("all");
  const [orgFilter, setOrgFilter] = useState("all");

  useEffect(() => {
    if (!currentUser?.uid) return;
    setLoading(true);
    listFarmerBids(currentUser.uid)
      .then((result) => {
        setActiveBids(result.activeBids);
        setClosedBids(result.closedBids);
        setContributions(result.contributions);
      })
      .catch((error: any) => {
        toast.error(error?.message || "Failed to load bids.");
      })
      .finally(() => setLoading(false));
  }, [currentUser?.uid]);

  const allBids = useMemo(() => [...activeBids, ...closedBids], [activeBids, closedBids]);
  const commodityOptions = useMemo(
    () => Array.from(new Set(allBids.map((bid) => bid.commodity).filter(Boolean))).sort(),
    [allBids]
  );
  const orgOptions = useMemo(
    () => Array.from(new Set(allBids.map((bid) => `${bid.orgId}::${bid.orgName}`))).sort(),
    [allBids]
  );

  const applyFilters = (rows: FarmerBid[]) =>
    rows.filter((row) => {
      const searchText = search.trim().toLowerCase();
      if (searchText && !`${row.commodity} ${row.orgName}`.toLowerCase().includes(searchText)) return false;
      if (commodity !== "all" && row.commodity !== commodity) return false;
      if (orgFilter !== "all" && row.orgId !== orgFilter) return false;
      return true;
    });

  const filteredActive = applyFilters(activeBids);
  const filteredClosed = applyFilters(closedBids);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Bids & Results</h2>
        <p className="text-sm text-muted-foreground">
          Track cooperative bids relevant to your recent contributions.
        </p>
      </div>

      <Card className="border-border/60">
        <CardHeader><CardTitle className="text-base">Filters</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <div>
            <Label>Search</Label>
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Commodity or coop" />
          </div>
          <div>
            <Label>Commodity</Label>
            <Select value={commodity} onValueChange={setCommodity}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {commodityOptions.map((item) => (
                  <SelectItem key={item} value={item}>{item}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Cooperative</Label>
            <Select value={orgFilter} onValueChange={setOrgFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {orgOptions.map((item) => {
                  const [orgId, orgName] = item.split("::");
                  return <SelectItem key={item} value={orgId}>{orgName}</SelectItem>;
                })}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active Bids</TabsTrigger>
          <TabsTrigger value="closed">Closed Bids</TabsTrigger>
          <TabsTrigger value="contributions">My Contributions</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-3">
          {loading ? (
            <Card className="border-border/60"><CardContent className="p-6 text-sm text-muted-foreground">Loading active bids...</CardContent></Card>
          ) : filteredActive.length === 0 ? (
            <Card className="border-border/60"><CardContent className="p-6 text-sm text-muted-foreground">No active bids for your crops right now.</CardContent></Card>
          ) : (
            filteredActive.map((bid) => (
              <Card key={`${bid.orgId}-${bid.bidId}`} className="border-border/60">
                <CardContent className="p-4 grid gap-3 md:grid-cols-[1fr_auto]">
                  <div className="space-y-1 text-sm">
                    <p className="font-semibold">{bid.commodity} • {bid.orgName}</p>
                    <p className="text-muted-foreground">Quantity requested: {bid.requestedQty.toLocaleString()} {bid.unit}</p>
                    <p className="text-muted-foreground">Current top price: {renderTopPrice(bid)}</p>
                    <p className="text-muted-foreground">Bidders: {bid.bidderCount}</p>
                    <p className="text-muted-foreground">You contributed: {bid.myContributionQty.toLocaleString()} {bid.myContributionUnit}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge>OPEN</Badge>
                    <Badge variant="secondary">Closes in {getCountdown(bid.closesAt)}</Badge>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/farmer/bids/${bid.orgId}/${bid.bidId}`)}>View details</Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="closed" className="space-y-3">
          {loading ? (
            <Card className="border-border/60"><CardContent className="p-6 text-sm text-muted-foreground">Loading closed bids...</CardContent></Card>
          ) : filteredClosed.length === 0 ? (
            <Card className="border-border/60"><CardContent className="p-6 text-sm text-muted-foreground">No closed bids yet.</CardContent></Card>
          ) : (
            filteredClosed.map((bid) => (
              <Card key={`${bid.orgId}-${bid.bidId}`} className="border-border/60">
                <CardContent className="p-4 grid gap-3 md:grid-cols-[1fr_auto]">
                  <div className="space-y-1 text-sm">
                    <p className="font-semibold">{bid.commodity} • {bid.orgName}</p>
                    <p className="text-muted-foreground">Closed: {formatDate(bid.closesAt)}</p>
                    <p className="text-muted-foreground">Winner: {bid.winningBuyerLabel || "Buyer (masked)"}</p>
                    <p className="text-muted-foreground">Winning price: {renderTopPrice(bid)}</p>
                    <p className="text-muted-foreground">Total contract value: KES {(Number(bid.winningPrice || 0) * Number(bid.requestedQty || 0)).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="secondary">CLOSED</Badge>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/farmer/bids/${bid.orgId}/${bid.bidId}`)}>View results</Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="contributions">
          <Card className="border-border/60">
            <CardHeader><CardTitle className="text-base">My Contributions (last 90 days)</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {contributions.length === 0 ? (
                <p className="text-muted-foreground">No contribution records found yet.</p>
              ) : contributions.map((item, index) => (
                <div key={`${item.orgId}-${item.commodity}-${index}`} className="rounded border border-border/60 p-3">
                  <p className="font-medium">{item.commodity}</p>
                  <p className="text-muted-foreground">{item.qty.toLocaleString()} {item.unit} • {item.source}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

