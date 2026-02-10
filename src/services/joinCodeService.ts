import { collection, doc, getDoc, getDocs, query, runTransaction, setDoc, Timestamp, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { addOrganizationMember } from "@/services/orgService";
import { getUserProfileDoc, upsertUserProfileDoc, type UserRole } from "@/services/userProfileService";
import { findActiveJoinCode, submitMembershipRequestWithJoinCode } from "@/services/cooperativeMembershipService";

export type JoinCodeType = "staff" | "farmer" | "buyer";

export interface JoinCodeDoc {
  id?: string;
  code?: string;
  orgId: string;
  type: JoinCodeType;
  createdByUid: string;
  expiresAt: any;
  maxUses: number;
  uses: number;
  usedCount?: number;
  isActive?: boolean;
  status: "active" | "disabled";
  orgName?: string | null;
}

const generateJoinCodeValue = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

export async function createJoinCode(params: {
  orgId: string;
  type: JoinCodeType;
  createdByUid: string;
  maxUses?: number;
  expiresAt?: Date | null;
  orgName?: string | null;
}) {
  const attempts = 5;
  for (let i = 0; i < attempts; i += 1) {
    const code = generateJoinCodeValue();
    const legacyRef = doc(db, "joinCodes", code);
    const nestedRef = doc(db, "orgs", params.orgId, "joinCodes", code);
    const [legacySnap, nestedSnap] = await Promise.all([getDoc(legacyRef), getDoc(nestedRef)]);
    if (legacySnap.exists() || nestedSnap.exists()) continue;
    const payload = {
      code,
      orgId: params.orgId,
      orgName: params.orgName ?? null,
      type: params.type,
      createdByUid: params.createdByUid,
      expiresAt: params.expiresAt ? Timestamp.fromDate(params.expiresAt) : null,
      maxUses: params.maxUses ?? 50,
      uses: 0,
      usedCount: 0,
      isActive: true,
      status: "active" as const,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    await Promise.all([
      setDoc(nestedRef, payload),
      // Backward-compatible mirror for legacy join flow.
      setDoc(legacyRef, payload, { merge: true }),
    ]);
    return code;
  }
  throw new Error("Unable to generate join code. Please try again.");
}

export async function getJoinCode(code: string): Promise<JoinCodeDoc | null> {
  const resolved = await findActiveJoinCode(code);
  return resolved as JoinCodeDoc | null;
}

export function isJoinCodeValid(docData: JoinCodeDoc): boolean {
  const activeFlag = docData.isActive === undefined ? docData.status === "active" : docData.isActive;
  if (!activeFlag) return false;
  const currentUses = Number(docData.usedCount ?? docData.uses ?? 0);
  if (docData.maxUses != null && currentUses >= docData.maxUses) return false;
  if (docData.expiresAt && docData.expiresAt.toDate) {
    return docData.expiresAt.toDate().getTime() > Date.now();
  }
  return true;
}

export async function applyJoinCode(
  code: string,
  uid: string,
  memberType: JoinCodeType,
  displayName?: string | null,
  email?: string | null,
  phone?: string | null
): Promise<void> {
  const data = (await getJoinCode(code)) as JoinCodeDoc | null;
  if (!data) throw new Error("Join code not found.");
  if (!isJoinCodeValid(data)) {
    throw new Error("Join code is invalid or expired.");
  }

  const ref = doc(db, "joinCodes", (data.code ?? code).toUpperCase());
  await runTransaction(db, async (tx) => {
    const legacySnap = await tx.get(ref);
    const nextUses = Number(data.usedCount ?? data.uses ?? 0) + 1;
    if (legacySnap.exists()) {
      tx.update(ref, {
        uses: nextUses,
        usedCount: nextUses,
        updatedAt: Timestamp.now(),
      });
    }
    const nestedRef = doc(db, "orgs", data.orgId, "joinCodes", (data.code ?? code).toUpperCase());
    const nestedSnap = await tx.get(nestedRef);
    if (nestedSnap.exists()) {
      tx.update(nestedRef, {
        uses: nextUses,
        usedCount: nextUses,
        updatedAt: Timestamp.now(),
      });
    }
  });

  const orgRole = memberType === "staff" ? "staff" : null;
  const userRole: UserRole = memberType === "staff" ? "org_staff" : memberType === "buyer" ? "buyer" : "farmer";

  if (memberType === "farmer") {
    await submitMembershipRequestWithJoinCode({
      code: data.code ?? code,
      uid,
      fullName: displayName ?? "Farmer",
      phone: phone ?? null,
      email: email ?? null,
    });

    const profile = await getUserProfileDoc(uid);
    await upsertUserProfileDoc(uid, {
      role: profile?.role ?? "farmer",
      displayName: displayName ?? profile?.displayName ?? undefined,
      email: email ?? profile?.email ?? undefined,
      phone: phone ?? profile?.phone,
    });
    return;
  }

  await addOrganizationMember(data.orgId, {
    uid,
    role: memberType === "staff" ? "staff" : "member",
    memberType: memberType === "staff" ? "staff" : memberType,
    joinedAt: Timestamp.now(),
    sponsored: memberType === "farmer",
    status: "active",
  });

  await setDoc(
    doc(db, "orgMembers", `${data.orgId}_${uid}`),
    {
      orgId: data.orgId,
      uid,
      role: memberType === "staff" ? "org_staff" : "member",
      memberType: memberType === "staff" ? "staff" : memberType,
      joinedAt: Timestamp.now(),
      sponsored: memberType === "farmer",
      status: "active",
    },
    { merge: true }
  );

  await upsertUserProfileDoc(uid, {
    role: userRole,
    orgId: data.orgId,
    orgRole,
    displayName: displayName ?? undefined,
    email: email ?? undefined,
  });
}

export async function listOrgJoinCodes(orgId: string): Promise<JoinCodeDoc[]> {
  const snap = await getDocs(query(collection(db, "orgs", orgId, "joinCodes"), where("orgId", "==", orgId)));
  return snap.docs.map((row) => ({ id: row.id, ...(row.data() as any) } as JoinCodeDoc));
}

export async function updateOrgJoinCodeStatus(orgId: string, code: string, isActive: boolean): Promise<void> {
  const normalized = code.toUpperCase();
  await setDoc(
    doc(db, "orgs", orgId, "joinCodes", normalized),
    {
      isActive,
      status: isActive ? "active" : "disabled",
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  );
  await setDoc(
    doc(db, "joinCodes", normalized),
    {
      isActive,
      status: isActive ? "active" : "disabled",
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  );
}

export const buildJoinDeepLink = (code: string) => `agrismart://join?code=${encodeURIComponent(code)}`;
export const buildJoinWebLink = (code: string) => `/join?code=${encodeURIComponent(code)}`;
