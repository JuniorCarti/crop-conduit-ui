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


type CollectionPlan = {
  id: string;
  crop: string;
  collectionCenter: string;
  startDate: string;
  endDate: string;
  targetVolumeKg: string;
  status: string;
};

export default function OrgAggregation() {
  const accountQuery = useUserAccount();
  const { currentUser } = useAuth();
  const orgId = accountQuery.data?.orgId ?? "";

  const [collections, setCollections] = useState<CollectionPlan[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [commitments, setCommitments] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);

  const [form, setForm] = useState({
    crop: "",
    collectionCenter: "",
    startDate: "",
    endDate: "",
    targetVolumeKg: "",
    notes: "",
  });

  const [commitmentForm, setCommitmentForm] = useState({
    memberUid: "",
    expectedVolumeKg: "",
    expectedGrade: "A",
  });

  const [deliveryForm, setDeliveryForm] = useState({
    memberUid: "",
    deliveredVolumeKg: "",
    gradeA: "",
    gradeB: "",
    gradeC: "",
    rejectedVolumeKg: "",
    rejectionReasons: "",
    batchId: "",
  });

  const loadCollections = async () => {
    if (!orgId) return;
    const snap = await getDocs(collection(db, "orgs", orgId, "collections"));
    const rows = snap.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as any) }));
    setCollections(rows as CollectionPlan[]);
  };

  const loadCommitments = async (collectionId: string) => {
    if (!orgId) return;
    const snap = await getDocs(collection(db, "orgs", orgId, "collections", collectionId, "commitments"));
    setCommitments(snap.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as any) })));
  };

  const loadDeliveries = async (collectionId: string) => {
    if (!orgId) return;
    const snap = await getDocs(collection(db, "orgs", orgId, "collections", collectionId, "deliveries"));
    setDeliveries(snap.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as any) })));
  };

  useEffect(() => {
    loadCollections().catch(() => setCollections([]));
  }, [orgId]);

  useEffect(() => {
    if (!selectedId) return;
    loadCommitments(selectedId).catch(() => setCommitments([]));
    loadDeliveries(selectedId).catch(() => setDeliveries([]));
  }, [selectedId]);

  const handleCreate = async () => {
    if (!orgId || !form.crop || !form.startDate || !form.endDate) return;
    await addDoc(collection(db, "orgs", orgId, "collections"), {
      ...form,
      targetVolumeKg: Number(form.targetVolumeKg || 0),
      status: "draft",
      createdByUid: currentUser?.uid ?? null,
      createdAt: serverTimestamp(),
    });
    setForm({ crop: "", collectionCenter: "", startDate: "", endDate: "", targetVolumeKg: "", notes: "" });
    await loadCollections();
  };

  const handleCommitment = async () => {
    if (!orgId || !selectedId || !commitmentForm.memberUid) return;
    await setDoc(
      doc(db, "orgs", orgId, "collections", selectedId, "commitments", commitmentForm.memberUid),
      {
        expectedVolumeKg: Number(commitmentForm.expectedVolumeKg || 0),
        expectedGrade: commitmentForm.expectedGrade,
        status: "committed",
        confirmedAt: serverTimestamp(),
      },
      { merge: true }
    );
    setCommitmentForm({ memberUid: "", expectedVolumeKg: "", expectedGrade: "A" });
    await loadCommitments(selectedId);
  };

  const handleDelivery = async () => {
    if (!orgId || !selectedId || !deliveryForm.memberUid) return;
    await addDoc(collection(db, "orgs", orgId, "collections", selectedId, "deliveries"), {
      memberUid: deliveryForm.memberUid,
      deliveredVolumeKg: Number(deliveryForm.deliveredVolumeKg || 0),
      gradeBreakdown: {
        A: Number(deliveryForm.gradeA || 0),
        B: Number(deliveryForm.gradeB || 0),
        C: Number(deliveryForm.gradeC || 0),
      },
      rejectedVolumeKg: Number(deliveryForm.rejectedVolumeKg || 0),
      rejectionReasons: deliveryForm.rejectionReasons ? deliveryForm.rejectionReasons.split(",").map((r) => r.trim()).filter(Boolean) : [],
      deliveredAt: serverTimestamp(),
      batchId: deliveryForm.batchId || null,
    });
    setDeliveryForm({ memberUid: "", deliveredVolumeKg: "", gradeA: "", gradeB: "", gradeC: "", rejectedVolumeKg: "", rejectionReasons: "", batchId: "" });
    await loadDeliveries(selectedId);
  };

  const selectedCollection = useMemo(() => collections.find((item) => item.id === selectedId) ?? null, [collections, selectedId]);

  return (
    <div className="space-y-6">
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Create collection plan</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Crop *</Label>
            <Input value={form.crop} onChange={(e) => setForm((prev) => ({ ...prev, crop: e.target.value }))} />
          </div>
          <div>
            <Label>Collection center *</Label>
            <Input value={form.collectionCenter} onChange={(e) => setForm((prev) => ({ ...prev, collectionCenter: e.target.value }))} />
          </div>
          <div>
            <Label>Start date *</Label>
            <Input type="date" value={form.startDate} onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))} />
          </div>
          <div>
            <Label>End date *</Label>
            <Input type="date" value={form.endDate} onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))} />
          </div>
          <div>
            <Label>Target volume (kg)</Label>
            <Input value={form.targetVolumeKg} onChange={(e) => setForm((prev) => ({ ...prev, targetVolumeKg: e.target.value }))} />
          </div>
          <div className="sm:col-span-2">
            <Label>Notes</Label>
            <Input value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} />
          </div>
          <div className="sm:col-span-2">
            <Button onClick={handleCreate}>Save plan</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Collection plans</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {collections.length === 0 ? (
            <p className="text-sm text-muted-foreground">No collection plans yet.</p>
          ) : (
            collections.map((plan) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedId(plan.id)}
                className={`w-full rounded-lg border px-3 py-2 text-left ${selectedId === plan.id ? "border-primary" : "border-border/60"}`}
              >
                <p className="text-sm font-semibold">{plan.crop} - {plan.startDate}</p>
                <p className="text-xs text-muted-foreground">{plan.collectionCenter} | Target: {plan.targetVolumeKg ?? 0} kg</p>
              </button>
            ))
          )}
        </CardContent>
      </Card>

      {selectedCollection && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-border/60">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base">Commitments</CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">Add commitment</Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Member commitment</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <Label>Member UID</Label>
                    <Input value={commitmentForm.memberUid} onChange={(e) => setCommitmentForm((prev) => ({ ...prev, memberUid: e.target.value }))} />
                    <Label>Expected volume (kg)</Label>
                    <Input value={commitmentForm.expectedVolumeKg} onChange={(e) => setCommitmentForm((prev) => ({ ...prev, expectedVolumeKg: e.target.value }))} />
                    <Label>Expected grade</Label>
                    <Input value={commitmentForm.expectedGrade} onChange={(e) => setCommitmentForm((prev) => ({ ...prev, expectedGrade: e.target.value }))} />
                    <Button onClick={handleCommitment}>Save commitment</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-2">
              {commitments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No commitments yet.</p>
              ) : (
                commitments.map((commitment) => (
                  <div key={commitment.id} className="rounded-lg border border-border/60 p-3 text-sm">
                    <p className="font-semibold">{commitment.id}</p>
                    <p className="text-xs text-muted-foreground">{commitment.expectedVolumeKg} kg - Grade {commitment.expectedGrade}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base">Deliveries</CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">Record delivery</Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Delivery record</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <Label>Member UID</Label>
                    <Input value={deliveryForm.memberUid} onChange={(e) => setDeliveryForm((prev) => ({ ...prev, memberUid: e.target.value }))} />
                    <Label>Delivered volume (kg)</Label>
                    <Input value={deliveryForm.deliveredVolumeKg} onChange={(e) => setDeliveryForm((prev) => ({ ...prev, deliveredVolumeKg: e.target.value }))} />
                    <Label>Grade A (kg)</Label>
                    <Input value={deliveryForm.gradeA} onChange={(e) => setDeliveryForm((prev) => ({ ...prev, gradeA: e.target.value }))} />
                    <Label>Grade B (kg)</Label>
                    <Input value={deliveryForm.gradeB} onChange={(e) => setDeliveryForm((prev) => ({ ...prev, gradeB: e.target.value }))} />
                    <Label>Grade C (kg)</Label>
                    <Input value={deliveryForm.gradeC} onChange={(e) => setDeliveryForm((prev) => ({ ...prev, gradeC: e.target.value }))} />
                    <Label>Rejected volume (kg)</Label>
                    <Input value={deliveryForm.rejectedVolumeKg} onChange={(e) => setDeliveryForm((prev) => ({ ...prev, rejectedVolumeKg: e.target.value }))} />
                    <Label>Rejection reasons (comma separated)</Label>
                    <Input value={deliveryForm.rejectionReasons} onChange={(e) => setDeliveryForm((prev) => ({ ...prev, rejectionReasons: e.target.value }))} />
                    <Label>Batch ID</Label>
                    <Input value={deliveryForm.batchId} onChange={(e) => setDeliveryForm((prev) => ({ ...prev, batchId: e.target.value }))} />
                    <Button onClick={handleDelivery}>Save delivery</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-2">
              {deliveries.length === 0 ? (
                <p className="text-sm text-muted-foreground">No deliveries yet.</p>
              ) : (
                deliveries.map((delivery) => (
                  <div key={delivery.id} className="rounded-lg border border-border/60 p-3 text-sm">
                    <p className="font-semibold">{delivery.memberUid}</p>
                    <p className="text-xs text-muted-foreground">{delivery.deliveredVolumeKg} kg delivered</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
