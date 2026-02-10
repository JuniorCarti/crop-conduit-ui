import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  setDoc,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { OrgType } from "@/config/orgCapabilities";

export type OrganizationType = "cooperative" | "enterprise" | "bank" | "ngo" | "government_national" | "gov_national";
export type OrganizationStatus = "active" | "suspended";

export interface OrganizationDoc {
  name: string;
  type: OrganizationType;
  createdByUid: string;
  createdAt: any;
  status: OrganizationStatus;
  verificationStatus?: "pending" | "approved" | "rejected";
  joinEnabled: boolean;
}

export interface OrganizationMemberDoc {
  uid: string;
  role: "admin" | "staff" | "member";
  memberType: "staff" | "farmer" | "buyer";
  joinedAt: any;
  sponsored: boolean;
  status: "active" | "pending" | "removed";
}

export interface OrganizationSubscriptionDoc {
  plan: "free" | "pro_seats" | "sponsor_farmers" | "enterprise" | "bank";
  seatsTotal: number;
  seatsUsed: number;
  sponsoredFarmersTotal: number;
  sponsoredFarmersUsed: number;
  features: Record<string, boolean>;
  billingStatus: "trial" | "active" | "past_due" | "cancelled";
  renewsAt?: string | null;
}

export async function createOrganization(
  payload: Omit<OrganizationDoc, "createdAt" | "status" | "joinEnabled">
): Promise<string> {
  const ref = await addDoc(collection(db, "organizations"), {
    ...payload,
    createdAt: Timestamp.now(),
    status: "active",
    joinEnabled: true,
  });
  return ref.id;
}

export async function getOrganization(orgId: string): Promise<OrganizationDoc | null> {
  const orgsRef = doc(db, "orgs", orgId);
  const orgsSnap = await getDoc(orgsRef);
  if (orgsSnap.exists()) {
    const data = orgsSnap.data() as any;
    return {
      name: data.orgName ?? data.name ?? "Organization",
      type: (data.orgType ?? data.type ?? "cooperative") as OrganizationType,
      createdByUid: data.createdByUid ?? data.createdBy ?? "",
      createdAt: data.createdAt ?? Timestamp.now(),
      status: data.status ?? "active",
      verificationStatus:
        data.verificationStatus ??
        ((data.status ?? "active") === "pending" ? "pending" : "approved"),
      joinEnabled: data.joinEnabled ?? true,
    };
  }

  const ref = doc(db, "organizations", orgId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data() as any;
  return {
    name: data.name ?? "Organization",
    type: (data.type ?? "cooperative") as OrganizationType,
    createdByUid: data.createdByUid ?? "",
    createdAt: data.createdAt ?? Timestamp.now(),
    status: data.status ?? "active",
    verificationStatus:
      data.verificationStatus ??
      ((data.status ?? "active") === "pending" ? "pending" : "approved"),
    joinEnabled: data.joinEnabled ?? true,
  };
}

export async function getOrgTypeById(orgId: string): Promise<OrgType | null> {
  const orgsRef = doc(db, "orgs", orgId);
  const orgsSnap = await getDoc(orgsRef);
  if (orgsSnap.exists()) {
    const data = orgsSnap.data() as any;
    return (data.orgType ?? data.type ?? null) as OrgType | null;
  }

  const ref = doc(db, "organizations", orgId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data() as any;
  return (data.type ?? data.orgType ?? null) as OrgType | null;
}

export async function addOrganizationMember(
  orgId: string,
  member: OrganizationMemberDoc
): Promise<void> {
  const ref = doc(db, "organizations", orgId, "members", member.uid);
  await setDoc(ref, { ...member }, { merge: true });
}

export async function listOrganizationMembers(orgId: string): Promise<OrganizationMemberDoc[]> {
  const orgsRef = collection(db, "orgs", orgId, "members");
  const orgsSnap = await getDocs(orgsRef);
  if (!orgsSnap.empty) {
    return orgsSnap.docs.map((docSnap) => docSnap.data() as OrganizationMemberDoc);
  }

  const ref = collection(db, "organizations", orgId, "members");
  const snap = await getDocs(ref);
  return snap.docs.map((docSnap) => docSnap.data() as OrganizationMemberDoc);
}

export async function upsertOrganizationSubscription(
  orgId: string,
  subscription: OrganizationSubscriptionDoc
): Promise<void> {
  const ref = doc(db, "organizations", orgId, "subscription", "current");
  await setDoc(ref, { ...subscription }, { merge: true });
}

export async function getOrganizationSubscription(
  orgId: string
): Promise<OrganizationSubscriptionDoc | null> {
  const ref = doc(db, "organizations", orgId, "subscription", "current");
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as OrganizationSubscriptionDoc;
}

export async function checkCreatorNeedsAdminMembershipFix(orgId: string, uid: string): Promise<boolean> {
  try {
    const userSnap = await getDoc(doc(db, "users", uid));
    if (!userSnap.exists()) return false;
    const user = userSnap.data() as any;
    if (user?.orgId !== orgId) return false;
    if (!["org_admin", "admin", "superadmin"].includes(user?.role)) return false;
  } catch {
    return false;
  }

  try {
    const memberSnap = await getDoc(doc(db, "orgs", orgId, "members", uid));
    return !memberSnap.exists();
  } catch (error: any) {
    const code = String(error?.code || "");
    // If read is blocked but user profile says org_admin of this org, allow showing fix CTA.
    if (code.includes("permission-denied")) return true;
    return false;
  }
}

export async function fixCreatorAdminMembership(params: {
  orgId: string;
  uid: string;
  name?: string | null;
  email?: string | null;
}) {
  // Keep this write-only. Rules should enforce whether user is allowed (creator/self).
  await setDoc(
    doc(db, "orgs", params.orgId, "members", params.uid),
    {
      uid: params.uid,
      role: "org_admin",
      name: params.name ?? "",
      email: params.email ?? "",
      status: "active",
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
}
