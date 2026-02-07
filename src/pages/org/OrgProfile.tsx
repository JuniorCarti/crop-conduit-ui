import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserAccount } from "@/hooks/useUserAccount";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function OrgProfile() {
  const account = useUserAccount();
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
          return;
        }
        const legacySnap = await getDoc(doc(db, "organizations", orgId));
        setOrg(legacySnap.exists() ? legacySnap.data() : null);
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
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">Loading organization profile...</CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Organization Profile</h1>
            <p className="text-sm text-muted-foreground">Manage organization details.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{org?.orgType || org?.type || "Org"}</Badge>
            <Badge variant="outline">{org?.status || "pending"}</Badge>
            <Button size="sm" variant="outline">Edit</Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Organization Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Name</p>
              <p className="font-semibold">{org?.orgName || org?.name || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Type</p>
              <p className="font-semibold">{org?.orgType || org?.type || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Contact person</p>
              <p className="font-semibold">{org?.contactPerson || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Contact phone</p>
              <p className="font-semibold">{org?.contactPhone || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Branch</p>
              <p className="font-semibold">{org?.branchName || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Date of registration</p>
              <p className="font-semibold">{org?.dateOfRegistration || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Years in operation</p>
              <p className="font-semibold">{org?.yearsInOperation || "-"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
