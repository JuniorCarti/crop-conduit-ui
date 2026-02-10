import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { deleteApp, initializeApp } from "firebase/app";
import { createUserWithEmailAndPassword, getAuth, signOut } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useUserAccount } from "@/hooks/useUserAccount";
import { listGovernmentTeam } from "@/services/govAggregatesService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "your-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "your-app-id",
};

function generateTempPassword() {
  return `Gov!${Math.random().toString(36).slice(2, 7)}#2026`;
}

export default function GovSettings() {
  const account = useUserAccount();
  const orgId = account.data?.orgId ?? "";
  const role = account.data?.role ?? "";
  const canManage = role === "gov_admin" || role === "org_admin" || role === "admin" || role === "superadmin";
  const [orgProfile, setOrgProfile] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "gov_viewer" as "gov_admin" | "gov_analyst" | "gov_viewer",
  });

  const teamQuery = useQuery({
    queryKey: ["govTeam", orgId],
    enabled: Boolean(orgId),
    queryFn: () => listGovernmentTeam(orgId),
  });

  useEffect(() => {
    if (!orgId) return;
    getDoc(doc(db, "orgs", orgId))
      .then((snap) => setOrgProfile(snap.exists() ? snap.data() : null))
      .catch(() => setOrgProfile(null));
  }, [orgId]);

  const createTeamMember = async () => {
    if (!canManage || !orgId) return;
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Name and email are required.");
      return;
    }
    setSaving(true);
    let secondaryApp: any = null;
    const tempPassword = generateTempPassword();
    try {
      secondaryApp = initializeApp(firebaseConfig, `gov-team-${Date.now()}`);
      const secondaryAuth = getAuth(secondaryApp);
      const credential = await createUserWithEmailAndPassword(secondaryAuth, form.email.trim(), tempPassword);
      const uid = credential.user.uid;
      await setDoc(doc(db, "users", uid), {
        uid,
        role: form.role,
        orgId,
        orgType: orgProfile?.orgType ?? "government_national",
        profileComplete: true,
        displayName: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim() || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      await setDoc(doc(db, "orgs", orgId, "members", uid), {
        uid,
        role: form.role,
        status: "active",
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim() || null,
        createdAt: serverTimestamp(),
        createdByUid: account.data?.uid ?? null,
      }, { merge: true });
      setGeneratedPassword(tempPassword);
      setOpen(false);
      setForm({ name: "", email: "", phone: "", role: "gov_viewer" });
      toast.success("Government team member created.");
      await teamQuery.refetch();
    } catch (error: any) {
      toast.error(error?.message || "Failed to create team member.");
    } finally {
      try {
        if (secondaryApp) {
          await signOut(getAuth(secondaryApp));
          await deleteApp(secondaryApp);
        }
      } catch {
        // no-op
      }
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-border/60">
        <CardHeader><CardTitle>Government organization profile</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
          <p>Organization: <span className="font-medium">{orgProfile?.orgName ?? orgProfile?.name ?? "--"}</span></p>
          <p>Type: <span className="font-medium">{orgProfile?.orgType ?? "--"}</span></p>
          <p>Ministry: <span className="font-medium">{orgProfile?.ministryName ?? orgProfile?.governmentInfo?.ministryOrDepartment ?? "--"}</span></p>
          <p>Department: <span className="font-medium">{orgProfile?.department ?? "--"}</span></p>
          <p>Office level: <span className="font-medium">{orgProfile?.officeLevel ?? "National"}</span></p>
          <p>Contact email: <span className="font-medium">{orgProfile?.officialWorkEmail ?? orgProfile?.email ?? "--"}</span></p>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Team management</CardTitle>
          <Button onClick={() => setOpen(true)} disabled={!canManage}>Add staff</Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {(teamQuery.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No team members yet.</p>
          ) : (
            (teamQuery.data ?? []).map((member: any) => (
              <div key={member.id} className="flex flex-col gap-1 rounded border border-border/60 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{member.name ?? member.displayName ?? "--"}</p>
                  <p className="text-xs text-muted-foreground">{member.email ?? "--"}</p>
                </div>
                <p className="capitalize">{member.role ?? "gov_viewer"}</p>
              </div>
            ))
          )}
          {generatedPassword && (
            <div className="rounded border border-primary/30 bg-primary/5 p-3 text-sm">
              Temporary password (show once): <span className="font-medium">{generatedPassword}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add government staff</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(value) => setForm((prev) => ({ ...prev, role: value as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gov_admin">gov_admin</SelectItem>
                  <SelectItem value="gov_analyst">gov_analyst</SelectItem>
                  <SelectItem value="gov_viewer">gov_viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={createTeamMember} disabled={saving}>{saving ? "Creating..." : "Create staff"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

