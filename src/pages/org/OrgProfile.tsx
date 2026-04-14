import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserAccount } from "@/hooks/useUserAccount";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { Building2, MapPin, Phone, Mail, Calendar, Users, TrendingUp, Award, Edit } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

export default function OrgProfile() {
  const account = useUserAccount();
  const navigate = useNavigate();
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [activeMembers, setActiveMembers] = useState(0);
  const [memberGrowth, setMemberGrowth] = useState<Array<{ month: string; count: number }>>([]);

  useEffect(() => {
    if (!account.data?.orgId) return;
    const load = async () => {
      setLoading(true);
      setErrorMessage(null);
      const orgId = account.data?.orgId;
      if (!orgId) {
        setLoading(false);
        return;
      }
      try {
        const orgSnap = await getDoc(doc(db, "orgs", orgId));
        if (orgSnap.exists()) {
          setOrg(orgSnap.data());
        } else {
          const legacySnap = await getDoc(doc(db, "organizations", orgId));
          setOrg(legacySnap.exists() ? legacySnap.data() : null);
        }

        // Load member stats
        const membersSnap = await getDocs(collection(db, "orgs", orgId, "members"));
        setMemberCount(membersSnap.size);
        
        let active = 0;
        const monthBuckets = new Map<string, number>();
        
        membersSnap.forEach((docSnap) => {
          const data = docSnap.data() as any;
          const status = data.status ?? data.verificationStatus;
          if (status === "active") active += 1;
          
          const date = data.joinedAt?.toDate?.() ?? data.createdAt?.toDate?.() ?? null;
          if (date) {
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
            monthBuckets.set(key, (monthBuckets.get(key) ?? 0) + 1);
          }
        });
        
        setActiveMembers(active);
        
        const growth = Array.from(monthBuckets.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .slice(-6)
          .map(([month, count]) => ({ month, count }));
        setMemberGrowth(growth);
      } catch (error: any) {
        const code = typeof error?.code === "string" ? error.code : "";
        const message = typeof error?.message === "string" ? error.message : "";
        const permissionDenied = code.includes("permission-denied") || /insufficient permissions/i.test(message);
        setOrg(null);
        setErrorMessage(
          permissionDenied
            ? "No access to this organization profile. Membership may not be set yet."
            : "Unable to load organization profile right now."
        );
      } finally {
        setLoading(false);
      }
    };
    load().catch(() => {
      setLoading(false);
      setErrorMessage("Unable to load organization profile right now.");
    });
  }, [account.data?.orgId]);

  if (loading || account.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Organization Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
          <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Banner */}
      <Card className="border-border/60 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary to-primary/60" />
        <CardContent className="-mt-16 pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="h-24 w-24 rounded-lg border-4 border-background bg-white flex items-center justify-center shadow-lg">
                <Building2 className="h-12 w-12 text-primary" />
              </div>
              <div className="pb-2">
                <h1 className="text-2xl font-bold text-foreground">{org?.orgName || org?.name || "Cooperative"}</h1>
                <p className="text-sm text-muted-foreground">{org?.county || "Kenya"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 pb-2">
              <Badge variant="secondary" className="text-sm">{org?.orgType || org?.type || "Cooperative"}</Badge>
              <Badge variant={org?.status === "active" ? "default" : "outline"} className="text-sm">
                {org?.status || "Active"}
              </Badge>
              <Button size="sm" variant="outline" className="gap-2">
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Members</p>
                <p className="mt-2 text-3xl font-bold">{memberCount}</p>
              </div>
              <div className="rounded-lg bg-blue-50 p-3">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Members</p>
                <p className="mt-2 text-3xl font-bold">{activeMembers}</p>
              </div>
              <div className="rounded-lg bg-green-50 p-3">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Years Active</p>
                <p className="mt-2 text-3xl font-bold">{org?.yearsInOperation || "--"}</p>
              </div>
              <div className="rounded-lg bg-purple-50 p-3">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Certifications</p>
                <p className="mt-2 text-3xl font-bold">--</p>
              </div>
              <div className="rounded-lg bg-amber-50 p-3">
                <Award className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Organization Details */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Organization Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Organization Name</p>
                <p className="font-semibold">{org?.orgName || org?.name || "-"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="font-semibold">{org?.county || "-"}</p>
                {org?.branchName && <p className="text-sm text-muted-foreground">{org.branchName}</p>}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Contact Phone</p>
                <p className="font-semibold">{org?.contactPhone || "-"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Contact Person</p>
                <p className="font-semibold">{org?.contactPerson || "-"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Registration Date</p>
                <p className="font-semibold">{org?.dateOfRegistration || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Member Growth Chart */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Member Growth</CardTitle>
            <p className="text-sm text-muted-foreground">New members over the last 6 months</p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {memberGrowth.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-muted-foreground">No growth data available</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={memberGrowth}>
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.2)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="justify-start" onClick={() => navigate("/org/members")}>
              <Users className="mr-2 h-4 w-4" />
              Manage Members
            </Button>
            <Button variant="outline" className="justify-start" onClick={() => navigate("/org/aggregation")}>
              <Calendar className="mr-2 h-4 w-4" />
              Plan Collection
            </Button>
            <Button variant="outline" className="justify-start" onClick={() => navigate("/org/group-prices")}>
              <TrendingUp className="mr-2 h-4 w-4" />
              Market Insights
            </Button>
            <Button variant="outline" className="justify-start" onClick={() => navigate("/org/subscription")}>
              <Award className="mr-2 h-4 w-4" />
              Subscription
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
