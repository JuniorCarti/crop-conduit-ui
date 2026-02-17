import { collection, collectionGroup, doc, getDoc, getDocs, limit, query, runTransaction, setDoc, Timestamp, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { addOrganizationMember } from "@/services/orgService";
import { getUserProfileDoc, upsertUserProfileDoc, type UserRole } from "@/services/userProfileService";
import { submitMembershipRequestWithJoinCode } from "@/services/cooperativeMembershipService";

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
  active?: boolean;
  limit?: number;
}

export type JoinCodeValidationReason = "NOT_FOUND" | "INACTIVE" | "EXPIRED" | "MAXED_OUT";

const CLOCK_SKEW_BUFFER_MS = 2 * 60 * 1000;

const normalizeCodeInput = (value: string) => value.trim().toUpperCase();

const toDateValue = (value: any): Date | null => {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value?.toDate === "function") {
    const parsed = value.toDate();
    return parsed instanceof Date && !Number.isNaN(parsed.getTime()) ? parsed : null;
  }
  if (typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

const toNumberOrNull = (value: any): number | null => {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

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

export async function resolveJoinCode(
  code: string
): Promise<{ orgId: string; joinCodeId: string; data: JoinCodeDoc } | null> {
  const normalized = normalizeCodeInput(code);
  if (!normalized) return null;

  try {
    const groupSnap = await getDocs(
      query(collectionGroup(db, "joinCodes"), where("code", "==", normalized), limit(1))
    );
    if (!groupSnap.empty) {
      const row = groupSnap.docs[0];
      const data = row.data() as JoinCodeDoc;
      return {
        orgId: String(data.orgId ?? row.ref.parent.parent?.id ?? ""),
        joinCodeId: row.id,
        data: { ...data, code: normalized },
      };
    }
  } catch (error: any) {
    if (import.meta.env.DEV) {
      console.debug("[JoinCode] collectionGroup lookup failed; trying legacy fallback", {
        code: normalized,
        message: error?.message,
      });
    }
  }

  const legacyRef = doc(db, "joinCodes", normalized);
  const legacySnap = await getDoc(legacyRef).catch(() => null);
  if (legacySnap?.exists()) {
    const data = legacySnap.data() as JoinCodeDoc;
    if (!data?.orgId) return null;
    return {
      orgId: data.orgId,
      joinCodeId: legacySnap.id,
      data: { ...data, code: normalized },
    };
  }

  const legacyByField = await getDocs(
    query(collection(db, "joinCodes"), where("code", "==", normalized), limit(1))
  ).catch(() => null);
  if (legacyByField && !legacyByField.empty) {
    const row = legacyByField.docs[0];
    const data = row.data() as JoinCodeDoc;
    if (!data?.orgId) return null;
    return {
      orgId: data.orgId,
      joinCodeId: row.id,
      data: { ...data, code: normalized },
    };
  }

  return null;
}

export function validateJoinCode(data: any): {
  ok: boolean;
  reason?: JoinCodeValidationReason;
  used: number;
  max: number;
  expiresAtDate: Date | null;
} {
  const active =
    data?.isActive !== undefined
      ? data.isActive === true
      : data?.active !== undefined
      ? data.active === true
      : data?.status !== "disabled";
  if (!active) {
    return { ok: false, reason: "INACTIVE", used: 0, max: Number.POSITIVE_INFINITY, expiresAtDate: null };
  }

  const used = Number(data?.usedCount ?? data?.uses ?? 0);
  const maxRaw = toNumberOrNull(data?.maxUses ?? data?.limit);
  const max = maxRaw === null ? Number.POSITIVE_INFINITY : maxRaw;
  if (Number.isFinite(max) && used >= max) {
    return { ok: false, reason: "MAXED_OUT", used, max, expiresAtDate: null };
  }

  const expiresAtDate = toDateValue(data?.expiresAt);
  if (expiresAtDate && expiresAtDate.getTime() < Date.now() - CLOCK_SKEW_BUFFER_MS) {
    return { ok: false, reason: "EXPIRED", used, max, expiresAtDate };
  }

  return { ok: true, used, max, expiresAtDate };
}

export async function getJoinCode(code: string): Promise<JoinCodeDoc | null> {
  const resolved = await resolveJoinCode(code);
  if (!resolved) return null;
  return resolved.data;
}

export function isJoinCodeValid(docData: JoinCodeDoc): boolean {
  return validateJoinCode(docData).ok;
}

export async function applyJoinCode(
  code: string,
  uid: string,
  memberType: JoinCodeType,
  displayName?: string | null,
  email?: string | null,
  phone?: string | null
): Promise<void> {
  const resolved = await resolveJoinCode(code);
  if (!resolved) throw new Error("Join code not found.");
  const data = resolved.data;
  const validation = validateJoinCode(data);
  if (!validation.ok) {
    if (validation.reason === "EXPIRED") throw new Error("Join code has expired.");
    if (validation.reason === "INACTIVE") throw new Error("Join code is disabled.");
    if (validation.reason === "MAXED_OUT") throw new Error("Join code has reached maximum uses.");
    throw new Error("Join code is invalid or expired.");
  }

  const normalizedCode = (data.code ?? code).toUpperCase();
  const ref = doc(db, "joinCodes", normalizedCode);
  await runTransaction(db, async (tx) => {
    const nextUses = Number(data.usedCount ?? data.uses ?? 0) + 1;
    const legacySnap = await tx.get(ref);
    const nestedRef = doc(db, "orgs", data.orgId, "joinCodes", resolved.joinCodeId);
    const nestedSnap = await tx.get(nestedRef);
    const nestedByCodeRef =
      resolved.joinCodeId !== normalizedCode
        ? doc(db, "orgs", data.orgId, "joinCodes", normalizedCode)
        : null;
    const nestedByCodeSnap = nestedByCodeRef ? await tx.get(nestedByCodeRef) : null;

    if (legacySnap.exists()) {
      tx.update(ref, {
        uses: nextUses,
        usedCount: nextUses,
        updatedAt: Timestamp.now(),
      });
    }
    if (nestedSnap.exists()) {
      tx.update(nestedRef, {
        uses: nextUses,
        usedCount: nextUses,
        updatedAt: Timestamp.now(),
      });
    }

    if (nestedByCodeRef && nestedByCodeSnap?.exists()) {
      tx.update(nestedByCodeRef, {
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
