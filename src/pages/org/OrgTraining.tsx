import { useEffect, useMemo, useState } from "react";
import { addDoc, collection, getDocs, serverTimestamp, doc, setDoc, getDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Users, Award, TrendingUp, CheckCircle2, Clock, BookOpen } from "lucide-react";
import { useUserAccount } from "@/hooks/useUserAccount";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { generateCertificateNumber, generateCertificatePdf, issueCertificate, upsertTrainingAttendance } from "@/services/cooperativeService";
import { toast } from "sonner";

export default function OrgTraining() {
  const accountQuery = useUserAccount();
  const { currentUser } = useAuth();
  const orgId = accountQuery.data?.orgId ?? "";
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({ title: "", date: "", location: "", trainer: "", cropTags: "" });
  const [attendanceForm, setAttendanceForm] = useState({
    trainingId: "",
    memberId: "",
    score: "",
    attended: "yes",
  });

  const loadSessions = async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "orgs", orgId, "trainings"));
      setSessions(snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
    } catch (error) {
      toast.error("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  const loadAttendance = async (trainingId: string) => {
    if (!orgId) return;
    try {
      const snap = await getDocs(collection(db, "orgs", orgId, "trainings", trainingId, "attendance"));
      setAttendanceRecords(snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
    } catch (error) {
      setAttendanceRecords([]);
    }
  };

  useEffect(() => {
    loadSessions().catch(() => setSessions([]));
  }, [orgId]);

  useEffect(() => {
    if (selectedSession) {
      loadAttendance(selectedSession.id).catch(() => setAttendanceRecords([]));
    }
  }, [selectedSession]);

  const handleCreate = async () => {
    if (!orgId || !form.title || !form.date) {
      toast.error("Please fill required fields");
      return;
    }
    try {
      await addDoc(collection(db, "orgs", orgId, "trainings"), {
        title: form.title,
        description: "",
        cropTags: form.cropTags ? form.cropTags.split(",").map((item) => item.trim()).filter(Boolean) : [],
        mode: "in_person",
        scheduledAt: form.date,
        locationText: form.location,
        trainer: form.trainer,
        createdByUid: currentUser?.uid ?? null,
        status: "scheduled",
        assessment: { enabled: true, passMark: 60, questionsCount: 10 },
        createdAt: serverTimestamp(),
      });
      setForm({ title: "", date: "", location: "", trainer: "", cropTags: "" });
      toast.success("Training session created");
      await loadSessions();
    } catch (error) {
      toast.error("Failed to create session");
    }
  };

  const handleAttendance = async () => {
    if (!orgId || !attendanceForm.trainingId || !attendanceForm.memberId) {
      toast.error("Please fill required fields");
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
      toast.success(passed ? "Attendance recorded and certificate issued" : "Attendance recorded");
      if (selectedSession?.id === attendanceForm.trainingId) {
        await loadAttendance(attendanceForm.trainingId);
      }
    } catch (error) {
      toast.error("Failed to record attendance");
    }
  };

  const activeSessions = useMemo(() => sessions.filter((session) => session.status !== "cancelled"), [sessions]);
  const upcomingSessions = useMemo(() => activeSessions.filter((session) => session.status === "scheduled"), [activeSessions]);
  const completedSessions = useMemo(() => activeSessions.filter((session) => session.status === "completed"), [activeSessions]);

  const totalAttendees = useMemo(() => attendanceRecords.filter(r => r.attended).length, [attendanceRecords]);
  const totalPassed = useMemo(() => attendanceRecords.filter(r => r.passed).length, [attendanceRecords]);
  const avgScore = useMemo(() => {
    const scores = attendanceRecords.filter(r => r.attended && r.score).map(r => Number(r.score));
    return scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : 0;
  }, [attendanceRecords]);

  return (
    <div className=\"space-y-6\">
      {/* Dashboard Stats */}
      <div className=\"grid gap-4 md:grid-cols-4\">
        <Card className=\"border-border/60\">
          <CardContent className=\"pt-6\">
            <div className=\"flex items-center justify-between\">
              <div>
                <p className=\"text-xs text-muted-foreground\">Total Sessions</p>
                <p className=\"text-2xl font-bold\">{activeSessions.length}</p>
              </div>
              <BookOpen className=\"h-8 w-8 text-primary\" />
            </div>
          </CardContent>
        </Card>
        <Card className=\"border-border/60\">
          <CardContent className=\"pt-6\">
            <div className=\"flex items-center justify-between\">
              <div>
                <p className=\"text-xs text-muted-foreground\">Upcoming</p>
                <p className=\"text-2xl font-bold\">{upcomingSessions.length}</p>
              </div>
              <Clock className=\"h-8 w-8 text-blue-600\" />
            </div>
          </CardContent>
        </Card>
        <Card className=\"border-border/60\">
          <CardContent className=\"pt-6\">
            <div className=\"flex items-center justify-between\">
              <div>
                <p className=\"text-xs text-muted-foreground\">Completed</p>
                <p className=\"text-2xl font-bold\">{completedSessions.length}</p>
              </div>
              <CheckCircle2 className=\"h-8 w-8 text-green-600\" />
            </div>
          </CardContent>
        </Card>
        <Card className=\"border-border/60\">
          <CardContent className=\"pt-6\">
            <div className=\"flex items-center justify-between\">
              <div>
                <p className=\"text-xs text-muted-foreground\">Certificates</p>
                <p className=\"text-2xl font-bold\">{totalPassed}</p>
              </div>
              <Award className=\"h-8 w-8 text-amber-600\" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue=\"calendar\" className=\"space-y-4\">
        <TabsList>
          <TabsTrigger value=\"calendar\">Calendar</TabsTrigger>
          <TabsTrigger value=\"create\">Schedule Session</TabsTrigger>
          <TabsTrigger value=\"attendance\">Record Attendance</TabsTrigger>
          {selectedSession && <TabsTrigger value=\"details\">Session Details</TabsTrigger>}
        </TabsList>

        <TabsContent value=\"calendar\" className=\"space-y-4\">
          <Card className=\"border-border/60\">
            <CardHeader>
              <CardTitle className=\"text-base\">Training Calendar</CardTitle>
            </CardHeader>
            <CardContent className=\"space-y-4\">
              {loading ? (
                <p className=\"text-sm text-muted-foreground\">Loading...</p>
              ) : activeSessions.length === 0 ? (
                <div className=\"text-center py-12\">
                  <Calendar className=\"h-12 w-12 mx-auto text-muted-foreground mb-4\" />
                  <p className=\"text-sm text-muted-foreground mb-4\">No training sessions scheduled</p>
                  <Button onClick={() => document.querySelector('[value=\"create\"]')?.click()}>Schedule First Session</Button>
                </div>
              ) : (
                <>
                  {upcomingSessions.length > 0 && (
                    <div>
                      <h3 className=\"text-sm font-semibold mb-3\">Upcoming Sessions</h3>
                      <div className=\"grid gap-3 md:grid-cols-2\">
                        {upcomingSessions.map((session) => (
                          <button
                            key={session.id}
                            type=\"button\"
                            onClick={() => {
                              setSelectedSession(session);
                              document.querySelector('[value=\"details\"]')?.click();
                            }}
                            className=\"rounded-lg border border-border/60 p-4 text-left hover:shadow-md transition-all\"
                          >
                            <div className=\"flex items-start justify-between mb-2\">
                              <div>
                                <p className=\"font-semibold\">{session.title}</p>
                                <p className=\"text-xs text-muted-foreground\">{session.locationText || "Location TBD"}</p>
                              </div>
                              <Badge variant=\"default\">{session.status}</Badge>
                            </div>
                            <div className=\"flex items-center gap-2 text-xs text-muted-foreground\">
                              <Calendar className=\"h-3 w-3\" />
                              <span>{session.scheduledAt}</span>
                            </div>
                            {session.cropTags && session.cropTags.length > 0 && (
                              <div className=\"flex flex-wrap gap-1 mt-2\">
                                {session.cropTags.map((tag: string) => (
                                  <Badge key={tag} variant=\"secondary\" className=\"text-xs\">{tag}</Badge>
                                ))}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {completedSessions.length > 0 && (
                    <div>
                      <h3 className=\"text-sm font-semibold mb-3\">Completed Sessions</h3>
                      <div className=\"grid gap-3 md:grid-cols-2\">
                        {completedSessions.map((session) => (
                          <button
                            key={session.id}
                            type=\"button\"
                            onClick={() => {
                              setSelectedSession(session);
                              document.querySelector('[value=\"details\"]')?.click();
                            }}
                            className=\"rounded-lg border border-border/60 p-4 text-left hover:shadow-md transition-all opacity-75\"
                          >
                            <div className=\"flex items-start justify-between mb-2\">
                              <div>
                                <p className=\"font-semibold\">{session.title}</p>
                                <p className=\"text-xs text-muted-foreground\">{session.locationText || "Location TBD"}</p>
                              </div>
                              <Badge variant=\"secondary\">{session.status}</Badge>
                            </div>
                            <div className=\"flex items-center gap-2 text-xs text-muted-foreground\">
                              <Calendar className=\"h-3 w-3\" />
                              <span>{session.scheduledAt}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value=\"create\">
          <Card className=\"border-border/60\">
            <CardHeader>
              <CardTitle className=\"text-base\">Schedule Training Session</CardTitle>
            </CardHeader>
            <CardContent className=\"grid gap-4 sm:grid-cols-2\">
              <div className=\"sm:col-span-2\">
                <Label>Title *</Label>
                <Input value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} placeholder=\"e.g., Sustainable Farming Practices\" />
              </div>
              <div>
                <Label>Date *</Label>
                <Input type=\"date\" value={form.date} onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))} />
              </div>
              <div>
                <Label>Location</Label>
                <Input value={form.location} onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))} placeholder=\"e.g., Community Center\" />
              </div>
              <div>
                <Label>Trainer</Label>
                <Input value={form.trainer} onChange={(e) => setForm((prev) => ({ ...prev, trainer: e.target.value }))} placeholder=\"Trainer name\" />
              </div>
              <div>
                <Label>Crop Tags (comma separated)</Label>
                <Input value={form.cropTags} onChange={(e) => setForm((prev) => ({ ...prev, cropTags: e.target.value }))} placeholder=\"Maize, Beans\" />
              </div>
              <div className=\"sm:col-span-2\">
                <Button onClick={handleCreate}>Schedule Session</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value=\"attendance\">
          <Card className=\"border-border/60\">
            <CardHeader>
              <CardTitle className=\"text-base\">Record Attendance & Assessment</CardTitle>
            </CardHeader>
            <CardContent className=\"grid gap-4 sm:grid-cols-2\">
              <div className=\"sm:col-span-2\">
                <Label>Training Session *</Label>
                <Select value={attendanceForm.trainingId} onValueChange={(value) => setAttendanceForm((prev) => ({ ...prev, trainingId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder=\"Select session\" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeSessions.map((session) => (
                      <SelectItem key={session.id} value={session.id}>{session.title} - {session.scheduledAt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Member ID *</Label>
                <Input value={attendanceForm.memberId} onChange={(e) => setAttendanceForm((prev) => ({ ...prev, memberId: e.target.value }))} placeholder=\"Member document ID\" />
              </div>
              <div>
                <Label>Attended *</Label>
                <Select value={attendanceForm.attended} onValueChange={(value) => setAttendanceForm((prev) => ({ ...prev, attended: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder=\"Select\" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=\"yes\">Yes</SelectItem>
                    <SelectItem value=\"no\">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Assessment Score (0-100)</Label>
                <Input value={attendanceForm.score} onChange={(e) => setAttendanceForm((prev) => ({ ...prev, score: e.target.value }))} placeholder=\"e.g., 85\" />
              </div>
              <div className=\"sm:col-span-2\">
                <Button onClick={handleAttendance}>Save Attendance</Button>
                <p className=\"text-xs text-muted-foreground mt-2\">Certificate will be auto-generated if score ≥ 60</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {selectedSession && (
          <TabsContent value=\"details\" className=\"space-y-4\">
            <Card className=\"border-border/60\">
              <CardHeader>
                <div className=\"flex items-center justify-between\">
                  <div>
                    <CardTitle className=\"text-base\">{selectedSession.title}</CardTitle>
                    <p className=\"text-sm text-muted-foreground\">{selectedSession.scheduledAt} • {selectedSession.locationText || "Location TBD"}</p>
                  </div>
                  <Badge variant=\"default\">{selectedSession.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className=\"space-y-4\">
                <div className=\"grid gap-4 md:grid-cols-4\">
                  <div className=\"rounded-lg border border-border/60 p-4\">
                    <p className=\"text-xs text-muted-foreground mb-1\">Total Attendees</p>
                    <p className=\"text-2xl font-bold\">{totalAttendees}</p>
                  </div>
                  <div className=\"rounded-lg border border-border/60 p-4\">
                    <p className=\"text-xs text-muted-foreground mb-1\">Passed</p>
                    <p className=\"text-2xl font-bold\">{totalPassed}</p>
                  </div>
                  <div className=\"rounded-lg border border-border/60 p-4\">
                    <p className=\"text-xs text-muted-foreground mb-1\">Average Score</p>
                    <p className=\"text-2xl font-bold\">{avgScore.toFixed(1)}</p>
                  </div>
                  <div className=\"rounded-lg border border-border/60 p-4\">
                    <p className=\"text-xs text-muted-foreground mb-1\">Pass Rate</p>
                    <p className=\"text-2xl font-bold\">{totalAttendees > 0 ? ((totalPassed / totalAttendees) * 100).toFixed(0) : 0}%</p>
                  </div>
                </div>

                {attendanceRecords.length > 0 && (
                  <div>
                    <h3 className=\"text-sm font-semibold mb-3\">Attendance Records</h3>
                    <div className=\"space-y-2\">
                      {attendanceRecords.map((record) => (
                        <div key={record.id} className=\"rounded-lg border border-border/60 p-3 flex items-center justify-between\">
                          <div>
                            <p className=\"font-medium text-sm\">{record.id}</p>
                            <p className=\"text-xs text-muted-foreground\">
                              {record.attended ? `Attended • Score: ${record.score || 0}` : "Did not attend"}
                            </p>
                          </div>
                          {record.passed && <Badge variant=\"default\"><Award className=\"h-3 w-3 mr-1\" />Certified</Badge>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
