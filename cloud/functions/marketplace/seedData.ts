/**
 * Seed Data Cloud Function
 * Populates Firestore with sample horticultural crop listings
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
// Sample listings data (inline to avoid import issues in Cloud Functions)
const SAMPLE_LISTINGS_DATA = [
  {
    title: "Fresh Tomatoes - Rio Grande Variety",
    cropType: "Tomato",
    variety: "Rio Grande",
    quantity: 500,
    unit: "kg",
    pricePerUnit: 80,
    currency: "KES",
    location: { lat: -1.2921, lng: 36.8219, county: "Nairobi", address: "Kasarani, Nairobi" },
    images: [],
    description: "Fresh, high-quality tomatoes from our farm.",
    tags: ["fresh", "organic"],
    status: "active",
    metadata: { quality: "Grade A", organic: true },
  },
  // Add more samples as needed
];

function generateSampleListings(count: number) {
  // Generate listings logic here
  return SAMPLE_LISTINGS_DATA.slice(0, count);
}

const db = admin.firestore();

/**
 * Seed horticultural crop listings
 * Callable function to populate database with sample data
 */
export const seedHorticulturalCrops = functions.https.onCall(async (data, context) => {
  // Only allow in development or with admin auth
  if (process.env.NODE_ENV === "production" && context.auth?.uid) {
    const userDoc = await db.collection("users").doc(context.auth.uid).get();
    const userData = userDoc.data();
    if (userData?.role !== "admin") {
      throw new functions.https.HttpsError("permission-denied", "Admin access required");
    }
  }

  const { count = 20, userId } = data;

  try {
    const listings = generateSampleListings(count);
    const batch = db.batch();
    let batchCount = 0;

    for (const listing of listings) {
      const listingRef = db.collection("listings").doc();
      batch.set(listingRef, {
        ...listing,
        sellerId: userId || "seed-user",
        sellerName: "Sample Farmer",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      batchCount++;
      if (batchCount >= 500) {
        // Firestore batch limit
        await batch.commit();
        batchCount = 0;
      }
    }

    if (batchCount > 0) {
      await batch.commit();
    }

    return {
      success: true,
      message: `Seeded ${listings.length} horticultural crop listings`,
      count: listings.length,
    };
  } catch (error: any) {
    console.error("Error seeding data:", error);
    throw new functions.https.HttpsError("internal", error.message || "Failed to seed data");
  }
});

/**
 * Seed specific sample listings
 */
export const seedSampleListings = functions.https.onCall(async (data, context) => {
  if (process.env.NODE_ENV === "production" && context.auth?.uid) {
    const userDoc = await db.collection("users").doc(context.auth.uid).get();
    const userData = userDoc.data();
    if (userData?.role !== "admin") {
      throw new functions.https.HttpsError("permission-denied", "Admin access required");
    }
  }

  const { userId } = data;

  try {
    const batch = db.batch();

    for (const listing of SAMPLE_LISTINGS) {
      const listingRef = db.collection("listings").doc();
      batch.set(listingRef, {
        ...listing,
        sellerId: userId || "seed-user",
        sellerName: "Sample Farmer",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();

    return {
      success: true,
      message: `Seeded ${SAMPLE_LISTINGS.length} sample listings`,
      count: SAMPLE_LISTINGS.length,
    };
  } catch (error: any) {
    console.error("Error seeding sample listings:", error);
    throw new functions.https.HttpsError("internal", error.message || "Failed to seed data");
  }
});
