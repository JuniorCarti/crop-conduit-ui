/**
 * Firestore Helper Functions
 * Additional utilities for fetching and managing Firestore data
 */

import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { convertCropFromFirestore, type Crop } from "./firestore";

const CROPS_COLLECTION = "crops";

/**
 * Fetch all crops for a user (one-time fetch, not real-time)
 * Useful for debugging or when you need a snapshot
 */
export async function fetchAllCrops(userId: string): Promise<Crop[]> {
  try {
    console.log(`[fetchAllCrops] Fetching all crops for user ${userId}`);
    
    const q = query(
      collection(db, CROPS_COLLECTION),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    console.log(`[fetchAllCrops] Found ${snapshot.docs.length} crop documents`);

    const crops = snapshot.docs.map((doc) => {
      try {
        const crop = convertCropFromFirestore(doc);
        console.log(`[fetchAllCrops] Converted crop: ${crop.id} - ${crop.name}`);
        return crop;
      } catch (error) {
        console.error(`[fetchAllCrops] Error converting document ${doc.id}:`, error);
        return null;
      }
    }).filter((crop): crop is Crop => crop !== null);

    console.log(`[fetchAllCrops] Successfully fetched ${crops.length} crops`);
    return crops;
  } catch (error: any) {
    console.error("[fetchAllCrops] Error fetching crops:", error);
    console.error("[fetchAllCrops] Error code:", error.code);
    console.error("[fetchAllCrops] Error message:", error.message);
    throw error;
  }
}

/**
 * Verify Firestore connection and permissions
 */
export async function verifyFirestoreAccess(userId: string): Promise<{
  success: boolean;
  message: string;
  cropCount?: number;
}> {
  try {
    const crops = await fetchAllCrops(userId);
    return {
      success: true,
      message: `Successfully connected. Found ${crops.length} crop(s).`,
      cropCount: crops.length,
    };
  } catch (error: any) {
    const errorMessage = error.message || "Unknown error";
    const isPermissionError = 
      error.code === "permission-denied" || 
      errorMessage.includes("permission") ||
      errorMessage.includes("security");

    return {
      success: false,
      message: isPermissionError
        ? "Permission denied. Please check Firestore security rules."
        : `Error: ${errorMessage}`,
    };
  }
}

