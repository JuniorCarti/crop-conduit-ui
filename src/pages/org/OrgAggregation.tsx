import { useEffect, useMemo, useState } from "react";
import { addDoc, collection, doc, getDocs, serverTimestamp, setDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Package, TrendingUp, Users, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { useUserAccount } from "@/hooks/useUserAccount";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

type CollectionPlan = {
  id: string;
  crop: string;
  collectionCenter: string;
  startDate: string;
  endDate: string;
  targetVolumeKg: string;
  status: string;
  actualVolumeKg?: number;
  commitmentCount?: number;
  deliveryCount?: number;
};

export default function OrgAggregation() {
  const accountQuery = useUserAccount();
  const { currentUser } = useAuth();
  const orgId = accountQuery.data?.orgId ?? "";

  const [collections, setCollections] = useState<CollectionPlan[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [commitments, setCommitments] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "orgs", orgId, "collections"));
      const rows = snap.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as any) }));
      setCollections(rows as CollectionPlan[]);
    } catch (error) {
      toast.error("Failed to load collections");
    } finally {
      setLoading(false);
    }
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
      toast.error("Please fill required fields");
      return;
    }
    try {
      await addDoc(collection(db, "orgs", orgId, "collections"), {
        ...form,
        targetVolumeKg: Number(form.targetVolumeKg || 0),
        status: "draft",
        createdByUid: currentUser?.uid ?? null,
        createdAt: serverTimestamp(),
      });
      setForm({ crop: "", collectionCenter: "", startDate: "", endDate: "", targetVolumeKg: "", notes: "" });
      toast.success("Collection plan created");
      await loadCollections();
    } catch (error) {
      toast.error("Failed to create plan");
    }
  };

  const handleCommitment = async () => {
    if (!orgId || !selectedId || !commitmentForm.memberUid) return;
    try {
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
      toast.success("Commitment recorded");
      await loadCommitments(selectedId);
    } catch (error) {
      toast.error("Failed to record commitment");
    }
  };

  const handleDelivery = async () => {
    if (!orgId || !selectedId || !deliveryForm.memberUid) return;
    try {
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
      toast.success("Delivery recorded");
      await loadDeliveries(selectedId);
    } catch (error) {
      toast.error("Failed to record delivery");
    }
  };

  const selectedCollection = useMemo(() => collections.find((item) => item.id === selectedId) ?? null, [collections, selectedId]);

  const totalCommitted = useMemo(() => commitments.reduce((sum, c) => sum + Number(c.expectedVolumeKg || 0), 0), [commitments]);
  const totalDelivered = useMemo(() => deliveries.reduce((sum, d) => sum + Number(d.deliveredVolumeKg || 0), 0), [deliveries]);
  const progressPercent = useMemo(() => {
    if (!selectedCollection) return 0;
    const target = Number(selectedCollection.targetVolumeKg || 0);
    return target > 0 ? Math.min(100, (totalDelivered / target) * 100) : 0;
  }, [selectedCollection, totalDelivered]);

  const activeCollections = useMemo(() => collections.filter(c => c.status !== "completed" && c.status !== "cancelled"), [collections]);
  const completedCollections = useMemo(() => collections.filter(c => c.status === "completed"), [collections]);

  return (
    <div className=\"space-y-6\">
      {/* Dashboard Stats */}
      <div className=\"grid gap-4 md:grid-cols-4\">
        <Card className=\"border-border/60\">
          <CardContent className=\"pt-6\">
            <div className=\"flex items-center justify-between\">
              <div>
                <p className=\"text-xs text-muted-foreground\">Active Plans</p>
                <p className=\"text-2xl font-bold\">{activeCollections.length}</p>
              </div>
              <Calendar className=\"h-8 w-8 text-primary\" />
            </div>
          </CardContent>
        </Card>
        <Card className=\"border-border/60\">
          <CardContent className=\"pt-6\">
            <div className=\"flex items-center justify-between\">
              <div>
                <p className=\"text-xs text-muted-foreground\">Total Commitments</p>
                <p className=\"text-2xl font-bold\">{commitments.length}</p>
              </div>
              <Users className=\"h-8 w-8 text-blue-600\" />
            </div>
          </CardContent>
        </Card>
        <Card className=\"border-border/60\">
          <CardContent className=\"pt-6\">
            <div className=\"flex items-center justify-between\">
              <div>
                <p className=\"text-xs text-muted-foreground\">Deliveries</p>
                <p className=\"text-2xl font-bold\">{deliveries.length}</p>
              </div>
              <Package className=\"h-8 w-8 text-green-600\" />
            </div>
          </CardContent>
        </Card>
        <Card className=\"border-border/60\">
          <CardContent className=\"pt-6\">
            <div className=\"flex items-center justify-between\">
              <div>
                <p className=\"text-xs text-muted-foreground\">Completed</p>
                <p className=\"text-2xl font-bold\">{completedCollections.length}</p>
              </div>
              <CheckCircle2 className=\"h-8 w-8 text-emerald-600\" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue=\"calendar\" className=\"space-y-4\">
        <TabsList>
          <TabsTrigger value=\"calendar\">Calendar View</TabsTrigger>
          <TabsTrigger value=\"create\">Create Plan</TabsTrigger>
          {selectedCollection && <TabsTrigger value=\"details\">Plan Details</TabsTrigger>}
        </TabsList>

        <TabsContent value=\"calendar\" className=\"space-y-4\">
          <Card className=\"border-border/60\">
            <CardHeader>
              <CardTitle className=\"text-base\">Collection Plans</CardTitle>
            </CardHeader>
            <CardContent className=\"space-y-3\">
              {loading ? (
                <p className=\"text-sm text-muted-foreground\">Loading...</p>
              ) : collections.length === 0 ? (
                <div className=\"text-center py-12\">
                  <Calendar className=\"h-12 w-12 mx-auto text-muted-foreground mb-4\" />
                  <p className=\"text-sm text-muted-foreground mb-4\">No collection plans yet</p>
                  <Button onClick={() => document.querySelector('[value=\"create\"]')?.click()}>Create First Plan</Button>
                </div>
              ) : (
                <div className=\"grid gap-3 md:grid-cols-2 lg:grid-cols-3\">
                  {collections.map((plan) => {
                    const isActive = plan.status !== \"completed\" && plan.status !== \"cancelled\";
                    return (
                      <button
                        key={plan.id}
                        type=\"button\"
                        onClick={() => {
                          setSelectedId(plan.id);
                          document.querySelector('[value=\"details\"]')?.click();
                        }}
                        className={`rounded-lg border p-4 text-left transition-all hover:shadow-md ${
                          selectedId === plan.id ? \"border-primary bg-primary/5\" : \"border-border/60\"
                        }`}
                      >
                        <div className=\"flex items-start justify-between mb-2\">
                          <div>
                            <p className=\"font-semibold\">{plan.crop}</p>
                            <p className=\"text-xs text-muted-foreground\">{plan.collectionCenter}</p>
                          </div>
                          <Badge variant={isActive ? \"default\" : \"secondary\"}>{plan.status}</Badge>
                        </div>
                        <div className=\"space-y-1 text-xs text-muted-foreground\">
                          <div className=\"flex items-center gap-1\">
                            <Clock className=\"h-3 w-3\" />
                            <span>{plan.startDate} → {plan.endDate}</span>
                          </div>
                          <div className=\"flex items-center gap-1\">
                            <TrendingUp className=\"h-3 w-3\" />
                            <span>Target: {Number(plan.targetVolumeKg || 0).toLocaleString()} kg</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value=\"create\">
          <Card className=\"border-border/60\">
            <CardHeader>
              <CardTitle className=\"text-base\">Create Collection Plan</CardTitle>
            </CardHeader>
            <CardContent className=\"grid gap-4 sm:grid-cols-2\">
              <div>
                <Label>Crop *</Label>
                <Input value={form.crop} onChange={(e) => setForm((prev) => ({ ...prev, crop: e.target.value }))} />
              </div>
              <div>
                <Label>Collection Center *</Label>
                <Input value={form.collectionCenter} onChange={(e) => setForm((prev) => ({ ...prev, collectionCenter: e.target.value }))} />
              </div>
              <div>
                <Label>Start Date *</Label>
                <Input type=\"date\" value={form.startDate} onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))} />
              </div>
              <div>
                <Label>End Date *</Label>
                <Input type=\"date\" value={form.endDate} onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))} />
              </div>
              <div>
                <Label>Target Volume (kg)</Label>
                <Input value={form.targetVolumeKg} onChange={(e) => setForm((prev) => ({ ...prev, targetVolumeKg: e.target.value }))} />
              </div>
              <div className=\"sm:col-span-2\">
                <Label>Notes</Label>
                <Input value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} />
              </div>
              <div className=\"sm:col-span-2\">
                <Button onClick={handleCreate}>Create Plan</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {selectedCollection && (
          <TabsContent value=\"details\" className=\"space-y-4\">
            {/* Progress Dashboard */}
            <Card className=\"border-border/60\">
              <CardHeader>
                <div className=\"flex items-center justify-between\">
                  <div>
                    <CardTitle className=\"text-base\">{selectedCollection.crop} - {selectedCollection.collectionCenter}</CardTitle>
                    <p className=\"text-sm text-muted-foreground\">{selectedCollection.startDate} to {selectedCollection.endDate}</p>
                  </div>
                  <Badge variant=\"default\">{selectedCollection.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className=\"space-y-4\">
                <div className=\"grid gap-4 md:grid-cols-3\">
                  <div className=\"rounded-lg border border-border/60 p-4\">
                    <p className=\"text-xs text-muted-foreground mb-1\">Target Volume</p>
                    <p className=\"text-2xl font-bold\">{Number(selectedCollection.targetVolumeKg || 0).toLocaleString()} kg</p>
                  </div>
                  <div className=\"rounded-lg border border-border/60 p-4\">
                    <p className=\"text-xs text-muted-foreground mb-1\">Committed</p>
                    <p className=\"text-2xl font-bold\">{totalCommitted.toLocaleString()} kg</p>
                    <p className=\"text-xs text-muted-foreground\">{commitments.length} members</p>
                  </div>
                  <div className=\"rounded-lg border border-border/60 p-4\">
                    <p className=\"text-xs text-muted-foreground mb-1\">Delivered</p>
                    <p className=\"text-2xl font-bold\">{totalDelivered.toLocaleString()} kg</p>
                    <p className=\"text-xs text-muted-foreground\">{deliveries.length} deliveries</p>
                  </div>
                </div>
                <div>
                  <div className=\"flex items-center justify-between mb-2\">
                    <p className=\"text-sm font-medium\">Collection Progress</p>
                    <p className=\"text-sm text-muted-foreground\">{progressPercent.toFixed(1)}%</p>
                  </div>
                  <Progress value={progressPercent} className=\"h-3\" />
                </div>
              </CardContent>
            </Card>

            <div className=\"grid gap-4 lg:grid-cols-2\">
              {/* Commitments */}
              <Card className=\"border-border/60\">
                <CardHeader className=\"flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between\">
                  <CardTitle className=\"text-base\">Commitments</CardTitle>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size=\"sm\" variant=\"outline\">Add Commitment</Button>
                    </DialogTrigger>
                    <DialogContent className=\"max-w-md\">
                      <DialogHeader>
                        <DialogTitle>Member Commitment</DialogTitle>
                      </DialogHeader>
                      <div className=\"space-y-3\">
                        <div>
                          <Label>Member UID</Label>
                          <Input value={commitmentForm.memberUid} onChange={(e) => setCommitmentForm((prev) => ({ ...prev, memberUid: e.target.value }))} />
                        </div>
                        <div>
                          <Label>Expected Volume (kg)</Label>
                          <Input value={commitmentForm.expectedVolumeKg} onChange={(e) => setCommitmentForm((prev) => ({ ...prev, expectedVolumeKg: e.target.value }))} />
                        </div>
                        <div>
                          <Label>Expected Grade</Label>
                          <Input value={commitmentForm.expectedGrade} onChange={(e) => setCommitmentForm((prev) => ({ ...prev, expectedGrade: e.target.value }))} />
                        </div>
                        <Button onClick={handleCommitment}>Save Commitment</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent className=\"space-y-2\">
                  {commitments.length === 0 ? (
                    <div className=\"text-center py-8\">
                      <AlertCircle className=\"h-8 w-8 mx-auto text-muted-foreground mb-2\" />
                      <p className=\"text-sm text-muted-foreground\">No commitments yet</p>
                    </div>
                  ) : (
                    commitments.map((commitment) => (
                      <div key={commitment.id} className=\"rounded-lg border border-border/60 p-3 text-sm\">
                        <div className=\"flex items-center justify-between\">
                          <p className=\"font-semibold\">{commitment.id}</p>
                          <Badge variant=\"secondary\">Grade {commitment.expectedGrade}</Badge>
                        </div>
                        <p className=\"text-xs text-muted-foreground mt-1\">{Number(commitment.expectedVolumeKg || 0).toLocaleString()} kg expected</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Deliveries */}
              <Card className=\"border-border/60\">
                <CardHeader className=\"flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between\">
                  <CardTitle className=\"text-base\">Deliveries</CardTitle>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size=\"sm\" variant=\"outline\">Record Delivery</Button>
                    </DialogTrigger>
                    <DialogContent className=\"max-w-md\">
                      <DialogHeader>
                        <DialogTitle>Delivery Record</DialogTitle>
                      </DialogHeader>
                      <div className=\"space-y-3\">
                        <div>
                          <Label>Member UID</Label>
                          <Input value={deliveryForm.memberUid} onChange={(e) => setDeliveryForm((prev) => ({ ...prev, memberUid: e.target.value }))} />
                        </div>
                        <div>
                          <Label>Delivered Volume (kg)</Label>
                          <Input value={deliveryForm.deliveredVolumeKg} onChange={(e) => setDeliveryForm((prev) => ({ ...prev, deliveredVolumeKg: e.target.value }))} />
                        </div>
                        <div className=\"grid grid-cols-3 gap-2\">
                          <div>
                            <Label>Grade A (kg)</Label>
                            <Input value={deliveryForm.gradeA} onChange={(e) => setDeliveryForm((prev) => ({ ...prev, gradeA: e.target.value }))} />
                          </div>
                          <div>
                            <Label>Grade B (kg)</Label>
                            <Input value={deliveryForm.gradeB} onChange={(e) => setDeliveryForm((prev) => ({ ...prev, gradeB: e.target.value }))} />
                          </div>
                          <div>
                            <Label>Grade C (kg)</Label>
                            <Input value={deliveryForm.gradeC} onChange={(e) => setDeliveryForm((prev) => ({ ...prev, gradeC: e.target.value }))} />
                          </div>
                        </div>
                        <div>
                          <Label>Rejected Volume (kg)</Label>
                          <Input value={deliveryForm.rejectedVolumeKg} onChange={(e) => setDeliveryForm((prev) => ({ ...prev, rejectedVolumeKg: e.target.value }))} />
                        </div>
                        <div>
                          <Label>Batch ID</Label>
                          <Input value={deliveryForm.batchId} onChange={(e) => setDeliveryForm((prev) => ({ ...prev, batchId: e.target.value }))} />
                        </div>
                        <Button onClick={handleDelivery}>Save Delivery</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent className=\"space-y-2\">
                  {deliveries.length === 0 ? (
                    <div className=\"text-center py-8\">
                      <Package className=\"h-8 w-8 mx-auto text-muted-foreground mb-2\" />
                      <p className=\"text-sm text-muted-foreground\">No deliveries yet</p>
                    </div>
                  ) : (
                    deliveries.map((delivery) => (
                      <div key={delivery.id} className=\"rounded-lg border border-border/60 p-3 text-sm\">
                        <p className=\"font-semibold\">{delivery.memberUid}</p>
                        <p className=\"text-xs text-muted-foreground\">{Number(delivery.deliveredVolumeKg || 0).toLocaleString()} kg delivered</p>
                        {delivery.gradeBreakdown && (
                          <p className=\"text-xs text-muted-foreground\">
                            A: {delivery.gradeBreakdown.A || 0} | B: {delivery.gradeBreakdown.B || 0} | C: {delivery.gradeBreakdown.C || 0}
                          </p>
                        )}
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
