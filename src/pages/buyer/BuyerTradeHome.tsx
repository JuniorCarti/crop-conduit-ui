import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { BUYER_TRADE_ENABLED, createBuyerBuyRequest, listMarketplaceListings, type ListingDoc } from "@/services/buyerTradeService";
import { getMarketPrices } from "@/services/marketPriceService";

export default function BuyerTradeHome() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ListingDoc[]>([]);
  const [county, setCounty] = useState("");
  const [grade, setGrade] = useState("all");
  const [deliveryMethod, setDeliveryMethod] = useState<"" | "pickup" | "delivery">("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [premiumOnly, setPremiumOnly] = useState(false);
  const [unit, setUnit] = useState("all");
  const [priceType, setPriceType] = useState("all");
  const [minQty, setMinQty] = useState("");
  const [maxQty, setMaxQty] = useState("");
  const [commodityFilter, setCommodityFilter] = useState("");
  const [buyReqOpen, setBuyReqOpen] = useState(false);
  const [buyReq, setBuyReq] = useState({ commodity: "", qty: "", targetPriceRange: "", county: "", deliveryPreference: "pickup" as "pickup" | "delivery" });
  const [insight, setInsight] = useState<{ avg: number; top: string[] }>({ avg: 0, top: [] });

  const loadListings = async () => {
    setLoading(true);
    try {
      const listings = await listMarketplaceListings({
        commodity: commodityFilter ? [commodityFilter] : undefined,
        county: county || undefined,
        grade: grade === "all" ? undefined : grade,
        verifiedOnly,
        priceType: priceType === "all" ? undefined : (priceType as "fixed" | "negotiable"),
        unit: unit === "all" ? undefined : unit,
        premiumOnly,
        minQty: minQty ? Number(minQty) : undefined,
        maxQty: maxQty ? Number(maxQty) : undefined,
        deliveryMethod,
      });
      setRows(listings);
    } catch (error: any) {
      toast.error(error?.message || "Failed to load listings.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings().catch(() => undefined);
  }, []);

  useEffect(() => {
    const commodity = rows[0]?.commodity;
    if (!commodity) return;
    getMarketPrices({ commodity, limitCount: 20 })
      .then((data) => {
        const avg = data.length ? data.reduce((sum, item) => sum + Number(item.retail || item.wholesale || 0), 0) / data.length : 0;
        const top = Array.from(new Set(rows.map((row) => row.commodity).filter(Boolean) as string[])).slice(0, 3);
        setInsight({ avg: Math.round(avg), top });
      })
      .catch(() => setInsight({ avg: 0, top: [] }));
  }, [rows]);

  const stats = useMemo(() => {
    const volume = rows.reduce((sum, row) => sum + Number(row.quantityAvailable || 0), 0);
    return {
      active: rows.length,
      volume,
      pendingTrades: 0,
      revenue: 0,
    };
  }, [rows]);

  const submitBuyRequest = async () => {
    if (!currentUser?.uid) return;
    if (!buyReq.commodity || !buyReq.qty || !buyReq.targetPriceRange || !buyReq.county) {
      toast.error("Fill all required fields.");
      return;
    }
    try {
      await createBuyerBuyRequest({
        buyerUid: currentUser.uid,
        commodity: buyReq.commodity,
        qty: Number(buyReq.qty),
        targetPriceRange: buyReq.targetPriceRange,
        county: buyReq.county,
        deliveryPreference: buyReq.deliveryPreference,
      });
      toast.success("Buy request posted.");
      setBuyReqOpen(false);
      setBuyReq({ commodity: "", qty: "", targetPriceRange: "", county: "", deliveryPreference: "pickup" });
    } catch (error: any) {
      toast.error(error?.message || "Failed to post buy request.");
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Trade & Exchange</h2>
          <p className="text-sm text-muted-foreground">Verified cooperative supply + commitment deposits to reduce cancellations.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setBuyReqOpen(true)}>Post Buy Request</Button>
          <Button onClick={() => navigate("/buyer/trade/bids")}>My Bids</Button>
          <Button variant="outline" onClick={() => navigate("/buyer/trade/contracts")}>Contracts</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/60"><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Active Listings</p><p className="text-2xl font-semibold">{stats.active}</p></CardContent></Card>
        <Card className="border-border/60"><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Total Volume Listed</p><p className="text-2xl font-semibold">{stats.volume.toLocaleString()} kg</p></CardContent></Card>
        <Card className="border-border/60"><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Pending Trades</p><p className="text-2xl font-semibold">{stats.pendingTrades}</p></CardContent></Card>
        <Card className="border-border/60"><CardContent className="pt-6"><p className="text-xs text-muted-foreground">This Month Revenue</p><p className="text-2xl font-semibold">KES {stats.revenue.toLocaleString()}</p></CardContent></Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <Card className="border-border/60">
          <CardHeader><CardTitle className="text-base">Filters</CardTitle></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <div><Label>Commodity</Label><Input value={commodityFilter} onChange={(e) => setCommodityFilter(e.target.value)} placeholder="Tomatoes" /></div>
            <div><Label>County / Region</Label><Input value={county} onChange={(e) => setCounty(e.target.value)} placeholder="Nakuru" /></div>
            <div><Label>Grade</Label><Select value={grade} onValueChange={setGrade}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="A">A</SelectItem><SelectItem value="B">B</SelectItem><SelectItem value="C">C</SelectItem></SelectContent></Select></div>
            <div><Label>Packaging unit</Label><Select value={unit} onValueChange={setUnit}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="kg">kg</SelectItem><SelectItem value="bags">bags</SelectItem><SelectItem value="crates">crates</SelectItem></SelectContent></Select></div>
            <div><Label>Price type</Label><Select value={priceType} onValueChange={setPriceType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="fixed">fixed</SelectItem><SelectItem value="negotiable">negotiable</SelectItem></SelectContent></Select></div>
            <div><Label>Min quantity</Label><Input value={minQty} onChange={(e) => setMinQty(e.target.value)} placeholder="0" /></div>
            <div><Label>Max quantity</Label><Input value={maxQty} onChange={(e) => setMaxQty(e.target.value)} placeholder="10000" /></div>
            <div><Label>Delivery method</Label><Select value={deliveryMethod || "any"} onValueChange={(value) => setDeliveryMethod(value === "any" ? "" : value as any)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="any">Any</SelectItem><SelectItem value="pickup">Pickup</SelectItem><SelectItem value="delivery">Delivery</SelectItem></SelectContent></Select></div>
            <label className="col-span-full flex items-center gap-2 text-sm"><Switch checked={verifiedOnly} onCheckedChange={setVerifiedOnly} /> Verified only</label>
            <label className="col-span-full flex items-center gap-2 text-sm"><Switch checked={premiumOnly} onCheckedChange={setPremiumOnly} /> Sponsored / Premium coops only</label>
            <div className="col-span-full"><Button onClick={() => loadListings()}>Apply Filters</Button></div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader><CardTitle className="text-base">Insights</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p><span className="text-muted-foreground">Top traded:</span> {insight.top.length ? insight.top.join(", ") : "--"}</p>
            <p><span className="text-muted-foreground">Avg price range:</span> {insight.avg ? `KES ~${insight.avg}/kg` : "--"}</p>
            <p className="text-muted-foreground">Supply hotspots map: coming soon.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader><CardTitle className="text-base">Listings</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Coop</TableHead>
                <TableHead>Commodity</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Indicative price</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Next available</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Bids</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={10}>Loading listings...</TableCell></TableRow>
              ) : rows.length === 0 ? (
                <TableRow><TableCell colSpan={10}>No listings found.</TableCell></TableRow>
              ) : rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{row.orgName || "Cooperative"}</span>
                      {row.verifiedOrg && <Badge variant="verified">Verified</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>{row.commodity} {row.grade ? `(${row.grade})` : ""}</TableCell>
                  <TableCell>{Number(row.quantityAvailable || 0).toLocaleString()} {row.unit || "kg"}</TableCell>
                  <TableCell>KES {Number(row.indicativePrice || 0).toLocaleString()}</TableCell>
                  <TableCell>{row.location?.county || "--"}{row.location?.subcounty ? `, ${row.location.subcounty}` : ""}</TableCell>
                  <TableCell>{row.nextAvailableDate?.toDate?.()?.toLocaleDateString?.() || "--"}</TableCell>
                  <TableCell><Badge variant="secondary">{row.status || "active"}</Badge></TableCell>
                  <TableCell>{Number(row.viewsCount || 0).toLocaleString()}</TableCell>
                  <TableCell>{Number(row.bidsCount || 0).toLocaleString()}</TableCell>
                  <TableCell><Button size="sm" variant="outline" onClick={() => navigate(`/buyer/trade/listings/${row.id}`)}>View</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={buyReqOpen} onOpenChange={setBuyReqOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Post Buy Request</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Commodity</Label><Input value={buyReq.commodity} onChange={(e) => setBuyReq((p) => ({ ...p, commodity: e.target.value }))} /></div>
            <div><Label>Quantity</Label><Input value={buyReq.qty} onChange={(e) => setBuyReq((p) => ({ ...p, qty: e.target.value }))} /></div>
            <div><Label>Target price range</Label><Input value={buyReq.targetPriceRange} onChange={(e) => setBuyReq((p) => ({ ...p, targetPriceRange: e.target.value }))} placeholder="KES 80-95/kg" /></div>
            <div><Label>County</Label><Input value={buyReq.county} onChange={(e) => setBuyReq((p) => ({ ...p, county: e.target.value }))} /></div>
            <div><Label>Delivery preference</Label><Select value={buyReq.deliveryPreference} onValueChange={(value) => setBuyReq((p) => ({ ...p, deliveryPreference: value as any }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pickup">Pickup</SelectItem><SelectItem value="delivery">Delivery</SelectItem></SelectContent></Select></div>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setBuyReqOpen(false)}>Cancel</Button><Button onClick={submitBuyRequest}>Post request</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
