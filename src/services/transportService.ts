import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
  type Query,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { stripUndefined } from "@/services/marketplaceService";
import type {
  TransportCompany,
  TransportVehicle,
  TransportShipment,
  TransportBid,
  TransportTracking,
} from "@/types/transport";

const COMPANIES_COLLECTION = "transportCompanies";
const VEHICLES_COLLECTION = "transportVehicles";
const SHIPMENTS_COLLECTION = "transportShipments";
const BIDS_COLLECTION = "transportBids";
const TRACKING_COLLECTION = "transportTracking";

const toDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "object" && value && "toDate" in value) {
    try {
      return (value as { toDate: () => Date }).toDate();
    } catch {
      return null;
    }
  }
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

const mapVehicle = (snap: QueryDocumentSnapshot<DocumentData>): TransportVehicle => {
  const data = snap.data() as TransportVehicle & { createdAt?: unknown; updatedAt?: unknown; nextAvailableAt?: unknown; lastLocationAt?: unknown };
  return {
    ...data,
    id: snap.id,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
    nextAvailableAt: toDate(data.nextAvailableAt),
    lastLocationAt: toDate(data.lastLocationAt),
  } as TransportVehicle;
};

const mapShipment = (snap: QueryDocumentSnapshot<DocumentData>): TransportShipment => {
  const data = snap.data() as TransportShipment & { createdAt?: unknown; updatedAt?: unknown };
  return {
    ...data,
    id: snap.id,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  } as TransportShipment;
};

const mapBid = (snap: QueryDocumentSnapshot<DocumentData>): TransportBid => {
  const data = snap.data() as TransportBid & { createdAt?: unknown; updatedAt?: unknown };
  return {
    ...data,
    id: snap.id,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  } as TransportBid;
};

function subscribeToQuery<T>(
  q: Query<DocumentData>,
  map: (snap: QueryDocumentSnapshot<DocumentData>) => T,
  callback: (items: T[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map(map);
      callback(items);
    },
    (error) => {
      console.error("Transport subscription error:", error);
      onError?.(error as Error);
      callback([]);
    }
  );
}

export function subscribeTransportCompany(
  companyId: string,
  callback: (company: TransportCompany | null) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const ref = doc(db, COMPANIES_COLLECTION, companyId);
  return onSnapshot(
    ref,
    (snap) => {
      callback(snap.exists() ? ({ ...(snap.data() as TransportCompany), id: snap.id } as TransportCompany) : null);
    },
    (error) => {
      console.error("Transport company subscription error:", error);
      onError?.(error as Error);
      callback(null);
    }
  );
}

export async function fetchTransportCompany(companyId: string): Promise<TransportCompany | null> {
  const snap = await getDoc(doc(db, COMPANIES_COLLECTION, companyId));
  if (!snap.exists()) return null;
  return { ...(snap.data() as TransportCompany), id: snap.id } as TransportCompany;
}

export async function upsertTransportCompany(companyId: string, data: Partial<TransportCompany>): Promise<void> {
  const payload = stripUndefined({
    ...data,
    updatedAt: serverTimestamp(),
  });
  await setDoc(doc(db, COMPANIES_COLLECTION, companyId), payload, { merge: true });
}

export function subscribeCompanyVehicles(
  companyId: string,
  callback: (vehicles: TransportVehicle[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return subscribeToQuery(
    query(collection(db, VEHICLES_COLLECTION), where("companyId", "==", companyId), orderBy("createdAt", "desc")),
    mapVehicle,
    callback,
    onError
  );
}

export function subscribeAvailableVehicles(
  callback: (vehicles: TransportVehicle[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return subscribeToQuery(
    query(collection(db, VEHICLES_COLLECTION), orderBy("createdAt", "desc")),
    mapVehicle,
    callback,
    onError
  );
}

export async function saveTransportVehicle(companyId: string, data: Partial<TransportVehicle>, vehicleId?: string): Promise<string> {
  const payload = stripUndefined({
    ...data,
    companyId,
    updatedAt: serverTimestamp(),
    createdAt: vehicleId ? undefined : serverTimestamp(),
  });

  if (vehicleId) {
    await updateDoc(doc(db, VEHICLES_COLLECTION, vehicleId), payload);
    return vehicleId;
  }

  const ref = await addDoc(collection(db, VEHICLES_COLLECTION), payload);
  return ref.id;
}

export async function deleteTransportVehicle(vehicleId: string): Promise<void> {
  await deleteDoc(doc(db, VEHICLES_COLLECTION, vehicleId));
}

export function subscribeCompanyShipments(
  companyId: string,
  callback: (shipments: TransportShipment[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return subscribeToQuery(
    query(collection(db, SHIPMENTS_COLLECTION), where("companyId", "==", companyId), orderBy("createdAt", "desc")),
    mapShipment,
    callback,
    onError
  );
}

export function subscribeRequesterShipments(
  requesterUid: string,
  callback: (shipments: TransportShipment[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return subscribeToQuery(
    query(collection(db, SHIPMENTS_COLLECTION), where("requesterUid", "==", requesterUid), orderBy("createdAt", "desc")),
    mapShipment,
    callback,
    onError
  );
}

export async function createTransportShipment(payload: TransportShipment): Promise<string> {
  const cleanPayload = stripUndefined({
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  const ref = await addDoc(collection(db, SHIPMENTS_COLLECTION), cleanPayload);
  return ref.id;
}

export async function updateTransportShipment(shipmentId: string, payload: Partial<TransportShipment>): Promise<void> {
  const cleanPayload = stripUndefined({
    ...payload,
    updatedAt: serverTimestamp(),
  });
  await updateDoc(doc(db, SHIPMENTS_COLLECTION, shipmentId), cleanPayload);
}

export function subscribeShipmentBids(
  shipmentId: string,
  callback: (bids: TransportBid[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return subscribeToQuery(
    query(collection(db, BIDS_COLLECTION), where("shipmentId", "==", shipmentId), orderBy("createdAt", "desc")),
    mapBid,
    callback,
    onError
  );
}

export async function createTransportBid(payload: TransportBid): Promise<string> {
  const cleanPayload = stripUndefined({
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  const ref = await addDoc(collection(db, BIDS_COLLECTION), cleanPayload);
  return ref.id;
}

export async function updateTransportBid(bidId: string, payload: Partial<TransportBid>): Promise<void> {
  const cleanPayload = stripUndefined({
    ...payload,
    updatedAt: serverTimestamp(),
  });
  await updateDoc(doc(db, BIDS_COLLECTION, bidId), cleanPayload);
}

export function subscribeTracking(shipmentId: string, callback: (tracking: TransportTracking | null) => void): Unsubscribe {
  const ref = doc(db, TRACKING_COLLECTION, shipmentId);
  return onSnapshot(ref, (snap) => {
    if (!snap.exists()) {
      callback(null);
      return;
    }
    const data = snap.data() as TransportTracking & { updatedAt?: unknown };
    callback({
      ...data,
      id: snap.id,
      updatedAt: toDate(data.updatedAt),
    } as TransportTracking);
  });
}

export async function upsertTracking(shipmentId: string, payload: Partial<TransportTracking>): Promise<void> {
  const cleanPayload = stripUndefined({
    ...payload,
    updatedAt: serverTimestamp(),
  });
  await setDoc(doc(db, TRACKING_COLLECTION, shipmentId), cleanPayload, { merge: true });
}
