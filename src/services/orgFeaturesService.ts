import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type OrgFeatureFlags = {
  invitesV2: boolean;
  analyticsV2: boolean;
  notificationsV2: boolean;
  membershipsMirrorV2: boolean;
  phase3Partners: boolean;
  phase3Sponsorships: boolean;
  phase3RevenueShare: boolean;
  phase3SellOnBehalf: boolean;
  phase3Impact: boolean;
  phase3Reports: boolean;
  phase3DonorExports: boolean;
};

export const DEFAULT_ORG_FEATURE_FLAGS: OrgFeatureFlags = {
  invitesV2: true,
  analyticsV2: true,
  notificationsV2: true,
  membershipsMirrorV2: true,
  phase3Partners: true,
  phase3Sponsorships: true,
  phase3RevenueShare: true,
  phase3SellOnBehalf: true,
  phase3Impact: true,
  phase3Reports: true,
  phase3DonorExports: true,
};

export async function ensureOrgFeatureFlags(orgId: string): Promise<OrgFeatureFlags> {
  const ref = doc(db, "orgs", orgId, "settings", "features");
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(
      ref,
      {
        ...DEFAULT_ORG_FEATURE_FLAGS,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return { ...DEFAULT_ORG_FEATURE_FLAGS };
  }
  return { ...DEFAULT_ORG_FEATURE_FLAGS };
}

export async function getOrgFeatureFlags(orgId: string): Promise<OrgFeatureFlags> {
  return ensureOrgFeatureFlags(orgId);
}
