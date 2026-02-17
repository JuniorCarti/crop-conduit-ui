import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { getOrgFeatureFlags } from "@/services/orgFeaturesService";
import { createUserNotification } from "@/services/notificationService";

type JoinCodeLookup = {
  code: string;
  orgId: string;
  type: "staff" | "farmer" | "buyer";
  isActive?: boolean;
  active?: boolean;
  status?: "active" | "disabled";
  orgName?: string | null;
  expiresAt?: any;
  maxUses?: number;
  limit?: number;
  usedCount?: number;
  uses?: number;
};

export type CoopMembershipRecord = {
  orgId: string;
  memberId: string;
  status: string;
  seatType: "none" | "paid" | "sponsored";
  coopName: string | null;
  memberUid?: string | null;
  linkedUserUid?: string | null;
  userUid?: string | null;
};

export type OrgJoinRequest = {
  id: string;
  uid: string;
  orgId: string;
  joinCode: string;
  status: "submitted" | "approved" | "rejected";
  createdAt?: any;
  updatedAt?: any;
  approvedAt?: any;
  approvedByUid?: string | null;
  rejectedAt?: any;
  rejectedByUid?: string | null;
  rejectionReason?: string | null;
};

const normalizeMembershipStatus = (value: string | null | undefined) => {
  const normalized = String(value ?? "").toLowerCase();
  if (normalized === "approved" || normalized === "verified") return "active";
  if (!normalized) return "submitted";
  return normalized;
};

const normalizeCode = (value: string) => value.trim().toUpperCase();

const CLOCK_SKEW_BUFFER_MS = 2 * 60 * 1000;

const toDateValue = (value: any): Date | null => {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value?.toDate === "function") {
    const parsed = value.toDate();
    return parsed instanceof Date && !Number.isNaN(parsed.getTime()) ? parsed : null;
  }
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

const isJoinCodeActive = (code: JoinCodeLookup) => {
  const activeByFlag =
    code.isActive !== undefined
      ? code.isActive === true
      : code.active !== undefined
      ? code.active === true
      : code.status !== "disabled";
  const currentUses = Number(code.usedCount ?? code.uses ?? 0);
  const maxUsesRaw = code.maxUses ?? code.limit;
  const maxUses = maxUsesRaw == null ? null : Number(maxUsesRaw);
  const underUseLimit = maxUses == null || !Number.isFinite(maxUses) || currentUses < maxUses;
  const expiresAt = toDateValue(code.expiresAt);
  const notExpired = !expiresAt || expiresAt.getTime() >= Date.now() - CLOCK_SKEW_BUFFER_MS;
  return activeByFlag && underUseLimit && notExpired;
};

export async function findActiveJoinCode(code: string): Promise<JoinCodeLookup | null> {
  const normalized = normalizeCode(code);
  if (!normalized) return null;

  try {
    const groupBase = collectionGroup(db, "joinCodes");
    const byCode = await getDocs(query(groupBase, where("code", "==", normalized), limit(20)));
    if (!byCode.empty) {
      const activeDoc = byCode.docs.find((row) => {
        const data = row.data() as JoinCodeLookup;
        return isJoinCodeActive(data);
      });
      if (activeDoc) {
        const data = activeDoc.data() as JoinCodeLookup;
        return { ...data, code: normalized };
      }
    }
  } catch (error: any) {
    if (import.meta.env.DEV) {
      console.debug("[JoinCode] collectionGroup lookup denied/failure, using legacy fallback", {
        code: normalized,
        message: error?.message,
      });
    }
  }

  // Backward compatibility with legacy top-level joinCodes collection.
  const legacySnap = await getDoc(doc(db, "joinCodes", normalized));
  if (legacySnap.exists()) {
    const data = legacySnap.data() as JoinCodeLookup;
    return isJoinCodeActive(data) ? { ...data, code: normalized } : null;
  }

  const legacyByField = await getDocs(
    query(collection(db, "joinCodes"), where("code", "==", normalized), limit(1))
  ).catch(() => null);
  if (!legacyByField || legacyByField.empty) return null;
  const data = legacyByField.docs[0].data() as JoinCodeLookup;
  return isJoinCodeActive(data) ? { ...data, code: normalized } : null;
}

