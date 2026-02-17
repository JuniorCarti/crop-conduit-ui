import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type VerifiedBadgeType = "farmer" | "buyer" | "cooperative";

export type UserVerificationProfile = {
  uid: string;
  displayName: string | null;
  badgeType: VerifiedBadgeType | null;
};

const cache = new Map<string, Promise<UserVerificationProfile>>();

const normalizeText = (value: unknown) => String(value ?? "").trim().toLowerCase();

const parseCooperativeName = (data: Record<string, any>) =>
  String(
    data.cooperativeName ||
      data.orgName ||
      data.organizationName ||
      data.org?.name ||
      data.organization?.name ||
      data.profile?.cooperativeName ||
      "",
  ).trim() || null;

const parseDisplayName = (data: Record<string, any>) =>
  String(data.displayName || data.fullName || data.name || data.companyName || "").trim() || null;

const isApproved = (value: unknown) => {
  const normalized = normalizeText(value);
  return normalized === "approved" || normalized === "verified" || normalized === "active";
};

const resolveRole = (data: Record<string, any>) => {
  const candidates = [data.type, data.role, data.userType, data.accountType];
  for (const candidate of candidates) {
    const normalized = normalizeText(candidate);
    if (normalized === "buyer" || normalized === "farmer" || normalized === "cooperative" || normalized === "organization" || normalized === "org" || normalized === "org_admin" || normalized === "org_staff") {
      return normalized;
    }
  }
  return "";
};

const resolveBadgeType = (data: Record<string, any>): VerifiedBadgeType | null => {
  const role = resolveRole(data);
  const approvalStatus = data.approvalStatus ?? data.verificationStatus ?? data.status;
  const approved = isApproved(approvalStatus);
  const verified = Boolean(data.verified);
  const verifiedOrg = Boolean(data.verifiedOrg || data.cooperativeVerified || data.orgVerified);

  if (role === "buyer") {
    const hasVerifiedBuyer = data.verifiedBuyer !== undefined && data.verifiedBuyer !== null;
    const verifiedBuyer = hasVerifiedBuyer ? Boolean(data.verifiedBuyer) : true;
    return approved && verifiedBuyer ? "buyer" : null;
  }

  if (role === "farmer") {
    return approved || verified ? "farmer" : null;
  }

  if (
    role === "cooperative" ||
    role === "organization" ||
    role === "org" ||
    role === "org_admin" ||
    role === "org_staff"
  ) {
    return approved || verified || verifiedOrg ? "cooperative" : null;
  }

  // Fallback for records that don't keep explicit role but still represent cooperative accounts
  if (parseCooperativeName(data) && (approved || verified || verifiedOrg)) {
    return "cooperative";
  }

  return null;
};

async function fetchUserVerificationProfile(uid: string): Promise<UserVerificationProfile> {
  if (!uid) return { uid: "", displayName: null, badgeType: null };
  const snap = await getDoc(doc(db, "users", uid)).catch(() => null);
  if (!snap?.exists()) {
    return { uid, displayName: null, badgeType: null };
  }
  const data = snap.data() as Record<string, any>;
  const role = resolveRole(data);
  const cooperativeLike =
    role === "cooperative" ||
    role === "organization" ||
    role === "org" ||
    normalizeText(data?.role) === "org_admin" ||
    normalizeText(data?.role) === "org_staff";
  const preferredName = cooperativeLike ? parseCooperativeName(data) || parseDisplayName(data) : parseDisplayName(data) || parseCooperativeName(data);

  return {
    uid,
    displayName: preferredName,
    badgeType: resolveBadgeType(data),
  };
}

export function getUserVerificationProfile(uid: string): Promise<UserVerificationProfile> {
  if (!uid) return Promise.resolve({ uid: "", displayName: null, badgeType: null });
  const key = uid.trim();
  const existing = cache.get(key);
  if (existing) return existing;
  const pending = fetchUserVerificationProfile(key).catch(() => ({ uid: key, displayName: null, badgeType: null }));
  cache.set(key, pending);
  return pending;
}

export async function getUserVerificationMap(uids: string[]): Promise<Record<string, UserVerificationProfile>> {
  const unique = Array.from(new Set(uids.filter(Boolean)));
  const rows = await Promise.all(unique.map((uid) => getUserVerificationProfile(uid)));
  return rows.reduce<Record<string, UserVerificationProfile>>((acc, row) => {
    acc[row.uid] = row;
    return acc;
  }, {});
}
