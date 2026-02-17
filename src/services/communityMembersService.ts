import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getUserCoopMembership } from "@/services/cooperativeMembershipService";

export type CommunityMemberSummary = {
  id: string;
  uid: string;
  name: string;
  initials: string;
  location: string;
  county: string | null;
  ward: string | null;
  cooperativeName: string | null;
  mainCrops: string[];
  secondaryCrops: string[];
  verified: boolean;
  joinedAt: Date | null;
  lastActiveAt: Date | null;
  lat: number | null;
  lon: number | null;
  profileCompleteness: number;
  score: number;
  reliabilityLabel: "high" | "medium" | "low";
};

export type CommunityEventsItem = {
  id: string;
  title: string;
  description: string;
  eventAt: Date | null;
  location: string;
  hostCoopId: string;
  hostCoopName: string | null;
  coverImage: string | null;
  source: "communityEvents" | "trainings";
};

const parseDate = (value: any): Date | null => {
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

const toNumber = (value: any): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getInitials = (name: string) => {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const normalizeCrops = (value: any): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .slice(0, 6);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 6);
  }
  return [];
};

const isVerified = (member: any) => {
  const status = String(member?.status ?? member?.verificationStatus ?? "").toLowerCase();
  return status === "active" || status === "approved" || status === "verified";
};

const profileCompleteness = (member: any) => {
  const checks = [
    Boolean(member?.fullName || member?.displayName),
    Boolean(member?.county || member?.locationCounty),
    Boolean(member?.ward || member?.locationWard),
    normalizeCrops(member?.mainCrops).length > 0 || normalizeCrops(member?.crops).length > 0,
    Boolean(member?.phone || member?.phoneNumber),
  ];
  const passed = checks.filter(Boolean).length;
  return Math.round((passed / checks.length) * 100);
};

const activityBoost = (lastActiveAt: Date | null) => {
  if (!lastActiveAt) return 5;
  const ageHours = Math.max(0, (Date.now() - lastActiveAt.getTime()) / (1000 * 60 * 60));
  if (ageHours < 24) return 35;
  if (ageHours < 24 * 7) return 20;
  if (ageHours < 24 * 30) return 10;
  return 4;
};

const haversineKm = (aLat: number, aLon: number, bLat: number, bLon: number) => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthKm = 6371;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * earthKm * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
};

const deriveMemberSummary = (id: string, member: any, coopName: string | null): CommunityMemberSummary => {
  const uid = String(member?.linkedUserUid || member?.userUid || member?.memberUid || id);
  const name = String(member?.fullName || member?.displayName || member?.memberUniqueId || "Farmer");
  const county = member?.county ?? member?.locationCounty ?? null;
  const ward = member?.ward ?? member?.locationWard ?? null;
  const location = [county, ward].filter(Boolean).join(", ") || "Location not set";
  const mainCrops = normalizeCrops(member?.mainCrops ?? member?.primaryCrops ?? member?.crops);
  const secondaryCrops = normalizeCrops(member?.secondaryCrops ?? member?.otherCrops);
  const verified = isVerified(member);
  const joinedAt = parseDate(member?.joinedAt ?? member?.createdAt);
  const lastActiveAt = parseDate(member?.lastActiveAt ?? member?.updatedAt ?? member?.lastSeenAt);
  const lat = toNumber(member?.lat ?? member?.latitude ?? member?.location?.lat ?? member?.geo?.lat);
  const lon = toNumber(member?.lon ?? member?.lng ?? member?.longitude ?? member?.location?.lon ?? member?.geo?.lng);
  const completeness = profileCompleteness(member);
  const score =
    (verified ? 45 : 10) +
    activityBoost(lastActiveAt) +
    Math.round(completeness / 4) +
    Math.min(15, Number(member?.postsCount ?? member?.activityCount ?? 0));

  const reliabilityLabel: "high" | "medium" | "low" =
    score >= 80 ? "high" : score >= 45 ? "medium" : "low";

  return {
    id,
    uid,
    name,
    initials: getInitials(name),
    location,
    county: county ? String(county) : null,
    ward: ward ? String(ward) : null,
    cooperativeName: coopName,
    mainCrops,
    secondaryCrops,
    verified,
    joinedAt,
    lastActiveAt,
    lat,
    lon,
    profileCompleteness: completeness,
    score,
    reliabilityLabel,
  };
};

const stableSortByNewest = (rows: CommunityMemberSummary[]) => {
  return [...rows].sort((a, b) => {
    const aTime = a.joinedAt?.getTime() ?? 0;
    const bTime = b.joinedAt?.getTime() ?? 0;
    return bTime - aTime;
  });
};

