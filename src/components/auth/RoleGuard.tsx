import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";

interface RoleGuardProps {
  allowed: Array<
    | "farmer"
    | "buyer"
    | "org_admin"
    | "org_staff"
    | "gov_admin"
    | "gov_analyst"
    | "gov_viewer"
    | "partner_admin"
    | "partner_analyst"
    | "partner_finance"
    | "admin"
    | "superadmin"
    | "unassigned"
  >;
  redirectTo?: string;
  ctaLabel?: string;
  children: React.ReactNode;
}

export function RoleGuard({ allowed, redirectTo = "/", ctaLabel, children }: RoleGuardProps) {
  const location = useLocation();
  const { role, isLoading } = useUserRole();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!allowed.includes(role)) {
    const target = role === "unassigned" ? "/registration" : redirectTo;
    return (
      <Navigate
        to="/unauthorized"
        replace
        state={{
          from: location.pathname,
          fallbackTo: target,
          fallbackLabel: ctaLabel,
          requiredRoles: allowed,
          currentRole: role,
        }}
      />
    );
  }

  return <>{children}</>;
}
