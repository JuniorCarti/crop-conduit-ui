import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useUserAccount } from "@/hooks/useUserAccount";
import { createOrgSponsorship, listOrgSponsorships, setSponsorshipStatus } from "@/services/phase3Service";
import { getOrgFeatureFlags } from "@/services/orgFeaturesService";
import { toast } from "sonner";
import { Phase3DisabledCard } from "@/components/org/Phase3DisabledCard";

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
    <div className="space-y-4">
      <Card className="border-border/60">
        <CardHeader><CardTitle className="text-base">Create sponsorship contract</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <div>
            <Label>Partner ID</Label>
            <Input value={form.partnerId} onChange={(e) => setForm((p) => ({ ...p, partnerId: e.target.value }))} />
          </div>
          <div>
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
          </div>
          <div>
            <Label>Seat budget</Label>
            <Input value={form.seatBudget} onChange={(e) => setForm((p) => ({ ...p, seatBudget: e.target.value }))} />
          </div>
          <div className="flex items-end">
            <Button onClick={submit} disabled={!canCreate || saving}>{saving ? "Saving..." : "Create"}</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader><CardTitle className="text-base">Contracts</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sponsorship contracts yet.</p>
          ) : (
            rows.map((row) => (
              <div key={row.id} className="rounded border border-border/60 p-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium">{row.title || row.partnerId}</p>
                  <p className="text-xs text-muted-foreground">Budget {Number(row.seatBudget ?? 0).toLocaleString()} • Used {Number(row.seatsUsed ?? 0).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{row.status ?? "proposed"}</Badge>
                  {canAdmin && row.status === "proposed" && (
                    <>
                      <Button size="sm" onClick={() => setStatus(row.id, "active")}>Accept</Button>
                      <Button size="sm" variant="outline" onClick={() => setStatus(row.id, "rejected")}>Reject</Button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

