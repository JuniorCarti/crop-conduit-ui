import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserAccount } from "@/hooks/useUserAccount";
import { createSalesBatch, listSalesBatches } from "@/services/phase3Service";
import { getOrgFeatureFlags } from "@/services/orgFeaturesService";
import { toast } from "sonner";
import { Phase3DisabledCard } from "@/components/org/Phase3DisabledCard";
import { Package, TrendingUp, DollarSign, Boxes } from "lucide-react";

export default function OrgSalesBatches() {
  const account = useUserAccount();
  const orgId = account.data?.orgId ?? "";
  const uid = account.data?.uid ?? "";
  const canManage = account.data?.role === "org_admin" || account.data?.role === "org_staff" || account.data?.role === "admin";
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState({ batchName: "", commodity: "", grade: "", targetMarket: "", targetPricePerKg: "" });

  const draftBatches = useMemo(() => rows.filter((row) => row.status === "draft"), [rows]);
  const activeBatches = useMemo(() => rows.filter((row) => row.status === "active" || row.status === "in_progress"), [rows]);
  const completedBatches = useMemo(() => rows.filter((row) => row.status === "completed" || row.status === "sold"), [rows]);
  const totalVolume = useMemo(() => rows.reduce((sum, row) => sum + Number(row.totalKg || 0), 0), [rows]);
  const totalValue = useMemo(() => rows.reduce((sum, row) => sum + Number(row.totalValueKES || 0), 0), [rows]);

  const load = async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const flags = await getOrgFeatureFlags(orgId);
      setEnabled(flags.phase3SellOnBehalf === true);
      if (!flags.phase3SellOnBehalf) {
        setRows([]);
        return;
      }
      setRows(await listSalesBatches(orgId));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, [orgId]);

  const createBatch = async () => {
    if (!orgId || !canManage) return;
    if (!form.batchName.trim()) {
      toast.error("Batch name is required.");
      return;
    }
    setSaving(true);
    try {
      await createSalesBatch({
        orgId,
        createdByUid: uid,
        batchName: form.batchName.trim(),
        commodity: form.commodity.trim(),
        grade: form.grade.trim(),
        targetMarket: form.targetMarket.trim(),
        targetPricePerKg: Number(form.targetPricePerKg || 0),
      });
      toast.success("Sales batch created.");
      setForm({ batchName: "", commodity: "", grade: "", targetMarket: "", targetPricePerKg: "" });
      await load();
    } catch (error: any) {
      toast.error(error?.message || "Failed to create sales batch.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Card className="border-border/60"><CardContent className="p-6 text-sm text-muted-foreground">Loading sales batches...</CardContent></Card>;
  if (!enabled) return <Phase3DisabledCard title="Sales Batches" />;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2.5">
                <Boxes className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{rows.length}</p>
                <p className="text-sm text-muted-foreground">Total Batches</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2.5">
                <Package className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeBatches.length}</p>
                <p className="text-sm text-muted-foreground">Active Batches</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2.5">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalVolume.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Volume (kg)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-orange-100 p-2.5">
                <DollarSign className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalValue.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Value (KES)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="batches" className="w-full">
        <TabsList>
          <TabsTrigger value="batches">All Batches</TabsTrigger>
          <TabsTrigger value="create">Create New</TabsTrigger>
        </TabsList>

        <TabsContent value="batches" className="space-y-4">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Sales Batches</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {rows.length === 0 ? (
                <div className="py-8 text-center">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">No sales batches yet.</p>
                  <p className="text-xs text-muted-foreground">Create your first batch to start aggregating produce for sale.</p>
                </div>
              ) : (
                rows.map((row) => (
                  <div key={row.id} className="rounded-lg border border-border/60 p-4 transition-colors hover:border-primary/50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{row.batchName || "Batch"}</p>
                          <Badge variant={
                            row.status === "completed" || row.status === "sold" ? "default" :
                            row.status === "active" || row.status === "in_progress" ? "secondary" :
                            "outline"
                          }>
                            {row.status || "draft"}
                          </Badge>
                        </div>
                        <div className="mt-2 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                          <div>
                            <p className="text-xs">Commodity</p>
                            <p className="font-medium text-foreground">{row.commodity || "--"}</p>
                          </div>
                          <div>
                            <p className="text-xs">Grade</p>
                            <p className="font-medium text-foreground">{row.grade || "--"}</p>
                          </div>
                          <div>
                            <p className="text-xs">Target Market</p>
                            <p className="font-medium text-foreground">{row.targetMarket || "--"}</p>
                          </div>
                          <div>
                            <p className="text-xs">Target Price/kg</p>
                            <p className="font-medium text-foreground">KES {Number(row.targetPricePerKg || 0).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-4 text-xs">
                          <div>
                            <span className="text-muted-foreground">Volume: </span>
                            <span className="font-semibold">{Number(row.totalKg ?? 0).toLocaleString()} kg</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Value: </span>
                            <span className="font-semibold">KES {Number(row.totalValueKES ?? 0).toLocaleString()}</span>
                          </div>
                          {row.memberCount && (
                            <div>
                              <span className="text-muted-foreground">Members: </span>
                              <span className="font-semibold">{row.memberCount}</span>
                            </div>
                          )}
                        </div>
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
                <CardTitle className="text-sm">Draft Batches</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{draftBatches.length}</p>
                <p className="text-xs text-muted-foreground">Pending activation</p>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-sm">Active Batches</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{activeBatches.length}</p>
                <p className="text-xs text-muted-foreground">In progress</p>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-sm">Completed Batches</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{completedBatches.length}</p>
                <p className="text-xs text-muted-foreground">Sold or completed</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Create Sales Batch</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label>Batch Name *</Label>
                  <Input 
                    value={form.batchName} 
                    onChange={(e) => setForm((p) => ({ ...p, batchName: e.target.value }))} 
                    placeholder="e.g., Maize Harvest Q1 2024"
                  />
                </div>
                <div>
                  <Label>Commodity</Label>
                  <Input 
                    value={form.commodity} 
                    onChange={(e) => setForm((p) => ({ ...p, commodity: e.target.value }))} 
                    placeholder="e.g., Maize"
                  />
                </div>
                <div>
                  <Label>Grade</Label>
                  <Input 
                    value={form.grade} 
                    onChange={(e) => setForm((p) => ({ ...p, grade: e.target.value }))} 
                    placeholder="e.g., Grade A"
                  />
                </div>
                <div>
                  <Label>Target Market</Label>
                  <Input 
                    value={form.targetMarket} 
                    onChange={(e) => setForm((p) => ({ ...p, targetMarket: e.target.value }))} 
                    placeholder="e.g., Nairobi Wholesale"
                  />
                </div>
                <div>
                  <Label>Target Price per kg (KES)</Label>
                  <Input 
                    type="number"
                    value={form.targetPricePerKg} 
                    onChange={(e) => setForm((p) => ({ ...p, targetPricePerKg: e.target.value }))} 
                    placeholder="e.g., 45"
                  />
                </div>
              </div>
              <Button onClick={createBatch} disabled={!canManage || saving}>
                {saving ? "Creating..." : "Create Sales Batch"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
