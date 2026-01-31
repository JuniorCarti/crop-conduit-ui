import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCard } from "@/components/shared/AlertCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { getFarmerProfileWithMigration, type FarmerProfile } from "@/services/firestore-farmer";
import { db } from "@/lib/firebase";
import { deleteDoc, doc, getDoc, setDoc, Timestamp } from "firebase/firestore";

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
  const [profile, setProfile] = useState<FarmerProfile | null>(null);
  const [pendingUpdate, setPendingUpdate] = useState<PendingUpdate | null>(null);
  const [loading, setLoading] = useState(true);

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
      } catch (error) {
        console.error("Failed to load farmer profile:", error);
        setProfile(null);
        setPendingUpdate(null);
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

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Farmer Profile" subtitle="Your farm and registration details">
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
      </PageHeader>
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-6">
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
            <Button onClick={() => navigate("/farmer-registration")}>
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
