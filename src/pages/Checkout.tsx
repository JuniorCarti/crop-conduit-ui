import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, LocateFixed, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { AlertCard } from "@/components/shared/AlertCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { createOrdersFromCart } from "@/services/ordersService";
import { getBuyerProfile, saveBuyerProfile } from "@/services/userProfileService";
import { ASHA_PREFILL_STORAGE_KEY } from "@/services/ashaActionDispatcher";
import { formatKsh } from "@/lib/currency";
import type { BuyerProfile, PaymentMethod } from "@/types/marketplace";
import { toast } from "sonner";

const MAX_PAY_ON_DELIVERY_AMOUNT = 20000;
const MAX_PAY_ON_DELIVERY_DISTANCE_KM = 50;

const normalizePhoneNumber = (value: string): string | null => {
  const trimmed = value.trim().replace(/\s+/g, "").replace(/-/g, "");
  if (!trimmed) return null;

  let normalized = trimmed;
  if (trimmed.startsWith("0")) {
    normalized = `+254${trimmed.slice(1)}`;
  } else if (trimmed.startsWith("254")) {
    normalized = `+${trimmed}`;
  } else if (!trimmed.startsWith("+")) {
    return null;
  }

  const digits = normalized.startsWith("+") ? normalized.slice(1) : normalized;
  if (!/^\d+$/.test(digits)) return null;
  if (digits.length < 10 || digits.length > 13) return null;
  return normalized;
};

const isValidPhoneNumber = (value: string) => Boolean(normalizePhoneNumber(value));

const haversineDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const readPrefillProfile = (): BuyerProfile | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ASHA_PREFILL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BuyerProfile;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
};

