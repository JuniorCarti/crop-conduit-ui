/**
 * Firestore Service for Farmer Profiles
 * Handles farmer registration data storage
 */

import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const FARMER_PROFILES_COLLECTION = "farmerProfiles";

/**
 * Farmer Profile Interface
 * Stores all farmer registration data including Supabase Storage URLs
 */
export interface FarmerProfile {
  id?: string;
  userId: string;
  fullName: string;
  county: string;
  constituency: string;
  ward: string;
  village: string;
  farmSize: number; // acres
  farmingType: "Crop" | "Livestock" | "Mixed";
  crops: string[];
  livestock: string[];
  experience?: number; // years
  tools?: string;
  challenges?: string;
  monthlyProduction?: string;
  phone: string;
  farmPhotoUrl?: string; // Supabase Storage URL (replaces Firebase Storage path)
  createdAt?: Date | Timestamp | string;
  updatedAt?: Date | Timestamp | string;
}

/**
 * Get a farmer profile by user ID
 */
export async function getFarmerProfile(userId: string): Promise<FarmerProfile | null> {
  try {
    const docRef = doc(db, FARMER_PROFILES_COLLECTION, userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
      } as FarmerProfile;
    }
    return null;
  } catch (error) {
    console.error("Error getting farmer profile:", error);
    throw error;
  }
}

/**
 * Create or update a farmer profile
 * 
 * @param profile - Farmer profile data (without id, createdAt, updatedAt)
 * @returns The document ID (which is the userId)
 */
export async function saveFarmerProfile(
  profile: Omit<FarmerProfile, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  try {
    const profileData = {
      ...profile,
      farmSize: typeof profile.farmSize === "string" ? parseFloat(profile.farmSize) : profile.farmSize,
      experience: profile.experience ? (typeof profile.experience === "string" ? parseInt(profile.experience) : profile.experience) : undefined,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Clean undefined values
    const cleanData = Object.fromEntries(
      Object.entries(profileData).filter(([_, value]) => value !== undefined)
    ) as any;

    // Use userId as the document ID for easy lookup
    const docRef = doc(db, FARMER_PROFILES_COLLECTION, profile.userId);
    await setDoc(docRef, cleanData, { merge: true });

    return profile.userId;
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
    if (updateData.farmSize && typeof updateData.farmSize === "string") {
      updateData.farmSize = parseFloat(updateData.farmSize);
    }
    if (updateData.experience && typeof updateData.experience === "string") {
      updateData.experience = parseInt(updateData.experience);
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

