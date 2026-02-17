import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar } from "recharts";
import { Bell, PlusCircle, TrendingUp } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { toast } from "sonner";
import { useUserAccount } from "@/hooks/useUserAccount";
import { getOrganization } from "@/services/orgService";
import { getMarketPrices } from "@/services/marketPriceService";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ListingCard } from "@/components/org/trade/ListingCard";
import { TradeTable } from "@/components/org/trade/TradeTable";
import { ContractCard } from "@/components/org/trade/ContractCard";
import type { ContractRow, TradeListing, TradeRow } from "@/components/org/trade/types";

const TRADE_FLAG = String((import.meta as any).env?.VITE_ENABLE_COOP_TRADE ?? "false").toLowerCase() === "true";
const INTL_SIM_FLAG = String((import.meta as any).env?.VITE_INTL_SIM_ENABLED ?? "false").toLowerCase() === "true";

const initialListings: TradeListing[] = [
  { id: "lst-1", crop: "Tomatoes", quantityKg: 1800, grade: "A", location: "Nakuru", harvestDate: "2026-02-22", pricePerKg: 95, status: "active", views: 43, bids: 6 },
  { id: "lst-2", crop: "Onions", quantityKg: 2400, grade: "B", location: "Nakuru", harvestDate: "2026-03-02", pricePerKg: 72, status: "paused", views: 18, bids: 2 },
];

const initialTrades: TradeRow[] = [
  { id: "tr-1", crop: "Tomatoes", buyer: "FreshMart Ltd", quantityKg: 900, agreedPrice: 98, deliveryDate: "2026-02-18", status: "pending" },
  { id: "tr-2", crop: "Cabbage", buyer: "City Greens", quantityKg: 1200, agreedPrice: 46, deliveryDate: "2026-02-14", status: "in_transit" },
];

const initialContracts: ContractRow[] = [
  { id: "ct-1", crop: "Irish Potato", lockedPrice: 64, quantityKg: 3000, deliveryWindow: "Feb 20 - Mar 10", buyer: "Metro Foods", status: "pending" },
  { id: "ct-2", crop: "Kale", lockedPrice: 58, quantityKg: 1500, deliveryWindow: "Mar 1 - Mar 15", buyer: "County School Feed", status: "accepted" },
];

const marketDemand = [
  { crop: "Tomatoes", demand: 84, supply: 62 },
  { crop: "Onions", demand: 70, supply: 68 },
  { crop: "Kale", demand: 65, supply: 51 },
  { crop: "Cabbage", demand: 59, supply: 56 },
  { crop: "Potato", demand: 77, supply: 73 },
];

const toMonthRevenue = (trades: TradeRow[]) =>
  trades.reduce((sum, row) => sum + row.quantityKg * row.agreedPrice, 0);

