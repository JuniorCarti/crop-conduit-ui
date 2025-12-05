/**
 * Notification Cloud Functions
 * Handles FCM push notifications for marketplace events
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();
const messaging = admin.messaging();

/**
 * Send notification to user
 */
async function sendNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  try {
    // Get user's FCM tokens
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      console.warn(`User ${userId} not found`);
      return;
    }

    const userData = userDoc.data();
    const fcmTokens = userData?.fcmTokens || [];

    if (fcmTokens.length === 0) {
      console.warn(`No FCM tokens for user ${userId}`);
      return;
    }

    // Send to all tokens
    const messages = fcmTokens.map((token: string) => ({
      token,
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        click_action: "FLUTTER_NOTIFICATION_CLICK",
      },
      android: {
        priority: "high" as const,
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1,
          },
        },
      },
    }));

    const response = await messaging.sendEach(messages);
    console.log(`Sent ${response.successCount} notifications to user ${userId}`);
  } catch (error) {
    console.error("Error sending notification:", error);
  }
}

/**
 * Trigger notification when new message is received
 */
export const onNewMessage = functions.firestore
  .document("chats/{chatId}/messages/{messageId}")
  .onCreate(async (snap, context) => {
    const message = snap.data();
    const chatId = context.params.chatId;

    // Get chat to find participants
    const chatDoc = await db.collection("chats").doc(chatId).get();
    if (!chatDoc.exists) return;

    const chatData = chatDoc.data();
    const participants = chatData?.participants || [];

    // Notify all participants except sender
    const recipients = participants.filter((uid: string) => uid !== message.senderId);

    for (const recipientId of recipients) {
      // Get sender name
      const senderDoc = await db.collection("users").doc(message.senderId).get();
      const senderName = senderDoc.data()?.displayName || "Someone";

      await sendNotification(
        recipientId,
        "New Message",
        `${senderName}: ${message.text.substring(0, 50)}${message.text.length > 50 ? "..." : ""}`,
        {
          type: "new_message",
          chatId,
          messageId: snap.id,
          senderId: message.senderId,
        }
      );
    }
  });

/**
 * Trigger notification when order status changes
 */
export const onOrderStatusChange = functions.firestore
  .document("orders/{orderId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Only notify on status change
    if (before.status === after.status) return;

    const orderId = context.params.orderId;

    // Notify buyer
    if (after.buyerId) {
      let title = "Order Update";
      let body = `Your order status has been updated to ${after.status}`;

      switch (after.status) {
        case "paid_in_escrow":
          title = "Payment Received";
          body = "Your payment has been received and is held in escrow";
          break;
        case "shipped":
          title = "Order Shipped";
          body = "Your order has been shipped";
          break;
        case "delivered":
          title = "Order Delivered";
          body = "Your order has been delivered. Please confirm receipt.";
          break;
        case "completed":
          title = "Order Completed";
          body = "Your order has been completed. Please rate your experience.";
          break;
      }

      await sendNotification(after.buyerId, title, body, {
        type: "order_update",
        orderId,
        status: after.status,
      });
    }

    // Notify seller
    if (after.sellerId && ["paid_in_escrow", "pending_payment"].includes(after.status)) {
      await sendNotification(
        after.sellerId,
        "New Order",
        `You have a new order for ${after.quantityOrdered} ${after.listingSnapshot?.unit || "units"}`,
        {
          type: "new_order",
          orderId,
        }
      );
    }
  });

/**
 * Trigger notification when rating is received
 */
export const onNewRating = functions.firestore
  .document("ratings/{ratingId}")
  .onCreate(async (snap, context) => {
    const rating = snap.data();

    if (rating.toUserId) {
      await sendNotification(
        rating.toUserId,
        "New Rating Received",
        `You received a ${rating.rating}-star rating${rating.comment ? `: "${rating.comment.substring(0, 50)}"` : ""}`,
        {
          type: "new_rating",
          ratingId: context.params.ratingId,
          fromUserId: rating.fromUserId,
        }
      );
    }
  });

/**
 * Manual notification sender (callable)
 */
export const sendNotificationToUser = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
  }

  // Only admins can send manual notifications
  const userDoc = await db.collection("users").doc(context.auth.uid).get();
  const userData = userDoc.data();
  if (userData?.role !== "admin") {
    throw new functions.https.HttpsError("permission-denied", "Admin access required");
  }

  const { userId, title, body, data: notificationData } = data;

  if (!userId || !title || !body) {
    throw new functions.https.HttpsError("invalid-argument", "Missing required fields");
  }

  await sendNotification(userId, title, body, notificationData);

  return { success: true };
});
