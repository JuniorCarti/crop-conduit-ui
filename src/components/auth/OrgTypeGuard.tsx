import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useOrgType } from "@/hooks/useOrgType";
import type { OrgType } from "@/config/orgCapabilities";

interface OrgTypeGuardProps {
  allowed: OrgType[];
  redirectTo?: string;
  ctaLabel?: string;
  children: React.ReactNode;
}

export function OrgTypeGuard({ allowed, redirectTo = "/org", ctaLabel, children }: OrgTypeGuardProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, isLoading: isRoleLoading } = useUserRole();
  const { orgType, isLoading: isOrgLoading } = useOrgType();
  const [resolvedType, setResolvedType] = useState<OrgType | null>(orgType);

  useEffect(() => {
    setResolvedType(orgType ?? null);
  }, [orgType]);

  const canBypass = useMemo(() => role === "admin" || role === "superadmin", [role]);
  const isLoading = isRoleLoading || isOrgLoading;

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

  if (!canBypass && (!resolvedType || !allowed.includes(resolvedType))) {
    const buttonLabel = ctaLabel ?? "Go to Org Portal";
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-3">
          <p className="text-lg font-semibold">Coming soon</p>
          <p className="text-sm text-muted-foreground">
            This module is available for cooperatives only. Your organization has a different portal.
          </p>
          <button
            type="button"
            onClick={() => navigate(redirectTo, { replace: true, state: { from: location } })}
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
