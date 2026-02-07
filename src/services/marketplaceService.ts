import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
  Timestamp,
  type DocumentData,
  type Query,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Listing, Order } from "@/features/marketplace/models/types";
import { uploadToR2 as uploadSingleToR2 } from "@/services/r2UploadService";
import { getUserCoopMembership } from "@/services/cooperativeMembershipService";

const LISTINGS_COLLECTION = "listings";
const ORDERS_COLLECTION = "orders";
const LISTING_EDITS_COLLECTION = "listingEdits";

type UserProfile = {
  displayName?: string | null;
  phone?: string | null;
};

const isFirestoreFieldValue = (value: unknown): boolean => {
  if (!value || typeof value !== "object") return false;
  if (value instanceof Date || value instanceof Timestamp) return false;
  return "isEqual" in (value as Record<string, unknown>);
};

// Recursively remove undefined values while preserving Firestore field values.
export const stripUndefined = <T,>(value: T): T => {
  if (value === undefined) {
    return undefined as T;
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => stripUndefined(item))
      .filter((item) => item !== undefined) as unknown as T;
  }

  if (value instanceof Date || value instanceof Timestamp || isFirestoreFieldValue(value)) {
    return value;
  }

  if (value && typeof value === "object") {
    const cleaned: Record<string, unknown> = {};
    Object.entries(value as Record<string, unknown>).forEach(([key, val]) => {
      if (val === undefined) return;
      const nextVal = stripUndefined(val);
      if (nextVal !== undefined) {
        cleaned[key] = nextVal;
      }
    });
    return cleaned as T;
  }

  return value;
};

const convertTimestamp = (value: unknown): Date => {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  if (typeof value === "object" && value && "toDate" in value) {
    try {
      return (value as { toDate: () => Date }).toDate();
    } catch {
      return new Date();
    }
  }
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? new Date() : date;
  }
  return new Date();
};

const toListing = (snap: QueryDocumentSnapshot<DocumentData>): Listing => {
  const data = snap.data() as Listing & {
    createdAt?: unknown;
    updatedAt?: unknown;
    latestReviewAt?: unknown;
    location?: Listing["location"] & { lon?: unknown; lng?: unknown; lat?: unknown; county?: string; address?: string };
    county?: string;
  };
  const lat = typeof data.location?.lat === "number" ? data.location.lat : 0;
  const lng =
    typeof data.location?.lng === "number"
      ? data.location.lng
      : typeof data.location?.lon === "number"
        ? data.location.lon
        : 0;
  const lon =
    typeof data.location?.lon === "number"
      ? data.location.lon
      : typeof data.location?.lng === "number"
        ? data.location.lng
        : 0;
  const avgRating = typeof data.avgRating === "number" ? data.avgRating : 0;
  const reviewCount = typeof data.reviewCount === "number" ? data.reviewCount : 0;
  const latestReviewSnippet = typeof data.latestReviewSnippet === "string" ? data.latestReviewSnippet : "";
  const latestReviewAt = data.latestReviewAt ? convertTimestamp(data.latestReviewAt) : undefined;
  const phoneNumber = typeof data.phoneNumber === "string" ? data.phoneNumber : "";
  const sellerPhone = typeof (data as { sellerPhone?: unknown }).sellerPhone === "string"
    ? (data as { sellerPhone?: string }).sellerPhone
    : undefined;

  return {
    ...data,
    id: snap.id,
    images: Array.isArray(data.images) ? data.images : [],
    tags: Array.isArray(data.tags) ? data.tags : [],
    location: {
      county: data.location?.county || data.county || "",
      address: data.location?.address || "",
      lat,
      lng,
      // Preserve lon for map usage while staying compatible with lng.
      ...(Number.isFinite(lon) ? { lon } : {}),
    },
    avgRating,
    reviewCount,
    latestReviewSnippet,
    phoneNumber,
    ...(sellerPhone ? { sellerPhone } : {}),
    ...(latestReviewAt ? { latestReviewAt } : {}),
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
  } as Listing;
};

const toOrder = (snap: QueryDocumentSnapshot<DocumentData>): Order => {
  const data = snap.data() as Order & {
    createdAt?: unknown;
    updatedAt?: unknown;
    quantity?: number;
    totalAmount?: number;
    items?: Order["items"];
  };

  const quantityOrdered =
    typeof data.quantityOrdered === "number"
      ? data.quantityOrdered
      : typeof data.quantity === "number"
        ? data.quantity
        : 0;

  const priceTotal =
    typeof data.priceTotal === "number"
      ? data.priceTotal
      : typeof data.totalAmount === "number"
        ? data.totalAmount
        : 0;

  return {
    ...data,
    id: snap.id,
    quantityOrdered,
    priceTotal,
    totalAmount: typeof data.totalAmount === "number" ? data.totalAmount : priceTotal,
    items: Array.isArray(data.items) ? data.items : undefined,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
  } as Order;
};

