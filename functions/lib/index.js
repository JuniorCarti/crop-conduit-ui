"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mpesaCallback = exports.initiateMpesaPayment = void 0;
const https_1 = require("firebase-functions/v2/https");
const v2_1 = require("firebase-functions/v2");
const params_1 = require("firebase-functions/params");
const admin = __importStar(require("firebase-admin"));
const axios_1 = __importDefault(require("axios"));
admin.initializeApp();
(0, v2_1.setGlobalOptions)({ maxInstances: 10 });
const db = admin.firestore();
// Define parameters
const MPESA_CONSUMER_KEY = (0, params_1.defineString)("MPESA_CONSUMER_KEY");
const MPESA_CONSUMER_SECRET = (0, params_1.defineString)("MPESA_CONSUMER_SECRET");
const MPESA_SHORTCODE = (0, params_1.defineString)("MPESA_SHORTCODE", { default: "174379" });
const MPESA_PASSKEY = (0, params_1.defineString)("MPESA_PASSKEY", { default: "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919" });
const MPESA_ENV = (0, params_1.defineString)("MPESA_ENV", { default: "sandbox" });
const APP_CALLBACK_URL = (0, params_1.defineString)("APP_CALLBACK_URL", { default: "https://us-central1-crop-conduit-ui.cloudfunctions.net" });
async function getMpesaToken() {
    const auth = Buffer.from(`${MPESA_CONSUMER_KEY.value()}:${MPESA_CONSUMER_SECRET.value()}`).toString("base64");
    const baseUrl = MPESA_ENV.value() === "production"
        ? "https://api.safaricom.co.ke"
        : "https://sandbox.safaricom.co.ke";
    const response = await axios_1.default.get(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, { headers: { Authorization: `Basic ${auth}` } });
    return response.data.access_token;
}
exports.initiateMpesaPayment = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "User must be authenticated");
    }
    const { orderId, phone, amount } = request.data;
    if (!orderId || !phone || !amount) {
        throw new https_1.HttpsError("invalid-argument", "Missing required fields");
    }
    const orderDoc = await db.collection("orders").doc(orderId).get();
    if (!orderDoc.exists) {
        throw new https_1.HttpsError("not-found", "Order not found");
    }
    const orderData = orderDoc.data();
    if (orderData.buyerId !== request.auth.uid) {
        throw new https_1.HttpsError("permission-denied", "Unauthorized");
    }
    if (orderData.status !== "pending_payment") {
        throw new https_1.HttpsError("failed-precondition", "Order is not in pending payment state");
    }
    try {
        const token = await getMpesaToken();
        const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, -3);
        const password = Buffer.from(`${MPESA_SHORTCODE.value()}${MPESA_PASSKEY.value()}${timestamp}`).toString("base64");
        const baseUrl = MPESA_ENV.value() === "production"
            ? "https://api.safaricom.co.ke"
            : "https://sandbox.safaricom.co.ke";
        const stkResponse = await axios_1.default.post(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
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
        }, { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });
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
    }
    catch (error) {
        if (error instanceof https_1.HttpsError)
            throw error;
        throw new https_1.HttpsError("internal", error.message || "Failed to initiate payment");
    }
});
exports.mpesaCallback = (0, https_1.onRequest)(async (req, res) => {
    var _a, _b, _c, _d, _e;
    try {
        const stkCallback = (_b = (_a = req.body) === null || _a === void 0 ? void 0 : _a.Body) === null || _b === void 0 ? void 0 : _b.stkCallback;
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
        const updateData = {
            status: ResultCode === 0 ? "completed" : "failed",
            mpesaCallback: Object.assign(Object.assign({}, transactionData.mpesaCallback), { ResultCode, ResultDesc }),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        if (ResultCode === 0 && (CallbackMetadata === null || CallbackMetadata === void 0 ? void 0 : CallbackMetadata.Item)) {
            const items = CallbackMetadata.Item;
            updateData.mpesaCallback.MpesaReceiptNumber = (_c = items.find((i) => i.Name === "MpesaReceiptNumber")) === null || _c === void 0 ? void 0 : _c.Value;
            updateData.mpesaCallback.TransactionDate = (_d = items.find((i) => i.Name === "TransactionDate")) === null || _d === void 0 ? void 0 : _d.Value;
            updateData.mpesaCallback.PhoneNumber = (_e = items.find((i) => i.Name === "PhoneNumber")) === null || _e === void 0 ? void 0 : _e.Value;
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
    }
    catch (error) {
        console.error("M-Pesa callback error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
//# sourceMappingURL=index.js.map