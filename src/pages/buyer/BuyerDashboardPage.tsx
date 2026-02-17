import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BuyerPageHeader } from "@/components/buyer/BuyerPageHeader";
import { BuyerKpiGrid } from "@/components/buyer/BuyerKpiGrid";
import { BuyerActivityTabs } from "@/components/buyer/BuyerActivityTabs";
import { BuyerAlertsPanel } from "@/components/buyer/BuyerAlertsPanel";
import { BuyerTableEmptyState } from "@/components/buyer/BuyerTableEmptyState";
import { BuyerSkeletonBlocks } from "@/components/buyer/BuyerSkeletonBlocks";
import { getBuyerDashboardView } from "@/services/buyerDashboardService";
import { useAuth } from "@/contexts/AuthContext";
import type { BuyerDashboardViewModel } from "@/types/buyerDashboard";
import { toast } from "sonner";

export default function BuyerDashboardPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<BuyerDashboardViewModel | null>(null);

  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    getBuyerDashboardView(currentUser.uid)
      .then(setView)
      .catch((error) => {
        console.error("Failed to load buyer dashboard", error);
        toast.error("Unable to load dashboard right now.");
      })
      .finally(() => setLoading(false));
  }, [currentUser?.uid]);

  const topSuppliers = useMemo(() => (view?.suppliers || []).slice(0, 4), [view?.suppliers]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6">
        <BuyerSkeletonBlocks />
      </div>
    );
  }

  if (!view) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 md:px-6">
        <BuyerTableEmptyState
          title="Buyer dashboard unavailable"
          description="Please sign in again to load your dashboard."
          ctaLabel="Go to login"
          onClick={() => navigate("/login")}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6">
      <BuyerPageHeader
        buyerName={view.buyerName}
        companyName={view.companyName}
        buyerType={view.buyerType}
        verificationStatus={view.verificationStatus}
        verifiedAt={view.verifiedAt}
        verifiedBy={view.verifiedBy}
        onBrowseMarketplace={() => navigate("/marketplace")}
        onCreateBid={() => navigate("/buyer/trade")}
        onMessageCoop={() => navigate("/community/inbox")}
        onViewOrders={() => navigate("/buyer/profile?tab=orders")}
      />

      <BuyerKpiGrid cards={view.kpis} />

      <div className="grid gap-4 lg:grid-cols-2">
        <BuyerActivityTabs data={view.activity} onOpenRoute={(route) => route && navigate(route)} />
        <BuyerAlertsPanel
          alerts={view.alerts}
          onManageAlerts={() => navigate("/buyer/profile?tab=alerts")}
          onOpenAlertRoute={(route) => route && navigate(route)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recommended Lots / Matches</CardTitle>
            <Button size="sm" variant="outline" onClick={() => navigate("/marketplace")}>Browse</Button>
          </CardHeader>
          <CardContent>
            {view.recommendedLots.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {view.recommendedLots.slice(0, 6).map((lot) => (
                  <div key={lot.id} className="rounded-xl border border-border/60 p-3">
                    <p className="font-medium">{lot.title}</p>
                    <p className="text-sm text-muted-foreground">{lot.crop} • {lot.location}</p>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="font-semibold text-primary">KES {lot.priceKes.toLocaleString()}/kg</span>
                      <Badge variant="outline">{lot.quantityLabel}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <BuyerTableEmptyState
                title="No recommendation yet"
                description="Recommendations will appear after your first activity."
                ctaLabel="Open Marketplace"
                onClick={() => navigate("/marketplace")}
              />
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Supplier Snapshot</CardTitle>
            <Button size="sm" variant="outline" onClick={() => navigate("/buyer/profile?tab=suppliers")}>View all</Button>
          </CardHeader>
          <CardContent>
            {topSuppliers.length ? (
              <div className="space-y-3">
                {topSuppliers.map((supplier) => (
                  <div key={supplier.id} className="rounded-xl border border-border/60 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-medium">{supplier.supplierName}</p>
                        <p className="text-sm text-muted-foreground">
                          {[supplier.cooperativeName, supplier.location].filter(Boolean).join(" • ")}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {supplier.reliabilityScore != null ? `${supplier.reliabilityScore}%` : "--"}
                      </Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {supplier.crops.length ? supplier.crops.slice(0, 4).map((crop) => <Badge key={`${supplier.id}-${crop}`} variant="secondary">{crop}</Badge>) : <Badge variant="outline">No crops set</Badge>}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => navigate(`/community/members/${supplier.id}`)}>View supplier</Button>
                      <Button size="sm" variant="outline" onClick={() => navigate("/community/inbox")}>Message</Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <BuyerTableEmptyState
                title="No suppliers yet"
                description="Suppliers you interact with will appear here."
                ctaLabel="Browse Marketplace"
                onClick={() => navigate("/marketplace")}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