async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = snap.data() as UserProfile;
    return {
      displayName: data.displayName ?? null,
      phone: data.phone ?? null,
    };
  } catch {
    return null;
  }
}

export function getBrowseListings(): Query<DocumentData> {
  return query(collection(db, LISTINGS_COLLECTION), orderBy("createdAt", "desc"));
}

export function getMyListings(uid: string): Query<DocumentData> {
  return query(
    collection(db, LISTINGS_COLLECTION),
    where("sellerId", "==", uid),
    orderBy("createdAt", "desc")
  );
}

export function getMyOrders(uid: string): Query<DocumentData> {
  return query(
    collection(db, ORDERS_COLLECTION),
    where("buyerId", "==", uid),
    orderBy("createdAt", "desc")
  );
}

export function getIncomingOrders(uid: string): Query<DocumentData> {
  return query(
    collection(db, ORDERS_COLLECTION),
    where("sellerId", "==", uid),
    orderBy("createdAt", "desc")
  );
}

function subscribeToQuery<T>(
  q: Query<DocumentData>,
  map: (snap: QueryDocumentSnapshot<DocumentData>) => T,
  callback: (items: T[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map(map);
      callback(items);
    },
    (error) => {
      console.error("Marketplace subscription error:", error);
      onError?.(error as Error);
      callback([]);
    }
  );
}

