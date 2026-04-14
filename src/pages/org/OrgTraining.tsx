import { useEffect, useMemo, useState } from "react";
import { addDoc, collection, getDocs, serverTimestamp, doc, setDoc, getDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useUserAccount } from "@/hooks/useUserAccount";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { generateCertificateNumber, generateCertificatePdf, issueCertificate, upsertTrainingAttendance } from "@/services/cooperativeService";
import { Calendar, GraduationCap, Users, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function OrgTraining() {
  const accountQuery = useUserAccount();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const orgId = accountQuery.data?.orgId ?? "";
  
  const [sessions, setSessions] = useState<any[]>([]);
  const [form, setForm] = useState({ title: "", date: "", location: "", trainer: "", cropTags: "" });
  const [attendanceForm, setAttendanceForm] = useState({
    trainingId: "",
    memberId: "",
    score: "",
    attended: "yes",
  });

  const activeSessions = useMemo(() => sessions.filter((session) => session.status !== "cancelled"), [sessions]);
  const completedSessions = useMemo(() => sessions.filter((session) => session.status === "completed"), [sessions]);
  const upcomingSessions = useMemo(() => sessions.filter((session) => session.status === "scheduled"), [sessions]);

  const loadSessions = async () => {
    if (!orgId) return;
    const snap = await getDocs(collection(db, "orgs", orgId, "trainings"));
    setSessions(snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
  };

  useEffect(() => {
    loadSessions().catch(() => setSessions([]));
  }, [orgId]);

  const handleCreate = async () => {
    if (!orgId || !form.title || !form.date) {
      toast({ title: "Missing fields", description: "Please fill in title and date", variant: "destructive" });
      return;
    }
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
    toast({ title: "Success", description: "Training session scheduled successfully" });
  };

  const handleAttendance = async () => {
    if (!orgId || !attendanceForm.trainingId || !attendanceForm.memberId) {
      toast({ title: "Missing fields", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    try {
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
      toast({ title: "Success", description: passed ? "Attendance recorded and certificate issued" : "Attendance recorded" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to record attendance", variant: "destructive" });
    }
  };

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
                <p className="text-2xl font-bold">{sessions.length}</p>
                <p className="text-sm text-muted-foreground">Total Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2.5">
                <GraduationCap className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{upcomingSessions.length}</p>
                <p className="text-sm text-muted-foreground">Upcoming</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2.5">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedSessions.length}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-orange-100 p-2.5">
                <Award className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Certificates Issued</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sessions" className="w-full">
        <TabsList>
          <TabsTrigger value="sessions">Training Sessions</TabsTrigger>
          <TabsTrigger value="schedule">Schedule New</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="space-y-4">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">All Training Sessions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeSessions.length === 0 ? (
                <div className="py-8 text-center">
                  <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">No training sessions scheduled yet.</p>
                  <p className="text-xs text-muted-foreground">Create your first training session to get started.</p>
                </div>
              ) : (
                activeSessions.map((session) => (
                  <div key={session.id} className="rounded-lg border border-border/60 p-4 transition-colors hover:border-primary/50">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{session.title}</p>
                          <Badge variant={session.status === "scheduled" ? "default" : session.status === "completed" ? "secondary" : "outline"}>
                            {session.status}
                          </Badge>
                        </div>
                        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                          <p className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {session.scheduledAt}
                          </p>
                          {session.locationText && (
                            <p className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              {session.locationText}
                            </p>
                          )}
                          {session.cropTags && session.cropTags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {session.cropTags.map((tag: string) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <Dialog onOpenChange={(open) => {
                        if (open) {
                          setAttendanceForm({ trainingId: session.id, memberId: "", score: "", attended: "yes" });
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">Record Attendance</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Record Attendance & Assessment</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Member ID *</Label>
                              <Input 
                                value={attendanceForm.memberId} 
                                onChange={(e) => setAttendanceForm((prev) => ({ ...prev, memberId: e.target.value }))} 
                                placeholder="Enter member ID"
                              />
                            </div>
                            <div>
                              <Label>Attended *</Label>
                              <Select value={attendanceForm.attended} onValueChange={(value) => setAttendanceForm((prev) => ({ ...prev, attended: value }))}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select attendance" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="yes">Yes</SelectItem>
                                  <SelectItem value="no">No</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Assessment Score (0-100)</Label>
                              <Input 
                                type="number"
                                min="0"
                                max="100"
                                value={attendanceForm.score} 
                                onChange={(e) => setAttendanceForm((prev) => ({ ...prev, score: e.target.value }))} 
                                placeholder="e.g., 75"
                              />
                              <p className="mt-1 text-xs text-muted-foreground">Pass mark: 60. Certificate issued if passed.</p>
                            </div>
                            <Button onClick={handleAttendance} className="w-full">Save Attendance</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Schedule Training Session</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Training Title *</Label>
                <Input 
                  value={form.title} 
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} 
                  placeholder="e.g., Sustainable Farming Practices"
                />
              </div>
              <div>
                <Label>Date *</Label>
                <Input 
                  type="date" 
                  value={form.date} 
                  onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))} 
                />
              </div>
              <div>
                <Label>Location</Label>
                <Input 
                  value={form.location} 
                  onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))} 
                  placeholder="e.g., Community Hall"
                />
              </div>
              <div>
                <Label>Trainer Name</Label>
                <Input 
                  value={form.trainer} 
                  onChange={(e) => setForm((prev) => ({ ...prev, trainer: e.target.value }))} 
                  placeholder="e.g., John Doe"
                />
              </div>
              <div>
                <Label>Crop Tags (comma separated)</Label>
                <Input 
                  value={form.cropTags} 
                  onChange={(e) => setForm((prev) => ({ ...prev, cropTags: e.target.value }))} 
                  placeholder="e.g., Maize, Beans, Tomatoes"
                />
              </div>
              <div className="sm:col-span-2">
                <Button onClick={handleCreate}>Schedule Training Session</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
