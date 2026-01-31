import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { BuyerProfile } from "@/types/marketplace";

const USERS_COLLECTION = "users";

export async function getBuyerProfile(uid: string): Promise<BuyerProfile | null> {
  const ref = doc(db, USERS_COLLECTION, uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data() as { buyerProfile?: BuyerProfile };
  return data?.buyerProfile ? data.buyerProfile : null;
}

export async function saveBuyerProfile(uid: string, profile: BuyerProfile): Promise<void> {
  const ref = doc(db, USERS_COLLECTION, uid);
  await setDoc(
    ref,
    {
      buyerProfile: {
        ...profile,
        updatedAt: serverTimestamp(),
      },
    },
    { merge: true }
  );
}
