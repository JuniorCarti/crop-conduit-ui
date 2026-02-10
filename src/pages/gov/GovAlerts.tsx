import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createGovAlert, listGovAlerts, safeArray } from "@/services/govAggregatesService";
import { useUserAccount } from "@/hooks/useUserAccount";
import { GovEmptyState } from "@/pages/gov/GovEmptyState";

export default function GovAlerts() {
  const account = useUserAccount();
  const role = account.data?.role ?? "";
  const canCreate = role === "gov_admin" || role === "org_admin" || role === "admin" || role === "superadmin";
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    type: "climate" as "climate" | "market" | "disease",
    severity: "medium" as "low" | "medium" | "high",
    title: "",
    message: "",
    countiesAffected: "",
  });

  const query = useQuery({
    queryKey: ["govAlerts"],
    queryFn: listGovAlerts,
  });

  const rows = useMemo(() => query.data ?? [], [query.data]);

  const submit = async () => {
    if (!canCreate) return;
    if (!form.title.trim() || !form.message.trim()) {
      toast.error("Title and message are required.");
      return;
    }
    try {
      await createGovAlert({
        type: form.type,
        severity: form.severity,
        title: form.title.trim(),
        message: form.message.trim(),
        countiesAffected: form.countiesAffected.split(",").map((item) => item.trim()).filter(Boolean),
        createdBy: account.data?.uid ?? "unknown",
      });
      toast.success("Alert published.");
      setOpen(false);
      setForm({ type: "climate", severity: "medium", title: "", message: "", countiesAffected: "" });
      await query.refetch();
    } catch (error: any) {
      toast.error(error?.message || "Failed to create alert.");
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-border/60">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Alerts and notices</CardTitle>
          <Button disabled={!canCreate} onClick={() => setOpen(true)}>Create notice</Button>
        </CardHeader>
      </Card>
      {rows.length === 0 ? <GovEmptyState title="No alerts published." /> : (
        <Card className="border-border/60">
          <CardHeader><CardTitle>Recent alerts</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {rows.map((row: any) => (
              <div key={row.id} className="rounded border border-border/60 p-3 text-sm">
                <p className="font-medium">{row.title}</p>
                <p className="text-xs text-muted-foreground capitalize">{row.type} • {row.severity}</p>
                <p className="mt-1">{row.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Counties: {safeArray<string>(row.countiesAffected).join(", ") || "National"}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create alert</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(value) => setForm((prev) => ({ ...prev, type: value as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="climate">Climate</SelectItem>
                    <SelectItem value="market">Market</SelectItem>
                    <SelectItem value="disease">Disease</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Severity</Label>
                <Select value={form.severity} onValueChange={(value) => setForm((prev) => ({ ...prev, severity: value as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Title</Label>
              <Input value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} />
            </div>
            <div>
              <Label>Message</Label>
              <Input value={form.message} onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))} />
            </div>
            <div>
              <Label>Counties affected (comma separated)</Label>
              <Input value={form.countiesAffected} onChange={(event) => setForm((prev) => ({ ...prev, countiesAffected: event.target.value }))} placeholder="Nakuru, Kisumu" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={submit} disabled={!canCreate}>Publish</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

