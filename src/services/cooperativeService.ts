import {
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  query,
  where,
} from "firebase/firestore";
import type { OrgType } from "@/config/orgCapabilities";
import { jsPDF } from "jspdf";
import { db } from "@/lib/firebase";
import { uploadToR2WithKey } from "@/services/r2UploadService";

export type CoopMemberStatus = "draft" | "submitted" | "verified" | "active" | "rejected" | "suspended";

export type CoopMemberDoc = {
  memberId: string;
  fullName: string;
  phone: string;
  nationalIdNumber: string;
  nextOfKinName: string;
  nextOfKinPhone: string;
  county: string;
  subcounty: string;
  ward: string;
  location: string;
  farmSizeAcres: number;
  landOwnershipType: string;
  mainCrops: string[];
  secondaryCrops: string[];
  seasonalProductionEstimate: Array<{ crop: string; amountKg: number }>;
  irrigationAvailable: boolean;
  storageAvailable: boolean;
  mpesaNumber: string;
  mpesaStatementUploads: string[];
  idFrontUrl: string;
  idBackUrl: string;
  verificationStatus: CoopMemberStatus;
  verificationNotes?: string | null;
  verifiedByUid?: string | null;
  verifiedAt?: any;
  linkedUserUid?: string | null;
  membershipRole: "member" | "group_leader" | "committee_member" | "field_agent_member";
  premiumSeatType: "none" | "paid" | "sponsored";
  seatAssignedAt?: any;
  premiumFeaturesUnlocked?: Record<string, boolean>;
  joinedAt?: any;
};

export type OrgSubscription = {
  planId?: string;
  status?: string;
  seatLimitPaid?: number;
  seatLimitSponsored?: number;
  renewalDate?: string;
};

const padSerial = (value: number, length = 6) => value.toString().padStart(length, "0");

export const deriveCoopCode = (orgName: string) => {
  const letters = orgName.replace(/[^a-zA-Z]/g, "").toUpperCase();
  if (!letters) return "COOP";
  return (letters + "COOP").slice(0, 4);
};

export async function generateMemberId(orgId: string, orgName: string) {
  const orgRef = doc(db, "orgs", orgId);
  const serial = await runTransaction(db, async (tx) => {
    const snap = await tx.get(orgRef);
    const current = (snap.exists() ? snap.data()?.counters?.memberSerial : 0) ?? 0;
    const next = Number(current) + 1;
    tx.set(orgRef, { counters: { memberSerial: next } }, { merge: true });
    return next;
  });

  const year = new Date().getFullYear();
  const coopCode = deriveCoopCode(orgName);
  const serialStr = padSerial(serial);
  return `AGCOOP-${coopCode}-${year}-${serialStr}`;
}

export async function generateCertificateNumber(orgId: string) {
  const orgRef = doc(db, "orgs", orgId);
  const serial = await runTransaction(db, async (tx) => {
    const snap = await tx.get(orgRef);
    const current = (snap.exists() ? snap.data()?.counters?.certificateSerial : 0) ?? 0;
    const next = Number(current) + 1;
    tx.set(orgRef, { counters: { certificateSerial: next } }, { merge: true });
    return next;
  });

  const year = new Date().getFullYear();
  const serialStr = padSerial(serial, 5);
  return `CERT-${year}-${serialStr}`;
}

export async function getOrgProfile(orgId: string) {
  const ref = doc(db, "orgs", orgId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as {
    name?: string;
    orgName?: string;
    orgType?: OrgType;
    subscription?: OrgSubscription;
    settings?: { preferredCrops?: string[]; nearbyMarkets?: string[] };
  };
}

export async function listCoopMembers(orgId: string) {
  const ref = collection(db, "orgs", orgId, "members");
  const snap = await getDocs(ref);
  return snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
}

export async function findMemberByPhone(orgId: string, phone: string) {
  const ref = collection(db, "orgs", orgId, "members");
  const q = query(ref, where("phone", "==", phone));
  const snap = await getDocs(q);
  return snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
}

export async function createMembershipStub(orgId: string, payload: Partial<CoopMemberDoc>) {
  const ref = doc(collection(db, "orgs", orgId, "members"));
  await setDoc(ref, {
    ...payload,
    verificationStatus: payload.verificationStatus ?? "draft",
    joinedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function issueCertificate(orgId: string, certificateId: string, payload: any) {
  const ref = doc(db, "orgs", orgId, "certificates", certificateId);
  await setDoc(ref, { ...payload, issuedAt: serverTimestamp() }, { merge: true });
}

export async function generateCertificatePdf(
  orgId: string,
  certificateNumber: string,
  payload: { memberName?: string; trainingTitle?: string; score?: number }
) {
  const docPdf = new jsPDF();
  docPdf.setFont("helvetica", "bold");
  docPdf.setFontSize(18);
  docPdf.text("AgriSmart Cooperative Certificate", 20, 25);
  docPdf.setFontSize(12);
  docPdf.setFont("helvetica", "normal");
  docPdf.text(`Certificate No: ${certificateNumber}`, 20, 40);
  docPdf.text(`Member: ${payload.memberName ?? "Member"}`, 20, 50);
  docPdf.text(`Training: ${payload.trainingTitle ?? "Training session"}`, 20, 60);
  docPdf.text(`Score: ${payload.score ?? 0}`, 20, 70);
  docPdf.text(`Issued: ${new Date().toLocaleDateString()}`, 20, 80);

  const blob = docPdf.output("blob");
  const file = new File([blob], `${certificateNumber}.pdf`, { type: "application/pdf" });
  const result = await uploadToR2WithKey(file, `orgs/${orgId}/certificates/${certificateNumber}.pdf`);
  return result.url;
}

export async function upsertTrainingAttendance(orgId: string, trainingId: string, memberId: string, payload: any) {
  const ref = doc(db, "orgs", orgId, "trainings", trainingId, "attendance", memberId);
  await setDoc(ref, { ...payload, checkedInAt: serverTimestamp() }, { merge: true });
}

export async function savePriceSnapshot(orgId: string, payload: any) {
  const ref = doc(collection(db, "orgs", orgId, "priceSnapshots"));
  await setDoc(ref, { ...payload, createdAt: serverTimestamp() }, { merge: true });
}
