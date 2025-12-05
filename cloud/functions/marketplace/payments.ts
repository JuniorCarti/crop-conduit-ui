/**
 * Payment Cloud Functions
 * Handles M-Pesa, Airtel Money, and Stripe payments
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import axios from "axios";

const db = admin.firestore();

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

// Airtel Money Configuration
const AIRTEL_CLIENT_ID = functions.config().airtel?.client_id || process.env.AIRTEL_CLIENT_ID;
const AIRTEL_CLIENT_SECRET = functions.config().airtel?.client_secret || process.env.AIRTEL_CLIENT_SECRET;
const AIRTEL_ENV = functions.config().airtel?.env || process.env.AIRTEL_ENV || "sandbox";
const AIRTEL_BASE_URL =
  AIRTEL_ENV === "production"
    ? "https://openapiuat.airtel.africa"
    : "https://openapiuat.airtel.africa"; // Sandbox URL

// Stripe Configuration
const STRIPE_SECRET_KEY = functions.config().stripe?.secret_key || process.env.STRIPE_SECRET_KEY;
const STRIPE_MOCK_MODE = functions.config().stripe?.mock_mode === "true" || process.env.STRIPE_MOCK_MODE === "true";

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
 */
export const initiateMpesaPayment = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
  }

  const { orderId, phone, amount } = data;

  if (!orderId || !phone || !amount) {
    throw new functions.https.HttpsError("invalid-argument", "Missing required fields");
  }

  try {
    // Verify order
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

    // Update order
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
    console.error("Error initiating M-Pesa payment:", error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError("internal", error.message || "Failed to initiate payment");
  }
});

/**
 * Initiate Airtel Money Payment
 */
export const initiateAirtelPayment = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
  }

  const { orderId, phone, amount } = data;

  if (!orderId || !phone || !amount) {
    throw new functions.https.HttpsError("invalid-argument", "Missing required fields");
  }

  try {
    // Verify order
    const orderDoc = await db.collection("orders").doc(orderId).get();
    if (!orderDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Order not found");
    }

    const orderData = orderDoc.data();
    if (orderData?.buyerId !== context.auth.uid) {
      throw new functions.https.HttpsError("permission-denied", "Unauthorized");
    }

    // Mock mode for Airtel
    if (AIRTEL_ENV === "sandbox" || !AIRTEL_CLIENT_ID) {
      // Create pending transaction
      const transactionRef = await db.collection("transactions").add({
        orderId,
        amount,
        currency: "KES",
        method: "airtel",
        status: "pending",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Simulate callback after 3 seconds
      setTimeout(async () => {
        await db.collection("transactions").doc(transactionRef.id).update({
          status: "completed",
          airtelCallback: {
            transactionId: `AIRTEL-${Date.now()}`,
            status: "SUCCESS",
          },
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        await db.collection("orders").doc(orderId).update({
          status: "paid_in_escrow",
          paymentRef: `AIRTEL-${Date.now()}`,
          transactionId: transactionRef.id,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }, 3000);

      return {
        success: true,
        message: "Airtel Money payment initiated. Please check your phone.",
        transactionId: transactionRef.id,
      };
    }

    // Production Airtel Money API call would go here
    // For now, return mock response
    return {
      success: true,
      message: "Airtel Money payment initiated",
    };
  } catch (error: any) {
    console.error("Error initiating Airtel payment:", error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError("internal", error.message || "Failed to initiate payment");
  }
});

/**
 * Create Stripe Payment Intent
 */
export const createStripePaymentIntent = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
  }

  const { orderId, amount, currency } = data;

  if (!orderId || !amount) {
    throw new functions.https.HttpsError("invalid-argument", "Missing required fields");
  }

  try {
    // Verify order
    const orderDoc = await db.collection("orders").doc(orderId).get();
    if (!orderDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Order not found");
    }

    const orderData = orderDoc.data();
    if (orderData?.buyerId !== context.auth.uid) {
      throw new functions.https.HttpsError("permission-denied", "Unauthorized");
    }

    // Mock mode
    if (STRIPE_MOCK_MODE || !STRIPE_SECRET_KEY) {
      const transactionRef = await db.collection("transactions").add({
        orderId,
        amount,
        currency: currency || "KES",
        method: "card",
        status: "completed",
        stripePaymentIntent: {
          id: `pi_mock_${Date.now()}`,
          status: "succeeded",
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await db.collection("orders").doc(orderId).update({
        status: "paid_in_escrow",
        paymentRef: `pi_mock_${Date.now()}`,
        transactionId: transactionRef.id,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        clientSecret: "mock_client_secret",
        paymentIntentId: `pi_mock_${Date.now()}`,
      };
    }

    // Production: Use Stripe SDK
    // const stripe = require("stripe")(STRIPE_SECRET_KEY);
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: Math.round(amount * 100), // Convert to cents
    //   currency: currency.toLowerCase(),
    //   metadata: { orderId },
    // });

    // return {
    //   success: true,
    //   clientSecret: paymentIntent.client_secret,
    //   paymentIntentId: paymentIntent.id,
    // };

    throw new functions.https.HttpsError("unimplemented", "Stripe integration requires production setup");
  } catch (error: any) {
    console.error("Error creating Stripe payment intent:", error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError("internal", error.message || "Failed to create payment intent");
  }
});

/**
 * M-Pesa Callback Webhook
 */
export const mpesaCallback = functions.https.onRequest(async (req, res) => {
  try {
    const callbackData = req.body;

    if (!callbackData.Body?.stkCallback) {
      return res.status(400).json({ error: "Invalid callback format" });
    }

    const stkCallback = callbackData.Body.stkCallback;
    const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } =
      stkCallback;

    // Find transaction
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
 * Airtel Money Callback Webhook
 */
export const airtelCallback = functions.https.onRequest(async (req, res) => {
  try {
    const callbackData = req.body;

    // Process Airtel callback
    // Update transaction and order status
    // Similar to M-Pesa callback handler

    return res.status(200).json({ status: "success" });
  } catch (error: any) {
    console.error("Error processing Airtel callback:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});
