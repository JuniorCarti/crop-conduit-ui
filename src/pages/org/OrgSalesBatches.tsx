import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUserAccount } from "@/hooks/useUserAccount";
import { createSalesBatch, listSalesBatches } from "@/services/phase3Service";
import { getOrgFeatureFlags } from "@/services/orgFeaturesService";
import { toast } from "sonner";
import { Phase3DisabledCard } from "@/components/org/Phase3DisabledCard";

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
    <div className="space-y-4">
      <Card className="border-border/60">
        <CardHeader><CardTitle className="text-base">Create sales batch</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-5">
          <div><Label>Batch name</Label><Input value={form.batchName} onChange={(e) => setForm((p) => ({ ...p, batchName: e.target.value }))} /></div>
          <div><Label>Commodity</Label><Input value={form.commodity} onChange={(e) => setForm((p) => ({ ...p, commodity: e.target.value }))} /></div>
          <div><Label>Grade</Label><Input value={form.grade} onChange={(e) => setForm((p) => ({ ...p, grade: e.target.value }))} /></div>
          <div><Label>Target market</Label><Input value={form.targetMarket} onChange={(e) => setForm((p) => ({ ...p, targetMarket: e.target.value }))} /></div>
          <div><Label>Target price/kg</Label><Input value={form.targetPricePerKg} onChange={(e) => setForm((p) => ({ ...p, targetPricePerKg: e.target.value }))} /></div>
        </CardContent>
        <CardContent>
          <Button onClick={createBatch} disabled={!canManage || saving}>{saving ? "Saving..." : "Create batch"}</Button>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader><CardTitle className="text-base">Batches</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sales batches yet.</p>
          ) : (
            rows.map((row) => (
              <div key={row.id} className="rounded border border-border/60 p-3">
                <p className="font-medium">{row.batchName || "Batch"}</p>
                <p className="text-xs text-muted-foreground">
                  {row.commodity || "--"} • {row.status || "draft"} • {Number(row.totalKg ?? 0).toLocaleString()} kg • KES {Number(row.totalValueKES ?? 0).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

