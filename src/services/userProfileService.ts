import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { BuyerProfile } from "@/types/marketplace";

export type UserRole =
  | "farmer"
  | "buyer"
  | "org_admin"
  | "org_staff"
  | "gov_admin"
  | "gov_analyst"
  | "gov_viewer"
  | "partner_admin"
  | "partner_analyst"
  | "partner_finance"
  | "admin"
  | "superadmin"
  | "unassigned";
export type OrgRole = "admin" | "staff" | null;

export interface UserProfileDoc {
  uid: string;
  role: UserRole;
  orgId: string | null;
  orgRole: OrgRole;
  displayName?: string;
  email?: string;
  phone?: string;
  createdAt?: any;
  premium?: boolean;
  features?: Record<string, boolean>;
}

const normalizePhone = (value?: string | null) => {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `254${digits.slice(1)}`;
  return digits;
};

async function upsertUserDirectory(uid: string, data: Partial<UserProfileDoc>) {
  const emailLower = data.email ? data.email.toLowerCase() : null;
  const phoneE164 = normalizePhone(data.phone);
  await setDoc(
    doc(db, "userDirectory", uid),
    {
      uid,
      emailLower,
      phoneE164,
      displayName: data.displayName ?? null,
      role: data.role ?? null,
      createdAt: Timestamp.now(),
    },
    { merge: true }
  );
}

export async function getUserProfileDoc(uid: string): Promise<UserProfileDoc | null> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as UserProfileDoc;
}

export async function upsertUserProfileDoc(uid: string, data: Partial<UserProfileDoc>): Promise<void> {
  const ref = doc(db, "users", uid);
  await setDoc(
    ref,
    {
      ...data,
      uid,
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  );
  await upsertUserDirectory(uid, data);
}

export async function ensureUserProfileDoc(uid: string, fallback: Partial<UserProfileDoc>): Promise<void> {
  const existing = await getUserProfileDoc(uid);
  if (existing) return;
  await setDoc(
    doc(db, "users", uid),
    {
      uid,
      role: fallback.role ?? "farmer",
      orgId: fallback.orgId ?? null,
      orgRole: fallback.orgRole ?? null,
      displayName: fallback.displayName ?? null,
      email: fallback.email ?? null,
      premium: fallback.premium ?? false,
      features: fallback.features ?? {},
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  );
  await upsertUserDirectory(uid, fallback);
}

export async function getBuyerProfile(uid: string): Promise<BuyerProfile | null> {
  const ref = doc(db, "users", uid, "profiles", "buyer");
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as BuyerProfile;
}

export async function saveBuyerProfile(uid: string, profile: BuyerProfile): Promise<void> {
  const ref = doc(db, "users", uid, "profiles", "buyer");
  await setDoc(
    ref,
    {
      ...profile,
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  );
}
