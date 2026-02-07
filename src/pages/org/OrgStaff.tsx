import { useMemo, useState } from "react";
import { addDoc, collection, doc, getDocs, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import { createUserWithEmailAndPassword, getAuth, signOut } from "firebase/auth";
import { deleteApp, initializeApp } from "firebase/app";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { useUserAccount } from "@/hooks/useUserAccount";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "your-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "your-app-id",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-XXXXXXXXXX",
};

function generateTempPassword() {
  const rand = Math.random().toString(36).slice(2, 7);
  return `Agri!${rand}#2026`;
}

export default function OrgStaff() {
  const account = useUserAccount();
  const orgId = account.data?.orgId ?? "";
  const role = account.data?.role ?? "";
  const actorUid = account.data?.uid ?? null;
  const actorName = account.data?.displayName ?? account.data?.email ?? "Org Admin";
  const canManage = role === "org_admin" || role === "admin" || role === "superadmin";

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    canVerifyMembers: false,
    canManageBilling: false,
  });

  const staffQuery = useQuery({
    queryKey: ["orgStaff", orgId],
    enabled: Boolean(orgId),
    queryFn: async () => {
      const snap = await getDocs(
        query(collection(db, "orgs", orgId, "members"), where("role", "==", "org_staff"))
      );
      return snap.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as any) }));
    },
  });

  const rows = useMemo(() => staffQuery.data ?? [], [staffQuery.data]);

  const resetForm = () => {
    setForm({
      name: "",
      email: "",
      phone: "",
      password: "",
      canVerifyMembers: false,
      canManageBilling: false,
    });
  };

  const handleCreateStaff = async () => {
    if (!orgId || !canManage || !actorUid) {
      toast.error("Only org_admin can add staff.");
      return;
    }
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Name and email are required.");
      return;
    }

    const tempPassword = form.password.trim() || generateTempPassword();
    setSaving(true);
    let secondaryApp: any = null;

    try {
      secondaryApp = initializeApp(firebaseConfig, `staff-create-${Date.now()}`);
      const secondaryAuth = getAuth(secondaryApp);
      const credential = await createUserWithEmailAndPassword(secondaryAuth, form.email.trim(), tempPassword);
      const staffUid = credential.user.uid;

      const userPayload = {
        uid: staffUid,
        role: "org_staff",
        orgId,
        orgType: "cooperative",
        profileComplete: true,
        displayName: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim() || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(doc(db, "users", staffUid), userPayload, { merge: true });

      const memberPayload = {
        uid: staffUid,
        role: "org_staff",
        status: "active",
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim() || null,
        permissions: {
          canVerifyMembers: form.canVerifyMembers,
          canManageBilling: form.canManageBilling,
        },
        createdByUid: actorUid,
        createdByName: actorName,
        createdAt: serverTimestamp(),
      };
      await setDoc(doc(db, "orgs", orgId, "members", staffUid), memberPayload, { merge: true });

      await setDoc(
        doc(db, "userDirectory", staffUid),
        {
          uid: staffUid,
          emailLower: form.email.trim().toLowerCase(),
          phoneE164: form.phone.replace(/\D/g, "") || null,
          displayName: form.name.trim(),
          role: "org_staff",
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );

      await addDoc(collection(db, "orgs", orgId, "memberAudit"), {
        memberId: staffUid,
        action: "staff_created",
        byUid: actorUid,
        byName: actorName,
        timestamp: serverTimestamp(),
        notes: "Staff account created by org admin.",
      });

      setGeneratedPassword(tempPassword);
      toast.success("Staff account created.");
      setOpen(false);
      resetForm();
      await staffQuery.refetch();
    } catch (error: any) {
      toast.error(error?.message || "Failed to create staff account.");
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Staff Management</CardTitle>
          <Button onClick={() => setOpen(true)} disabled={!canManage}>
            Add Staff
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>No staff added yet.</TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.name || "--"}</TableCell>
                    <TableCell>{row.email || "--"}</TableCell>
                    <TableCell>{row.phone || "--"}</TableCell>
                    <TableCell className="capitalize">{row.role || "org_staff"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{row.status || "active"}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {generatedPassword && (
            <div className="mt-4 rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
              <p className="font-semibold">Temporary password (show once)</p>
              <p className="text-muted-foreground mt-1">{generatedPassword}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Staff</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
            </div>
            <div>
              <Label>Temporary password (optional)</Label>
              <Input type="text" value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))} placeholder="Auto-generated if empty" />
            </div>
            <label className="flex items-center justify-between text-sm">
              Can verify members
              <Switch
                checked={form.canVerifyMembers}
                onCheckedChange={(checked) => setForm((prev) => ({ ...prev, canVerifyMembers: checked }))}
              />
            </label>
            <label className="flex items-center justify-between text-sm">
              Can manage billing
              <Switch
                checked={form.canManageBilling}
                onCheckedChange={(checked) => setForm((prev) => ({ ...prev, canManageBilling: checked }))}
              />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateStaff} disabled={saving}>
                {saving ? "Creating..." : "Create staff"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

