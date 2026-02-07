import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCard } from "@/components/shared/AlertCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { getFarmerProfileWithMigration, type FarmerProfile } from "@/services/firestore-farmer";
import { startConversation } from "@/services/dmService";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { deleteDoc, doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { useUserRole } from "@/hooks/useUserRole";
import {
  getLatestJoinRequestForUser,
  getSubmittedJoinRequestForUser,
  getUserCoopMembership,
  submitMembershipRequestWithJoinCode,
} from "@/services/cooperativeMembershipService";

type PendingUpdate = {
  payload?: Partial<FarmerProfile>;
  status?: "pending" | "approved" | "rejected" | string;
  submittedAt?: Date | Timestamp | string;
  reviewEtaHours?: number;
};

const formatValue = (value?: string | number | null) => {
  if (value === null || value === undefined || value === "") return "Not provided";
  return String(value);
};

const toDate = (value?: Date | Timestamp | string) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string") return new Date(value);
  if ("toDate" in value && typeof value.toDate === "function") return value.toDate();
  return null;
};

export default function FarmerProfile() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { role } = useUserRole();
  const [profile, setProfile] = useState<FarmerProfile | null>(null);
  const [pendingUpdate, setPendingUpdate] = useState<PendingUpdate | null>(null);
  const [loading, setLoading] = useState(true);
  const [coopStatus, setCoopStatus] = useState<{ verified: boolean; orgName?: string | null; status?: string | null } | null>(null);
  const [latestJoinRequest, setLatestJoinRequest] = useState<any | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);

  const DEBUG_PROFILE = import.meta.env.DEV && import.meta.env.VITE_DEBUG_PROFILE === "true";
  const DEMO_AUTO_APPROVE =
    import.meta.env.DEV && import.meta.env.VITE_DEMO_APPROVE_PENDING === "true";

  useEffect(() => {
    if (!currentUser?.uid) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const run = async () => {
      setLoading(true);
      try {
        let profileData = await getFarmerProfileWithMigration(
          currentUser.uid,
          currentUser.email ?? undefined,
          DEBUG_PROFILE
        );

        let pendingData: PendingUpdate | null = null;
        const pendingRef = doc(db, "farmers", currentUser.uid, "pendingUpdates", "latest");
        const pendingSnap = await getDoc(pendingRef);
        if (pendingSnap.exists()) {
          pendingData = pendingSnap.data() as PendingUpdate;
        }

        if (DEMO_AUTO_APPROVE && pendingData?.status === "pending") {
          const submittedAtDate = toDate(pendingData.submittedAt);
          const etaHours = pendingData.reviewEtaHours ?? 2;
          if (submittedAtDate) {
            const elapsedMs = Date.now() - submittedAtDate.getTime();
            if (elapsedMs >= etaHours * 60 * 60 * 1000) {
              const payload = pendingData.payload ?? {};
              const cleanPayload = Object.fromEntries(
                Object.entries(payload).filter(([, value]) => value !== undefined)
              );
              await setDoc(
                doc(db, "farmers", currentUser.uid),
                {
                  ...cleanPayload,
                  pending: {
                    status: "approved",
                    submittedAt: pendingData.submittedAt ?? Timestamp.now(),
                    reviewEtaHours: etaHours,
                  },
                  updatedAt: Timestamp.now(),
                },
                { merge: true }
              );
              await deleteDoc(pendingRef);
              pendingData = null;
              profileData = await getFarmerProfileWithMigration(
                currentUser.uid,
                currentUser.email ?? undefined,
                DEBUG_PROFILE
              );
            }
          }
        }

        setProfile(profileData);
        setPendingUpdate(pendingData);

        const membership = await getUserCoopMembership(currentUser.uid);
        if (membership?.status === "active") {
          setCoopStatus({ verified: true, orgName: membership.coopName ?? null, status: "active" });
          return;
        }
        const submitted = await getSubmittedJoinRequestForUser(currentUser.uid);
        const latest = await getLatestJoinRequestForUser(currentUser.uid);
        setLatestJoinRequest(latest);
        if (submitted) {
          setCoopStatus({ verified: false, orgName: membership?.coopName ?? null, status: "submitted" });
          return;
        }
        const coopSnap = await getDoc(doc(db, "users", currentUser.uid, "coopVerification", "status"));
        if (coopSnap.exists()) {
          const data = coopSnap.data() as any;
          setCoopStatus({
            verified: Boolean(data.verified),
            orgName: data.orgName ?? null,
            status: data.status ?? (data.verified ? "active" : "submitted"),
          });
        } else {
          setCoopStatus({ verified: false });
        }
      } catch (error) {
        console.error("Failed to load farmer profile:", error);
        setProfile(null);
        setPendingUpdate(null);
        setCoopStatus(null);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [currentUser?.uid, currentUser?.email, DEBUG_PROFILE, DEMO_AUTO_APPROVE]);

  const locationText = useMemo(() => {
    if (!profile) return "Not provided";
    const parts = [profile.county, profile.constituency, profile.ward].filter(Boolean);
    return parts.length ? parts.join(" / ") : "Not provided";
  }, [profile]);

  const isPending = profile?.pending?.status === "pending" || pendingUpdate?.status === "pending";
  const cropsCount = profile?.crops?.length ?? 0;
  const farmingType = profile?.typeOfFarming ?? profile?.farmingType;

  if (!currentUser && !loading) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="Farmer Profile" subtitle="Your farm and registration details" />
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 space-y-4">
          <AlertCard
            type="warning"
            title="Sign in required"
            message="Please sign in to view your farmer profile."
          />
          <Button onClick={() => navigate("/login")}>Go to Login</Button>
        </div>
      </div>
    );
  }

  if (role === "buyer" || role === "org_admin" || role === "org_staff") {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="Profile" subtitle="Access restricted" />
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 space-y-4">
          <AlertCard
            type="warning"
            title="Access restricted"
            message="Your account type does not have access to farmer profile details."
          />
          <Button onClick={() => navigate(role === "buyer" ? "/marketplace" : "/org")}>
            Go to your home
          </Button>
        </div>
      </div>
    );
  }

  const handleMessageFarmer = async () => {
    if (!profile?.uid || profile.uid === currentUser?.uid) return;
    try {
      const conversation = await startConversation(profile.uid);
      if (conversation?.conversationId) {
        navigate(`/community/chat/${conversation.conversationId}`);
      }
    } catch (error: any) {
      toast.error(error?.message || "Unable to start conversation");
    }
  };

  const handleJoinCooperative = async () => {
    if (!currentUser?.uid) {
      navigate("/login");
      return;
    }
    if (!joinCode.trim()) {
      toast.error("Enter a join code.");
      return;
    }
    setJoinLoading(true);
    try {
      const result = await submitMembershipRequestWithJoinCode({
        code: joinCode,
        uid: currentUser.uid,
        fullName: profile?.fullName ?? currentUser.displayName ?? "Farmer",
        phone: profile?.phone ?? currentUser.phoneNumber ?? null,
        email: profile?.email ?? currentUser.email ?? null,
      });
      setCoopStatus({ verified: false, orgName: result.coopName, status: "submitted" });
      const latest = await getLatestJoinRequestForUser(currentUser.uid);
      setLatestJoinRequest(latest);
      setJoinCode("");
      toast.success("Request sent to cooperative for approval.");
    } catch (error: any) {
      toast.error(error?.message || "Failed to submit join request.");
    } finally {
      setJoinLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Farmer Profile" subtitle="Your farm and registration details">
        <div className="flex items-center gap-2">
          {!loading && profile && profile.uid !== currentUser?.uid ? (
            <Button type="button" onClick={handleMessageFarmer} size="sm" variant="outline">
              Message Farmer
            </Button>
          ) : null}
          <Button
            variant="outline"
            onClick={() =>
              navigate("/farmer-registration", {
                state: { farmerData: profile, pendingStatus: profile?.pending?.status },
              })
            }
            disabled={Boolean(isPending || !profile)}
          >
            {isPending ? "Edit (pending review)" : "Edit Profile"}
          </Button>
        </div>
      </PageHeader>
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {role === "unassigned" && (
          <AlertCard
            type="info"
            title="Complete registration"
            message="Choose a registration type to unlock the right tools."
            action="Complete registration"
            onAction={() => navigate("/registration")}
          />
        )}
        {loading ? (
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        ) : !profile ? (
          <div className="space-y-4">
            <AlertCard
              type="info"
              title="No farmer profile yet"
              message="Complete registration to create your farmer profile."
            />
            <Button onClick={() => navigate("/registration")}>
              Complete registration
            </Button>
          </div>
        ) : (
          <>
            {isPending && (
              <AlertCard
                type="warning"
                title="Update pending review"
                message="Update pending review — showing last approved profile."
              />
            )}

            <Card className="border-border/60">
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 rounded-2xl bg-secondary overflow-hidden flex items-center justify-center">
                      {profile.farmPhotoUrl ? (
                        <img
                          src={profile.farmPhotoUrl}
                          alt={`${profile.fullName} farm`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-semibold text-muted-foreground">
                          {profile.fullName?.charAt(0) || "F"}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Farmer</p>
                      <h2 className="text-2xl font-bold text-foreground">
                        {formatValue(profile.fullName)}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {locationText}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {farmingType && (
                      <Badge variant="secondary" className="capitalize">
                        {farmingType}
                      </Badge>
                    )}
                    <Badge variant="outline">{cropsCount} crops</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
              <div className="space-y-6">
                <Card className="border-border/60">
                  <CardHeader>
                    <CardTitle>Farm Photo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {profile.farmPhotoUrl ? (
                      <img
                        src={profile.farmPhotoUrl}
                        alt={`${profile.fullName} farm`}
                        className="w-full rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
                        No farm photo uploaded
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-border/60">
                  <CardHeader>
                    <CardTitle>Quick stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Farm size (acres)</p>
                      <p className="text-lg font-semibold">
                        {formatValue(profile.farmSizeAcres ?? profile.farmSize)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Experience (years)</p>
                      <p className="text-lg font-semibold">
                        {formatValue(profile.farmExperienceYears ?? profile.experienceYears)}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/60">
                  <CardHeader>
                    <CardTitle>My cooperative</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {coopStatus?.verified ? (
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">{coopStatus.orgName ?? "Cooperative"}</p>
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">Active</Badge>
                      </div>
                    ) : coopStatus?.status === "submitted" ? (
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">{coopStatus.orgName ?? "Cooperative"}</p>
                        <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100">Submitted</Badge>
                      </div>
                    ) : coopStatus?.status === "rejected" ? (
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">{coopStatus.orgName ?? "Cooperative"}</p>
                        <Badge className="bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-100">Rejected</Badge>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No active cooperative membership.
                      </p>
                    )}

                    {!coopStatus?.verified && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Join a Cooperative</p>
                        <Input
                          placeholder="Enter join code"
                          value={joinCode}
                          onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                        />
                        <Button size="sm" onClick={handleJoinCooperative} disabled={joinLoading}>
                          {joinLoading ? "Submitting..." : "Submit join code"}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-border/60">
                  <CardHeader>
                    <CardTitle>My join request status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {!latestJoinRequest ? (
                      <p className="text-sm text-muted-foreground">No join request submitted yet.</p>
                    ) : latestJoinRequest.status === "submitted" ? (
                      <div className="space-y-1">
                        <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100">Awaiting cooperative approval</Badge>
                        <p className="text-xs text-muted-foreground">Submitted on {latestJoinRequest.createdAt?.toDate?.()?.toLocaleString?.() || "-"}</p>
                      </div>
                    ) : latestJoinRequest.status === "approved" ? (
                      <div className="space-y-1">
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">Approved</Badge>
                        <p className="text-xs text-muted-foreground">Approved on {latestJoinRequest.approvedAt?.toDate?.()?.toLocaleString?.() || "-"}</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Badge className="bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-100">Rejected</Badge>
                        <p className="text-xs text-muted-foreground">
                          Reason: {latestJoinRequest.rejectionReason || "No reason provided."}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="border-border/60">
                  <CardHeader>
                    <CardTitle>Contact</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Full name</p>
                      <p className="font-semibold">{formatValue(profile.fullName)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-semibold">{formatValue(profile.phone)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-semibold">{formatValue(profile.email)}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/60">
                  <CardHeader>
                    <CardTitle>Location</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">County</p>
                      <p className="font-semibold">{formatValue(profile.county)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Constituency</p>
                      <p className="font-semibold">{formatValue(profile.constituency)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Ward</p>
                      <p className="font-semibold">{formatValue(profile.ward)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Village</p>
                      <p className="font-semibold">{formatValue(profile.village)}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/60">
                  <CardHeader>
                    <CardTitle>Farm</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Type of farming</p>
                      <p className="font-semibold capitalize">
                        {formatValue(profile.typeOfFarming ?? profile.farmingType)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Farm size (acres)</p>
                      <p className="font-semibold">
                        {formatValue(profile.farmSizeAcres ?? profile.farmSize)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Experience (years)</p>
                      <p className="font-semibold">
                        {formatValue(profile.farmExperienceYears ?? profile.experienceYears)}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/60">
                  <CardHeader>
                    <CardTitle>Crops grown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {profile.crops?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {profile.crops.map((crop) => (
                          <Badge key={crop} variant="secondary" className="text-xs">
                            {crop}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="font-semibold">{formatValue(undefined)}</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-border/60">
                  <CardHeader>
                    <CardTitle>Tools & equipment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-semibold">
                      {formatValue(profile.toolsOrEquipment ?? profile.toolsOwned)}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border/60">
                  <CardHeader>
                    <CardTitle>Challenges</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-semibold">
                      {formatValue(profile.primaryChallenges ?? profile.challenges)}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border/60">
                  <CardHeader>
                    <CardTitle>Estimated monthly production</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-semibold">
                      {formatValue(profile.estimatedMonthlyProduction)}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
