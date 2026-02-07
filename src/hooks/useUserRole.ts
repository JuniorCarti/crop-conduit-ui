import { useUserAccount } from "@/hooks/useUserAccount";

export function useUserRole() {
  const accountQuery = useUserAccount();
  const role = (accountQuery.data?.role as
    | "farmer"
    | "buyer"
    | "org_admin"
    | "org_staff"
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
