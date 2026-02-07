import { ReactNode, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useUserAccount } from "@/hooks/useUserAccount";
import { Button } from "@/components/ui/button";

type OrgFeatureGuardProps = {
  feature: string;
  children: ReactNode;
};

export function OrgFeatureGuard({ feature, children }: OrgFeatureGuardProps) {
  const account = useUserAccount();
  const orgId = account.data?.orgId ?? "";
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    const check = async () => {
      if (!orgId) {
        setAllowed(false);
        return;
      }
      try {
        const snap = await getDoc(doc(db, "orgs", orgId, "subscription", "current"));
        if (!snap.exists()) {
          setAllowed(false);
          return;
        }
        const data = snap.data() as any;
        setAllowed(Boolean(data.featureFlags?.[feature]));
      } catch {
        setAllowed(false);
      }
    };
    check().catch(() => setAllowed(false));
  }, [feature, orgId]);

  if (allowed === null) {
    return <div className="rounded-lg border border-border/60 bg-card p-4 text-sm text-muted-foreground">Checking subscription access...</div>;
  }

  if (!allowed) {
    return (
      <div className="rounded-lg border border-border/60 bg-card p-6 space-y-2">
        <h2 className="text-base font-semibold">Feature locked by current plan</h2>
        <p className="text-sm text-muted-foreground">Upgrade plan or enable this feature in billing settings.</p>
        <Button asChild size="sm">
          <Link to="/org/billing">Go to Billing</Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
