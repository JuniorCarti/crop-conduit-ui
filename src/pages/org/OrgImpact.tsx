import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserAccount } from "@/hooks/useUserAccount";
import { getOrgFeatureFlags } from "@/services/orgFeaturesService";
import { listImpactMonths, upsertImpactMonth } from "@/services/phase3Service";
import { Phase3DisabledCard } from "@/components/org/Phase3DisabledCard";
import { toast } from "sonner";
import { Users, TrendingUp, DollarSign, Award, BarChart3 } from "lucide-react";

export default function OrgImpact() {
  const account = useUserAccount();
  const orgId = account.data?.orgId ?? "";
  const canManage = account.data?.role === "org_admin" || account.data?.role === "org_staff" || account.data?.role === "admin";
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [activeMembers, setActiveMembers] = useState("");
  const [sponsoredMembers, setSponsoredMembers] = useState("");
  const [groupSalesValueKES, setGroupSalesValueKES] = useState("");
  const [saving, setSaving] = useState(false);

  const totalActiveMembers = useMemo(() => {
    if (rows.length === 0) return 0;
    return Number(rows[0]?.activeMembers || 0);
  }, [rows]);

  const totalSponsoredMembers = useMemo(() => {
    if (rows.length === 0) return 0;
    return Number(rows[0]?.sponsoredMembers || 0);
  }, [rows]);

  const totalSalesValue = useMemo(() => {
    return rows.reduce((sum, row) => sum + Number(row.groupSalesValueKES || 0), 0);
  }, [rows]);

  const avgSalesPerMonth = useMemo(() => {
    if (rows.length === 0) return 0;
    return Math.round(totalSalesValue / rows.length);
  }, [totalSalesValue, rows.length]);

  const load = async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const flags = await getOrgFeatureFlags(orgId);
      setEnabled(flags.phase3Impact === true);
      if (!flags.phase3Impact) {
        setRows([]);
        return;
      }
      const data = await listImpactMonths(orgId);
      data.sort((a, b) => (b.month || "").localeCompare(a.month || ""));
      setRows(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, [orgId]);

  const save = async () => {
    if (!orgId || !canManage) return;
    if (!month) {
      toast.error("Month is required.");
      return;
    }
    setSaving(true);
    try {
      await upsertImpactMonth(orgId, month, {
        activeMembers: Number(activeMembers || 0),
        sponsoredMembers: Number(sponsoredMembers || 0),
        groupSalesValueKES: Number(groupSalesValueKES || 0),
        trainingsHeld: 0,
        attendanceCount: 0,
        groupSalesVolumeKg: 0,
        avgFarmGatePriceDeltaKES: 0,
        estimatedPostHarvestLossReductionPct: 0,
        updatedByUid: account.data?.uid ?? null,
      });
      toast.success("Impact month saved.");
      setActiveMembers("");
      setSponsoredMembers("");
      setGroupSalesValueKES("");
      await load();
    } catch (error: any) {
      toast.error(error?.message || "Failed to save impact month.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Card className="border-border/60"><CardContent className="p-6 text-sm text-muted-foreground">Loading impact...</CardContent></Card>;
  if (!enabled) return <Phase3DisabledCard title="Impact" />;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2.5">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalActiveMembers}</p>
                <p className="text-sm text-muted-foreground">Active Members</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2.5">
                <Award className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalSponsoredMembers}</p>
                <p className="text-sm text-muted-foreground">Sponsored Members</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2.5">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalSalesValue.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Sales (KES)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-orange-100 p-2.5">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{avgSalesPerMonth.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Avg Sales/Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Impact Overview</TabsTrigger>
          <TabsTrigger value="entry">Record Impact</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Monthly Impact Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {rows.length === 0 ? (
                <div className="py-8 text-center">
                  <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">No impact data recorded yet.</p>
                  <p className="text-xs text-muted-foreground">Start recording monthly impact metrics to track progress.</p>
                </div>
              ) : (
                rows.map((row) => (
                  <div key={row.id} className="rounded-lg border border-border/60 p-4 transition-colors hover:border-primary/50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{row.month}</p>
                          <Badge variant="secondary">
                            {new Date(row.month + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                          </Badge>
                        </div>
                        <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Active Members</p>
                            <p className="font-semibold">{Number(row.activeMembers ?? 0).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Sponsored Members</p>
                            <p className="font-semibold">{Number(row.sponsoredMembers ?? 0).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Sales Value</p>
                            <p className="font-semibold">KES {Number(row.groupSalesValueKES ?? 0).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Sales Volume</p>
                            <p className="font-semibold">{Number(row.groupSalesVolumeKg ?? 0).toLocaleString()} kg</p>
                          </div>
                        </div>
                        {(row.trainingsHeld || row.attendanceCount) && (
                          <div className="mt-3 flex flex-wrap gap-4 text-xs">
                            {row.trainingsHeld > 0 && (
                              <div>
                                <span className="text-muted-foreground">Trainings: </span>
                                <span className="font-semibold">{row.trainingsHeld}</span>
                              </div>
                            )}
                            {row.attendanceCount > 0 && (
                              <div>
                                <span className="text-muted-foreground">Attendance: </span>
                                <span className="font-semibold">{row.attendanceCount}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-sm">Total Months Tracked</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{rows.length}</p>
                <p className="text-xs text-muted-foreground">Impact records</p>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-sm">Latest Month</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{rows.length > 0 ? rows[0].month : "--"}</p>
                <p className="text-xs text-muted-foreground">Most recent data</p>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-sm">Growth Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {rows.length >= 2 
                    ? `${Math.round(((Number(rows[0]?.activeMembers || 0) - Number(rows[1]?.activeMembers || 0)) / Number(rows[1]?.activeMembers || 1)) * 100)}%`
                    : "--"}
                </p>
                <p className="text-xs text-muted-foreground">Member growth</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="entry" className="space-y-4">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Record Monthly Impact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label>Month (YYYY-MM) *</Label>
                  <Input 
                    type="month"
                    value={month} 
                    onChange={(e) => setMonth(e.target.value)} 
                    placeholder="2024-01"
                  />
                </div>
                <div>
                  <Label>Active Members</Label>
                  <Input 
                    type="number"
                    value={activeMembers} 
                    onChange={(e) => setActiveMembers(e.target.value)} 
                    placeholder="e.g., 150"
                  />
                </div>
                <div>
                  <Label>Sponsored Members</Label>
                  <Input 
                    type="number"
                    value={sponsoredMembers} 
                    onChange={(e) => setSponsoredMembers(e.target.value)} 
                    placeholder="e.g., 50"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Group Sales Value (KES)</Label>
                  <Input 
                    type="number"
                    value={groupSalesValueKES} 
                    onChange={(e) => setGroupSalesValueKES(e.target.value)} 
                    placeholder="e.g., 500000"
                  />
                </div>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/50 p-3 text-xs text-muted-foreground">
                <p className="font-medium">Note:</p>
                <p className="mt-1">Record impact metrics at the end of each month to track cooperative performance and growth over time.</p>
              </div>
              <Button onClick={save} disabled={!canManage || saving}>
                {saving ? "Saving..." : "Save Impact Data"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
