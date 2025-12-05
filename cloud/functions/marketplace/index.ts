/**
 * Marketplace Cloud Functions
 * Firebase Cloud Functions for payment processing and escrow management
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import axios from "axios";

// Import payment functions
export {
  initiateMpesaPayment,
  mpesaCallback,
  initiateAirtelPayment,
  airtelCallback,
  createStripePaymentIntent,
} from "./payments";

// Import notification functions
export {
  onNewMessage,
  onOrderStatusChange,
  onNewRating,
  sendNotificationToUser,
} from "./notifications";

// Import market price sync functions
export {
  syncMarketPricesScheduled,
  syncMarketPricesManual,
} from "./syncMarketPrices";

// Import Excel parsing function
export {
  parseMarketPricesExcel,
} from "./parseExcel";

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const messaging = admin.messaging();

// M-Pesa Configuration
const MPESA_CONSUMER_KEY = functions.config().mpesa?.consumer_key || process.env.MPESA_CONSUMER_KEY;
const MPESA_CONSUMER_SECRET = functions.config().mpesa?.consumer_secret || process.env.MPESA_CONSUMER_SECRET;
const MPESA_SHORTCODE = functions.config().mpesa?.shortcode || process.env.MPESA_SHORTCODE;
const MPESA_PASSKEY = functions.config().mpesa?.passkey || process.env.MPESA_PASSKEY;
const MPESA_ENV = functions.config().mpesa?.env || process.env.MPESA_ENV || "sandbox";
const MPESA_BASE_URL =
  MPESA_ENV === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

/**
 * Get M-Pesa OAuth token
 */