export async function getUserCoopMembership(uid: string): Promise<CoopMembershipRecord | null> {
  if (!uid) return null;

  const orgIdCandidates = new Set<string>();
  try {
    const membershipSnap = await getDocs(query(collection(db, "users", uid, "memberships"), limit(10)));
    membershipSnap.docs.forEach((row) => {
      const data = row.data() as any;
      if (data?.orgId) orgIdCandidates.add(String(data.orgId));
      else orgIdCandidates.add(row.id);
    });
  } catch {}

  try {
    const coopStatusSnap = await getDoc(doc(db, "users", uid, "coopVerification", "status"));
    if (coopStatusSnap.exists()) {
      const coopStatus = coopStatusSnap.data() as any;
      if (coopStatus?.orgId) orgIdCandidates.add(String(coopStatus.orgId));
    }
  } catch {}

  for (const orgId of orgIdCandidates) {
    const byUid = await getDoc(doc(db, "orgs", orgId, "members", uid));
    if (byUid.exists()) {
      const data = byUid.data() as any;
      return {
        orgId,
        memberId: byUid.id,
        status: normalizeMembershipStatus(data.status ?? data.verificationStatus ?? "submitted"),
        seatType: data.seatType ?? data.seatStatus ?? data.premiumSeatType ?? "none",
        coopName: data.coopName ?? data.orgName ?? null,
        memberUid: data.memberUid ?? null,
        linkedUserUid: data.linkedUserUid ?? null,
        userUid: data.userUid ?? null,
      };
    }

    const linkedSnap = await getDocs(
      query(collection(db, "orgs", orgId, "members"), where("linkedUserUid", "==", uid), limit(1))
    );
    if (!linkedSnap.empty) {
      const linkedDoc = linkedSnap.docs[0];
      const data = linkedDoc.data() as any;
      return {
        orgId,
        memberId: linkedDoc.id,
        status: normalizeMembershipStatus(data.status ?? data.verificationStatus ?? "submitted"),
        seatType: data.seatType ?? data.seatStatus ?? data.premiumSeatType ?? "none",
        coopName: data.coopName ?? data.orgName ?? null,
        memberUid: data.memberUid ?? null,
        linkedUserUid: data.linkedUserUid ?? null,
        userUid: data.userUid ?? null,
      };
    }

    const userUidSnap = await getDocs(
      query(collection(db, "orgs", orgId, "members"), where("userUid", "==", uid), limit(1))
    );
    if (!userUidSnap.empty) {
      const memberDoc = userUidSnap.docs[0];
      const data = memberDoc.data() as any;
      return {
        orgId,
        memberId: memberDoc.id,
        status: normalizeMembershipStatus(data.status ?? data.verificationStatus ?? "submitted"),
        seatType: data.seatType ?? data.seatStatus ?? data.premiumSeatType ?? "none",
        coopName: data.coopName ?? data.orgName ?? null,
        memberUid: data.memberUid ?? null,
        linkedUserUid: data.linkedUserUid ?? null,
        userUid: data.userUid ?? null,
      };
    }
  }

  // Legacy fallback path.
  const candidates: CoopMembershipRecord[] = [];
  const collect = (snap: any) => {
    snap.docs.forEach((memberDoc: any) => {
      const path = memberDoc.ref.path.split("/");
      if (path.length < 4 || path[0] !== "orgs") return;
      const orgId = path[1];
      const memberId = path[3];
      const data = memberDoc.data() as any;
      candidates.push({
        orgId,
        memberId,
        status: normalizeMembershipStatus(data.status ?? data.verificationStatus ?? "submitted"),
        seatType: data.seatType ?? data.seatStatus ?? data.premiumSeatType ?? "none",
        coopName: data.coopName ?? data.orgName ?? null,
        memberUid: data.memberUid ?? null,
        linkedUserUid: data.linkedUserUid ?? null,
        userUid: data.userUid ?? null,
      });
    });
  };

  try {
    const byMemberUid = await getDocs(query(collectionGroup(db, "members"), where("memberUid", "==", uid), limit(25)));
    collect(byMemberUid);
  } catch {}
  if (candidates.length === 0) {
    try {
      const byUserUid = await getDocs(query(collectionGroup(db, "members"), where("userUid", "==", uid), limit(25)));
      collect(byUserUid);
    } catch {}
  }
  if (candidates.length === 0) {
    try {
      const byLinkedUid = await getDocs(
        query(collectionGroup(db, "members"), where("linkedUserUid", "==", uid), limit(25))
      );
      collect(byLinkedUid);
    } catch {}
  }

  if (candidates.length === 0) return null;
  const active = candidates.find((item) => item.status === "active");
  return active ?? candidates[0];
}

