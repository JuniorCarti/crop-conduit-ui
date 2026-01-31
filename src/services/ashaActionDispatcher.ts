import type { Listing } from "@/features/marketplace/models/types";
import { getListing } from "@/features/marketplace/services/ListingService";
import { saveBuyerProfile } from "@/services/userProfileService";
import type { BuyerProfile } from "@/types/marketplace";

export type AshaAction =
  | { type: "NAVIGATE"; to: string }
  | { type: "OPEN_LISTING"; listingId: string }
  | { type: "ADD_TO_CART"; listing?: Record<string, any>; listingId?: string; quantity?: number }
  | { type: "OPEN_CART" }
  | { type: "CHECKOUT" }
  | { type: "PREFILL_CHECKOUT"; buyer: Record<string, any> };

export type AshaActionPayload = {
  ok?: boolean;
  reply?: string;
  intent?: string;
  uiHint?: {
    navigateTo?: string;
    highlightId?: string;
    openModal?: string;
  };
  actions?: AshaAction[];
  toolResult?: any;
};

type NotifyFn = (message: string, type?: "info" | "success" | "error") => void;

type CartDeps = {
  addItem?: (listing: Listing, quantity?: number) => void;
  removeItem?: (listingId: string) => void;
  clearCart?: () => void;
  openCart?: () => void;
  closeCart?: () => void;
};

export type AshaActionDeps = {
  navigate: (to: string) => void;
  cart?: CartDeps;
  notify?: NotifyFn;
  openModal?: (key: string, payload?: unknown) => void;
  userId?: string;
};

const PREFILL_STORAGE_KEY = "asha_checkout_prefill";

export const ASHA_PREFILL_STORAGE_KEY = PREFILL_STORAGE_KEY;

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = typeof value === "string" ? Number(value) : (value as number);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toString = (value: unknown, fallback = ""): string => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || fallback;
  }
  return fallback;
};

const normalizeListing = (input?: Record<string, any> | null): Listing | null => {
  if (!input || typeof input !== "object") return null;
  const id = toString(input.id ?? input.listingId);
  if (!id) return null;

  const title = toString(input.title ?? input.name, "Listing");
  const cropType = toString(input.cropType ?? input.cropName ?? input.crop, "Produce");
  const unit = (toString(input.unit ?? input.unitName, "kg") as Listing["unit"]) || "kg";
  const quantity = Math.max(1, toNumber(input.quantity ?? input.qty ?? 1, 1));
  const pricePerUnit = Math.max(0, toNumber(input.pricePerUnit ?? input.price ?? input.unitPrice, 0));
  const currency = (toString(input.currency, "KES") as Listing["currency"]) || "KES";
  const phoneNumber = toString(input.phoneNumber ?? input.phone);

  const location = input.location ?? {};
  const lat = toNumber(location.lat ?? input.lat, 0);
  const lng = toNumber(location.lng ?? location.lon ?? input.lng ?? input.lon, 0);
  const county = toString(location.county ?? input.county);
  const address = toString(location.address ?? input.address);

  const images = Array.isArray(input.images) ? input.images.filter(Boolean) : [];
  const imageUrl = toString(input.imageUrl ?? input.photoUrl);
  if (!images.length && imageUrl) {
    images.push(imageUrl);
  }

  const sellerId = toString(input.sellerId ?? input.seller?.id ?? input.seller?.uid);
  const sellerName = toString(input.sellerName ?? input.seller?.name);
  const now = new Date();

  return {
    id,
    title,
    cropType,
    quantity,
    unit,
    pricePerUnit,
    currency,
    phoneNumber,
    location: {
      lat,
      lng,
      county,
      address: address || undefined,
    },
    images,
    sellerId,
    sellerName: sellerName || undefined,
    status: "active",
    createdAt: now,
    updatedAt: now,
  };
};

