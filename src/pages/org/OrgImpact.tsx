import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUserAccount } from "@/hooks/useUserAccount";
import { getOrgFeatureFlags } from "@/services/orgFeaturesService";
import { listImpactMonths, upsertImpactMonth } from "@/services/phase3Service";
import { Phase3DisabledCard } from "@/components/org/Phase3DisabledCard";
import { toast } from "sonner";

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
      setRows(await listImpactMonths(orgId));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, [orgId]);

  const save = async () => {
    if (!orgId || !canManage) return;
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
      await load();
    } catch (error: any) {
      toast.error(error?.message || "Failed to save impact month.");
    }
  };

  if (loading) return <Card className="border-border/60"><CardContent className="p-6 text-sm text-muted-foreground">Loading impact...</CardContent></Card>;
  if (!enabled) return <Phase3DisabledCard title="Impact" />;

  return (
    <div className="space-y-4">
      <Card className="border-border/60">
        <CardHeader><CardTitle className="text-base">Impact entry</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <div><Label>Month (YYYY-MM)</Label><Input value={month} onChange={(e) => setMonth(e.target.value)} /></div>
          <div><Label>Active members</Label><Input value={activeMembers} onChange={(e) => setActiveMembers(e.target.value)} /></div>
          <div><Label>Sponsored members</Label><Input value={sponsoredMembers} onChange={(e) => setSponsoredMembers(e.target.value)} /></div>
          <div><Label>Group sales value (KES)</Label><Input value={groupSalesValueKES} onChange={(e) => setGroupSalesValueKES(e.target.value)} /></div>
        </CardContent>
        <CardContent><Button onClick={save} disabled={!canManage}>Save</Button></CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader><CardTitle className="text-base">Monthly impact</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">--</p>
          ) : (
            rows.map((row) => (
              <div key={row.id} className="rounded border border-border/60 p-3 text-sm">
                <p className="font-medium">{row.month}</p>
                <p className="text-xs text-muted-foreground">
                  Active {Number(row.activeMembers ?? 0)} • Sponsored {Number(row.sponsoredMembers ?? 0)} • Sales KES {Number(row.groupSalesValueKES ?? 0).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

