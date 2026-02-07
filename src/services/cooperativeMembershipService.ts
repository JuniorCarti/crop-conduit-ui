import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type JoinCodeLookup = {
  code: string;
  orgId: string;
  type: "staff" | "farmer" | "buyer";
  isActive?: boolean;
  status?: "active" | "disabled";
  orgName?: string | null;
  expiresAt?: any;
  maxUses?: number;
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

const normalizeCode = (value: string) => value.trim().toUpperCase();

const isJoinCodeActive = (code: JoinCodeLookup) => {
  const activeByFlag = code.isActive === undefined ? code.status !== "disabled" : code.isActive === true;
  const underUseLimit = code.maxUses == null || Number(code.uses ?? 0) < Number(code.maxUses);
  const notExpired =
    !code.expiresAt ||
    (typeof code.expiresAt?.toDate === "function"
      ? code.expiresAt.toDate().getTime() > Date.now()
      : true);
  return activeByFlag && underUseLimit && notExpired;
};

export async function findActiveJoinCode(code: string): Promise<JoinCodeLookup | null> {
  const normalized = normalizeCode(code);
  if (!normalized) return null;

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

  // Backward compatibility with legacy top-level joinCodes collection.
  const legacySnap = await getDoc(doc(db, "joinCodes", normalized));
  if (!legacySnap.exists()) return null;
  const data = legacySnap.data() as JoinCodeLookup;
  return { ...data, code: normalized };
}

export async function getUserCoopMembership(uid: string): Promise<CoopMembershipRecord | null> {
  if (!uid) return null;

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
        status: data.status ?? data.verificationStatus ?? "submitted",
        seatType: data.seatType ?? data.seatStatus ?? data.premiumSeatType ?? "none",
        coopName: data.coopName ?? data.orgName ?? null,
        memberUid: data.memberUid ?? null,
        linkedUserUid: data.linkedUserUid ?? null,
        userUid: data.userUid ?? null,
      });
    });
  };

  const byMemberUid = await getDocs(query(collectionGroup(db, "members"), where("memberUid", "==", uid), limit(25)));
  collect(byMemberUid);
  if (candidates.length === 0) {
    const byUserUid = await getDocs(query(collectionGroup(db, "members"), where("userUid", "==", uid), limit(25)));
    collect(byUserUid);
  }
  if (candidates.length === 0) {
    const byLinkedUid = await getDocs(
      query(collectionGroup(db, "members"), where("linkedUserUid", "==", uid), limit(25))
    );
    collect(byLinkedUid);
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
  const resolved = await findActiveJoinCode(params.code);
  if (!resolved || !isJoinCodeActive(resolved)) {
    throw new Error("Invalid code");
  }
  if (resolved.type !== "farmer") {
    throw new Error("This join code is not for farmer membership.");
  }

  const orgId = resolved.orgId;
  const coopStatusSnap = await getDoc(doc(db, "users", params.uid, "coopVerification", "status"));
  if (coopStatusSnap.exists()) {
    const coopStatus = coopStatusSnap.data() as any;
    if (coopStatus?.verified === true && coopStatus?.orgId === orgId) {
      throw new Error("You are already an active member of this cooperative.");
    }
    if (coopStatus?.verified === true && coopStatus?.orgId && coopStatus?.orgId !== orgId) {
      throw new Error("You already have an active cooperative membership.");
    }
  }

  const existingSubmitted = await getDocs(
    query(collection(db, "orgJoinRequests"), where("uid", "==", params.uid), limit(50))
  );
  const hasPendingForOrg = existingSubmitted.docs.some((row) => {
    const data = row.data() as any;
    return data.orgId === orgId && data.status === "submitted";
  });
  if (hasPendingForOrg) {
    throw new Error("You already have a pending membership request.");
  }

  const requestId = `${orgId}_${params.uid}_${Date.now()}`;
  const requestRef = doc(db, "orgJoinRequests", requestId);
  const coopName = resolved.orgName ?? "Cooperative";
  await setDoc(
    requestRef,
    {
      uid: params.uid,
      orgId,
      joinCode: normalizeCode(params.code),
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
    doc(db, "users", params.uid, "coopVerification", "status"),
    {
      verified: false,
      status: "submitted",
      orgId,
      orgName: coopName,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

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
