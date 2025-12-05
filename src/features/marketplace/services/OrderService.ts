/**
 * Order Service
 * Handles order creation, updates, and status management
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  runTransaction,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Order, OrderStatus } from "../models/types";
import { getListing } from "./ListingService";

const ORDERS_COLLECTION = "orders";
const LISTINGS_COLLECTION = "listings";

const convertTimestamp = (timestamp: any): Date => {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  if (timestamp?.toDate) return timestamp.toDate();
  if (typeof timestamp === "string") return new Date(timestamp);
  return new Date();
};

/**
 * Create a new order with stock reservation
 * Uses Firestore transaction to ensure atomicity
 */
export async function createOrder(
  order: Omit<Order, "id" | "createdAt" | "updatedAt" | "status">
): Promise<string> {
  try {
    // Use transaction to reserve stock and create order atomically
    const orderId = await runTransaction(db, async (transaction) => {
      // Get listing to check availability
      const listingRef = doc(db, LISTINGS_COLLECTION, order.listingId);
      const listingSnap = await transaction.get(listingRef);

      if (!listingSnap.exists()) {
        throw new Error("Listing not found");
      }

      const listingData = listingSnap.data();
      if (listingData.status !== "active") {
        throw new Error("Listing is not active");
      }

      if (listingData.quantity < order.quantityOrdered) {
        throw new Error("Insufficient quantity available");
      }

      // Reserve stock by reducing quantity
      const newQuantity = listingData.quantity - order.quantityOrdered;
      transaction.update(listingRef, {
        quantity: newQuantity,
        updatedAt: Timestamp.now(),
        // Mark as sold if quantity reaches 0
        ...(newQuantity === 0 && { status: "sold" }),
      });

      // Create order
      const orderRef = doc(collection(db, ORDERS_COLLECTION));
      const orderData: any = {
        ...order,
        status: "pending_payment" as OrderStatus,
        listingSnapshot: listingData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      transaction.set(orderRef, orderData);

      return orderRef.id;
    });

    return orderId;
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  additionalData?: Partial<Order>
): Promise<void> {
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    const updates: any = {
      status,
      updatedAt: Timestamp.now(),
    };

    // Add timestamp based on status
    if (status === "shipped" && !additionalData?.shippedAt) {
      updates.shippedAt = Timestamp.now();
    }
    if (status === "delivered" && !additionalData?.deliveredAt) {
      updates.deliveredAt = Timestamp.now();
    }
    if (status === "completed" && !additionalData?.completedAt) {
      updates.completedAt = Timestamp.now();
    }

    if (additionalData) {
      Object.assign(updates, additionalData);
    }

    await updateDoc(orderRef, updates);
  } catch (error) {
    console.error("Error updating order status:", error);
    throw error;
  }
}

/**
 * Get order by ID
 */
export async function getOrder(orderId: string): Promise<Order | null> {
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    const orderSnap = await getDoc(orderRef);

    if (orderSnap.exists()) {
      const data = orderSnap.data();
      return {
        id: orderSnap.id,
        ...data,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
        shippedAt: data.shippedAt ? convertTimestamp(data.shippedAt) : undefined,
        deliveredAt: data.deliveredAt ? convertTimestamp(data.deliveredAt) : undefined,
        completedAt: data.completedAt ? convertTimestamp(data.completedAt) : undefined,
      } as Order;
    }
    return null;
  } catch (error) {
    console.error("Error getting order:", error);
    throw error;
  }
}

/**
 * Get orders for a user (buyer or seller)
 */
export async function getUserOrders(
  userId: string,
  role: "buyer" | "seller",
  status?: OrderStatus
): Promise<Order[]> {
  try {
    let q = query(
      collection(db, ORDERS_COLLECTION),
      where(role === "buyer" ? "buyerId" : "sellerId", "==", userId),
      orderBy("createdAt", "desc")
    );

    if (status) {
      q = query(q, where("status", "==", status));
    }

    const snapshot = await getDocs(q);
    const orders: Order[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      orders.push({
        id: doc.id,
        ...data,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
        shippedAt: data.shippedAt ? convertTimestamp(data.shippedAt) : undefined,
        deliveredAt: data.deliveredAt ? convertTimestamp(data.deliveredAt) : undefined,
        completedAt: data.completedAt ? convertTimestamp(data.completedAt) : undefined,
      } as Order);
    });

    return orders;
  } catch (error) {
    console.error("Error getting user orders:", error);
    throw error;
  }
}

/**
 * Subscribe to user orders with real-time updates
 */
export function subscribeToUserOrders(
  userId: string,
  role: "buyer" | "seller",
  callback: (orders: Order[]) => void
): () => void {
  try {
    const q = query(
      collection(db, ORDERS_COLLECTION),
      where(role === "buyer" ? "buyerId" : "sellerId", "==", userId),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const orders: Order[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          orders.push({
            id: doc.id,
            ...data,
            createdAt: convertTimestamp(data.createdAt),
            updatedAt: convertTimestamp(data.updatedAt),
            shippedAt: data.shippedAt ? convertTimestamp(data.shippedAt) : undefined,
            deliveredAt: data.deliveredAt ? convertTimestamp(data.deliveredAt) : undefined,
            completedAt: data.completedAt ? convertTimestamp(data.completedAt) : undefined,
          } as Order);
        });
        callback(orders);
      },
      (error) => {
        console.error("Error subscribing to orders:", error);
        callback([]);
      }
    );
  } catch (error) {
    console.error("Error setting up order subscription:", error);
    return () => {};
  }
}

/**
 * Cancel an order (only if pending_payment or paid_in_escrow)
 */
export async function cancelOrder(orderId: string, userId: string): Promise<void> {
  try {
    const order = await getOrder(orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    // Verify user has permission
    if (order.buyerId !== userId && order.sellerId !== userId) {
      throw new Error("Unauthorized");
    }

    // Only allow cancellation in certain states
    if (!["pending_payment", "paid_in_escrow"].includes(order.status)) {
      throw new Error("Order cannot be cancelled in current state");
    }

    await runTransaction(db, async (transaction) => {
      const orderRef = doc(db, ORDERS_COLLECTION, orderId);
      const listingRef = doc(db, LISTINGS_COLLECTION, order.listingId);

      // Update order status
      transaction.update(orderRef, {
        status: "cancelled" as OrderStatus,
        updatedAt: Timestamp.now(),
      });

      // Restore stock if order was paid
      if (order.status === "paid_in_escrow") {
        const listingSnap = await transaction.get(listingRef);
        if (listingSnap.exists()) {
          const listingData = listingSnap.data();
          transaction.update(listingRef, {
            quantity: listingData.quantity + order.quantityOrdered,
            status: listingData.status === "sold" ? "active" : listingData.status,
            updatedAt: Timestamp.now(),
          });
        }
      }
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    throw error;
  }
}
