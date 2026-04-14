import { useEffect, useMemo, useState } from "react";
import { addDoc, collection, doc, getDocs, serverTimestamp, setDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useUserAccount } from "@/hooks/useUserAccount";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { Calendar, Package, TrendingUp, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
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

  const totalCommitted = useMemo(() => {
    return commitments.reduce((sum, c) => sum + (Number(c.expectedVolumeKg) || 0), 0);
  }, [commitments]);

  const totalDelivered = useMemo(() => {
    return deliveries.reduce((sum, d) => sum + (Number(d.deliveredVolumeKg) || 0), 0);
  }, [deliveries]);

  const progressPercent = useMemo(() => {
    if (!selectedCollection || !selectedCollection.targetVolumeKg) return 0;
    const target = Number(selectedCollection.targetVolumeKg);
    if (target === 0) return 0;
    return Math.min(Math.round((totalDelivered / target) * 100), 100);
  }, [selectedCollection, totalDelivered]);

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
    if (!orgId || !form.crop || !form.startDate || !form.endDate) {
      toast({ title: "Missing fields", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    await addDoc(collection(db, "orgs", orgId, "collections"), {
      ...form,
      targetVolumeKg: Number(form.targetVolumeKg || 0),
      status: "draft",
      createdByUid: currentUser?.uid ?? null,
      createdAt: serverTimestamp(),
    });
    setForm({ crop: "", collectionCenter: "", startDate: "", endDate: "", targetVolumeKg: "", notes: "" });
    await loadCollections();
    toast({ title: "Success", description: "Collection plan created successfully" });
  };

  const handleCommitment = async () => {
    if (!orgId || !selectedId || !commitmentForm.memberUid) {
      toast({ title: "Missing fields", description: "Please fill in member UID", variant: "destructive" });
      return;
    }
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
    toast({ title: "Success", description: "Commitment recorded successfully" });
  };

  const handleDelivery = async () => {
    if (!orgId || !selectedId || !deliveryForm.memberUid) {
      toast({ title: "Missing fields", description: "Please fill in member UID", variant: "destructive" });
      return;
    }
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
    toast({ title: "Success", description: "Delivery recorded successfully" });
  };

  const selectedCollection = useMemo(() => collections.find((item) => item.id === selectedId) ?? null, [collections, selectedId]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2.5">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{collections.length}</p>
                <p className="text-sm text-muted-foreground">Collection Plans</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2.5">
                <Package className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{commitments.length}</p>
                <p className="text-sm text-muted-foreground">Member Commitments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2.5">
                <Truck className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{deliveries.length}</p>
                <p className="text-sm text-muted-foreground">Deliveries Recorded</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-orange-100 p-2.5">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalDelivered.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Volume (kg)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="plans" className="w-full">
        <TabsList>
          <TabsTrigger value="plans">Collection Plans</TabsTrigger>
          <TabsTrigger value="create">Create New Plan</TabsTrigger>
          {selectedCollection && <TabsTrigger value="details">Plan Details</TabsTrigger>}
        </TabsList>

        <TabsContent value="plans" className="space-y-4">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Active Collection Plans</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {collections.length === 0 ? (
                <div className="py-8 text-center">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">No collection plans yet.</p>
                  <p className="text-xs text-muted-foreground">Create your first plan to start aggregating produce.</p>
                </div>
              ) : (
                collections.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedId(plan.id)}
                    className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${selectedId === plan.id ? "border-primary bg-primary/5" : "border-border/60 hover:border-primary/50"}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold">{plan.crop}</p>
                        <p className="text-xs text-muted-foreground">{plan.collectionCenter}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{plan.startDate} to {plan.endDate}</p>
                      </div>
                      <Badge variant={plan.status === "draft" ? "secondary" : "default"}>{plan.status}</Badge>
                    </div>
                    <p className="mt-2 text-xs font-medium">Target: {plan.targetVolumeKg ?? 0} kg</p>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Create Collection Plan</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Crop *</Label>
                <Input value={form.crop} onChange={(e) => setForm((prev) => ({ ...prev, crop: e.target.value }))} placeholder="e.g., Maize" />
              </div>
              <div>
                <Label>Collection Center *</Label>
                <Input value={form.collectionCenter} onChange={(e) => setForm((prev) => ({ ...prev, collectionCenter: e.target.value }))} placeholder="e.g., Nairobi Hub" />
              </div>
              <div>
                <Label>Start Date *</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))} />
              </div>
              <div>
                <Label>End Date *</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))} />
              </div>
              <div>
                <Label>Target Volume (kg)</Label>
                <Input type="number" value={form.targetVolumeKg} onChange={(e) => setForm((prev) => ({ ...prev, targetVolumeKg: e.target.value }))} placeholder="e.g., 5000" />
              </div>
              <div className="sm:col-span-2">
                <Label>Notes</Label>
                <Input value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Additional information..." />
              </div>
              <div className="sm:col-span-2">
                <Button onClick={handleCreate}>Create Collection Plan</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {selectedCollection && (
          <TabsContent value="details" className="space-y-4">
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-base">Collection Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium">Delivery Progress</span>
                    <span className="text-sm font-bold text-primary">{progressPercent}%</span>
                  </div>
                  <Progress value={progressPercent} className="h-2" />
                  <p className="mt-2 text-xs text-muted-foreground">
                    {totalDelivered.toLocaleString()} kg delivered of {selectedCollection.targetVolumeKg} kg target
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-border/60 p-3">
                    <p className="text-xs text-muted-foreground">Committed Volume</p>
                    <p className="text-xl font-bold">{totalCommitted.toLocaleString()} kg</p>
                  </div>
                  <div className="rounded-lg border border-border/60 p-3">
                    <p className="text-xs text-muted-foreground">Delivered Volume</p>
                    <p className="text-xl font-bold">{totalDelivered.toLocaleString()} kg</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="border-border/60">
                <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="text-base">Member Commitments</CardTitle>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">Add Commitment</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Record Member Commitment</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3">
                        <div>
                          <Label>Member UID *</Label>
                          <Input value={commitmentForm.memberUid} onChange={(e) => setCommitmentForm((prev) => ({ ...prev, memberUid: e.target.value }))} placeholder="Enter member ID" />
                        </div>
                        <div>
                          <Label>Expected Volume (kg) *</Label>
                          <Input type="number" value={commitmentForm.expectedVolumeKg} onChange={(e) => setCommitmentForm((prev) => ({ ...prev, expectedVolumeKg: e.target.value }))} placeholder="e.g., 500" />
                        </div>
                        <div>
                          <Label>Expected Grade</Label>
                          <Input value={commitmentForm.expectedGrade} onChange={(e) => setCommitmentForm((prev) => ({ ...prev, expectedGrade: e.target.value }))} placeholder="A, B, or C" />
                        </div>
                        <Button onClick={handleCommitment} className="w-full">Save Commitment</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent className="space-y-2">
                  {commitments.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">No commitments recorded yet.</p>
                  ) : (
                    commitments.map((commitment) => (
                      <div key={commitment.id} className="rounded-lg border border-border/60 p-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-semibold">{commitment.id}</p>
                            <p className="text-xs text-muted-foreground">{commitment.expectedVolumeKg} kg - Grade {commitment.expectedGrade}</p>
                          </div>
                          <Badge variant="secondary">{commitment.status}</Badge>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="text-base">Delivery Records</CardTitle>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">Record Delivery</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Record Delivery</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3">
                        <div>
                          <Label>Member UID *</Label>
                          <Input value={deliveryForm.memberUid} onChange={(e) => setDeliveryForm((prev) => ({ ...prev, memberUid: e.target.value }))} placeholder="Enter member ID" />
                        </div>
                        <div>
                          <Label>Delivered Volume (kg) *</Label>
                          <Input type="number" value={deliveryForm.deliveredVolumeKg} onChange={(e) => setDeliveryForm((prev) => ({ ...prev, deliveredVolumeKg: e.target.value }))} placeholder="e.g., 450" />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label>Grade A (kg)</Label>
                            <Input type="number" value={deliveryForm.gradeA} onChange={(e) => setDeliveryForm((prev) => ({ ...prev, gradeA: e.target.value }))} placeholder="0" />
                          </div>
                          <div>
                            <Label>Grade B (kg)</Label>
                            <Input type="number" value={deliveryForm.gradeB} onChange={(e) => setDeliveryForm((prev) => ({ ...prev, gradeB: e.target.value }))} placeholder="0" />
                          </div>
                          <div>
                            <Label>Grade C (kg)</Label>
                            <Input type="number" value={deliveryForm.gradeC} onChange={(e) => setDeliveryForm((prev) => ({ ...prev, gradeC: e.target.value }))} placeholder="0" />
                          </div>
                        </div>
                        <div>
                          <Label>Rejected Volume (kg)</Label>
                          <Input type="number" value={deliveryForm.rejectedVolumeKg} onChange={(e) => setDeliveryForm((prev) => ({ ...prev, rejectedVolumeKg: e.target.value }))} placeholder="0" />
                        </div>
                        <div>
                          <Label>Rejection Reasons</Label>
                          <Input value={deliveryForm.rejectionReasons} onChange={(e) => setDeliveryForm((prev) => ({ ...prev, rejectionReasons: e.target.value }))} placeholder="Comma separated" />
                        </div>
                        <div>
                          <Label>Batch ID</Label>
                          <Input value={deliveryForm.batchId} onChange={(e) => setDeliveryForm((prev) => ({ ...prev, batchId: e.target.value }))} placeholder="Optional" />
                        </div>
                        <Button onClick={handleDelivery} className="w-full">Save Delivery</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent className="space-y-2">
                  {deliveries.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">No deliveries recorded yet.</p>
                  ) : (
                    deliveries.map((delivery) => (
                      <div key={delivery.id} className="rounded-lg border border-border/60 p-3">
                        <p className="text-sm font-semibold">{delivery.memberUid}</p>
                        <p className="text-xs text-muted-foreground">{delivery.deliveredVolumeKg} kg delivered</p>
                        {delivery.batchId && <p className="text-xs text-muted-foreground">Batch: {delivery.batchId}</p>}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
