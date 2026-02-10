import { useMemo } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { useQuery } from "@tanstack/react-query";
import { useUserAccount } from "@/hooks/useUserAccount";
import { db } from "@/lib/firebase";

type GovGuardStatus = {
  orgType: string | null;
  verificationStatus: string | null;
};

export function GovTypeGuard() {
  const location = useLocation();
  const account = useUserAccount();
  const orgId = account.data?.orgId ?? null;
  const role = account.data?.role ?? null;
  const userRolesAllowed = role === "org_admin" || role === "org_staff" || role === "gov_admin" || role === "gov_analyst" || role === "gov_viewer" || role === "admin" || role === "superadmin";

  const query = useQuery({
    queryKey: ["govGuard", orgId],
    enabled: Boolean(orgId && userRolesAllowed),
    staleTime: 30_000,
    queryFn: async (): Promise<GovGuardStatus> => {
      const snap = await getDoc(doc(db, "orgs", orgId!));
      if (!snap.exists()) return { orgType: null, verificationStatus: null };
      const data = snap.data() as any;
      return {
        orgType: data.orgType ?? data.type ?? null,
        verificationStatus: data.verificationStatus ?? data.status ?? null,
      };
    },
  });

  const isLoading = account.isLoading || account.isFetching || query.isLoading || query.isFetching;
  const canBypass = role === "admin" || role === "superadmin";
  const orgType = query.data?.orgType ?? null;
  const verificationStatus = query.data?.verificationStatus ?? null;
  const isGovOrg = useMemo(
    () => orgType === "government_national" || orgType === "gov_national",
    [orgType]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Checking government portal access...</p>
        </div>
      </div>
    );
  }

  if (!canBypass && !userRolesAllowed) {
    return <Navigate to="/profile" replace state={{ from: location.pathname }} />;
  }

  if (!canBypass && !isGovOrg) {
    return <Navigate to="/org" replace state={{ from: location.pathname }} />;
  }

  if (!canBypass && verificationStatus !== "approved") {
    return <Navigate to="/gov/under-review" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