export async function listCommunityMembersForCurrentUser(uid: string): Promise<CommunityMemberSummary[]> {
  if (!uid) return [];
  const membership = await getUserCoopMembership(uid);
  if (!membership?.orgId) return [];

  const orgSnap = await getDoc(doc(db, "orgs", membership.orgId)).catch(() => null);
  const coopName = orgSnap?.exists() ? String(orgSnap.data()?.orgName ?? orgSnap.data()?.name ?? "Cooperative") : null;

  const membersSnap = await getDocs(query(collection(db, "orgs", membership.orgId, "members"), limit(500)));
  const members = membersSnap.docs
    .map((row) => deriveMemberSummary(row.id, row.data(), coopName));

  const dedupe = new Map<string, CommunityMemberSummary>();
  for (const member of members) {
    const key = member.uid || member.id;
    const existing = dedupe.get(key);
    if (!existing || (member.lastActiveAt?.getTime() ?? 0) > (existing.lastActiveAt?.getTime() ?? 0)) {
      dedupe.set(key, member);
    }
  }
  return stableSortByNewest(Array.from(dedupe.values()));
}

export function filterMembersByRadius(params: {
  members: CommunityMemberSummary[];
  originLat: number | null;
  originLon: number | null;
  radiusKm: number;
}) {
  if (params.originLat == null || params.originLon == null) return params.members;
  return params.members.filter((member) => {
    if (member.lat == null || member.lon == null) return false;
    const distance = haversineKm(params.originLat, params.originLon, member.lat, member.lon);
    return distance <= params.radiusKm;
  });
}

export async function getCommunityMemberByUid(currentUid: string, targetUid: string) {
  const all = await listCommunityMembersForCurrentUser(currentUid);
  return all.find((row) => row.uid === targetUid || row.id === targetUid) ?? null;
}

export async function getFollowCounts(targetUid: string) {
  if (!targetUid) return { followers: 0, following: 0 };
  const [followersSnap, followingSnap] = await Promise.all([
    getDocs(query(collection(db, "communityFollows"), where("followeeUid", "==", targetUid), limit(1000))),
    getDocs(query(collection(db, "communityFollows"), where("followerUid", "==", targetUid), limit(1000))),
  ]);
  return {
    followers: followersSnap.size,
    following: followingSnap.size,
  };
}

export async function isFollowingUser(followerUid: string, followeeUid: string) {
  if (!followerUid || !followeeUid) return false;
  const row = await getDoc(doc(db, "communityFollows", `${followerUid}_${followeeUid}`));
  return row.exists();
}

export async function listFollowingUsers(uid: string) {
  if (!uid) return [] as Array<{ uid: string }>;
  const snap = await getDocs(
    query(collection(db, "communityFollows"), where("followerUid", "==", uid), limit(50))
  );
  return snap.docs.map((row) => ({ uid: String((row.data() as any)?.followeeUid ?? "") })).filter((row) => row.uid);
}

export async function followUser(followerUid: string, followeeUid: string) {
  if (!followerUid || !followeeUid || followerUid === followeeUid) return;
  await setDoc(
    doc(db, "communityFollows", `${followerUid}_${followeeUid}`),
    {
      followerUid,
      followeeUid,
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function unfollowUser(followerUid: string, followeeUid: string) {
  if (!followerUid || !followeeUid || followerUid === followeeUid) return;
  await deleteDoc(doc(db, "communityFollows", `${followerUid}_${followeeUid}`));
}

export async function listFarmerEvents(uid: string): Promise<CommunityEventsItem[]> {
  if (!uid) return [];
  const membership = await getUserCoopMembership(uid);
  if (!membership?.orgId) return [];

  const orgId = membership.orgId;
  const [orgSnap, communityEventsSnap, trainingsSnap] = await Promise.all([
    getDoc(doc(db, "orgs", orgId)).catch(() => null),
    getDocs(query(collection(db, "orgs", orgId, "communityEvents"), orderBy("eventAt", "asc"), limit(100))).catch(() => null),
    getDocs(query(collection(db, "orgs", orgId, "trainings"), orderBy("scheduledAt", "asc"), limit(100))).catch(() => null),
  ]);

  const coopName = orgSnap?.exists() ? String(orgSnap.data()?.orgName ?? orgSnap.data()?.name ?? "Cooperative") : null;

  const events: CommunityEventsItem[] = [];

  communityEventsSnap?.docs.forEach((row) => {
    const data = row.data() as any;
    events.push({
      id: row.id,
      title: String(data?.title ?? "Cooperative event"),
      description: String(data?.description ?? ""),
      eventAt: parseDate(data?.eventAt ?? data?.date ?? data?.scheduledAt),
      location: String(data?.location ?? data?.locationText ?? "TBA"),
      hostCoopId: orgId,
      hostCoopName: coopName,
      coverImage: data?.coverImage ?? null,
      source: "communityEvents",
    });
  });

  trainingsSnap?.docs.forEach((row) => {
    const data = row.data() as any;
    events.push({
      id: row.id,
      title: String(data?.title ?? "Training session"),
      description: String(data?.description ?? "Cooperative training event"),
      eventAt: parseDate(data?.scheduledAt ?? data?.date),
      location: String(data?.locationText ?? "TBA"),
      hostCoopId: orgId,
      hostCoopName: coopName,
      coverImage: null,
      source: "trainings",
    });
  });

  return events
    .filter((event) => event.eventAt)
    .sort((a, b) => (a.eventAt?.getTime() ?? 0) - (b.eventAt?.getTime() ?? 0));
}
