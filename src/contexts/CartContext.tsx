import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Listing } from "@/features/marketplace/models/types";
import type { CartItem } from "@/types/marketplace";

const STORAGE_KEY = "agrismart_marketplace_cart";

interface CartContextValue {
  cartItems: CartItem[];
  addItem: (listing: Listing, quantity?: number) => void;
  removeItem: (listingId: string) => void;
  updateQty: (listingId: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const loadFromStorage = (): CartItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && typeof item.listingId === "string");
  } catch {
    return [];
  }
};

const saveToStorage = (items: CartItem[]) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage errors.
  }
};

const clampQuantity = (value: number, max?: number) => {
  const safeValue = Math.max(1, Number.isFinite(value) ? value : 1);
  if (typeof max === "number" && max > 0) {
    return Math.min(safeValue, max);
  }
  return safeValue;
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => loadFromStorage());
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    saveToStorage(cartItems);
  }, [cartItems]);

  const addItem = (listing: Listing, quantity: number = 1) => {
    if (!listing.id) return;
    setCartItems((prev) => {
      const existing = prev.find((item) => item.listingId === listing.id);
      const maxQuantity = Number.isFinite(listing.quantity) ? listing.quantity : undefined;
      const nextQuantity = clampQuantity((existing?.quantity || 0) + quantity, maxQuantity);

      if (existing) {
        return prev.map((item) =>
          item.listingId === listing.id ? { ...item, quantity: nextQuantity } : item
        );
      }

      const imageUrl = listing.images?.[0] || "/placeholder.svg";
      const rawLat = typeof listing.location?.lat === "number" ? listing.location.lat : null;
      const rawLng =
        typeof listing.location?.lng === "number"
          ? listing.location.lng
          : typeof listing.location?.lon === "number"
            ? listing.location.lon
            : null;
      const hasValidCoords = rawLat !== null && rawLng !== null && !(rawLat === 0 && rawLng === 0);

      const item: CartItem = {
        listingId: listing.id,
        sellerId: listing.sellerId,
        sellerName: listing.sellerName,
        title: listing.title,
        imageUrl,
        unit: listing.unit,
        pricePerUnit: listing.pricePerUnit,
        currency: listing.currency || "KES",
        county: listing.location?.county || "",
        listingLat: hasValidCoords ? rawLat : null,
        listingLng: hasValidCoords ? rawLng : null,
        quantity: clampQuantity(quantity, maxQuantity),
        maxQuantity,
      };

      return [...prev, item];
    });
  };

  const removeItem = (listingId: string) => {
    setCartItems((prev) => prev.filter((item) => item.listingId !== listingId));
  };

  const updateQty = (listingId: string, quantity: number) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.listingId !== listingId) return item;
        return { ...item, quantity: clampQuantity(quantity, item.maxQuantity) };
      })
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const openCart = () => {
    setIsCartOpen(true);
  };

  const closeCart = () => {
    setIsCartOpen(false);
  };

  const value = useMemo(
    () => ({
      cartItems,
      addItem,
      removeItem,
      updateQty,
      clearCart,
      isCartOpen,
      openCart,
      closeCart,
    }),
    [cartItems, isCartOpen]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}