export default function TradePage() {
  const featureEnabled = TRADE_FLAG;
  const intlEnabled = INTL_SIM_FLAG;
  const account = useUserAccount();
  const orgId = account.data?.orgId ?? "";
  const [orgName, setOrgName] = useState("Cooperative");
  const [listings, setListings] = useState<TradeListing[]>(initialListings);
  const [trades, setTrades] = useState<TradeRow[]>(initialTrades);
  const [contracts, setContracts] = useState<ContractRow[]>(initialContracts);
  const [notifications] = useState([
    "New bid: Tomatoes +5 KES/kg",
    "Price spike alert: Onion +8%",
    "Contract offer from Metro Foods",
    "Payment confirmed for FreshMart trade",
  ]);

  const [listingOpen, setListingOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<TradeRow | null>(null);
  const [form, setForm] = useState({ crop: "", quantityKg: "", grade: "A", harvestDate: "", minPrice: "", photos: "" });
  const [cropSuggestions, setCropSuggestions] = useState<string[]>([]);
  const [priceTrend, setPriceTrend] = useState<Array<{ date: string; price: number }>>([]);
  const [intlSignals, setIntlSignals] = useState<Record<string, "upward" | "downward" | "neutral">>({});
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (!orgId) return;
    getOrganization(orgId)
      .then((org) => {
        const name = org?.name || (org as any)?.orgName || "Cooperative";
        setOrgName(name);
        setListings((prev) => prev.map((row) => ({ ...row, location: org?.county || row.location || "Nakuru" })));
      })
      .catch(() => undefined);
  }, [orgId]);

  useEffect(() => {
    if (!orgId) return;
    getDocs(collection(db, "orgs", orgId, "members"))
      .then((snap) => {
        const bag = new Set<string>();
        snap.docs.forEach((docSnap) => {
          const data = docSnap.data() as any;
          [...(data.mainCrops ?? []), ...(data.secondaryCrops ?? []), ...(data.crops ?? [])]
            .filter(Boolean)
            .forEach((crop: string) => bag.add(String(crop)));
        });
        setCropSuggestions(Array.from(bag).slice(0, 8));
      })
      .catch(() => setCropSuggestions([]));
  }, [orgId]);

  useEffect(() => {
    const commodity = listings[0]?.crop;
    if (!commodity) return;
    getMarketPrices({ commodity, limitCount: 20 })
      .then((rows) => {
        const chart = rows
          .slice(0, 12)
          .reverse()
          .map((row) => ({
            date: row.date?.toISOString?.().slice(5, 10) ?? "--",
            price: Number(row.retail ?? row.wholesale ?? 0),
          }));
        setPriceTrend(chart);
      })
      .catch(() => setPriceTrend([]));
  }, [listings]);

  useEffect(() => {
    if (!orgId) return;
    try {
      const raw = localStorage.getItem(`intl_sim_scenarios_${orgId}`);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;
      const next = parsed.reduce<Record<string, "upward" | "downward" | "neutral">>((acc, row: any) => {
        if (!row?.crop || acc[row.crop]) return acc;
        const direction = row?.result?.direction || row?.direction;
        acc[row.crop] = direction === "up" ? "upward" : direction === "down" ? "downward" : "neutral";
        return acc;
      }, {});
      setIntlSignals(next);
    } catch {
      setIntlSignals({});
    }
  }, [orgId, intlEnabled]);

  useEffect(() => {
    const shouldOpen = searchParams.get("openCreate") === "1";
    if (!shouldOpen) return;
    const crop = searchParams.get("crop") || "";
    const floorPrice = searchParams.get("floorPrice") || "";
    setForm((prev) => ({
      ...prev,
      crop: crop || prev.crop,
      minPrice: floorPrice || prev.minPrice,
    }));
    setListingOpen(true);
  }, [searchParams]);

  const stats = useMemo(() => {
    const active = listings.filter((row) => row.status === "active").length;
    const volume = listings.reduce((sum, row) => sum + row.quantityKg, 0);
    const pendingTrades = trades.filter((row) => row.status === "pending").length;
    const revenue = toMonthRevenue(trades);
    return { active, volume, pendingTrades, revenue };
  }, [listings, trades]);

  const suggestionPrice = useMemo(() => {
    if (!priceTrend.length) return 70;
    const avg = priceTrend.reduce((sum, row) => sum + row.price, 0) / priceTrend.length;
    return Math.round(avg * 1.03);
  }, [priceTrend]);

  const createListing = () => {
    if (!form.crop || !form.quantityKg || !form.minPrice || !form.harvestDate) {
      toast.error("Fill all required fields.");
      return;
    }
    const next: TradeListing = {
      id: `lst-${Date.now()}`,
      crop: form.crop,
      quantityKg: Number(form.quantityKg),
      grade: form.grade,
      location: listings[0]?.location || "Nakuru",
      harvestDate: form.harvestDate,
      pricePerKg: Number(form.minPrice),
      status: "active",
      views: 0,
      bids: 0,
    };
    setListings((prev) => [next, ...prev]);
    setListingOpen(false);
    setForm({ crop: "", quantityKg: "", grade: "A", harvestDate: "", minPrice: "", photos: "" });
    toast.success("Listing created.");
  };

  if (!featureEnabled) {
    return (
      <Card className="border-border/60">
        <CardHeader><CardTitle>Cooperative Trade</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Trade / Exchange is disabled. Set `VITE_ENABLE_COOP_TRADE=true` to enable this module.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Cooperative Trade</h2>
          <p className="text-sm text-muted-foreground">Mini agri-exchange for {orgName}.</p>
        </div>
        <Button onClick={() => setListingOpen(true)}><PlusCircle className="mr-2 h-4 w-4" />Create listing</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/60"><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Active listings</p><p className="text-2xl font-semibold">{stats.active}</p></CardContent></Card>
        <Card className="border-border/60"><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Total volume listed</p><p className="text-2xl font-semibold">{stats.volume.toLocaleString()} kg</p></CardContent></Card>
        <Card className="border-border/60"><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Pending trades</p><p className="text-2xl font-semibold">{stats.pendingTrades}</p></CardContent></Card>
        <Card className="border-border/60"><CardContent className="pt-6"><p className="text-xs text-muted-foreground">This month revenue</p><p className="text-2xl font-semibold">KES {stats.revenue.toLocaleString()}</p></CardContent></Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <Tabs defaultValue="listings" className="space-y-4">
          <TabsList className="h-auto flex-wrap">
            <TabsTrigger value="listings">Listings</TabsTrigger>
            <TabsTrigger value="trades">My Trades</TabsTrigger>
            <TabsTrigger value="contracts">Contracts</TabsTrigger>
            <TabsTrigger value="insights">Market Insights</TabsTrigger>
            {intlEnabled && <TabsTrigger value="intl">International Simulation</TabsTrigger>}
          </TabsList>

          <TabsContent value="listings" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  onEdit={() => setListingOpen(true)}
                  onViewBids={(row) => toast.info(`${row.bids} bids on ${row.crop}`)}
                  onToggle={(row) => setListings((prev) => prev.map((item) => item.id === row.id ? { ...item, status: item.status === "active" ? "paused" : "active" } : item))}
                  intlSignal={intlSignals[listing.crop]}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="trades" className="space-y-4">
            <Card className="border-border/60">
              <CardHeader><CardTitle className="text-base">Trade history</CardTitle></CardHeader>
              <CardContent><TradeTable rows={trades} onSelect={setSelectedTrade} /></CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contracts" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {contracts.map((contract) => (
                <ContractCard
                  key={contract.id}
                  contract={contract}
                  onView={(row) => toast.info(`Contract ${row.id}`)}
                  onAccept={(row) => {
                    setContracts((prev) => prev.map((item) => item.id === row.id ? { ...item, status: "accepted" } : item));
                    toast.success("Contract accepted.");
                  }}
                  onDecline={(row) => {
                    setContracts((prev) => prev.map((item) => item.id === row.id ? { ...item, status: "declined" } : item));
                    toast.success("Contract declined.");
                  }}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-2">
              <Card className="border-border/60">
                <CardHeader><CardTitle className="text-base">Price trends</CardTitle></CardHeader>
                <CardContent className="h-64">
                  {priceTrend.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={priceTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="price" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.2)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-sm text-muted-foreground">No price trend data available.</p>
                  )}
                </CardContent>
              </Card>
              <Card className="border-border/60">
                <CardHeader><CardTitle className="text-base">Demand heat map</CardTitle></CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={marketDemand}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="crop" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="demand" fill="hsl(var(--primary))" />
                      <Bar dataKey="supply" fill="hsl(var(--muted-foreground))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="border-border/60"><CardHeader><CardTitle className="text-base">Top demanded crops</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">{marketDemand.sort((a,b)=>b.demand-a.demand).slice(0,3).map((row)=> <p key={row.crop}>{row.crop} <span className="text-muted-foreground">({row.demand} demand index)</span></p>)}</CardContent></Card>
              <Card className="border-border/60"><CardHeader><CardTitle className="text-base">Supply forecast</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">{marketDemand.map((row)=> <div key={row.crop} className="flex items-center justify-between"><span>{row.crop}</span><Badge variant="outline">{row.supply}%</Badge></div>)}</CardContent></Card>
              <Card className="border-border/60"><CardHeader><CardTitle className="text-base">Asha Suggests</CardTitle></CardHeader><CardContent className="space-y-2 text-sm"><p className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" />Best time to sell tomatoes: next 5 days.</p><p>Price outlook: stable to mildly positive.</p><p>Demand alert: schools procurement window opens next week.</p></CardContent></Card>
            </div>
          </TabsContent>

          {intlEnabled && (
            <TabsContent value="intl" className="space-y-4">
              <Card className="border-border/60">
                <CardHeader><CardTitle className="text-base">International Markets moved</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-muted-foreground">International simulation is now available on a dedicated page.</p>
                  <Button asChild>
                    <Link to="/org/international">Open International Markets</Link>
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        <div className="space-y-4">
          <Card className="border-border/60">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bell className="h-4 w-4" />Notifications</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {notifications.map((note, idx) => (
                <div key={idx} className="rounded border border-border/60 px-3 py-2">{note}</div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader><CardTitle className="text-base">Trust & ratings</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div><p className="text-muted-foreground text-xs">Cooperative rating</p><p className="font-semibold">4.6 / 5.0</p></div>
              <Separator />
              <div><p className="text-muted-foreground text-xs">Delivery reliability</p><p className="font-semibold">92%</p></div>
              <Separator />
              <div><p className="text-muted-foreground text-xs">Quality consistency</p><p className="font-semibold">89%</p></div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={listingOpen} onOpenChange={setListingOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>Create listing</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Crop *</Label>
              <Input value={form.crop} onChange={(e) => setForm((p) => ({ ...p, crop: e.target.value }))} placeholder="Tomatoes" />
              {cropSuggestions.length > 0 && <p className="mt-1 text-xs text-muted-foreground">Suggestions: {cropSuggestions.join(", ")}</p>}
            </div>
            <div>
              <Label>Quantity (kg) *</Label>
              <Input value={form.quantityKg} onChange={(e) => setForm((p) => ({ ...p, quantityKg: e.target.value }))} placeholder="1200" />
            </div>
            <div>
              <Label>Quality grade</Label>
              <Select value={form.grade} onValueChange={(value) => setForm((p) => ({ ...p, grade: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                  <SelectItem value="C">C</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Harvest date *</Label>
              <Input type="date" value={form.harvestDate} onChange={(e) => setForm((p) => ({ ...p, harvestDate: e.target.value }))} />
            </div>
            <div>
              <Label>Minimum price (KES/kg) *</Label>
              <Input value={form.minPrice} onChange={(e) => setForm((p) => ({ ...p, minPrice: e.target.value }))} placeholder="85" />
            </div>
            <div>
              <Label>Photos (optional)</Label>
              <Input value={form.photos} onChange={(e) => setForm((p) => ({ ...p, photos: e.target.value }))} placeholder="photo URL(s)" />
            </div>
          </div>

          <Card className="border-border/60">
            <CardHeader><CardTitle className="text-base">AI suggestions</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p>Suggested price: <span className="font-semibold">KES {suggestionPrice}/kg</span></p>
              <p>Demand forecast: <span className="font-semibold">High in next 7 days</span></p>
              <p>Best selling window: <span className="font-semibold">Tue - Fri morning auctions</span></p>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setListingOpen(false)}>Cancel</Button>
            <Button onClick={createListing}>Publish listing</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Drawer open={Boolean(selectedTrade)} onOpenChange={(open) => !open && setSelectedTrade(null)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Trade details</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 text-sm space-y-2">
            <p><span className="text-muted-foreground">Crop:</span> {selectedTrade?.crop}</p>
            <p><span className="text-muted-foreground">Buyer:</span> {selectedTrade?.buyer}</p>
            <p><span className="text-muted-foreground">Quantity:</span> {selectedTrade?.quantityKg.toLocaleString()} kg</p>
            <p><span className="text-muted-foreground">Agreed price:</span> KES {selectedTrade?.agreedPrice.toLocaleString()}</p>
            <p><span className="text-muted-foreground">Delivery:</span> {selectedTrade?.deliveryDate}</p>
            <p><span className="text-muted-foreground">Status:</span> {selectedTrade?.status.replace("_", " ")}</p>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
