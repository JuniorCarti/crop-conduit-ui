import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useUserAccount } from "@/hooks/useUserAccount";
import { createOrgSponsorship, listOrgSponsorships, setSponsorshipStatus } from "@/services/phase3Service";
import { getOrgFeatureFlags } from "@/services/orgFeaturesService";
import { toast } from "sonner";
import { Phase3DisabledCard } from "@/components/org/Phase3DisabledCard";
import { Handshake, Users, TrendingUp, Award } from "lucide-react";

export default function OrgSponsorships() {
  const account = useUserAccount();
  const orgId = account.data?.orgId ?? "";
  const uid = account.data?.uid ?? "";
  const canAdmin = account.data?.role === "org_admin" || account.data?.role === "admin" || account.data?.role === "superadmin";
  const [enabled, setEnabled] = useState(false);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ partnerId: "", title: "", seatBudget: "0" });

  const activeContracts = useMemo(() => rows.filter((row) => row.status === "active"), [rows]);
  const proposedContracts = useMemo(() => rows.filter((row) => row.status === "proposed"), [rows]);
  const totalBudget = useMemo(() => rows.reduce((sum, row) => sum + Number(row.seatBudget || 0), 0), [rows]);
  const totalUsed = useMemo(() => rows.reduce((sum, row) => sum + Number(row.seatsUsed || 0), 0), [rows]);
  const totalRemaining = useMemo(() => totalBudget - totalUsed, [totalBudget, totalUsed]);

  const load = async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const flags = await getOrgFeatureFlags(orgId);
      setEnabled(flags.phase3Sponsorships === true);
      if (!flags.phase3Sponsorships) {
        setRows([]);
        return;
      }
      const data = await listOrgSponsorships(orgId);
      setRows(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, [orgId]);

  const canCreate = useMemo(
    () => canAdmin && form.partnerId.trim() && form.title.trim() && Number(form.seatBudget) > 0,
    [canAdmin, form]
  );

  const submit = async () => {
    if (!orgId || !canCreate) return;
    setSaving(true);
    try {
      const result = await createOrgSponsorship({
        orgId,
        partnerId: form.partnerId.trim(),
        title: form.title.trim(),
        seatBudget: Number(form.seatBudget),
        startAt: null,
        endAt: null,
        createdByUid: uid,
      });
      if ("skipped" in result && result.skipped) {
        toast.error("Feature is disabled.");
      } else {
        toast.success("Sponsorship created.");
        setForm({ partnerId: "", title: "", seatBudget: "0" });
        await load();
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to create sponsorship.");
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (id: string, status: "active" | "rejected") => {
    if (!orgId || !canAdmin) return;
    try {
      await setSponsorshipStatus({ orgId, sponsorshipId: id, status, actorUid: uid });
      toast.success(`Sponsorship ${status}.`);
      await load();
    } catch (error: any) {
      toast.error(error?.message || "Failed to update sponsorship.");
    }
  };

  if (loading) return <Card className="border-border/60"><CardContent className="p-6 text-sm text-muted-foreground">Loading sponsorships...</CardContent></Card>;
  if (!enabled) return <Phase3DisabledCard title="Sponsorships" />;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2.5">
                <Handshake className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{rows.length}</p>
                <p className="text-sm text-muted-foreground">Total Contracts</p>
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
                <p className="text-2xl font-bold">{activeContracts.length}</p>
                <p className="text-sm text-muted-foreground">Active Contracts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2.5">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalBudget}</p>
                <p className="text-sm text-muted-foreground">Total Seat Budget</p>
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
                <p className="text-2xl font-bold">{totalRemaining}</p>
                <p className="text-sm text-muted-foreground">Seats Remaining</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Sponsorship Utilization</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Seats Used</span>
              <span className="font-semibold">{totalUsed} / {totalBudget}</span>
            </div>
            <Progress value={totalBudget > 0 ? (totalUsed / totalBudget) * 100 : 0} className="h-2" />
          </div>
          <div className="grid gap-2 text-sm sm:grid-cols-3">
            <div className="rounded-lg border border-border/60 p-3">
              <p className="text-xs text-muted-foreground">Total Budget</p>
              <p className="text-lg font-bold">{totalBudget}</p>
            </div>
            <div className="rounded-lg border border-border/60 p-3">
              <p className="text-xs text-muted-foreground">Seats Used</p>
              <p className="text-lg font-bold">{totalUsed}</p>
            </div>
            <div className="rounded-lg border border-border/60 p-3">
              <p className="text-xs text-muted-foreground">Remaining</p>
              <p className="text-lg font-bold">{totalRemaining}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="contracts" className="w-full">
        <TabsList>
          <TabsTrigger value="contracts">All Contracts</TabsTrigger>
          <TabsTrigger value="create">Create New</TabsTrigger>
        </TabsList>

        <TabsContent value="contracts" className="space-y-4">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Sponsorship Contracts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {rows.length === 0 ? (
                <div className="py-8 text-center">
                  <Handshake className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">No sponsorship contracts yet.</p>
                  <p className="text-xs text-muted-foreground">Create your first contract to start receiving sponsored seats.</p>
                </div>
              ) : (
                rows.map((row) => {
                  const budget = Number(row.seatBudget ?? 0);
                  const used = Number(row.seatsUsed ?? 0);
                  const remaining = Math.max(0, budget - used);
                  const utilization = budget > 0 ? (used / budget) * 100 : 0;

                  return (
                    <div key={row.id} className="rounded-lg border border-border/60 p-4 transition-colors hover:border-primary/50">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{row.title || row.partnerId}</p>
                            <Badge variant={
                              row.status === "active" ? "default" :
                              row.status === "proposed" ? "secondary" :
                              "outline"
                            }>
                              {row.status ?? "proposed"}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">Partner: {row.partnerId}</p>
                          <div className="mt-3 space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Utilization</span>
                              <span className="font-semibold">{used} / {budget} ({Math.round(utilization)}%)</span>
                            </div>
                            <Progress value={utilization} className="h-1.5" />
                            <div className="flex flex-wrap gap-3 text-xs">
                              <div>
                                <span className="text-muted-foreground">Budget: </span>
                                <span className="font-semibold">{budget}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Used: </span>
                                <span className="font-semibold">{used}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Remaining: </span>
                                <span className="font-semibold">{remaining}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        {canAdmin && row.status === "proposed" && (
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => setStatus(row.id, "active")}>Accept</Button>
                            <Button size="sm" variant="outline" onClick={() => setStatus(row.id, "rejected")}>Reject</Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-sm">Active Contracts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{activeContracts.length}</p>
                <p className="text-xs text-muted-foreground">Currently active</p>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-sm">Pending Approval</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{proposedContracts.length}</p>
                <p className="text-xs text-muted-foreground">Awaiting review</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Create Sponsorship Contract</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Partner ID *</Label>
                  <Input 
                    value={form.partnerId} 
                    onChange={(e) => setForm((p) => ({ ...p, partnerId: e.target.value }))} 
                    placeholder="e.g., PARTNER-001"
                  />
                </div>
                <div>
                  <Label>Contract Title *</Label>
                  <Input 
                    value={form.title} 
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} 
                    placeholder="e.g., Q1 2024 Sponsorship"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Seat Budget *</Label>
                  <Input 
                    type="number"
                    value={form.seatBudget} 
                    onChange={(e) => setForm((p) => ({ ...p, seatBudget: e.target.value }))} 
                    placeholder="e.g., 100"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">Number of sponsored seats allocated by this partner</p>
                </div>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/50 p-3 text-xs text-muted-foreground">
                <p className="font-medium">Note:</p>
                <p className="mt-1">Sponsorship contracts allow partners to fund seats for cooperative members. New contracts start in "proposed" status and require admin approval.</p>
              </div>
              <Button onClick={submit} disabled={!canCreate || saving}>
                {saving ? "Creating..." : "Create Sponsorship Contract"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
