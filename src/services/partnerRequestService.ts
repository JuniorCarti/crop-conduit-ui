import { addDoc, collection, getDocs, orderBy, query, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export type PartnerRequestStatus = "draft" | "pending" | "contacted" | "approved" | "rejected";

export type PartnerRequestPayload = {
  orgId: string;
  orgName: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  crops: string[];
  monthlyVolume: number;
  certifications: string[];
  preferredMarkets: string[];
  notes?: string;
};

export type PartnerRequestRecord = PartnerRequestPayload & {
  id: string;
  status: PartnerRequestStatus;
  createdAt?: any;
  updatedAt?: any;
  createdByUid: string;
};

const storageKey = (orgId: string) => `export_partnership_requests_${orgId}`;

const isPermissionError = (error: any) =>
  error?.code === "permission-denied" || String(error?.message || "").toLowerCase().includes("permission");

const parseLocal = (orgId: string): PartnerRequestRecord[] => {
  try {
    const raw = localStorage.getItem(storageKey(orgId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const persistLocal = (orgId: string, records: PartnerRequestRecord[]) =>
  localStorage.setItem(storageKey(orgId), JSON.stringify(records));

export async function listPartnerRequests(orgId: string): Promise<{ records: PartnerRequestRecord[]; fromFallback: boolean }> {
  const local = parseLocal(orgId);
  try {
    const snap = await getDocs(
      query(collection(db, "orgs", orgId, "exportPartnershipRequests"), orderBy("createdAt", "desc"))
    );
    const remote = snap.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as any) })) as PartnerRequestRecord[];
    const mergedMap = new Map<string, PartnerRequestRecord>();
    [...remote, ...local].forEach((row) => mergedMap.set(row.id, row));
    const merged = Array.from(mergedMap.values()).sort(
      (a, b) => new Date(b.createdAt?.toDate?.() ?? b.createdAt ?? 0).getTime() - new Date(a.createdAt?.toDate?.() ?? a.createdAt ?? 0).getTime()
    );
    persistLocal(orgId, merged);
    return { records: merged, fromFallback: false };
  } catch (error: any) {
    if (!isPermissionError(error)) throw error;
    return { records: local, fromFallback: true };
  }
}

export async function createPartnerRequest(payload: PartnerRequestPayload): Promise<{ record: PartnerRequestRecord; fromFallback: boolean }> {
  const actorUid = auth.currentUser?.uid || "unknown";
  const now = new Date().toISOString();
  const localRecord: PartnerRequestRecord = {
    id: `local_${Date.now()}`,
    ...payload,
    status: "pending",
    createdAt: now,
    updatedAt: now,
    createdByUid: actorUid,
  };

  try {
    const ref = await addDoc(collection(db, "orgs", payload.orgId, "exportPartnershipRequests"), {
      ...payload,
      status: "pending",
      createdByUid: actorUid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return {
      record: { ...localRecord, id: ref.id },
      fromFallback: false,
    };
  } catch (error: any) {
    if (!isPermissionError(error)) throw error;
    const current = parseLocal(payload.orgId);
    const next = [localRecord, ...current];
    persistLocal(payload.orgId, next);
    return { record: localRecord, fromFallback: true };
  }
}
