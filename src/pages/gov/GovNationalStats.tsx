import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getNationalStats } from "@/services/govAggregatesService";
import { GovEmptyState } from "@/pages/gov/GovEmptyState";

export default function GovNationalStats() {
  const query = useQuery({
    queryKey: ["govNationalStats"],
    queryFn: getNationalStats,
  });

  if (query.isLoading) {
    return <Card className="border-border/60"><CardContent className="p-6 text-sm text-muted-foreground">Loading national statistics...</CardContent></Card>;
  }

  if (!query.data) return <GovEmptyState />;

  const membership = query.data.membership ?? { active: 0, pending: 0, suspended: 0 };
  const seats = query.data.seats ?? { paidUsed: 0, paidTotal: 0, sponsoredUsed: 0, sponsoredTotal: 0 };
  const trainings = query.data.trainings ?? { total: 0, attendance: 0, completionRate: 0 };
  const marketplace = query.data.marketplace ?? { listings: 0, transactions: 0 };

  return (
    <Tabs defaultValue="membership" className="space-y-4">
      <TabsList className="flex flex-wrap h-auto">
        <TabsTrigger value="membership">Membership</TabsTrigger>
        <TabsTrigger value="seats">Seat Utilization</TabsTrigger>
        <TabsTrigger value="trainings">Trainings</TabsTrigger>
        <TabsTrigger value="marketplace">Marketplace impact</TabsTrigger>
      </TabsList>

      <TabsContent value="membership">
        <Card className="border-border/60"><CardHeader><CardTitle>Membership</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-3 text-sm"><p>Active: <span className="font-semibold">{membership.active}</span></p><p>Pending: <span className="font-semibold">{membership.pending}</span></p><p>Suspended: <span className="font-semibold">{membership.suspended}</span></p></CardContent></Card>
      </TabsContent>
      <TabsContent value="seats">
        <Card className="border-border/60"><CardHeader><CardTitle>Seat utilization</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2 text-sm"><p>Paid seats: <span className="font-semibold">{seats.paidUsed}/{seats.paidTotal}</span></p><p>Sponsored seats: <span className="font-semibold">{seats.sponsoredUsed}/{seats.sponsoredTotal}</span></p></CardContent></Card>
      </TabsContent>
      <TabsContent value="trainings">
        <Card className="border-border/60"><CardHeader><CardTitle>Trainings</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-3 text-sm"><p>Total trainings: <span className="font-semibold">{trainings.total}</span></p><p>Attendance: <span className="font-semibold">{trainings.attendance}</span></p><p>Completion rate: <span className="font-semibold">{trainings.completionRate}%</span></p></CardContent></Card>
      </TabsContent>
      <TabsContent value="marketplace">
        <Card className="border-border/60"><CardHeader><CardTitle>Marketplace impact</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2 text-sm"><p>Listings by verified farmers: <span className="font-semibold">{marketplace.listings}</span></p><p>Transactions count: <span className="font-semibold">{marketplace.transactions}</span></p></CardContent></Card>
      </TabsContent>
    </Tabs>
  );
}