export async function submitMembershipRequestWithJoinCode(params: {
  code: string;
  uid: string;
  fullName?: string | null;
  phone?: string | null;
  email?: string | null;
}) {
  const authedUid = auth.currentUser?.uid ?? params.uid;
  if (!authedUid) {
    throw new Error("Please log in and try again.");
  }
  if (authedUid !== params.uid && import.meta.env.DEV) {
    console.debug("[JoinCode] UID mismatch, using authenticated UID", {
      providedUid: params.uid,
      authedUid,
    });
  }

  const resolved = await findActiveJoinCode(params.code);
  if (!resolved || !isJoinCodeActive(resolved)) {
    throw new Error("Invalid code");
  }
  if (resolved.type !== "farmer") {
    throw new Error("This join code is not for farmer membership.");
  }

  const orgId = resolved.orgId;
  const coopStatusSnap = await getDoc(doc(db, "users", authedUid, "coopVerification", "status"));
  if (coopStatusSnap.exists()) {
    const coopStatus = coopStatusSnap.data() as any;
    if (coopStatus?.verified === true && coopStatus?.orgId === orgId) {
      throw new Error("You are already an active member of this cooperative.");
    }
    if (coopStatus?.verified === true && coopStatus?.orgId && coopStatus?.orgId !== orgId) {
      throw new Error("You already have an active cooperative membership.");
    }
  }

  const stableRequestRef = doc(db, "orgJoinRequests", `${orgId}_${authedUid}`);
  const stableRequestSnap = await getDoc(stableRequestRef).catch(() => null);
  const hasStablePending =
    stableRequestSnap?.exists() && String((stableRequestSnap.data() as any)?.status ?? "") === "submitted";

  let hasPendingForOrg = hasStablePending;
  if (!hasPendingForOrg) {
    try {
      const existingSubmitted = await getDocs(
        query(collection(db, "orgJoinRequests"), where("uid", "==", authedUid), limit(50))
      );
      hasPendingForOrg = existingSubmitted.docs.some((row) => {
        const data = row.data() as any;
        return data.orgId === orgId && data.status === "submitted";
      });
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.debug("[JoinCode] orgJoinRequests query denied/failure; using stable request check only", {
          uid: authedUid,
          orgId,
          message: error?.message,
        });
      }
    }
  }
  if (hasPendingForOrg) {
    throw new Error("You already have a pending membership request.");
  }

  // Anti-abuse: limit join attempts per user per UTC day.
  const today = new Date().toISOString().slice(0, 10);
  const rateRef = doc(db, "users", authedUid, "rateLimits", "joinRequests");
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(rateRef);
    const data = snap.exists() ? (snap.data() as any) : {};
    const day = String(data.day ?? "");
    const count = Number(data.count ?? 0);
    const nextCount = day === today ? count + 1 : 1;
    if (nextCount > 10) {
      throw new Error("Too many join attempts today. Please try again tomorrow.");
    }
    tx.set(
      rateRef,
      {
        day: today,
        count: nextCount,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  });

  const requestRef = stableRequestRef;
  const coopName = resolved.orgName ?? "Cooperative";
  await setDoc(
    requestRef,
    {
      uid: authedUid,
      orgId,
      joinCode: normalizeCode(params.code),
      userName: params.fullName ?? null,
      userPhone: params.phone ?? null,
      userEmail: params.email ?? null,
      status: "submitted",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      approvedAt: null,
      approvedByUid: null,
      rejectedAt: null,
      rejectedByUid: null,
      rejectionReason: null,
    },
    { merge: true }
  );

  await setDoc(
    doc(db, "users", authedUid, "coopVerification", "status"),
    {
      verified: false,
      status: "submitted",
      orgId,
      orgName: coopName,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  try {
    const flags = await getOrgFeatureFlags(orgId);
    if (flags.membershipsMirrorV2) {
      await setDoc(
        doc(db, "users", authedUid, "memberships", orgId),
        {
          orgId,
          role: "member",
          status: "submitted",
          joinedAt: null,
          linkedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }
    if (flags.notificationsV2) {
      await createUserNotification({
        uid: authedUid,
        orgId,
        type: "join_request_submitted",
        title: "Join request submitted",
        message: `Your request to join ${coopName} has been sent for approval.`,
      });
    }
  } catch {
    // Optional enhancements: never block primary join request flow.
  }

  return { orgId, coopName, status: "submitted" as const };
}

export async function getSubmittedJoinRequestForUser(uid: string): Promise<OrgJoinRequest | null> {
  if (!uid) return null;
  const snap = await getDocs(
    query(collection(db, "orgJoinRequests"), where("uid", "==", uid), limit(25))
  );
  if (snap.empty) return null;
  const submitted = snap.docs
    .map((row) => ({ id: row.id, ...(row.data() as any) } as OrgJoinRequest))
    .filter((row) => row.status === "submitted")
    .sort((a, b) => {
      const aTime = a.updatedAt?.toMillis?.() ?? a.createdAt?.toMillis?.() ?? 0;
      const bTime = b.updatedAt?.toMillis?.() ?? b.createdAt?.toMillis?.() ?? 0;
      return bTime - aTime;
    });
  return submitted[0] ?? null;
}

export async function getLatestJoinRequestForUser(uid: string): Promise<OrgJoinRequest | null> {
  if (!uid) return null;
  const snap = await getDocs(query(collection(db, "orgJoinRequests"), where("uid", "==", uid), limit(25)));
  if (snap.empty) return null;
  const rows = snap.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as any) } as OrgJoinRequest));
  rows.sort((a, b) => {
    const aTime = a.updatedAt?.toMillis?.() ?? a.createdAt?.toMillis?.() ?? 0;
    const bTime = b.updatedAt?.toMillis?.() ?? b.createdAt?.toMillis?.() ?? 0;
    return bTime - aTime;
  });
  return rows[0] ?? null;
}
