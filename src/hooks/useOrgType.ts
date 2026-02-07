import { useEffect, useState } from "react";
import { useUserAccount } from "@/hooks/useUserAccount";
import { getOrgTypeById } from "@/services/orgService";
import type { OrgType } from "@/config/orgCapabilities";

export function useOrgType() {
  const accountQuery = useUserAccount();
  const [orgType, setOrgType] = useState<OrgType | null>(
    (accountQuery.data?.orgType as OrgType | undefined) ?? null
  );
  const orgId = accountQuery.data?.orgId ?? null;

  useEffect(() => {
    const storedType = accountQuery.data?.orgType as OrgType | undefined;
    if (storedType) {
      setOrgType(storedType);
      return;
    }

    if (!orgId) {
      setOrgType(null);
      return;
    }

    let active = true;
    getOrgTypeById(orgId)
      .then((type) => {
        if (!active) return;
        setOrgType(type ?? null);
      })
      .catch(() => {
        if (!active) return;
        setOrgType(null);
      });

    return () => {
      active = false;
    };
  }, [accountQuery.data?.orgType, orgId]);

  return {
    orgType,
    orgId,
    isLoading: accountQuery.isLoading,
  };
}
