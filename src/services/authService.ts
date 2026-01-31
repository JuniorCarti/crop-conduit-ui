import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";

const TOKEN_KEY = "firebase_id_token";
const UID_KEY = "firebase_uid";
const EMAIL_KEY = "firebase_email";

export const waitForAuth = (timeoutMs = 5000) =>
  new Promise<User>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Auth timeout"));
    }, timeoutMs);

    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        clearTimeout(timer);
        unsub();
        resolve(user);
      }
    });
  });

export async function fetchVerifiedToken() {
  await auth.currentUser?.reload();
  const token = await auth.currentUser?.getIdToken(true);
  if (!token) {
    throw new Error("Firebase token missing");
  }
  return token;
}

export function persistToken(user: User, token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(UID_KEY, user.uid);
  localStorage.setItem(EMAIL_KEY, user.email ?? "");
}

export function clearAuthDebug() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(UID_KEY);
  localStorage.removeItem(EMAIL_KEY);
}

export function isAuthHealthy() {
  if (typeof window === "undefined") return false;
  return !!auth.currentUser && !!localStorage.getItem(TOKEN_KEY);
}

export async function ensureAuthToken() {
  const user = await waitForAuth();
  await user.reload();
  const token = await user.getIdToken(true);
  if (!token) {
    throw new Error("Firebase token missing");
  }
  persistToken(user, token);

  console.log("Firebase user:", user);
  console.log("Firebase token:", token);

  if (typeof window !== "undefined") {
    (window as any).getFirebaseToken = async () => auth.currentUser?.getIdToken(true);
  }

  return token;
}
