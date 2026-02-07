import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useUserAccount } from "@/hooks/useUserAccount";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function OrgUnderReview() {
  const account = useUserAccount();
  const orgId = account.data?.orgId ?? null;

  const orgQuery = useQuery({
    queryKey: ["orgReviewStatus", orgId],
    enabled: Boolean(orgId),
    queryFn: async () => {
      if (!orgId) return null;
      const snap = await getDoc(doc(db, "orgs", orgId));
      return snap.exists() ? (snap.data() as any) : null;
    },
  });

  const status = useMemo(() => {
    const value = orgQuery.data?.verificationStatus;
    if (value === "approved" || value === "rejected" || value === "pending") return value;
    return "pending";
  }, [orgQuery.data]);

  const rejectionReason = orgQuery.data?.rejectionReason || null;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8 bg-background">
      <Card className="w-full max-w-xl border-border/60">
        <CardHeader className="space-y-3 text-center">
          <CardTitle className="text-2xl">Your Application is Under Review</CardTitle>
          <div className="flex justify-center">
            <Badge variant={status === "rejected" ? "destructive" : "secondary"} className="capitalize">
              {status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            We are verifying your organization documents. You will get access once approved.
          </p>
          {status === "rejected" && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-left">
              <p className="font-medium text-destructive mb-1">Application rejected</p>
              <p className="text-muted-foreground">{rejectionReason || "No rejection reason provided."}</p>
            </div>
          )}
          <div className="flex justify-center gap-2 pt-2">
            {status === "rejected" && (
              <Button asChild>
                <Link to="/org-registration">Edit &amp; Resubmit</Link>
              </Button>
            )}
            <Button asChild variant="outline">
              <Link to="/profile">Go to Profile</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

