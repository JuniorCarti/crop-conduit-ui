import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useUserAccount } from "@/hooks/useUserAccount";
import { db } from "@/lib/firebase";
import {
  getLatestJoinRequestForUser,
  getSubmittedJoinRequestForUser,
  getUserCoopMembership,
  submitMembershipRequestWithJoinCode,
} from "@/services/cooperativeMembershipService";
import { listFarmerBids } from "@/services/farmerBidsService";
import { toast } from "sonner";

export default function Cooperatives() {
  const { currentUser } = useAuth();
  const accountQuery = useUserAccount();
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [coopStatus, setCoopStatus] = useState<{ verified: boolean; orgName?: string | null; status?: string | null } | null>(null);
  const [membership, setMembership] = useState<any | null>(null);
  const [latestRequestReason, setLatestRequestReason] = useState<string | null>(null);
  const [activeBids, setActiveBids] = useState<Array<{ orgId: string; bidId: string; commodity: string; orgName: string; closesAt?: any }>>([]);

  useEffect(() => {
    const loadStatus = async () => {
      if (!currentUser?.uid) return;
      const membership = await getUserCoopMembership(currentUser.uid);
      setMembership(membership);
      if (membership?.status === "active") {
        let resolvedName = membership.coopName ?? null;
        if (!resolvedName && membership.orgId) {
          const orgSnap = await getDoc(doc(db, "orgs", membership.orgId));
          if (orgSnap.exists()) {
            const orgData = orgSnap.data() as any;
            resolvedName = orgData?.orgName ?? orgData?.name ?? null;
          }
        }
        setCoopStatus({
          verified: true,
          orgName: resolvedName,
          status: "active",
        });
        return;
      }
      const submitted = await getSubmittedJoinRequestForUser(currentUser.uid);
      if (submitted) {
        setCoopStatus({
          verified: false,
          orgName: membership?.coopName ?? null,
          status: "submitted",
        });
        return;
      }
      const latest = await getLatestJoinRequestForUser(currentUser.uid);
      if (latest?.status === "rejected") {
        setLatestRequestReason(latest.rejectionReason ?? null);
        setCoopStatus({
          verified: false,
          orgName: membership?.coopName ?? null,
          status: "rejected",
        });
        return;
      }
      const snap = await getDoc(doc(db, "users", currentUser.uid, "coopVerification", "status"));
      if (snap.exists()) {
        const data = snap.data() as any;
        setCoopStatus({
          verified: Boolean(data.verified),
          orgName: data.orgName ?? null,
          status: data.status ?? (data.verified ? "active" : "submitted"),
        });
      } else {
        setCoopStatus({ verified: false });
        setMembership(null);
        setLatestRequestReason(null);
      }
    };
    loadStatus().catch(() => setCoopStatus({ verified: false }));
  }, [currentUser?.uid]);

  useEffect(() => {
    if (!currentUser?.uid) return;
    listFarmerBids(currentUser.uid)
      .then((result) => {
        setActiveBids(
          result.activeBids.slice(0, 3).map((bid) => ({
            orgId: bid.orgId,
            bidId: bid.bidId,
            commodity: bid.commodity,
            orgName: bid.orgName,
            closesAt: bid.closesAt,
          }))
        );
      })
      .catch(() => setActiveBids([]));
  }, [currentUser?.uid]);

  const formatCountdown = (value: any) => {
    const date = value?.toDate?.() ?? (value ? new Date(value) : null);
    if (!date || Number.isNaN(date.getTime())) return "--";
    const diff = date.getTime() - Date.now();
    if (diff <= 0) return "Closing";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return hours >= 24 ? `${Math.floor(hours / 24)}d ${hours % 24}h` : `${hours}h ${mins}m`;
  };

  const handleJoin = async () => {
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
      const profile = accountQuery.data;
      const result = await submitMembershipRequestWithJoinCode({
        code: joinCode.trim(),
        uid: currentUser.uid,
        fullName: profile?.displayName ?? currentUser.displayName ?? "Farmer",
        phone: profile?.phone ?? currentUser.phoneNumber ?? null,
        email: profile?.email ?? currentUser.email ?? null,
      });
      setCoopStatus({ verified: false, orgName: result.coopName, status: result.status });
      toast.success("Request sent to cooperative for approval.");
      setJoinCode("");
    } catch (error: any) {
      toast.error(error?.message || "Failed to submit join request.");
    } finally {
      setJoinLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Join a cooperative</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Enter join code"
            value={joinCode}
            onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
          />
          <Button onClick={handleJoin} disabled={joinLoading}>
            {joinLoading ? "Joining..." : "Join"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">My cooperative membership</CardTitle>
        </CardHeader>
        <CardContent>
          {coopStatus?.verified ? (
            <div className="space-y-1">
              <p className="text-sm font-semibold">{coopStatus.orgName ?? "Cooperative"}</p>
              <p className="text-xs text-emerald-700">Status: Active</p>
              <p className="text-xs text-muted-foreground">Seat: {membership?.seatType ?? "none"}</p>
              <Badge variant="verified">Verified badge</Badge>
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
              {latestRequestReason && (
                <p className="text-xs text-muted-foreground">Reason: {latestRequestReason}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No active cooperative membership. Join with a code to request verification.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Active bids</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {activeBids.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active bids available right now.</p>
          ) : (
            activeBids.map((bid) => (
              <div key={`${bid.orgId}-${bid.bidId}`} className="rounded border border-border/60 p-3 text-sm">
                <p className="font-medium">{bid.commodity}</p>
                <p className="text-xs text-muted-foreground">{bid.orgName} • closes in {formatCountdown(bid.closesAt)}</p>
              </div>
            ))
          )}
          <Button variant="outline" onClick={() => navigate("/farmer/bids")}>View All</Button>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Coop announcements</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No announcements available.</p>
        </CardContent>
      </Card>
    </div>
  );
}
