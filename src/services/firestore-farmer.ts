/**
 * Firestore Service for Farmer Profiles
 * Handles farmer registration data storage
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  updateDoc,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const FARMER_PROFILES_COLLECTION = "farmers";

/**
 * Farmer Profile Interface
 * Stores all farmer registration data including Cloudflare R2 image URLs
 */
export interface FarmerProfile {
  id?: string;
  uid: string;
  email?: string;
  fullName: string;
  phone: string;
  county: string;
  constituency: string;
  ward: string;
  village: string;
  farmSize?: number;
  farmingType?: string;
  farmSizeAcres?: number;
  typeOfFarming?: "crop" | "livestock" | "mixed";
  crops: string[];
  experienceYears?: number;
  farmExperienceYears?: number;
  toolsOwned?: string;
  toolsOrEquipment?: string;
  challenges?: string;
  primaryChallenges?: string;
  estimatedMonthlyProduction?: string;
  farmPhotoUrl?: string | null;
  pending?: {
    status?: string;
    submittedAt?: Date | Timestamp | string;
    reviewEtaHours?: number;
  };
  createdAt?: Date | Timestamp | string;
  updatedAt?: Date | Timestamp | string;
}

const normalizeProfile = (id: string, data: Record<string, any>): FarmerProfile => ({
  id,
  ...data,
  createdAt: data.createdAt?.toDate?.() || data.createdAt,
  updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
});

/**
 * Get a farmer profile by user ID
 */
export async function getFarmerProfile(userId: string): Promise<FarmerProfile | null> {
  try {
    const docRef = doc(db, FARMER_PROFILES_COLLECTION, userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return normalizeProfile(docSnap.id, data);
    }
    return null;
  } catch (error) {
    console.error("Error getting farmer profile:", error);
    throw error;
  }
}

/**
 * Get a farmer profile by uid, with migration fallback from email-based documents.
 */
export async function getFarmerProfileWithMigration(
  userId: string,
  email?: string,
  debug?: boolean
): Promise<FarmerProfile | null> {
  const log = (...args: any[]) => {
    if (debug) {
      console.log("[FarmerProfile]", ...args);
    }
  };

  try {
    log("Fetching profile for uid:", userId);
    const docRef = doc(db, FARMER_PROFILES_COLLECTION, userId);
    const docSnap = await getDoc(docRef);

    log("farmers/{uid} exists:", docSnap.exists());
    if (docSnap.exists()) {
      return normalizeProfile(docSnap.id, docSnap.data());
    }

    if (!email) {
      log("No email available for fallback lookup.");
      return null;
    }

    const fallbackQuery = query(
      collection(db, FARMER_PROFILES_COLLECTION),
      where("email", "==", email),
      limit(1)
    );
    const fallbackSnap = await getDocs(fallbackQuery);
    log("fallback query found profile:", !fallbackSnap.empty);

    if (fallbackSnap.empty) {
      return null;
    }

    const legacyDoc = fallbackSnap.docs[0];
    const legacyData = legacyDoc.data();
    const createdAt = legacyData.createdAt ?? Timestamp.now();
    const migratedData = {
      ...legacyData,
      uid: userId,
      email,
      createdAt,
      updatedAt: Timestamp.now(),
    };

    await setDoc(docRef, migratedData, { merge: true });
    return normalizeProfile(docRef.id, migratedData);
  } catch (error) {
    console.error("Error getting farmer profile with migration:", error);
    throw error;
  }
}

/**
 * Create or update a farmer profile
 * 
 * @param profile - Farmer profile data (without id, createdAt, updatedAt)
 * @returns The document ID (which is the uid)
 */
export async function saveFarmerProfile(
  profile: Omit<FarmerProfile, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  try {
    const docRef = doc(db, FARMER_PROFILES_COLLECTION, profile.uid);
    const existing = await getDoc(docRef);
    const createdAt = existing.exists()
      ? existing.data().createdAt ?? Timestamp.now()
      : Timestamp.now();

    const profileData = {
      ...profile,
      farmSizeAcres:
        typeof profile.farmSizeAcres === "string"
          ? parseFloat(profile.farmSizeAcres)
          : profile.farmSizeAcres,
      farmExperienceYears:
        profile.farmExperienceYears && typeof profile.farmExperienceYears === "string"
          ? parseInt(profile.farmExperienceYears)
          : profile.farmExperienceYears,
      createdAt,
      updatedAt: Timestamp.now(),
    };

    // Clean undefined values
    const cleanData = Object.fromEntries(
      Object.entries(profileData).filter(([_, value]) => value !== undefined)
    ) as any;

    // Use userId as the document ID for easy lookup
    await setDoc(docRef, cleanData, { merge: true });

    return profile.uid;
  } catch (error) {
    console.error("Error saving farmer profile:", error);
    throw error;
  }
}

/**
 * Update farmer profile fields
 */
export async function updateFarmerProfile(
  userId: string,
  updates: Partial<FarmerProfile>
): Promise<void> {
  try {
    const docRef = doc(db, FARMER_PROFILES_COLLECTION, userId);
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now(),
    };

    // Convert farmSize and experience if they're strings
    if (updateData.farmSizeAcres && typeof updateData.farmSizeAcres === "string") {
      updateData.farmSizeAcres = parseFloat(updateData.farmSizeAcres);
    }
    if (updateData.farmExperienceYears && typeof updateData.farmExperienceYears === "string") {
      updateData.farmExperienceYears = parseInt(updateData.farmExperienceYears);
    }

    // Clean undefined values
    const cleanData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    await updateDoc(docRef, cleanData);
  } catch (error) {
    console.error("Error updating farmer profile:", error);
    throw error;
  }
}

