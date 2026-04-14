import { onCall, HttpsError, onRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import { defineString } from "firebase-functions/params";
import * as admin from "firebase-admin";
import axios from "axios";

admin.initializeApp();
setGlobalOptions({ maxInstances: 10 });

const db = admin.firestore();

// Define parameters
const MPESA_CONSUMER_KEY = defineString("MPESA_CONSUMER_KEY");
const MPESA_CONSUMER_SECRET = defineString("MPESA_CONSUMER_SECRET");
const MPESA_SHORTCODE = defineString("MPESA_SHORTCODE", { default: "174379" });
const MPESA_PASSKEY = defineString("MPESA_PASSKEY", { default: "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919" });
const MPESA_ENV = defineString("MPESA_ENV", { default: "sandbox" });
const APP_CALLBACK_URL = defineString("APP_CALLBACK_URL", { default: "https://us-central1-crop-conduit-ui.cloudfunctions.net" });

async function getMpesaToken(): Promise<string> {
  const auth = Buffer.from(`${MPESA_CONSUMER_KEY.value()}:${MPESA_CONSUMER_SECRET.value()}`).toString("base64");
  const baseUrl = MPESA_ENV.value() === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";
  
  const response = await axios.get(
    `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${auth}` } }
  );
  return response.data.access_token;
}

export const initiateMpesaPayment = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const { orderId, phone, amount } = request.data;
  if (!orderId || !phone || !amount) {
    throw new HttpsError("invalid-argument", "Missing required fields");
  }

  const orderDoc = await db.collection("orders").doc(orderId).get();
  if (!orderDoc.exists) {
    throw new HttpsError("not-found", "Order not found");
  }

  const orderData = orderDoc.data()!;
  if (orderData.buyerId !== request.auth.uid) {
    throw new HttpsError("permission-denied", "Unauthorized");
  }
  if (orderData.status !== "pending_payment") {
    throw new HttpsError("failed-precondition", "Order is not in pending payment state");
  }

  try {
    const token = await getMpesaToken();
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, -3);
    const password = Buffer.from(`${MPESA_SHORTCODE.value()}${MPESA_PASSKEY.value()}${timestamp}`).toString("base64");
    
    const baseUrl = MPESA_ENV.value() === "production"
      ? "https://api.safaricom.co.ke"
      : "https://sandbox.safaricom.co.ke";

    const stkResponse = await axios.post(
      `${baseUrl}/mpesa/stkpush/v1/processrequest`,
      {
        BusinessShortCode: MPESA_SHORTCODE.value(),
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: Math.round(amount),
        PartyA: phone,
        PartyB: MPESA_SHORTCODE.value(),
        PhoneNumber: phone,
        CallBackURL: `${APP_CALLBACK_URL.value()}/mpesaCallback`,
        AccountReference: `ORDER-${orderId}`,
        TransactionDesc: `Payment for order ${orderId}`,
      },
      { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
    );

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
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message || "Failed to initiate payment");
  }
});

export const mpesaCallback = onRequest(async (req, res) => {
  try {
    const stkCallback = req.body?.Body?.stkCallback;
    if (!stkCallback) {
      res.status(400).json({ error: "Invalid callback format" });
      return;
    }

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;

    const snapshot = await db
      .collection("transactions")
      .where("mpesaCallback.CheckoutRequestID", "==", CheckoutRequestID)
      .limit(1)
      .get();

    if (snapshot.empty) {
      res.status(404).json({ error: "Transaction not found" });
      return;
    }

    const transactionDoc = snapshot.docs[0];
    const transactionData = transactionDoc.data();

    const updateData: any = {
      status: ResultCode === 0 ? "completed" : "failed",
      mpesaCallback: { ...transactionData.mpesaCallback, ResultCode, ResultDesc },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (ResultCode === 0 && CallbackMetadata?.Item) {
      const items = CallbackMetadata.Item;
      updateData.mpesaCallback.MpesaReceiptNumber = items.find((i: any) => i.Name === "MpesaReceiptNumber")?.Value;
      updateData.mpesaCallback.TransactionDate = items.find((i: any) => i.Name === "TransactionDate")?.Value;
      updateData.mpesaCallback.PhoneNumber = items.find((i: any) => i.Name === "PhoneNumber")?.Value;
    }

    await transactionDoc.ref.update(updateData);

    if (ResultCode === 0 && transactionData.orderId) {
      await db.collection("orders").doc(transactionData.orderId).update({
        status: "paid_in_escrow",
        paymentRef: updateData.mpesaCallback.MpesaReceiptNumber,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (error: any) {
    console.error("M-Pesa callback error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
