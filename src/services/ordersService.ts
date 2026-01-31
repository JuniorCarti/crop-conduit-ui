import { collection, doc, serverTimestamp, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { BuyerProfile, CartItem, OrderItem, PaymentMethod, PaymentStatus } from "@/types/marketplace";

const ORDERS_COLLECTION = "orders";

interface BuyerInfo {
  id: string;
  name: string;
  email?: string | null;
}

interface OrdersSummary {
  orderIds: string[];
}

const buildOrderItems = (items: CartItem[]): OrderItem[] => {
  return items.map((item) => ({
    listingId: item.listingId,
    title: item.title,
    sellerId: item.sellerId,
    imageUrl: item.imageUrl,
    unit: item.unit,
    qty: item.quantity,
    unitPrice: item.pricePerUnit,
    subtotal: item.pricePerUnit * item.quantity,
  }));
};

export async function createOrdersFromCart(
  cartItems: CartItem[],
  buyer: BuyerInfo,
  buyerProfile: BuyerProfile,
  payment: { method: PaymentMethod; status: PaymentStatus; providerRef?: string }
): Promise<OrdersSummary> {
  if (!cartItems.length) {
    throw new Error("Cart is empty.");
  }

  const grouped = new Map<string, CartItem[]>();
  cartItems.forEach((item) => {
    if (!grouped.has(item.sellerId)) {
      grouped.set(item.sellerId, []);
    }
    grouped.get(item.sellerId)?.push(item);
  });

  const batch = writeBatch(db);
  const orderIds: string[] = [];

  grouped.forEach((items, sellerId) => {
    const orderRef = doc(collection(db, ORDERS_COLLECTION));
    const orderItems = buildOrderItems(items);
    const totalAmount = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
    const totalQuantity = orderItems.reduce((sum, item) => sum + item.qty, 0);
    const currency = items[0]?.currency || "KES";

    batch.set(orderRef, {
      buyerId: buyer.id,
      buyerName: buyer.name || buyer.email || "Buyer",
      buyerProfileSnapshot: buyerProfile,
      sellerId,
      status: "pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      currency,
      totals: {
        itemsCount: orderItems.length,
        subtotal: totalAmount,
        total: totalAmount,
      },
      totalAmount,
      quantity: totalQuantity,
      items: orderItems,
      payment,
      delivery: {
        county: buyerProfile.county,
        town: buyerProfile.town,
        addressLine: buyerProfile.addressLine,
        landmark: buyerProfile.landmark || "",
        lat: buyerProfile.latitude,
        lng: buyerProfile.longitude,
      },
    });

    orderIds.push(orderRef.id);
  });

  await batch.commit();

  return { orderIds };
}
