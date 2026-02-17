import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

export const cooperativeMaintenanceDaily = functions.pubsub
  .schedule("every 24 hours")
  .onRun(async () => {
    const now = admin.firestore.Timestamp.now();

    // 1) Disable expired join codes
    const joinCodeGroups = await db.collectionGroup("joinCodes").get();
    const joinCodeWrites: Promise<any>[] = [];
    joinCodeGroups.forEach((snap) => {
      const data = snap.data() as any;
      const expiresAt = data?.expiresAt?.toMillis?.() ?? null;
      const isExpired = expiresAt != null && expiresAt <= now.toMillis();
      if (isExpired && data?.isActive !== false) {
        joinCodeWrites.push(
          snap.ref.set(
            {
              isActive: false,
              status: "disabled",
              updatedAt: now,
            },
            { merge: true }
          )
        );
      }
    });

    // 2) Expire old pending join requests (> 30 days)
    const cutoff = admin.firestore.Timestamp.fromMillis(now.toMillis() - 30 * 24 * 60 * 60 * 1000);
    const pendingRequests = await db.collection("orgJoinRequests").where("status", "==", "submitted").get();
    const requestWrites: Promise<any>[] = [];
    pendingRequests.forEach((snap) => {
      const data = snap.data() as any;
      const createdAt = data?.createdAt?.toMillis?.() ?? null;
      if (createdAt != null && createdAt < cutoff.toMillis()) {
        requestWrites.push(
          snap.ref.set(
            {
              status: "expired",
              expiryReason: "timeout",
              updatedAt: now,
            },
            { merge: true }
          )
        );
      }
    });

    await Promise.all([...joinCodeWrites, ...requestWrites]);
    return null;
  });