export function subscribeToBrowseListings(
  callback: (listings: Listing[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return subscribeToQuery(getBrowseListings(), toListing, callback, onError);
}

export function subscribeToMyListings(
  uid: string,
  callback: (listings: Listing[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return subscribeToQuery(getMyListings(uid), toListing, callback, onError);
}

export function subscribeToMyOrders(
  uid: string,
  callback: (orders: Order[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return subscribeToQuery(getMyOrders(uid), toOrder, callback, onError);
}

export function subscribeToIncomingOrders(
  uid: string,
  callback: (orders: Order[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return subscribeToQuery(getIncomingOrders(uid), toOrder, callback, onError);
}

export async function uploadToR2(files: FileList | File[]): Promise<string[]> {
  const fileArray = Array.isArray(files) ? files : Array.from(files);
  const urls: string[] = [];

  for (const file of fileArray) {
    const url = await uploadSingleToR2(file);
    urls.push(url);
  }

  return urls;
}

export async function createListingWithProfile(
  listing: Omit<Listing, "id" | "createdAt" | "updatedAt" | "sellerId">,
  currentUser: { uid: string; displayName?: string | null; phoneNumber?: string | null }
): Promise<string> {
  const profile = await getUserProfile(currentUser.uid);
  const sellerName = profile?.displayName || currentUser.displayName || null;
  const sellerPhone = profile?.phone || currentUser.phoneNumber || null;
  const coopSnap = await getDoc(doc(db, "users", currentUser.uid, "coopVerification", "status"));
  const coopData = coopSnap.exists() ? (coopSnap.data() as any) : null;
  let coopVerified = coopData?.verified === true;
  let coopId = coopVerified ? coopData?.orgId ?? null : null;
  let coopName = coopVerified ? coopData?.orgName ?? null : null;
  if (!coopVerified) {
    const membership = await getUserCoopMembership(currentUser.uid);
    if (membership?.status === "active") {
      coopVerified = true;
      coopId = membership.orgId;
      coopName = membership.coopName ?? coopName;
    }
  }

  const payload: Record<string, unknown> = {
    ...listing,
    sellerId: currentUser.uid,
    sellerName,
    sellerPhone,
    phoneNumber: listing.phoneNumber || sellerPhone || "",
    status: listing.status || "active",
    images: listing.images || [],
    location: {
      county: listing.location?.county || "",
      address: listing.location?.address || "",
      lat: listing.location?.lat ?? null,
      lng: listing.location?.lng ?? listing.location?.lon ?? null,
      lon: listing.location?.lon ?? listing.location?.lng ?? null,
    },
    avgRating: 0,
    reviewCount: 0,
    latestReviewSnippet: "",
    coopVerified,
    coopId,
    coopName,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const cleanPayload = stripUndefined(payload);
  if (import.meta.env?.DEV) {
    console.log("[marketplace] createListing payload", cleanPayload);
  }

  const docRef = await addDoc(collection(db, LISTINGS_COLLECTION), cleanPayload);
  return docRef.id;
}

export async function createOrderForListing(
  listing: Listing,
  buyerId: string,
  quantity: number
): Promise<string> {
  if (!listing.id) {
    throw new Error("Listing ID is required");
  }

  if (listing.sellerId === buyerId) {
    throw new Error("You cannot order your own listing");
  }

  const safeQuantity = Math.max(1, Number.isFinite(quantity) ? quantity : 1);
  const totalAmount = safeQuantity * listing.pricePerUnit;

  const payload: Record<string, unknown> = {
    listingId: listing.id,
    sellerId: listing.sellerId,
    buyerId,
    quantity: safeQuantity,
    unit: listing.unit,
    pricePerUnit: listing.pricePerUnit,
    totalAmount,
    // Backward-compatible fields used in existing UI components.
    quantityOrdered: safeQuantity,
    priceTotal: totalAmount,
    currency: listing.currency,
    listingSnapshot: {
      ...listing,
      id: listing.id,
      location: {
        county: listing.location?.county || "",
        address: listing.location?.address || "",
        lat: listing.location?.lat ?? null,
        lng: listing.location?.lng ?? null,
      },
      images: listing.images || [],
    },
    status: "pending",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const cleanPayload = stripUndefined(payload);
  if (import.meta.env?.DEV) {
    console.log("[marketplace] createOrder payload", cleanPayload);
  }

  const docRef = await addDoc(collection(db, ORDERS_COLLECTION), cleanPayload);
  return docRef.id;
}

export async function requestListingEdit(
  listing: Listing,
  patch: Record<string, unknown>
): Promise<string> {
  if (!listing.id) {
    throw new Error("Listing ID is required");
  }
  if (!patch || Object.keys(patch).length === 0) {
    throw new Error("No changes to submit.");
  }
  if (listing.status === "pending_update") {
    throw new Error("Listing is already pending review.");
  }

  const listingRef = doc(db, LISTINGS_COLLECTION, listing.id);
  const editRef = doc(collection(db, LISTING_EDITS_COLLECTION));
  const submittedAt = Timestamp.now();
  const reviewAfterAt = Timestamp.fromMillis(submittedAt.toMillis() + 60 * 60 * 1000);

  await runTransaction(db, async (transaction) => {
    const listingSnap = await transaction.get(listingRef);
    if (!listingSnap.exists()) {
      throw new Error("Listing not found.");
    }

    const listingData = listingSnap.data() as Listing;
    if (listingData.sellerId !== listing.sellerId) {
      throw new Error("You are not authorized to edit this listing.");
    }

    transaction.set(editRef, {
      listingId: listing.id,
      sellerId: listing.sellerId,
      patch,
      status: "pending",
      submittedAt,
      reviewAfterAt,
    });

    transaction.update(listingRef, {
      status: "pending_update",
      lastEditRequestId: editRef.id,
      updatedAt: serverTimestamp(),
    });
  });

  return editRef.id;
}

// Manual approval helper (call from admin-only tooling later).
export async function approveListingEdit(editId: string): Promise<void> {
  if (!editId) {
    throw new Error("Edit ID is required");
  }

  const editRef = doc(db, LISTING_EDITS_COLLECTION, editId);

  await runTransaction(db, async (transaction) => {
    const editSnap = await transaction.get(editRef);
    if (!editSnap.exists()) {
      throw new Error("Edit request not found.");
    }

    const editData = editSnap.data() as {
      listingId?: string;
      patch?: Record<string, unknown>;
      status?: string;
    };
    if (!editData.listingId || !editData.patch) {
      throw new Error("Invalid edit request.");
    }
    if (editData.status && editData.status !== "pending") {
      throw new Error("Edit request has already been processed.");
    }

    const listingRef = doc(db, LISTINGS_COLLECTION, editData.listingId);
    const listingSnap = await transaction.get(listingRef);
    if (!listingSnap.exists()) {
      throw new Error("Listing not found.");
    }

    transaction.update(listingRef, {
      ...editData.patch,
      status: "active",
      updatedAt: serverTimestamp(),
    });

    transaction.update(editRef, {
      status: "approved",
      reviewedAt: serverTimestamp(),
    });
  });
}
