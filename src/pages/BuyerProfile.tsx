import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, ShieldCheck, Star } from "lucide-react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { BuyerProfileEmptyState } from "@/components/buyer-profile/EmptyState";
import { BuyerProfileSkeleton } from "@/components/buyer-profile/SkeletonState";
import { StatCard } from "@/components/buyer-profile/StatCard";
import { BuyerProfileTabNav } from "@/components/buyer-profile/TabNav";
import { getBuyerProfileView } from "@/services/buyerProfileService";
import type { BuyerOrderSummary, BuyerProfileTabKey, BuyerProfileViewModel, BuyerSupplierSummary } from "@/types/buyerProfile";

export default function BuyerProfile() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<BuyerProfileTabKey>("overview");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<BuyerProfileViewModel | null>(null);
  const [supplierFilter, setSupplierFilter] = useState("");
  const [orderModal, setOrderModal] = useState<BuyerOrderSummary | null>(null);
  const [showAlertRuleModal, setShowAlertRuleModal] = useState(false);

  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getBuyerProfileView(currentUser.uid)
      .then((data) => setProfile(data))
      .catch(() => toast.error("Failed to load buyer profile."))
      .finally(() => setLoading(false));
  }, [currentUser?.uid]);

  const filteredSuppliers = useMemo(() => {
    if (!profile) return [];
    if (!supplierFilter.trim()) return profile.suppliers;
    const query = supplierFilter.toLowerCase();
    return profile.suppliers.filter((supplier) =>
      [supplier.supplierName, supplier.cooperativeName, supplier.location, ...(supplier.crops || [])]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [profile, supplierFilter]);

  const favoriteSuppliers = useMemo(
    () => filteredSuppliers.filter((supplier) => supplier.favorite),
    [filteredSuppliers]
  );

  if (!currentUser && !loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <BuyerProfileEmptyState
          title="Please sign in"
          description="Sign in to access your buyer profile."
          ctaLabel="Go to Login"
          onCta={() => navigate("/login")}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6">
        {loading ? (
          <BuyerProfileSkeleton />
        ) : profile ? (
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as BuyerProfileTabKey)} className="space-y-5">
            <header className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-bold">{profile.companyName || profile.displayName}</h1>
                    <Badge variant="verified" className="inline-flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {profile.verificationStatus === "verified" ? "Verified Buyer" : "Verification Pending"}
                    </Badge>
                    <Badge variant="outline">{profile.buyerMode}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Manage company information, sourcing preferences, suppliers, contracts, and alerts.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => navigate("/buyer-registration")}>Edit Profile</Button>
                  <Button variant="outline" onClick={() => setActiveTab("preferences")}>Preferences</Button>
                  <Button variant="outline" onClick={() => setActiveTab("company")}>Compliance Docs</Button>
                  <Button variant="outline" onClick={() => toast.info("Support portal coming soon.")}>Support</Button>
                </div>
              </div>
            </header>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
              <StatCard label="Total Purchases (KES)" value={profile.metrics.totalPurchasesKes.toLocaleString()} />
              <StatCard label="Total Volume Bought (kg)" value={profile.metrics.totalVolumeKg.toLocaleString()} />
              <StatCard label="Active Orders" value={String(profile.metrics.activeOrders)} />
              <StatCard label="Active Contracts" value={String(profile.metrics.activeContracts)} />
              <StatCard label="On-time Payment Rate" value={`${profile.metrics.onTimePaymentRate ?? 0}%`} />
              <StatCard label="Reliability Score" value={`${profile.metrics.reliabilityScore ?? 0}%`} />
            </div>

            <BuyerProfileTabNav />

            <TabsContent value="overview" className="space-y-4">
              <Card className="border-border/60">
                <CardHeader><CardTitle>Your Sourcing Focus</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-muted-foreground">Crops:</span>
                    {profile.sourcingFocus.crops.length ? profile.sourcingFocus.crops.map((crop) => <Badge key={crop} variant="secondary">{crop}</Badge>) : <Badge variant="outline">None set</Badge>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-muted-foreground">{profile.buyerMode === "INTERNATIONAL" ? "Destinations:" : "Preferred markets:"}</span>
                    {(profile.buyerMode === "INTERNATIONAL" ? profile.sourcingFocus.preferredRegions : profile.sourcingFocus.preferredMarkets).length
                      ? (profile.buyerMode === "INTERNATIONAL" ? profile.sourcingFocus.preferredRegions : profile.sourcingFocus.preferredMarkets).map((item) => <Badge key={item} variant="outline">{item}</Badge>)
                      : <Badge variant="outline">None set</Badge>}
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="border-border/60">
                  <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
                  <CardContent>
                    {profile.recentActivity.length ? (
                      <div className="space-y-3">
                        {profile.recentActivity.map((activity) => (
                          <div key={activity.id} className="rounded-lg border border-border/60 p-3">
                            <p className="font-medium">{activity.title}</p>
                            <p className="text-sm text-muted-foreground">{activity.detail}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <BuyerProfileEmptyState title="No recent activity" description="Orders, contract updates, and messages will appear here." />
                    )}
                  </CardContent>
                </Card>

                <Card className="border-border/60">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Smart Alerts</CardTitle>
                    <Button size="sm" variant="outline" onClick={() => setActiveTab("alerts")}>Manage alerts</Button>
                  </CardHeader>
                  <CardContent>
                    {profile.smartAlerts.length ? (
                      <div className="space-y-3">
                        {profile.smartAlerts.map((alert) => (
                          <div key={alert.id} className="rounded-lg border border-border/60 p-3">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium">{alert.title}</p>
                              <Badge variant={alert.severity === "high" ? "destructive" : "secondary"}>{alert.severity}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{alert.detail}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <BuyerProfileEmptyState title="No alerts configured" description="Create an alert rule for price spikes or delivery delays." ctaLabel="Add rule" onCta={() => setShowAlertRuleModal(true)} />
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="company" className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="border-border/60">
                  <CardHeader><CardTitle>Company Details</CardTitle></CardHeader>
                  <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
                    <Field label="Company Name" value={profile.company.companyName} />
                    <Field label="Buyer Type" value={profile.buyerMode} />
                    <Field label="Country" value={profile.company.country} />
                    <Field label="City/Region" value={profile.company.cityOrRegion} />
                    <Field label="Phone" value={profile.company.phone} />
                    <Field label="WhatsApp" value={profile.company.whatsapp} />
                    <Field label="Email" value={profile.company.email} />
                    <Field label="Website" value={profile.company.website} />
                    {profile.buyerMode === "INTERNATIONAL" ? <Field label="Destinations" value={(profile.company.destinations || []).join(", ")} className="sm:col-span-2" /> : null}
                  </CardContent>
                </Card>
                <Card className="border-border/60">
                  <CardHeader><CardTitle>Verification Status</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <Badge variant="verified">{profile.verificationStatus === "verified" ? "Verified" : "Pending verification"}</Badge>
                    <p className="text-sm text-muted-foreground">Upload compliance documents to improve trust signals with suppliers.</p>
                    <Button variant="outline" onClick={() => toast.info("Verification request submitted.")}>Request verification</Button>
                  </CardContent>
                </Card>
              </div>
              <Card className="border-border/60">
                <CardHeader><CardTitle>Documents</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">Optional - you can upload later.</p>
                  {["Certificate of incorporation", "Import license", "Bank reference letter", "Company profile/brochure", "Business premises video"].map((label) => (
                    <div key={label}>
                      <Label className="mb-2 block">{label}</Label>
                      <Input type="file" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preferences" className="space-y-4">
              <Card className="border-border/60">
                <CardHeader><CardTitle>Preferences</CardTitle></CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <Field label="Crops sourced" value={profile.preferences.crops.join(", ")} />
                  <Field label="Monthly purchase volume" value={profile.preferences.monthlyVolume} />
                  <Field label="Preferred markets" value={profile.preferences.preferredMarkets.join(", ")} />
                  <Field label="Delivery regions" value={profile.preferences.deliveryRegions.join(", ")} />
                  <Field label="Quality preferences" value={profile.preferences.qualityPreferences.join(", ")} />
                  <Field label="Payment preferences" value={profile.preferences.paymentPreferences.join(", ")} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="suppliers" className="space-y-4">
              <Card className="border-border/60">
                <CardHeader><CardTitle>Supplier Management</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <Input placeholder="Search by supplier, crop, cooperative, location" value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)} />
                  {filteredSuppliers.length ? (
                    <div className="grid gap-3">
                      {filteredSuppliers.map((supplier) => (
                        <SupplierCard key={supplier.id} supplier={supplier} />
                      ))}
                    </div>
                  ) : (
                    <BuyerProfileEmptyState title="No suppliers yet" description="Browse Marketplace or join a cooperative deal." ctaLabel="Open Marketplace" onCta={() => navigate("/marketplace")} />
                  )}
                </CardContent>
              </Card>
              <Card className="border-border/60">
                <CardHeader><CardTitle>Favorites</CardTitle></CardHeader>
                <CardContent>
                  {favoriteSuppliers.length ? favoriteSuppliers.map((supplier) => <SupplierCard key={supplier.id} supplier={supplier} compact />) : <BuyerProfileEmptyState title="No favorites yet" description="Favorite suppliers to track them quickly." />}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="orders" className="space-y-4">
              <Card className="border-border/60">
                <CardHeader><CardTitle>Orders & Logistics</CardTitle></CardHeader>
                <CardContent>
                  {profile.orders.length ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order ID</TableHead>
                          <TableHead>Crop</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Supplier</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>ETA</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {profile.orders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell>{order.id}</TableCell>
                            <TableCell>{order.crop}</TableCell>
                            <TableCell>{order.quantity}</TableCell>
                            <TableCell>KES {order.priceKes.toLocaleString()}</TableCell>
                            <TableCell>{order.supplier}</TableCell>
                            <TableCell><Badge variant="secondary">{order.status}</Badge></TableCell>
                            <TableCell>{order.eta || "--"}</TableCell>
                            <TableCell>{order.createdAt}</TableCell>
                            <TableCell><Button size="sm" variant="outline" onClick={() => setOrderModal(order)}>Details</Button></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <BuyerProfileEmptyState title="No orders yet" description="Your order history will appear here." ctaLabel="Browse Marketplace" onCta={() => navigate("/marketplace")} />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contracts" className="space-y-4">
              <Card className="border-border/60">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Contracts</CardTitle>
                  <Button variant="outline" onClick={() => toast.info("Contract request flow coming soon.")}>Create contract request</Button>
                </CardHeader>
                <CardContent>
                  {profile.contracts.length ? (
                    <div className="space-y-3">
                      {profile.contracts.map((contract) => (
                        <div key={contract.id} className="rounded-xl border border-border/60 p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-medium">{contract.name}</p>
                            <Badge variant="outline">{contract.status}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{contract.supplier} • {contract.crop} • {contract.volume}</p>
                          <p className="text-sm text-muted-foreground">{contract.startDate} - {contract.endDate} • {contract.priceType}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <BuyerProfileEmptyState title="No active contracts" description="Contract milestones and renewals will be tracked here." />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="alerts" className="space-y-4">
              <Card className="border-border/60">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Alerts</CardTitle>
                  <Button variant="outline" onClick={() => setShowAlertRuleModal(true)}>Add alert rule</Button>
                </CardHeader>
                <CardContent>
                  {profile.smartAlerts.length ? (
                    <div className="space-y-3">
                      {profile.smartAlerts.map((alert) => (
                        <div key={alert.id} className="rounded-lg border border-border/60 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium">{alert.title}</p>
                            <Badge variant={alert.severity === "high" ? "destructive" : "secondary"}>{alert.severity}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{alert.detail}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <BuyerProfileEmptyState title="No alerts yet" description="Create price and delivery alerts to stay ahead." />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="messages" className="space-y-4">
              <Card className="border-border/60">
                <CardHeader><CardTitle>Messages Shortcut</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {profile.messages.length ? (
                    profile.messages.map((message) => (
                      <div key={message.id} className="rounded-lg border border-border/60 p-3">
                        <p className="font-medium">{message.participant}</p>
                        <p className="text-sm text-muted-foreground">{message.lastMessage}</p>
                      </div>
                    ))
                  ) : (
                    <BuyerProfileEmptyState title="No conversations yet" description="Start a conversation with suppliers from Community or Marketplace." />
                  )}
                  <Button onClick={() => navigate("/community/inbox")}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Go to Inbox
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <BuyerProfileEmptyState title="Unable to load profile" description="Try refreshing. If this persists, contact support." />
        )}
      </div>

      <Dialog open={!!orderModal} onOpenChange={(open) => !open && setOrderModal(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Order details</DialogTitle></DialogHeader>
          {orderModal ? (
            <div className="space-y-3 text-sm">
              <p><span className="text-muted-foreground">Order:</span> {orderModal.id}</p>
              <p><span className="text-muted-foreground">Supplier:</span> {orderModal.supplier}</p>
              <p><span className="text-muted-foreground">Status:</span> {orderModal.status}</p>
              <p><span className="text-muted-foreground">ETA:</span> {orderModal.eta || "Not available"}</p>
              <div className="rounded-lg border border-border/60 p-3">
                <p className="font-medium">Delivery timeline</p>
                <p className="text-muted-foreground">Order created → Dispatch → In transit → Delivered</p>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={showAlertRuleModal} onOpenChange={setShowAlertRuleModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add alert rule</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="mb-2 block">Crop</Label>
              <Input placeholder="e.g. Tomatoes" />
            </div>
            <div>
              <Label className="mb-2 block">Market / Country</Label>
              <Input placeholder="e.g. Wakulima or UAE" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="mb-2 block">Trigger direction</Label>
                <Select defaultValue="up">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="up">Price up %</SelectItem>
                    <SelectItem value="down">Price down %</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block">Time window</Label>
                <Select defaultValue="7d">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">24 hours</SelectItem>
                    <SelectItem value="7d">7 days</SelectItem>
                    <SelectItem value="30d">30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              onClick={() => {
                toast.success("Alert rule saved.");
                setShowAlertRuleModal(false);
              }}
            >
              Save rule
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SupplierCard({ supplier, compact = false }: { supplier: BuyerSupplierSummary; compact?: boolean }) {
  return (
    <div className="rounded-xl border border-border/60 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium">{supplier.supplierName}</p>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Star className="h-3.5 w-3.5" />
          {supplier.rating ?? 0}
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{supplier.cooperativeName || "Independent supplier"} • {supplier.location}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {(supplier.crops || []).map((crop) => (
          <Badge key={crop} variant="secondary">{crop}</Badge>
        ))}
      </div>
      {!compact ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="outline"><MessageSquare className="mr-1 h-3.5 w-3.5" />Message</Button>
          <Button size="sm" variant="outline">View supplier</Button>
          <Button size="sm" variant="ghost">Favorite</Button>
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, value, className }: { label: string; value?: string | null; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value || "N/A"}</p>
    </div>
  );
}
