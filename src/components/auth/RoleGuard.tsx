import { useLocation, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
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
    const buttonLabel =
      ctaLabel ||
      (target.startsWith("/marketplace")
        ? "Go to Marketplace"
        : target.startsWith("/org")
        ? "Go to Org Portal"
        : target.startsWith("/gov")
        ? "Go to Government Portal"
        : target.startsWith("/profile")
        ? "Go to Profile"
        : target.startsWith("/registration")
        ? "Complete registration"
        : "Go to your home");
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-3">
          <p className="text-lg font-semibold">Access restricted</p>
          <p className="text-sm text-muted-foreground">
            You do not have access to this page.
          </p>
          <button
            type="button"
            onClick={() => navigate(target, { replace: true, state: { from: location } })}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
