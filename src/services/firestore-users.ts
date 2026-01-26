/**
 * Firestore helpers for user preferences
 */

import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type SupportedLanguage = "en" | "sw";

export async function getUserLanguage(uid: string): Promise<SupportedLanguage | null> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const language = snap.data().language;
  return language === "sw" || language === "en" ? language : null;
}

export async function setUserLanguage(uid: string, language: SupportedLanguage): Promise<void> {
  const ref = doc(db, "users", uid);
  await setDoc(
    ref,
    {
      language,
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  );
}
