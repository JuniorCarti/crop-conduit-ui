/**
 * Firestore helpers for Climate feature
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  Timestamp,
  where,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { AlertItem, AlertSubscription, FarmLocation, UserProfile } from "@/types/climate";

const USERS_COLLECTION = "users";
const FARMS_COLLECTION = "farms";
const ALERT_SUBSCRIPTIONS_COLLECTION = "alertSubscriptions";
const ALERTS_COLLECTION = "alerts";

function mapFarmDoc(farmDoc: any): FarmLocation {
  const data = farmDoc.data();
  return {
    id: farmDoc.id,
    ...data,
    createdAt: data.createdAt?.toDate?.() || data.createdAt,
    updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
  } as FarmLocation;
}

function sortFarmsByCreatedAt(farms: FarmLocation[]) {
  return farms.sort((a, b) => {
    const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt || 0).getTime();
    const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt || 0).getTime();
    return bTime - aTime;
  });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const ref = doc(db, USERS_COLLECTION, uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    uid,
    plan: data.plan ?? "free",
    language: data.language ?? "en",
    phoneNumber: data.phoneNumber,
    features: data.features ?? {
      climateBasic: true,
      climatePremium: false,
      frostAlerts: false,
      rain14: false,
      smsAlerts: false,
    },
    createdAt: data.createdAt?.toDate?.() || data.createdAt,
  };
}

export function subscribeToFarms(
  uid: string,
  callback: (farms: FarmLocation[]) => void
): () => void {
  const farmsRef = collection(db, FARMS_COLLECTION);
  const farmsQuery = query(farmsRef, where("uid", "==", uid));

  return onSnapshot(
    farmsQuery,
    (snapshot) => {
      const farms = snapshot.docs.map(mapFarmDoc);
      callback(sortFarmsByCreatedAt(farms));
    },
    (error) => {
      console.error("[subscribeToFarms] Firestore snapshot error:", error);
    }
  );
}

export async function createFarm(
  farm: Omit<FarmLocation, "id" | "createdAt">
): Promise<string> {
  const ref = await addDoc(collection(db, FARMS_COLLECTION), {
    ...farm,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return ref.id;
}

export async function getFarms(uid: string): Promise<FarmLocation[]> {
  const farmsRef = collection(db, FARMS_COLLECTION);
  const farmsQuery = query(farmsRef, where("uid", "==", uid));
  const snapshot = await getDocs(farmsQuery);
  const farms = snapshot.docs.map(mapFarmDoc);
  return sortFarmsByCreatedAt(farms);
}

export function subscribeToRecentAlerts(
  uid: string,
  callback: (alerts: AlertItem[]) => void,
  limitCount: number = 3
): () => void {
  const alertsRef = collection(db, ALERTS_COLLECTION, uid, "items");
  const alertsQuery = query(
    alertsRef,
    orderBy("scheduledFor", "desc"),
    limit(limitCount)
  );

  return onSnapshot(
    alertsQuery,
    (snapshot) => {
      const alerts = snapshot.docs.map((alertDoc) => {
        const data = alertDoc.data();
        return {
          id: alertDoc.id,
          ...data,
          scheduledFor: data.scheduledFor?.toDate?.() || data.scheduledFor,
          sentAt: data.sentAt?.toDate?.() || data.sentAt,
        } as AlertItem;
      });
      callback(alerts);
    },
    () => {
      callback([]);
    }
  );
}

export async function getAlertSubscription(uid: string): Promise<AlertSubscription | null> {
  const ref = doc(db, ALERT_SUBSCRIPTIONS_COLLECTION, uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    uid,
    farms: data.farms || [],
    updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
  };
}

export async function updateAlertSubscription(params: {
  uid: string;
  farmId: string;
  channels: Array<"inApp" | "sms">;
  frost: boolean;
  rain: boolean;
}): Promise<void> {
  const ref = doc(db, ALERT_SUBSCRIPTIONS_COLLECTION, params.uid);
  const snap = await getDoc(ref);
  const existing = snap.exists() ? snap.data().farms || [] : [];
  const index = existing.findIndex((farm: any) => farm.farmId === params.farmId);
  const nextFarm = {
    farmId: params.farmId,
    channels: params.channels,
    frost: params.frost,
    rain: params.rain,
  };
  const farms = [...existing];
  if (index >= 0) {
    farms[index] = nextFarm;
  } else {
    farms.push(nextFarm);
  }

  await setDoc(
    ref,
    {
      uid: params.uid,
      farms,
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  );
}
