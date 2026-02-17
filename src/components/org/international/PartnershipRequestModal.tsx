import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createPartnerRequest, type PartnerRequestPayload } from "@/services/partnerRequestService";
import { toast } from "sonner";

const CERTIFICATIONS = ["GlobalGAP", "Phytosanitary", "HACCP/ISO", "ICO"];
const PREFERRED_MARKETS = ["EU", "UAE", "China", "India", "Regional"];

export function PartnershipRequestModal({
  open,
  onOpenChange,
  orgId,
  orgName,
  initialCrops,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  orgName: string;
  initialCrops: string[];
  onCreated: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    contactPerson: "",
    contactPhone: "",
    contactEmail: "",
    crops: initialCrops.join(", "),
    monthlyVolume: "",
    certifications: [] as string[],
    preferredMarkets: [] as string[],
    notes: "",
  });

  const toggleChoice = (field: "certifications" | "preferredMarkets", value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((item) => item !== value)
        : [...prev[field], value],
    }));
  };

  const submit = async () => {
    const payload: PartnerRequestPayload = {
      orgId,
      orgName,
      contactPerson: form.contactPerson.trim(),
      contactPhone: form.contactPhone.trim(),
      contactEmail: form.contactEmail.trim(),
      crops: form.crops.split(",").map((item) => item.trim()).filter(Boolean),
      monthlyVolume: Number(form.monthlyVolume || 0),
      certifications: form.certifications,
      preferredMarkets: form.preferredMarkets,
      notes: form.notes.trim(),
    };
    if (!payload.contactPerson || !payload.contactPhone || !payload.contactEmail || !payload.crops.length || payload.monthlyVolume <= 0) {
      toast.error("Fill all required partnership request fields.");
      return;
    }
    setSaving(true);
    try {
      const { fromFallback } = await createPartnerRequest(payload);
      toast.success(fromFallback ? "Request saved locally (permission-limited)." : "Partnership request submitted.");
      onCreated();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.message || "Failed to submit partnership request.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader><DialogTitle>Request Partnership</DialogTitle></DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label>Cooperative</Label><Input value={orgName} disabled /></div>
          <div><Label>Contact person *</Label><Input value={form.contactPerson} onChange={(e) => setForm((p) => ({ ...p, contactPerson: e.target.value }))} /></div>
          <div><Label>Phone *</Label><Input value={form.contactPhone} onChange={(e) => setForm((p) => ({ ...p, contactPhone: e.target.value }))} /></div>
          <div><Label>Email *</Label><Input type="email" value={form.contactEmail} onChange={(e) => setForm((p) => ({ ...p, contactEmail: e.target.value }))} /></div>
          <div><Label>Crop(s) *</Label><Input value={form.crops} onChange={(e) => setForm((p) => ({ ...p, crops: e.target.value }))} placeholder="Tomatoes, Onions" /></div>
          <div><Label>Monthly volume estimate (kg) *</Label><Input type="number" value={form.monthlyVolume} onChange={(e) => setForm((p) => ({ ...p, monthlyVolume: e.target.value }))} /></div>
        </div>
        <div>
          <Label>Current certifications</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {CERTIFICATIONS.map((cert) => (
              <button key={cert} type="button" onClick={() => toggleChoice("certifications", cert)} className={`rounded-full border px-3 py-1 text-xs ${form.certifications.includes(cert) ? "border-primary bg-primary/10 text-primary" : "border-border/60 text-muted-foreground"}`}>{cert}</button>
            ))}
          </div>
        </div>
        <div>
          <Label>Preferred markets</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {PREFERRED_MARKETS.map((market) => (
              <button key={market} type="button" onClick={() => toggleChoice("preferredMarkets", market)} className={`rounded-full border px-3 py-1 text-xs ${form.preferredMarkets.includes(market) ? "border-primary bg-primary/10 text-primary" : "border-border/60 text-muted-foreground"}`}>{market}</button>
            ))}
          </div>
        </div>
        <div>
          <Label>Notes</Label>
          <Textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Submitting..." : "Submit request"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
