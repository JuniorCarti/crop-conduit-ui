/**
 * Presence Service
 * Manages user online/offline status using Firebase Realtime Database
 * Mirrors to Firestore for querying
 */

import { getDatabase, ref, set, onDisconnect, serverTimestamp, onValue, off } from "firebase/database";
import { doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getAuth } from "firebase/auth";
import { initializeApp } from "firebase/app";

// Initialize Realtime Database
// Use the same app instance from firebase.ts to avoid duplicate initialization
let rtdb: ReturnType<typeof getDatabase> | null = null;

try {
  // Get database URL - ensure it's just the root URL, not a child path
  const databaseURL = import.meta.env.VITE_FIREBASE_DATABASE_URL;
  if (databaseURL) {
    // Ensure URL is root level (ends with .firebaseio.com or .firebasedatabase.app)
    const cleanURL = databaseURL.split('/').slice(0, 3).join('/'); // Get protocol + domain only
    const app = initializeApp(
      {
        databaseURL: cleanURL,
      },
      "presence"
    );
    rtdb = getDatabase(app);
  } else {
    // Try to construct from project ID
    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
    if (projectId) {
      const app = initializeApp(
        {
          databaseURL: `https://${projectId}-default-rtdb.firebaseio.com`,
        },
        "presence"
      );
      rtdb = getDatabase(app);
    }
  }
} catch (error) {
  console.warn("Realtime Database not configured, presence will use Firestore only", error);
}

const PRESENCE_PATH = "status";
const USERS_COLLECTION = "users";

/**
 * Set user as online
 * Call this when user connects/opens app
 */
export async function setUserOnline(userId: string): Promise<void> {
  try {
    if (rtdb) {
      const statusRef = ref(rtdb, `${PRESENCE_PATH}/${userId}`);
      
      // Set online status
      await set(statusRef, {
        state: "online",
        lastChanged: serverTimestamp(),
      });

      // Set offline when user disconnects
      onDisconnect(statusRef).set({
        state: "offline",
        lastChanged: serverTimestamp(),
      });
    }

    // Also update Firestore
    const userRef = doc(db, USERS_COLLECTION, userId);
    await setDoc(
      userRef,
      {
        presence: {
          isOnline: true,
          lastSeen: new Date(),
        },
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Error setting user online:", error);
  }
}

/**
 * Set user as offline
 */
export async function setUserOffline(userId: string): Promise<void> {
  try {
    if (rtdb) {
      const statusRef = ref(rtdb, `${PRESENCE_PATH}/${userId}`);
      await set(statusRef, {
        state: "offline",
        lastChanged: serverTimestamp(),
      });
    }

    // Update Firestore
    const userRef = doc(db, USERS_COLLECTION, userId);
    await setDoc(
      userRef,
      {
        presence: {
          isOnline: false,
          lastSeen: new Date(),
        },
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Error setting user offline:", error);
  }
}

/**
 * Subscribe to user's presence status
 * Returns unsubscribe function
 */
export function subscribeToUserPresence(
  userId: string,
  callback: (isOnline: boolean, lastSeen?: Date) => void
): () => void {
  try {
    if (rtdb) {
      const statusRef = ref(rtdb, `${PRESENCE_PATH}/${userId}`);
      
      const unsubscribe = onValue(statusRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const isOnline = data.state === "online";
          const lastSeen = data.lastChanged ? new Date(data.lastChanged) : undefined;
          callback(isOnline, lastSeen);
        } else {
          callback(false);
        }
      });

      return () => {
        off(statusRef);
        unsubscribe();
      };
    } else {
      // Fallback to Firestore
      const userRef = doc(db, USERS_COLLECTION, userId);
      const unsubscribe = onSnapshot(
        userRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            const presence = data.presence || {};
            callback(presence.isOnline || false, presence.lastSeen?.toDate());
          } else {
            callback(false);
          }
        },
        (error) => {
          console.error("Error subscribing to presence:", error);
          callback(false);
        }
      );

      return unsubscribe;
    }
  } catch (error) {
    console.error("Error setting up presence subscription:", error);
    return () => {};
  }
}

/**
 * Get user's current presence status
 */
export async function getUserPresence(userId: string): Promise<{ isOnline: boolean; lastSeen?: Date }> {
  try {
    if (rtdb) {
      const statusRef = ref(rtdb, `${PRESENCE_PATH}/${userId}`);
      const snapshot = await new Promise<any>((resolve, reject) => {
        onValue(statusRef, resolve, reject, { onlyOnce: true });
      });
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        return {
          isOnline: data.state === "online",
          lastSeen: data.lastChanged ? new Date(data.lastChanged) : undefined,
        };
      }
    }

    // Fallback to Firestore
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const data = userSnap.data();
      const presence = data.presence || {};
      return {
        isOnline: presence.isOnline || false,
        lastSeen: presence.lastSeen?.toDate(),
      };
    }

    return { isOnline: false };
  } catch (error) {
    console.error("Error getting user presence:", error);
    return { isOnline: false };
  }
}
