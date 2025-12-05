/**
 * Notification Service
 * Handles FCM token registration and push notifications
 */

import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { messaging } from "@/lib/firebase";
import { toast } from "sonner";

const USERS_COLLECTION = "users";

// VAPID key for FCM (get from Firebase Console > Project Settings > Cloud Messaging)
const VAPID_KEY = import.meta.env.VITE_FCM_VAPID_KEY || "";

/**
 * Request notification permission and get FCM token
 */
export async function requestNotificationPermission(): Promise<string | null> {
  try {
    if (!messaging) {
      console.warn("FCM not available");
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("Notification permission denied");
      return null;
    }

    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    return token;
  } catch (error) {
    console.error("Error getting FCM token:", error);
    return null;
  }
}

/**
 * Register FCM token for user
 */
export async function registerFCMToken(userId: string, token: string): Promise<void> {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, {
      fcmTokens: arrayUnion(token),
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error("Error registering FCM token:", error);
    throw error;
  }
}

/**
 * Unregister FCM token
 */
export async function unregisterFCMToken(userId: string, token: string): Promise<void> {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, {
      fcmTokens: arrayRemove(token),
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error("Error unregistering FCM token:", error);
    throw error;
  }
}

/**
 * Initialize FCM and register token
 */
export async function initializeFCM(userId: string): Promise<void> {
  try {
    if (!messaging) {
      console.warn("FCM not available");
      return;
    }

    const token = await requestNotificationPermission();
    if (token) {
      await registerFCMToken(userId, token);
      console.log("FCM token registered:", token);
    }

    // Listen for foreground messages
    onMessage(messaging, (payload) => {
      console.log("Message received:", payload);
      toast.info(payload.notification?.title || "New notification", {
        description: payload.notification?.body,
      });
    });
  } catch (error) {
    console.error("Error initializing FCM:", error);
  }
}

/**
 * Check if notifications are supported
 */
export async function isNotificationSupported(): Promise<boolean> {
  try {
    return await isSupported();
  } catch {
    return false;
  }
}
