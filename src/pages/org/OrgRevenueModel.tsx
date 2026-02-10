import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserAccount } from "@/hooks/useUserAccount";
import { getOrgFeatureFlags } from "@/services/orgFeaturesService";
import { getRevenueSettings, upsertRevenueSettings } from "@/services/phase3Service";
import { Phase3DisabledCard } from "@/components/org/Phase3DisabledCard";
import { toast } from "sonner";

export default function OrgRevenueModel() {
  const account = useUserAccount();
  const orgId = account.data?.orgId ?? "";
  const canAdmin = account.data?.role === "org_admin" || account.data?.role === "admin" || account.data?.role === "superadmin";
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    mode: "none",
    perMemberFeeKES: "",
    commissionPercent: "",
    farmerMonthlyKES: "",
    active: false,
  });

  const load = async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const flags = await getOrgFeatureFlags(orgId);
      setEnabled(flags.phase3RevenueShare === true);
      if (!flags.phase3RevenueShare) return;
      const settings = await getRevenueSettings(orgId);
      if (!settings) return;
      setForm({
        mode: settings.mode ?? "none",
        perMemberFeeKES: String(settings.perMemberFeeKES ?? ""),
        commissionPercent: String(settings.commissionPercent ?? ""),
        farmerMonthlyKES: String(settings.farmerMonthlyKES ?? ""),
        active: Boolean(settings.active),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, [orgId]);

  const sample = useMemo(() => {
    const commission = Number(form.commissionPercent || 0);
    const saleValue = 100000;
    return {
      coopCommission: Math.round((saleValue * commission) / 100),
      farmerNet: Math.round(saleValue - (saleValue * commission) / 100),
    };
  }, [form.commissionPercent]);

  const save = async () => {
    if (!orgId || !canAdmin) return;
    setSaving(true);
    try {
      await upsertRevenueSettings({
        orgId,
        mode: form.mode as any,
        perMemberFeeKES: form.perMemberFeeKES ? Number(form.perMemberFeeKES) : null,
        commissionPercent: form.commissionPercent ? Number(form.commissionPercent) : null,
        farmerMonthlyKES: form.farmerMonthlyKES ? Number(form.farmerMonthlyKES) : null,
        active: form.active,
      });
      toast.success("Revenue model saved.");
    } catch (error: any) {
      toast.error(error?.message || "Failed to save revenue model.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Card className="border-border/60"><CardContent className="p-6 text-sm text-muted-foreground">Loading revenue model...</CardContent></Card>;
  if (!enabled) return <Phase3DisabledCard title="Revenue Model" />;

  return (
    <div className="space-y-4">
      <Card className="border-border/60">
        <CardHeader><CardTitle className="text-base">Revenue sharing settings</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div>
            <Label>Mode</Label>
            <Select value={form.mode} onValueChange={(value) => setForm((p) => ({ ...p, mode: value }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">none</SelectItem>
                <SelectItem value="per_member">per_member</SelectItem>
                <SelectItem value="commission">commission</SelectItem>
                <SelectItem value="subscription">subscription</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Per member fee (KES)</Label>
            <Input value={form.perMemberFeeKES} onChange={(e) => setForm((p) => ({ ...p, perMemberFeeKES: e.target.value }))} />
          </div>
          <div>
            <Label>Commission %</Label>
            <Input value={form.commissionPercent} onChange={(e) => setForm((p) => ({ ...p, commissionPercent: e.target.value }))} />
          </div>
          <div>
            <Label>Farmer monthly fee (KES)</Label>
            <Input value={form.farmerMonthlyKES} onChange={(e) => setForm((p) => ({ ...p, farmerMonthlyKES: e.target.value }))} />
          </div>
        </CardContent>
        <CardContent className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Examples: commission 3%-8%, monthly KES 50-150, onboarding KES 100 once.</p>
          <Button onClick={save} disabled={!canAdmin || saving}>{saving ? "Saving..." : "Save settings"}</Button>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader><CardTitle className="text-base">Win-Win calculator (sample KES 100,000 sale)</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-1">
          <p>Cooperative share: KES {sample.coopCommission.toLocaleString()}</p>
          <p>Farmer net: KES {sample.farmerNet.toLocaleString()}</p>
        </CardContent>
      </Card>
    </div>
  );
}