async function getMpesaToken(): Promise<string> {
  try {
    const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString("base64");
    const response = await axios.get(`${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });
    return response.data.access_token;
  } catch (error: any) {
    console.error("Error getting M-Pesa token:", error);
    throw new Error("Failed to authenticate with M-Pesa");
  }
}

/**
 * Initiate M-Pesa STK Push
 * Callable function from frontend
 */
export const initiatePayment = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
  }

  const { orderId, phone, amount } = data;

  if (!orderId || !phone || !amount) {
    throw new functions.https.HttpsError("invalid-argument", "Missing required fields");
  }

  try {
    // Verify order exists and belongs to user
    const orderDoc = await db.collection("orders").doc(orderId).get();
    if (!orderDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Order not found");
    }

    const orderData = orderDoc.data();
    if (orderData?.buyerId !== context.auth.uid) {
      throw new functions.https.HttpsError("permission-denied", "Unauthorized");
    }

    if (orderData?.status !== "pending_payment") {
      throw new functions.https.HttpsError("failed-precondition", "Order is not in pending payment state");
    }

    // Get M-Pesa token
    const token = await getMpesaToken();

    // Generate timestamp and password
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, -3);
    const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString("base64");

    // STK Push payload
    const stkPushPayload = {
      BusinessShortCode: MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.round(amount),
      PartyA: phone,
      PartyB: MPESA_SHORTCODE,
      PhoneNumber: phone,
      CallBackURL: `${functions.config().app?.callback_url || "https://your-domain.com"}/mpesa/callback`,
      AccountReference: `ORDER-${orderId}`,
      TransactionDesc: `Payment for order ${orderId}`,
    };

    // Initiate STK Push
    const stkResponse = await axios.post(
      `${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
      stkPushPayload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Create transaction record
    const transactionRef = await db.collection("transactions").add({
      orderId,
      amount,
      currency: "KES",
      method: "mpesa",
      status: "pending",
      mpesaCallback: {
        MerchantRequestID: stkResponse.data.MerchantRequestID,
        CheckoutRequestID: stkResponse.data.CheckoutRequestID,
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update order with transaction reference
    await db.collection("orders").doc(orderId).update({
      transactionId: transactionRef.id,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      MerchantRequestID: stkResponse.data.MerchantRequestID,
      CheckoutRequestID: stkResponse.data.CheckoutRequestID,
      ResponseCode: stkResponse.data.ResponseCode,
      ResponseDescription: stkResponse.data.ResponseDescription,
      CustomerMessage: stkResponse.data.CustomerMessage,
    };
  } catch (error: any) {
    console.error("Error initiating payment:", error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError("internal", error.message || "Failed to initiate payment");
  }
});

/**
 * M-Pesa Callback Webhook (legacy - use mpesaCallback from payments.ts)
 * @deprecated Use mpesaCallback from payments.ts
 */
export const mpesaCallbackLegacy = functions.https.onRequest(async (req, res) => {
  try {
    const callbackData = req.body;

    // Validate callback structure
    if (!callbackData.Body?.stkCallback) {
      return res.status(400).json({ error: "Invalid callback format" });
    }

    const stkCallback = callbackData.Body.stkCallback;
    const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } =
      stkCallback;

    // Find transaction by CheckoutRequestID
    const transactionsSnapshot = await db
      .collection("transactions")
      .where("mpesaCallback.CheckoutRequestID", "==", CheckoutRequestID)
      .limit(1)
      .get();

    if (transactionsSnapshot.empty) {
      console.error("Transaction not found for CheckoutRequestID:", CheckoutRequestID);
      return res.status(404).json({ error: "Transaction not found" });
    }

    const transactionDoc = transactionsSnapshot.docs[0];
    const transactionData = transactionDoc.data();
    const orderId = transactionData.orderId;

    // Update transaction
    const updateData: any = {
      status: ResultCode === 0 ? "completed" : "failed",
      mpesaCallback: {
        ...transactionData.mpesaCallback,
        ResultCode,
        ResultDesc,
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Extract payment details if successful
    if (ResultCode === 0 && CallbackMetadata?.Item) {
      const items = CallbackMetadata.Item;
      const receiptNumber = items.find((item: any) => item.Name === "MpesaReceiptNumber")?.Value;
      const transactionDate = items.find((item: any) => item.Name === "TransactionDate")?.Value;
      const phoneNumber = items.find((item: any) => item.Name === "PhoneNumber")?.Value;

      updateData.mpesaCallback = {
        ...updateData.mpesaCallback,
        MpesaReceiptNumber: receiptNumber,
        TransactionDate: transactionDate,
        PhoneNumber: phoneNumber,
      };
    }

    await transactionDoc.ref.update(updateData);

    // Update order status if payment successful
    if (ResultCode === 0 && orderId) {
      await db.collection("orders").doc(orderId).update({
        status: "paid_in_escrow",
        paymentRef: updateData.mpesaCallback.MpesaReceiptNumber,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (error: any) {
    console.error("Error processing M-Pesa callback:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Release Escrow Funds
 * Admin or auto-release function
 */
export const releaseEscrow = functions.https.onCall(async (data, context) => {
  // Verify authentication and admin role
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
  }

  const userDoc = await db.collection("users").doc(context.auth.uid).get();
  const userData = userDoc.data();
  if (userData?.role !== "admin") {
    throw new functions.https.HttpsError("permission-denied", "Admin access required");
  }

  const { orderId, reason } = data;

  if (!orderId) {
    throw new functions.https.HttpsError("invalid-argument", "Order ID required");
  }

  try {
    const orderDoc = await db.collection("orders").doc(orderId).get();
    if (!orderDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Order not found");
    }

    const orderData = orderDoc.data();
    if (orderData?.status !== "paid_in_escrow") {
      throw new functions.https.HttpsError("failed-precondition", "Order is not in escrow");
    }

    // Update order status
    await db.collection("orders").doc(orderId).update({
      status: "completed",
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // In production, here you would transfer funds to seller's account
    // For now, we just mark the order as completed
    console.log(`Escrow released for order ${orderId}. Reason: ${reason || "Auto-release"}`);

    return { success: true, message: "Escrow released successfully" };
  } catch (error: any) {
    console.error("Error releasing escrow:", error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError("internal", error.message || "Failed to release escrow");
  }
});

/**
 * Auto-release escrow after delivery confirmation
 * Triggered when order status changes to "delivered"
 */
export const onOrderDelivered = functions.firestore
  .document("orders/{orderId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Check if order was just marked as delivered
    if (before.status === "paid_in_escrow" && after.status === "delivered") {
      const orderId = context.params.orderId;

      // Auto-release after 24 hours (or immediately if configured)
      const autoReleaseDelay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

      setTimeout(async () => {
        try {
          // Re-check order status
          const orderDoc = await db.collection("orders").doc(orderId).get();
          const orderData = orderDoc.data();

          if (orderData?.status === "delivered") {
            await db.collection("orders").doc(orderId).update({
              status: "completed",
              completedAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            console.log(`Auto-released escrow for order ${orderId}`);
          }
        } catch (error) {
          console.error(`Error auto-releasing escrow for order ${orderId}:`, error);
        }
      }, autoReleaseDelay);
    }
  });

/**
 * Generate Receipt PDF
 * Creates a digital receipt for completed orders
 */
export const generateReceipt = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
  }

  const { orderId } = data;

  if (!orderId) {
    throw new functions.https.HttpsError("invalid-argument", "Order ID required");
  }

  try {
    const orderDoc = await db.collection("orders").doc(orderId).get();
    if (!orderDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Order not found");
    }

    const orderData = orderDoc.data();
    if (orderData?.buyerId !== context.auth.uid && orderData?.sellerId !== context.auth.uid) {
      throw new functions.https.HttpsError("permission-denied", "Unauthorized");
    }

    // Generate receipt (simplified - in production, use a PDF library)
    const receiptData = {
      orderId,
      date: new Date().toISOString(),
      buyer: orderData?.buyerName || "Buyer",
      seller: orderData?.sellerName || "Seller",
      items: [
        {
          description: orderData?.listingSnapshot?.title || "Crop",
          quantity: orderData?.quantityOrdered,
          unit: orderData?.listingSnapshot?.unit,
          price: orderData?.pricePerUnit,
          total: orderData?.priceTotal,
        },
      ],
      total: orderData?.priceTotal,
      currency: orderData?.currency || "KES",
    };

    // In production, generate PDF and upload to Supabase Storage
    // For now, return receipt data
    return {
      success: true,
      receiptUrl: `https://your-storage.com/receipts/${orderId}.pdf`, // Placeholder
      receiptData,
    };
  } catch (error: any) {
    console.error("Error generating receipt:", error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError("internal", error.message || "Failed to generate receipt");
  }
});
