import { useEffect, useMemo, useState } from "react";
import { addDoc, collection, getDocs, serverTimestamp, doc, setDoc, getDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserAccount } from "@/hooks/useUserAccount";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { generateCertificateNumber, generateCertificatePdf, issueCertificate, upsertTrainingAttendance } from "@/services/cooperativeService";


export default function OrgTraining() {
  const accountQuery = useUserAccount();
  const { currentUser } = useAuth();
  const orgId = accountQuery.data?.orgId ?? "";
  const [sessions, setSessions] = useState<any[]>([]);
  const [form, setForm] = useState({ title: "", date: "", location: "", trainer: "", cropTags: "" });
  const [attendanceForm, setAttendanceForm] = useState({
    trainingId: "",
    memberId: "",
    score: "",
    attended: "yes",
  });

  const loadSessions = async () => {
    if (!orgId) return;
    const snap = await getDocs(collection(db, "orgs", orgId, "trainings"));
    setSessions(snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
  };

  useEffect(() => {
    loadSessions().catch(() => setSessions([]));
  }, [orgId]);

  const handleCreate = async () => {
    if (!orgId || !form.title || !form.date) return;
    await addDoc(collection(db, "orgs", orgId, "trainings"), {
      title: form.title,
      description: "",
      cropTags: form.cropTags ? form.cropTags.split(",").map((item) => item.trim()).filter(Boolean) : [],
      mode: "in_person",
      scheduledAt: form.date,
      locationText: form.location,
      createdByUid: currentUser?.uid ?? null,
      status: "scheduled",
      assessment: { enabled: true, passMark: 60, questionsCount: 10 },
      createdAt: serverTimestamp(),
    });
    setForm({ title: "", date: "", location: "", trainer: "", cropTags: "" });
    await loadSessions();
  };

  const handleAttendance = async () => {
    if (!orgId || !attendanceForm.trainingId || !attendanceForm.memberId) return;
    const trainingSnap = await getDoc(doc(db, "orgs", orgId, "trainings", attendanceForm.trainingId));
    const passMark = trainingSnap.exists() ? trainingSnap.data()?.assessment?.passMark ?? 60 : 60;
    const score = Number(attendanceForm.score || 0);
    const attended = attendanceForm.attended === "yes";
    const passed = attended && score >= passMark;

    await upsertTrainingAttendance(orgId, attendanceForm.trainingId, attendanceForm.memberId, {
      attended,
      score,
      passed,
    });

    if (passed) {
      const memberSnap = await getDoc(doc(db, "orgs", orgId, "members", attendanceForm.memberId));
      const memberData = memberSnap.exists() ? memberSnap.data() as any : null;
      const certificateNumber = await generateCertificateNumber(orgId);
      const certId = `${attendanceForm.trainingId}_${attendanceForm.memberId}`;
      const pdfUrl = await generateCertificatePdf(orgId, certificateNumber, {
        memberName: memberData?.fullName ?? "Member",
        trainingTitle: trainingSnap.data()?.title ?? "Training",
        score,
      });
      await issueCertificate(orgId, certId, {
        memberUid: attendanceForm.memberId,
        memberId: memberData?.memberId ?? "",
        trainingId: attendanceForm.trainingId,
        trainingTitle: trainingSnap.data()?.title ?? "",
        score,
        certificateNumber,
        status: "issued",
        pdfUrl,
      });
    }

    setAttendanceForm({ trainingId: "", memberId: "", score: "", attended: "yes" });
  };

  const activeSessions = useMemo(() => sessions.filter((session) => session.status !== "cancelled"), [sessions]);

  return (
    <div className="space-y-6">
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Schedule training session</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} />
          </div>
          <div>
            <Label>Date</Label>
            <Input type="date" value={form.date} onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))} />
          </div>
          <div>
            <Label>Location</Label>
            <Input value={form.location} onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))} />
          </div>
          <div>
            <Label>Crop tags</Label>
            <Input value={form.cropTags} onChange={(e) => setForm((prev) => ({ ...prev, cropTags: e.target.value }))} />
          </div>
          <div className="sm:col-span-2">
            <Button onClick={handleCreate}>Schedule session</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Training sessions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sessions scheduled yet.</p>
          ) : (
            activeSessions.map((session) => (
              <div key={session.id} className="rounded-lg border border-border/60 p-3 text-sm space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-foreground">{session.title}</p>
                    <p className="text-xs text-muted-foreground">{session.scheduledAt} - {session.locationText || "Location TBD"}</p>
                  </div>
                  <Dialog onOpenChange={(open) => {
                    if (open) {
                      setAttendanceForm({ trainingId: session.id, memberId: "", score: "", attended: "yes" });
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">Record attendance</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Attendance & assessment</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3">
                        <Label>Member ID</Label>
                        <Input value={attendanceForm.memberId} onChange={(e) => setAttendanceForm((prev) => ({ ...prev, memberId: e.target.value }))} />
                        <Label>Attended</Label>
                        <Select value={attendanceForm.attended} onValueChange={(value) => setAttendanceForm((prev) => ({ ...prev, attended: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yes">Yes</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                          </SelectContent>
                        </Select>
                        <Label>Score</Label>
                        <Input value={attendanceForm.score} onChange={(e) => setAttendanceForm((prev) => ({ ...prev, score: e.target.value }))} />
                        <Button onClick={handleAttendance}>Save attendance</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
