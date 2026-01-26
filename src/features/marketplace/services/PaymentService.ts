/**
 * Payment Service
 * Handles M-Pesa STK Push integration and payment callbacks
 */

import {
  collection,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  Transaction,
  TransactionStatus,
  MpesaSTKPushRequest,
  MpesaSTKPushResponse,
} from "../models/types";
import { updateOrderStatus } from "./OrderService";

const TRANSACTIONS_COLLECTION = "transactions";
const MOCK_MODE = import.meta.env.VITE_MPESA_MOCK_MODE === "true";

const convertTimestamp = (timestamp: any): Date => {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  if (timestamp?.toDate) return timestamp.toDate();
  if (typeof timestamp === "string") return new Date(timestamp);
  return new Date();
};

/**
 * Initiate M-Pesa STK Push payment
 */
export async function initiateMpesaPayment(
  request: MpesaSTKPushRequest
): Promise<MpesaSTKPushResponse> {
  try {
    if (MOCK_MODE) {
      // Mock mode for development
      console.log("MOCK MODE: Simulating M-Pesa STK Push", request);
      
      // Create pending transaction
      const transactionRef = await addDoc(collection(db, TRANSACTIONS_COLLECTION), {
        orderId: request.orderId,
        amount: request.amount,
        currency: "KES",
        method: "mpesa",
        status: "pending" as TransactionStatus,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      // Simulate callback after 3 seconds
      setTimeout(async () => {
        await handleMockCallback(transactionRef.id, request.orderId, true);
      }, 3000);

      return {
        success: true,
        MerchantRequestID: `MOCK-${Date.now()}`,
        CheckoutRequestID: `MOCK-CHECKOUT-${Date.now()}`,
        ResponseCode: "0",
        ResponseDescription: "Success. Request accepted for processing",
        CustomerMessage: "MOCK: Enter your M-Pesa PIN to complete payment",
      };
    }

    throw new Error("M-Pesa payments are not configured.");
  } catch (error: any) {
    console.error("Error initiating M-Pesa payment:", error);
    throw new Error(error.message || "Failed to initiate payment");
  }
}

/**
 * Handle mock payment callback (for development)
 */
async function handleMockCallback(
  transactionId: string,
  orderId: string,
  success: boolean
): Promise<void> {
  try {
    const transactionRef = doc(db, TRANSACTIONS_COLLECTION, transactionId);
    
    if (success) {
      await updateDoc(transactionRef, {
        status: "completed" as TransactionStatus,
        mpesaCallback: {
          ResultCode: 0,
          ResultDesc: "The service request is processed successfully.",
          MpesaReceiptNumber: `MOCK${Date.now()}`,
          TransactionDate: new Date().toISOString(),
          PhoneNumber: "254712345678",
        },
        updatedAt: Timestamp.now(),
      });

      // Update order status
      await updateOrderStatus(orderId, "paid_in_escrow", {
        paymentRef: `MOCK${Date.now()}`,
        transactionId,
      });
    } else {
      await updateDoc(transactionRef, {
        status: "failed" as TransactionStatus,
        mpesaCallback: {
          ResultCode: 1032,
          ResultDesc: "Request cancelled by user",
        },
        updatedAt: Timestamp.now(),
      });
    }
  } catch (error) {
    console.error("Error handling mock callback:", error);
  }
}

/**
 * Get transaction by ID
 */
export async function getTransaction(transactionId: string): Promise<Transaction | null> {
  try {
    const transactionRef = doc(db, TRANSACTIONS_COLLECTION, transactionId);
    const transactionSnap = await getDoc(transactionRef);

    if (transactionSnap.exists()) {
      const data = transactionSnap.data();
      return {
        id: transactionSnap.id,
        ...data,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
      } as Transaction;
    }
    return null;
  } catch (error) {
    console.error("Error getting transaction:", error);
    throw error;
  }
}

/**
 * Get transactions for an order
 */
export async function getOrderTransactions(orderId: string): Promise<Transaction[]> {
  try {
    const q = query(
      collection(db, TRANSACTIONS_COLLECTION),
      where("orderId", "==", orderId),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    const transactions: Transaction[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      transactions.push({
        id: doc.id,
        ...data,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
      } as Transaction);
    });

    return transactions;
  } catch (error) {
    console.error("Error getting order transactions:", error);
    throw error;
  }
}

/**
 * Create refund transaction
 */
export async function createRefund(
  orderId: string,
  amount: number,
  reason: string
): Promise<string> {
  try {
    // Get original transaction
    const transactions = await getOrderTransactions(orderId);
    const originalTx = transactions.find((tx) => tx.status === "completed");

    if (!originalTx) {
      throw new Error("No completed transaction found for order");
    }

    // Create refund transaction
    const refundRef = await addDoc(collection(db, TRANSACTIONS_COLLECTION), {
      orderId,
      amount: -amount, // Negative for refund
      currency: originalTx.currency,
      method: originalTx.method,
      status: "completed" as TransactionStatus,
      refundAmount: amount,
      refundReason: reason,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // Update original transaction
    await updateDoc(doc(db, TRANSACTIONS_COLLECTION, originalTx.id!), {
      status: "refunded" as TransactionStatus,
      refundAmount: amount,
      refundReason: reason,
      updatedAt: Timestamp.now(),
    });

    return refundRef.id;
  } catch (error) {
    console.error("Error creating refund:", error);
    throw error;
  }
}
