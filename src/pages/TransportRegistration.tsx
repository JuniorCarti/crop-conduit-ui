import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Truck } from "lucide-react";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { toast } from "sonner";
import { AuthCardShell } from "@/components/landing/AuthCardShell";
import { HeroPanel } from "@/components/landing/HeroPanel";
import { LandingShell } from "@/components/landing/LandingShell";
import { AgriSmartLogo } from "@/components/Brand/AgriSmartLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { upsertUserProfileDoc } from "@/services/userProfileService";

const fleetModes = [
  { value: "owned", label: "Owned fleet" },
  { value: "subcontracted", label: "Subcontracted fleet" },
  { value: "mixed", label: "Mixed (owned + subcontracted)" },
];

export default function TransportRegistration() {
  const navigate = useNavigate();
  const { currentUser, signup } = useAuth();
  const [saving, setSaving] = useState(false);
  const [existingStatus, setExistingStatus] = useState<string | null>(null);
  const [form, setForm] = useState({
    companyName: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    email: "",
    password: "",
    confirmPassword: "",
    county: "",
    serviceRegions: "",
    fleetMode: "owned",
    notes: "",
  });

  useEffect(() => {
    if (!currentUser?.uid) return;
    const load = async () => {
      const snap = await getDoc(doc(db, "transportCompanies", currentUser.uid));
      if (!snap.exists()) return;
      const data = snap.data() as any;
      setExistingStatus(String(data.approvalStatus || "pending"));
      setForm((prev) => ({
        ...prev,
        companyName: data.companyName ?? "",
        contactName: data.contactName ?? "",
        contactPhone: data.contactPhone ?? "",
        contactEmail: data.contactEmail ?? "",
        county: data.county ?? "",
        serviceRegions: Array.isArray(data.serviceRegions) ? data.serviceRegions.join(", ") : data.serviceRegions ?? "",
        fleetMode: data.fleetMode ?? "owned",
        notes: data.notes ?? "",
      }));
    };
    load();
  }, [currentUser?.uid]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.companyName.trim() || !form.contactPhone.trim()) {
      toast.error("Company name and phone are required.");
      return;
    }

    if (!currentUser) {
      if (!form.email || !form.password || !form.confirmPassword) {
        toast.error("Email and password are required.");
        return;
      }
      if (form.password !== form.confirmPassword) {
        toast.error("Passwords do not match.");
        return;
      }
    } else {
      if (existingStatus === "approved") {
        toast.error("Your transport company is already approved.");
        navigate("/transport");
        return;
      }
      if (existingStatus === "pending") {
        toast.error("Your registration is already submitted and awaiting approval.");
        return;
      }
    }

    setSaving(true);
    try {
      const userCredential = currentUser ? { user: currentUser } : await signup(form.email, form.password, form.contactName);
      const uid = userCredential.user.uid;
      const serviceRegions = form.serviceRegions
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      const payload = {
        ownerUid: uid,
        companyName: form.companyName.trim(),
        contactName: form.contactName.trim() || null,
        contactPhone: form.contactPhone.trim(),
        contactEmail: form.contactEmail.trim() || null,
        county: form.county.trim() || null,
        serviceRegions,
        fleetMode: form.fleetMode,
        notes: form.notes.trim() || null,
        approvalStatus: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, "transportCompanies", uid), payload, { merge: true });
      await upsertUserProfileDoc(uid, {
        role: "transport_admin",
        displayName: form.contactName || userCredential.user.displayName || undefined,
        email: form.contactEmail || userCredential.user.email || undefined,
        phone: form.contactPhone || userCredential.user.phoneNumber || undefined,
      });

      toast.success("Transport company submitted for review.");
      navigate("/transport");
    } catch (error: any) {
      console.error("Transport registration failed", error);
      toast.error(error?.message || "Failed to submit transport registration.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <LandingShell
      hero={
        <HeroPanel>
          <div className="inline-flex w-fit rounded-full border border-white/60 bg-white/70 px-4 py-2 shadow-sm backdrop-blur">
            <AgriSmartLogo variant="inline" size="sm" showTagline={false} />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold leading-tight text-foreground sm:text-5xl lg:text-6xl whitespace-normal break-words">
              Register your transport company.
            </h1>
            <p className="max-w-xl text-base text-foreground/70 sm:text-lg whitespace-normal break-words leading-relaxed">
              Share your fleet details so farmers and cooperatives can book reliable logistics and track deliveries.
            </p>
          </div>
        </HeroPanel>
      }
      card={
      <AuthCardShell id="transport-registration">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Truck className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Transport and Logistics Registration</h2>
          <p className="text-sm text-muted-foreground">Provide company details to activate your portal.</p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {!currentUser && (
            <>
              <div className="space-y-1">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                  placeholder="your@email.com"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                  placeholder="Create a password"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={(event) => setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                  placeholder="Confirm your password"
                />
              </div>
            </>
          )}
            <div className="space-y-1">
              <Label htmlFor="companyName">Company name *</Label>
              <Input
                id="companyName"
                value={form.companyName}
                onChange={(event) => setForm((prev) => ({ ...prev, companyName: event.target.value }))}
                placeholder="e.g., Rift Valley Logistics"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="contactName">Primary contact name</Label>
              <Input
                id="contactName"
                value={form.contactName}
                onChange={(event) => setForm((prev) => ({ ...prev, contactName: event.target.value }))}
                placeholder="e.g., Sarah Wanjiku"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="contactPhone">Contact phone *</Label>
                <Input
                  id="contactPhone"
                  value={form.contactPhone}
                  onChange={(event) => setForm((prev) => ({ ...prev, contactPhone: event.target.value }))}
                  placeholder="+254 7xx xxx xxx"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="contactEmail">Contact email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={form.contactEmail}
                  onChange={(event) => setForm((prev) => ({ ...prev, contactEmail: event.target.value }))}
                  placeholder="ops@company.co.ke"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="county">County / HQ</Label>
                <Input
                  id="county"
                  value={form.county}
                  onChange={(event) => setForm((prev) => ({ ...prev, county: event.target.value }))}
                  placeholder="Nakuru"
                />
              </div>
              <div className="space-y-1">
                <Label>Fleet ownership</Label>
                <Select
                  value={form.fleetMode}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, fleetMode: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select fleet type" />
                  </SelectTrigger>
                  <SelectContent>
                    {fleetModes.map((mode) => (
                      <SelectItem key={mode.value} value={mode.value}>
                        {mode.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="serviceRegions">Service regions</Label>
              <Input
                id="serviceRegions"
                value={form.serviceRegions}
                onChange={(event) => setForm((prev) => ({ ...prev, serviceRegions: event.target.value }))}
                placeholder="Nakuru, Nairobi, Eldoret"
              />
              <p className="text-xs text-muted-foreground">Comma-separated counties or corridors.</p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                placeholder="Optional details about your fleet or services"
              />
            </div>

            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Submitting..." : "Submit registration"}
            </Button>

            <div className="text-center">
              <Button type="button" variant="ghost" onClick={() => navigate("/registration")} className="text-sm">
                Back to registration
              </Button>
            </div>
          </form>
        </AuthCardShell>
      }
    />
  );
}
