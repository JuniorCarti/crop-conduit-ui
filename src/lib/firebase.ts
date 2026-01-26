/**
 * Firebase Configuration
 * 
 * Replace these values with your Firebase project configuration.
 * You can find these in your Firebase Console > Project Settings > General > Your apps
 */

import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "your-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "your-app-id",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-XXXXXXXXXX",
};

// Check if Firebase is properly configured
const isFirebaseConfigured = 
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== "your-api-key" &&
  firebaseConfig.projectId && 
  firebaseConfig.projectId !== "your-project-id";

if (!isFirebaseConfigured) {
  console.warn(
    "%c⚠️ Firebase Not Configured",
    "color: orange; font-weight: bold; font-size: 14px;"
  );
  console.warn(
    "Firebase configuration is missing. Please set the following environment variables in your .env file:\n" +
    "  - VITE_FIREBASE_API_KEY\n" +
    "  - VITE_FIREBASE_AUTH_DOMAIN\n" +
    "  - VITE_FIREBASE_PROJECT_ID\n" +
    "  - VITE_FIREBASE_STORAGE_BUCKET\n" +
    "  - VITE_FIREBASE_MESSAGING_SENDER_ID\n" +
    "  - VITE_FIREBASE_APP_ID\n" +
    "\n" +
    "Authentication features will not work until Firebase is configured.\n" +
    "See README_FIREBASE.md for setup instructions.\n" +
    "\n" +
    "Note: API errors in the console are expected when Firebase is not configured."
  );
}

// Initialize Firebase
// Note: This may show API errors in console if config is invalid, but won't crash the app
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Enable offline persistence
if (typeof window !== "undefined") {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === "failed-precondition") {
      console.warn("Firestore persistence failed: Multiple tabs open");
    } else if (err.code === "unimplemented") {
      console.warn("Firestore persistence not available in this browser");
    }
  });
}

// Initialize Firebase Storage
export const storage = getStorage(app);

// Initialize Firebase Cloud Messaging (if available)
export let messaging: ReturnType<typeof getMessaging> | null = null;
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.warn("FCM not available:", error);
  }
}

// Connect to emulators in development (optional)
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === "true") {
  connectAuthEmulator(auth, "http://localhost:9099");
  connectFirestoreEmulator(db, "localhost", 8080);
}

export default app;