export default function Checkout() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { cartItems, updateQty, removeItem, clearCart } = useCart();

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [saveAsDefault, setSaveAsDefault] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [locationCaptured, setLocationCaptured] = useState(false);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [county, setCounty] = useState("");
  const [town, setTown] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [landmark, setLandmark] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [airtelPhone, setAirtelPhone] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("Pending");

  useEffect(() => {
    const prefill = readPrefillProfile();
    if (!prefill) return;
    setFullName((prev) => prev || prefill.fullName || "");
    setPhone((prev) => prev || prefill.phone || "");
    setEmail((prev) => prev || prefill.email || "");
    setCounty((prev) => prev || prefill.county || "");
    setTown((prev) => prev || prefill.town || "");
    setAddressLine((prev) => prev || prefill.addressLine || "");
    setLandmark((prev) => prev || prefill.landmark || "");
    if (prefill.latitude != null) {
      setLatitude((prev) => (prev == null ? prefill.latitude : prev));
    }
    if (prefill.longitude != null) {
      setLongitude((prev) => (prev == null ? prefill.longitude : prev));
    }
    if (prefill.latitude != null && prefill.longitude != null) {
      setLocationCaptured((prev) => prev || true);
    }
    if (prefill.phone) {
      setMpesaPhone((prev) => prev || prefill.phone || "");
      setAirtelPhone((prev) => prev || prefill.phone || "");
    }
  }, []);

  useEffect(() => {
    if (!currentUser?.uid) return;
    setIsLoadingProfile(true);
    getBuyerProfile(currentUser.uid)
      .then((profile) => {
        if (profile) {
          setFullName(profile.fullName || "");
          setPhone(profile.phone || "");
          setEmail(profile.email || currentUser.email || "");
          setCounty(profile.county || "");
          setTown(profile.town || "");
          setAddressLine(profile.addressLine || "");
          setLandmark(profile.landmark || "");
          setLatitude(profile.latitude ?? null);
          setLongitude(profile.longitude ?? null);
          setLocationCaptured(profile.latitude != null && profile.longitude != null);
          setMpesaPhone(profile.phone || "");
          setAirtelPhone(profile.phone || "");
          toast.success("Saved delivery details loaded.");
        } else {
          setEmail(currentUser.email || "");
        }
      })
      .catch((error) => {
        console.error("Failed to load buyer profile:", error);
      })
      .finally(() => setIsLoadingProfile(false));
  }, [currentUser?.uid, currentUser?.email]);

  const totals = useMemo(() => {
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalCost = cartItems.reduce(
      (sum, item) => sum + item.pricePerUnit * item.quantity,
      0
    );
    return { totalItems, totalCost };
  }, [cartItems]);

  const buyerProfileComplete = Boolean(
    fullName.trim() &&
      isValidPhoneNumber(phone) &&
      county.trim() &&
      town.trim() &&
      addressLine.trim()
  );

  const maxDistanceKm = useMemo(() => {
    if (latitude == null || longitude == null) return null;
    const distances = cartItems
      .map((item) => {
        if (item.listingLat == null || item.listingLng == null) return null;
        return haversineDistanceKm(latitude, longitude, item.listingLat, item.listingLng);
      })
      .filter((value): value is number => typeof value === "number");
    if (distances.length === 0) return null;
    return Math.max(...distances);
  }, [cartItems, latitude, longitude]);

  const payOnDeliveryEligible =
    buyerProfileComplete &&
    totals.totalCost <= MAX_PAY_ON_DELIVERY_AMOUNT &&
    (maxDistanceKm == null || maxDistanceKm <= MAX_PAY_ON_DELIVERY_DISTANCE_KM);

  useEffect(() => {
    if (paymentMethod === "pay_on_delivery" && !payOnDeliveryEligible) {
      setPaymentMethod("");
    }
  }, [paymentMethod, payOnDeliveryEligible]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast.warning("Geolocation is not supported on this device.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setLocationCaptured(true);
        setIsLocating(false);
        toast.success("Location captured.");
      },
      (error) => {
        console.warn("Geolocation error:", error);
        setIsLocating(false);
        toast.warning("Unable to access your location.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const buildBuyerProfile = (): BuyerProfile => ({
    fullName: fullName.trim(),
    phone: normalizePhoneNumber(phone) || phone.trim(),
    email: email.trim() || currentUser?.email || "",
    county: county.trim(),
    town: town.trim(),
    addressLine: addressLine.trim(),
    landmark: landmark.trim(),
    latitude,
    longitude,
  });

  const canPlaceOrder =
    !!paymentMethod &&
    buyerProfileComplete &&
    cartItems.length > 0 &&
    !isPlacingOrder &&
    (paymentMethod !== "pay_on_delivery" || payOnDeliveryEligible);

  const handlePlaceOrders = async () => {
    if (!currentUser?.uid) {
      navigate("/login");
      return;
    }

    if (!cartItems.length) {
      toast.error("Your cart is empty.");
      return;
    }

    if (!paymentMethod) {
      toast.error("Please select a payment method.");
      return;
    }

    if (!buyerProfileComplete) {
      toast.error("Please complete the delivery details.");
      return;
    }

    const normalizedPhone = normalizePhoneNumber(phone);
    if (!normalizedPhone) {
      toast.error("Enter a valid Kenyan phone number.");
      return;
    }

    if (paymentMethod === "pay_on_delivery" && !payOnDeliveryEligible) {
      toast.error(
        "Pay on delivery is available for orders up to KES 20,000 and within 50km."
      );
      return;
    }

    if (paymentMethod === "mpesa") {
      const mpesaNormalized = normalizePhoneNumber(mpesaPhone || phone);
      if (!mpesaNormalized) {
        toast.error("Enter a valid M-Pesa phone number.");
        return;
      }
    }

    if (paymentMethod === "airtel") {
      const airtelNormalized = normalizePhoneNumber(airtelPhone || phone);
      if (!airtelNormalized) {
        toast.error("Enter a valid Airtel Money phone number.");
        return;
      }
    }

    const buyerProfile = buildBuyerProfile();
    const paymentStatusValue =
      paymentMethod === "pay_on_delivery" ? "cash_on_delivery" : "pending";

    try {
      setIsPlacingOrder(true);
      if (saveAsDefault) {
        await saveBuyerProfile(currentUser.uid, buyerProfile);
      }

      await createOrdersFromCart(
        cartItems,
        {
          id: currentUser.uid,
          name: currentUser.displayName || "",
          email: currentUser.email || "",
        },
        buyerProfile,
        {
          method: paymentMethod,
          status: paymentStatusValue,
        }
      );

      clearCart();
      toast.success("Order placed successfully.");
      navigate("/marketplace?tab=my-orders");
    } catch (error: any) {
      console.error("Checkout failed:", error);
      toast.error(error?.message || "Failed to place orders.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="min-h-screen">
      <PageHeader title="Checkout" subtitle="Review and place your orders" icon={ShoppingCart} />

      <div className="p-4 md:p-6 space-y-6">
        {cartItems.length === 0 ? (
          <AlertCard
            type="info"
            title="Your cart is empty"
            message="Add listings from the Marketplace to place an order."
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <Card key={item.listingId} className="overflow-hidden">
                  <CardContent className="p-4 flex flex-col md:flex-row gap-4">
                    <img
                      src={item.imageUrl || "/placeholder.svg"}
                      alt={item.title}
                      className="w-full md:w-32 h-32 object-cover rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.svg";
                      }}
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-foreground">{item.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.sellerName ? `Seller: ${item.sellerName}` : item.county}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.listingId)}
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex flex-wrap items-center gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Unit price</p>
                          <p className="font-medium text-foreground">
                            {formatKsh(item.pricePerUnit)} / {item.unit}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateQty(item.listingId, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="min-w-[32px] text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateQty(item.listingId, item.quantity + 1)}
                            disabled={typeof item.maxQuantity === "number" && item.quantity >= item.maxQuantity}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Subtotal</p>
                          <p className="font-semibold text-foreground">
                            {formatKsh(item.pricePerUnit * item.quantity)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="space-y-4">
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">Delivery Details</h3>
                    {locationCaptured && (
                      <Badge variant="outline" className="text-emerald-600 border-emerald-200">
                        Location captured
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <Label htmlFor="fullName">Full name *</Label>
                      <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone *</Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          if (!mpesaPhone) setMpesaPhone(e.target.value);
                          if (!airtelPhone) setAirtelPhone(e.target.value);
                        }}
                        placeholder="0712345678 or +254712345678"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="county">County *</Label>
                        <Input id="county" value={county} onChange={(e) => setCounty(e.target.value)} />
                      </div>
                      <div>
                        <Label htmlFor="town">Town *</Label>
                        <Input id="town" value={town} onChange={(e) => setTown(e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="addressLine">Address line *</Label>
                      <Input
                        id="addressLine"
                        value={addressLine}
                        onChange={(e) => setAddressLine(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="landmark">Landmark</Label>
                      <Input id="landmark" value={landmark} onChange={(e) => setLandmark(e.target.value)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleUseMyLocation}
                        disabled={isLocating}
                        className="gap-2"
                      >
                        {isLocating ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Locating...
                          </>
                        ) : (
                          <>
                            <LocateFixed className="h-4 w-4" />
                            Use my current location
                          </>
                        )}
                      </Button>
                      {locationCaptured && (
                        <span className="text-xs text-emerald-600">Location captured ✓</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="saveAsDefault"
                      checked={saveAsDefault}
                      onCheckedChange={(value) => setSaveAsDefault(Boolean(value))}
                    />
                    <Label htmlFor="saveAsDefault" className="text-sm">
                      Save as default
                    </Label>
                  </div>

                  {isLoadingProfile && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Loading saved details...
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 space-y-4">
                  <h3 className="font-semibold text-foreground">Payment Method</h3>
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
                    className="space-y-2"
                  >
                    <label className="flex items-center gap-3">
                      <RadioGroupItem value="pay_on_delivery" disabled={!payOnDeliveryEligible} />
                      <span className="text-sm">Pay on Delivery</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <RadioGroupItem value="mpesa" />
                      <span className="text-sm">M-Pesa</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <RadioGroupItem value="airtel" />
                      <span className="text-sm">Airtel Money</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <RadioGroupItem value="card" />
                      <span className="text-sm">Card</span>
                    </label>
                  </RadioGroup>

                  {paymentMethod === "pay_on_delivery" && (
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Pay on delivery is available for orders up to KES 20,000 and within 50km.</p>
                      {!payOnDeliveryEligible && (
                        <p className="text-amber-600">
                          Pay on delivery is available for orders up to KES 20,000 and within 50km.
                        </p>
                      )}
                      {maxDistanceKm != null && (
                        <p>Estimated max distance: {maxDistanceKm.toFixed(1)} km</p>
                      )}
                    </div>
                  )}

                  {paymentMethod === "mpesa" && (
                    <div className="space-y-2">
                      <Label htmlFor="mpesaPhone">M-Pesa phone</Label>
                      <Input
                        id="mpesaPhone"
                        value={mpesaPhone || phone}
                        onChange={(e) => setMpesaPhone(e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setPaymentStatus("Pending");
                          toast.info("STK Push placeholder");
                        }}
                      >
                        Initiate STK Push
                      </Button>
                      <p className="text-xs text-muted-foreground">Status: {paymentStatus}</p>
                    </div>
                  )}

                  {paymentMethod === "airtel" && (
                    <div className="space-y-2">
                      <Label htmlFor="airtelPhone">Airtel Money phone</Label>
                      <Input
                        id="airtelPhone"
                        value={airtelPhone || phone}
                        onChange={(e) => setAirtelPhone(e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => toast.info("Airtel Money payment placeholder")}
                      >
                        Initiate Airtel Money Payment
                      </Button>
                    </div>
                  )}

                  {paymentMethod === "card" && (
                    <div className="text-xs text-muted-foreground">
                      Card payment coming soon.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="h-fit">
                <CardContent className="p-4 space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total items</p>
                    <p className="text-2xl font-semibold text-foreground">{totals.totalItems}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total cost</p>
                    <p className="text-2xl font-bold text-foreground">
                      {formatKsh(totals.totalCost)}
                    </p>
                  </div>
                  <Button className="w-full" onClick={handlePlaceOrders} disabled={!canPlaceOrder}>
                    {isPlacingOrder ? "Placing orders..." : "Place Order(s)"}
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => navigate("/marketplace")}>
                    Go back to Marketplace
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {cartItems.length === 0 && (
          <Button onClick={() => navigate("/marketplace")}>Go back to Marketplace</Button>
        )}
      </div>
    </div>
  );
}
