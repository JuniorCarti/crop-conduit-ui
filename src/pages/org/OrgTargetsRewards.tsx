import { useEffect, useMemo, useState } from "react";
import { addDoc, collection, doc, getDocs, serverTimestamp, setDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useUserAccount } from "@/hooks/useUserAccount";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";


type TargetDoc = {
  id: string;
  title: string;
  description?: string;
  targetType: "delivery" | "training" | "verification" | "custom";
  rules?: any;
  reward?: any;
  startDate?: string;
  endDate?: string;
  status?: string;
};

export default function OrgTargetsRewards() {
  const accountQuery = useUserAccount();
  const { currentUser } = useAuth();
  const orgId = accountQuery.data?.orgId ?? "";

  const [targets, setTargets] = useState<TargetDoc[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    targetType: "verification",
    crop: "",
    volumeKg: "",
    trainingsCount: "",
    deadline: "",
    rewardType: "voucher",
    rewardValue: "",
    rewardNotes: "",
    startDate: "",
    endDate: "",
  });

  const [rewardForm, setRewardForm] = useState({ targetId: "", memberId: "", notes: "" });

  const loadTargets = async () => {
    if (!orgId) return;
    const snap = await getDocs(collection(db, "orgs", orgId, "targets"));
    const rows = snap.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as any) }));
    setTargets(rows as TargetDoc[]);
  };

  const loadMembers = async () => {
    if (!orgId) return;
    const snap = await getDocs(collection(db, "orgs", orgId, "members"));
    setMembers(snap.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as any) })));
  };

  const loadCertificates = async () => {
    if (!orgId) return;
    const snap = await getDocs(collection(db, "orgs", orgId, "certificates"));
    setCertificates(snap.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as any) })));
  };

  const loadDeliveries = async () => {
    if (!orgId) return;
    const collectionsSnap = await getDocs(collection(db, "orgs", orgId, "collections"));
    const rows: any[] = [];
    for (const docSnap of collectionsSnap.docs) {
      const deliveriesSnap = await getDocs(collection(db, "orgs", orgId, "collections", docSnap.id, "deliveries"));
      deliveriesSnap.forEach((delivery) => rows.push(delivery.data()));
    }
    setDeliveries(rows);
  };

  useEffect(() => {
    loadTargets().catch(() => setTargets([]));
    loadMembers().catch(() => setMembers([]));
    loadCertificates().catch(() => setCertificates([]));
    loadDeliveries().catch(() => setDeliveries([]));
  }, [orgId]);

  useEffect(() => {
    const syncProgress = async () => {
      if (!orgId || targets.length === 0 || members.length === 0) return;
      await Promise.all(
        targets.map(async (target) => {
          if (target.targetType === "verification") {
            await Promise.all(
              members.map((member) =>
                setDoc(
                  doc(db, "orgs", orgId, "targets", target.id, "progress", member.id),
                  {
                    progressValue: member.verificationStatus === "active" || member.verificationStatus === "verified" ? 1 : 0,
                    eligible: member.verificationStatus === "active" || member.verificationStatus === "verified",
                    lastUpdatedAt: serverTimestamp(),
                  },
                  { merge: true }
                )
              )
            );
          }
          if (target.targetType === "training") {
            const memberCertCounts = members.map((member) => ({
              id: member.id,
              count: certificates.filter((cert) => cert.memberUid === member.id).length,
            }));
            await Promise.all(
              memberCertCounts.map((entry) =>
                setDoc(
                  doc(db, "orgs", orgId, "targets", target.id, "progress", entry.id),
                  {
                    progressValue: entry.count,
                    eligible: entry.count > 0,
                    lastUpdatedAt: serverTimestamp(),
                  },
                  { merge: true }
                )
              )
            );
          }
        })
      );
    };
    syncProgress().catch(() => {});
  }, [orgId, targets, members, certificates]);

  const handleCreate = async () => {
    if (!orgId || !form.title) return;
    await addDoc(collection(db, "orgs", orgId, "targets"), {
      title: form.title,
      description: form.description,
      targetType: form.targetType,
      rules: {
        crop: form.crop || null,
        volumeKg: form.volumeKg ? Number(form.volumeKg) : null,
        trainingsCount: form.trainingsCount ? Number(form.trainingsCount) : null,
        deadline: form.deadline || null,
      },
      reward: {
        type: form.rewardType,
        value: form.rewardValue,
        notes: form.rewardNotes,
      },
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      status: "active",
      createdAt: serverTimestamp(),
      createdByUid: currentUser?.uid ?? null,
    });
    setForm({
      title: "",
      description: "",
      targetType: "verification",
      crop: "",
      volumeKg: "",
      trainingsCount: "",
      deadline: "",
      rewardType: "voucher",
      rewardValue: "",
      rewardNotes: "",
      startDate: "",
      endDate: "",
    });
    await loadTargets();
  };

  const progressSummary = useMemo(() => {
    const verifiedCount = members.filter((m) => m.verificationStatus === "active" || m.verificationStatus === "verified").length;
    const certificateCount = certificates.length;
    const totalDelivered = deliveries.reduce((sum, delivery) => sum + Number(delivery.deliveredVolumeKg || 0), 0);
    return { verifiedCount, certificateCount, totalDelivered };
  }, [members, certificates, deliveries]);

  const handleIssueReward = async () => {
    if (!orgId || !rewardForm.targetId || !rewardForm.memberId) return;
    const target = targets.find((item) => item.id === rewardForm.targetId);
    if (!target) return;
    await addDoc(collection(db, "orgs", orgId, "targets", rewardForm.targetId, "rewards"), {
      memberUid: rewardForm.memberId,
      memberId: rewardForm.memberId,
      issuedAt: serverTimestamp(),
      reward: target.reward,
      issuedByUid: currentUser?.uid ?? null,
      status: "issued",
      notes: rewardForm.notes || null,
    });
    setRewardForm({ targetId: "", memberId: "", notes: "" });
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Create target</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} />
          </div>
          <div>
            <Label>Target type</Label>
            <Input value={form.targetType} onChange={(e) => setForm((prev) => ({ ...prev, targetType: e.target.value }))} />
          </div>
          <div>
            <Label>Description</Label>
            <Input value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
          </div>
          <div>
            <Label>Crop (optional)</Label>
            <Input value={form.crop} onChange={(e) => setForm((prev) => ({ ...prev, crop: e.target.value }))} />
          </div>
          <div>
            <Label>Volume target (kg)</Label>
            <Input value={form.volumeKg} onChange={(e) => setForm((prev) => ({ ...prev, volumeKg: e.target.value }))} />
          </div>
          <div>
            <Label>Training count</Label>
            <Input value={form.trainingsCount} onChange={(e) => setForm((prev) => ({ ...prev, trainingsCount: e.target.value }))} />
          </div>
          <div>
            <Label>Reward type</Label>
            <Input value={form.rewardType} onChange={(e) => setForm((prev) => ({ ...prev, rewardType: e.target.value }))} />
          </div>
          <div>
            <Label>Reward value</Label>
            <Input value={form.rewardValue} onChange={(e) => setForm((prev) => ({ ...prev, rewardValue: e.target.value }))} />
          </div>
          <div>
            <Label>Start date</Label>
            <Input type="date" value={form.startDate} onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))} />
          </div>
          <div>
            <Label>End date</Label>
            <Input type="date" value={form.endDate} onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))} />
          </div>
          <div className="sm:col-span-2">
            <Button onClick={handleCreate}>Create target</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Targets & progress</CardTitle>
          <Dialog onOpenChange={(open) => {
            if (!open) setRewardForm({ targetId: "", memberId: "", notes: "" });
          }}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">Issue reward</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Issue reward</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Label>Target ID</Label>
                <Input value={rewardForm.targetId} onChange={(e) => setRewardForm((prev) => ({ ...prev, targetId: e.target.value }))} />
                <Label>Member ID</Label>
                <Input value={rewardForm.memberId} onChange={(e) => setRewardForm((prev) => ({ ...prev, memberId: e.target.value }))} />
                <Label>Notes</Label>
                <Input value={rewardForm.notes} onChange={(e) => setRewardForm((prev) => ({ ...prev, notes: e.target.value }))} />
                <Button onClick={handleIssueReward}>Issue</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-3">
          {targets.length === 0 ? (
            <p className="text-sm text-muted-foreground">No targets created.</p>
          ) : (
            targets.map((target) => (
              <div key={target.id} className="rounded-lg border border-border/60 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{target.title}</p>
                    <p className="text-xs text-muted-foreground">{target.targetType} target</p>
                  </div>
                  <span className="text-xs uppercase text-muted-foreground">{target.status}</span>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {target.targetType === "verification" && (
                    <p>Verified members: {progressSummary.verifiedCount}</p>
                  )}
                  {target.targetType === "training" && (
                    <p>Certificates issued: {progressSummary.certificateCount}</p>
                  )}
                  {target.targetType === "delivery" && (
                    <p>Total delivered: {progressSummary.totalDelivered} kg</p>
                  )}
                  {target.targetType === "custom" && (
                    <p>Custom tracking (manual updates)</p>
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