const resolveNavigateTarget = (navigateTo?: string, highlightId?: string): string | null => {
  if (!navigateTo) return null;
  let target = navigateTo.trim();
  if (!target) return null;

  if (highlightId && target.includes(":id")) {
    target = target.replace(":id", highlightId);
  }

  if (highlightId && target === "/marketplace") {
    target = `/marketplace/listings/${highlightId}`;
  }

  if (target === "/orders") {
    return "/marketplace?tab=my-orders";
  }

  return target;
};

const normalizeBuyerProfile = (buyer: Record<string, any>): BuyerProfile | null => {
  if (!buyer || typeof buyer !== "object") return null;
  const fullName = toString(buyer.fullName ?? buyer.name);
  const phone = toString(buyer.phone);
  const county = toString(buyer.county);
  const town = toString(buyer.town ?? buyer.ward);
  const addressLine = toString(buyer.addressLine ?? buyer.address ?? buyer.location);

  if (!fullName && !phone && !county && !town && !addressLine) {
    return null;
  }

  return {
    fullName: fullName || "Farmer",
    phone,
    email: toString(buyer.email),
    county,
    town,
    addressLine,
    landmark: toString(buyer.landmark),
    latitude: Number.isFinite(buyer.latitude) ? buyer.latitude : null,
    longitude: Number.isFinite(buyer.longitude) ? buyer.longitude : null,
  };
};

const persistPrefill = (profile: BuyerProfile) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREFILL_STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // ignore storage failures
  }
};

export async function dispatchAshaActions(
  payload: AshaActionPayload,
  deps: AshaActionDeps
) {
  const actions = Array.isArray(payload?.actions) ? [...payload.actions] : [];
  if (payload?.uiHint?.navigateTo) {
    const target = resolveNavigateTarget(payload.uiHint.navigateTo, payload.uiHint.highlightId);
    if (target) {
      actions.push({ type: "NAVIGATE", to: target });
    }
  }

  if (payload?.uiHint?.openModal) {
    if (deps.openModal) {
      deps.openModal(payload.uiHint.openModal, { highlightId: payload.uiHint.highlightId });
    }
  }

  if (!actions.length) return;

  const notify: NotifyFn =
    deps.notify ??
    ((message, type) => {
      if (type === "error") {
        console.error(message);
      } else {
        console.log(message);
      }
    });

  for (const action of actions) {
    try {
      switch (action.type) {
        case "NAVIGATE": {
          const target = resolveNavigateTarget(action.to, payload?.uiHint?.highlightId);
          if (target) {
            deps.navigate(target);
          }
          break;
        }
        case "OPEN_LISTING": {
          const listingId = toString(action.listingId);
          if (!listingId) {
            notify("Listing not found.", "error");
            break;
          }
          deps.navigate(`/marketplace/listings/${listingId}`);
          break;
        }
        case "ADD_TO_CART": {
          if (!deps.cart?.addItem) {
            notify("Cart unavailable.", "error");
            break;
          }
          const listingId = toString(action.listingId ?? action.listing?.id ?? action.listing?.listingId);
          let listing = normalizeListing(action.listing);
          if (!listing && listingId) {
            listing = await getListing(listingId);
          }
          if (!listing) {
            notify("Unable to add listing to cart.", "error");
            break;
          }
          deps.cart.addItem(listing, action.quantity ?? 1);
          notify("Added to cart.", "success");
          break;
        }
        case "OPEN_CART": {
          if (deps.cart?.openCart) {
            deps.cart.openCart();
          }
          deps.navigate("/checkout");
          break;
        }
        case "CHECKOUT": {
          deps.navigate("/checkout");
          break;
        }
        case "PREFILL_CHECKOUT": {
          const profile = normalizeBuyerProfile(action.buyer || {});
          if (!profile) {
            notify("Unable to prefill checkout details.", "error");
            break;
          }
          persistPrefill(profile);
          if (deps.userId) {
            await saveBuyerProfile(deps.userId, profile);
          }
          notify("Checkout details updated.", "success");
          break;
        }
        default: {
          // Ignore unknown action types.
          break;
        }
      }
    } catch (error) {
      notify(
        (error as Error)?.message || "Action failed.",
        "error"
      );
    }
  }
}
