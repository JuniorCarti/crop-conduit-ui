import { useUserAccount } from "@/hooks/useUserAccount";

export function useUserRole() {
  const accountQuery = useUserAccount();
  const role = (accountQuery.data?.role as
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
    | "unassigned") ?? "unassigned";
  const orgId = accountQuery.data?.orgId ?? null;
  return {
    role,
    orgId,
    isLoading: accountQuery.isLoading,
  };
}
