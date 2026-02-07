import { useMemo } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { useQuery } from "@tanstack/react-query";
import { useUserAccount } from "@/hooks/useUserAccount";
import { db } from "@/lib/firebase";

type OrgApprovalStatus = "pending" | "approved" | "rejected" | "unknown";

export function OrgApprovalGuard({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const account = useUserAccount();
  const orgId = account.data?.orgId ?? null;
  const role = account.data?.role ?? null;
  const isOrgRole = role === "org_admin" || role === "org_staff";

  const statusQuery = useQuery({
    queryKey: ["orgApprovalStatus", orgId],
    enabled: Boolean(orgId && isOrgRole),
    staleTime: 60_000,
    queryFn: async (): Promise<OrgApprovalStatus> => {
      if (!orgId) return "unknown";
      const orgSnap = await getDoc(doc(db, "orgs", orgId));
      if (!orgSnap.exists()) return "unknown";
      const status = (orgSnap.data() as any)?.verificationStatus;
      if (status === "approved" || status === "pending" || status === "rejected") return status;
      return "pending";
    },
  });

  const isLoading = account.isLoading || account.isFetching || statusQuery.isLoading || statusQuery.isFetching;
  const status = useMemo(() => statusQuery.data ?? "unknown", [statusQuery.data]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Checking organization approval...</p>
        </div>
      </div>
    );
  }

  if (isOrgRole && status !== "approved") {
    return (
      <Navigate
        to="/org/under-review"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return <>{children}</>;
}

