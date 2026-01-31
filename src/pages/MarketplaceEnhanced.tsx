/**
 * Enhanced Marketplace Page
 * Full-featured marketplace with live ratings, real-time chat, multiple payments, and map
 */

import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Store, Search, Plus, Filter, MapPin, MessageSquare, ShoppingCart } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCard } from "@/components/shared/AlertCard";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateRating } from "@/features/marketplace/hooks/useRatings";
import { ListingCard } from "@/features/marketplace/components/ListingCard";
import { CreateListingForm } from "@/features/marketplace/components/CreateListingForm";
import { EnhancedChatWindow } from "@/features/marketplace/components/EnhancedChatWindow";
import { PaymentModal } from "@/features/marketplace/components/PaymentModal";
import { StarRatingInput } from "@/features/marketplace/components/StarRating";
import { MarketplaceMap } from "@/features/marketplace/components/MarketplaceMap";
import { PriceReference } from "@/features/marketplace/components/PriceReference";
import { ReviewsSection } from "@/components/marketplace/ReviewsSection";
import { ReviewStars } from "@/components/marketplace/ReviewStars";
import { EditListingModal } from "@/features/marketplace/components/EditListingModal";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { initializeFCM } from "@/features/marketplace/services/NotificationService";
import { setUserOnline, setUserOffline } from "@/features/marketplace/services/PresenceService";
import { getOrCreateChat } from "@/features/marketplace/services/ChatService";
import { getOrder } from "@/features/marketplace/services/OrderService";
import { findFarmersInRadius } from "@/features/marketplace/services/GeolocationService";
import type { Listing, ListingSortBy, Order, Rating } from "@/features/marketplace/models/types";
import {
  createOrderForListing,
  subscribeToBrowseListings,
  subscribeToIncomingOrders,
  subscribeToMyListings,
  subscribeToMyOrders,
} from "@/services/marketplaceService";
import { toast } from "sonner";

export default function MarketplaceEnhanced() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { cartItems, addItem: addToCart } = useCart();
  const [showListingModal, setShowListingModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [otherUserId, setOtherUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<ListingSortBy>("newest");
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [farmerCount, setFarmerCount] = useState(0);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [browseListings, setBrowseListings] = useState<Listing[]>([]);
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [buyerOrders, setBuyerOrders] = useState<Order[]>([]);
  const [incomingOrders, setIncomingOrders] = useState<Order[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [myListingsLoading, setMyListingsLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [listingToEdit, setListingToEdit] = useState<Listing | null>(null);
  const [showSellerPhone, setShowSellerPhone] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(searchParams.get("tab") || "browse");

  // Initialize FCM and presence on mount
  useEffect(() => {
    if (currentUser?.uid) {
      try {
        initializeFCM(currentUser.uid).catch(console.error);
        setUserOnline(currentUser.uid).catch(console.error);
      } catch (error) {
        console.error("Error initializing FCM/presence:", error);
      }

      return () => {
        try {
          setUserOffline(currentUser.uid).catch(console.error);
        } catch (error) {
          console.error("Error setting user offline:", error);
        }
      };
    }
  }, [currentUser?.uid]);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.warn("Geolocation error:", error);
          // Default to Nairobi
          setUserLocation({ lat: -1.2921, lng: 36.8219 });
        }
      );
    } else {
      // Default to Nairobi
      setUserLocation({ lat: -1.2921, lng: 36.8219 });
    }
  }, []);

  // Get farmer count in area
  useEffect(() => {
    if (userLocation) {
      findFarmersInRadius(userLocation.lat, userLocation.lng, 10, 50).then((result) => {
        setFarmerCount(result.count);
      });
    }
  }, [userLocation]);

  // Browse listings: show all listings from every user.
  useEffect(() => {
    setListingsLoading(true);
    const unsubscribe = subscribeToBrowseListings(
      (listings) => {
        setBrowseListings(listings);
        setListingsLoading(false);
      },
      () => {
        toast.error("Failed to load listings");
        setListingsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // User-specific data: my listings, my orders, and incoming orders.
  useEffect(() => {
    const uid = currentUser?.uid;
    if (!uid) {
      setMyListings([]);
      setBuyerOrders([]);
      setIncomingOrders([]);
      setMyListingsLoading(false);
      setOrdersLoading(false);
      return;
    }

    setMyListingsLoading(true);
    setOrdersLoading(true);
    let buyerLoaded = false;
    let incomingLoaded = false;
    const finishOrdersLoad = () => {
      if (buyerLoaded && incomingLoaded) {
        setOrdersLoading(false);
      }
    };

    const unsubMyListings = subscribeToMyListings(
      uid,
      (listings) => {
        setMyListings(listings);
        setMyListingsLoading(false);
      },
      () => {
        toast.error("Failed to load your listings");
        setMyListingsLoading(false);
      }
    );

    const unsubMyOrders = subscribeToMyOrders(
      uid,
      (orders) => {
        setBuyerOrders(orders);
        buyerLoaded = true;
        finishOrdersLoad();
      },
      () => {
        toast.error("Failed to load your orders");
        buyerLoaded = true;
        finishOrdersLoad();
      }
    );

    const unsubIncoming = subscribeToIncomingOrders(
      uid,
      (orders) => {
        setIncomingOrders(orders);
        incomingLoaded = true;
        finishOrdersLoad();
      },
      () => {
        toast.error("Failed to load incoming orders");
        incomingLoaded = true;
        finishOrdersLoad();
      }
    );

    return () => {
      unsubMyListings();
      unsubMyOrders();
      unsubIncoming();
    };
  }, [currentUser?.uid]);

  const createRating = useCreateRating();

  const handleViewListing = (listing: Listing) => {
    setSelectedListing(listing);
  };

  const handleContactSeller = async () => {
    if (!selectedListing || !currentUser?.uid) return;

    try {
      const chat = await getOrCreateChat(
        currentUser.uid,
        selectedListing.sellerId,
        selectedListing.id
      );
      setChatId(chat.id);
      setOtherUserId(selectedListing.sellerId);
      setShowChatModal(true);
    } catch (error) {
      console.error("Error opening chat:", error);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedListing || !currentUser?.uid) return;

    try {
      if (selectedListing.sellerId === currentUser.uid) {
        toast.error("You cannot order your own listing");
        return;
      }

      const orderId = await createOrderForListing(selectedListing, currentUser.uid, orderQuantity);

      const order = await getOrder(orderId);
      if (order) {
        setCreatedOrder(order);
        setShowPaymentModal(true);
      }
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error((error as Error)?.message || "Failed to create order");
    }
  };

  const handleSubmitRating = async (rating: number, comment?: string) => {
    if (!createdOrder || !currentUser?.uid) return;

    try {
      await createRating.mutateAsync({
        orderId: createdOrder.id!,
        listingId: createdOrder.listingId,
        fromUserId: currentUser.uid,
        toUserId: createdOrder.sellerId,
        rating,
        comment,
      });
      setShowRatingModal(false);
    } catch (error) {
      console.error("Error submitting rating:", error);
    }
  };

  const filteredListings = browseListings.filter((listing) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      listing.title.toLowerCase().includes(query) ||
      listing.cropType.toLowerCase().includes(query) ||
      listing.location.county.toLowerCase().includes(query)
    );
  });

  const sortedListings = [...filteredListings].sort((a, b) => {
    if (sortBy === "price_low") return a.pricePerUnit - b.pricePerUnit;
    if (sortBy === "price_high") return b.pricePerUnit - a.pricePerUnit;
    const aTime = new Date(a.createdAt as Date).getTime();
    const bTime = new Date(b.createdAt as Date).getTime();
    return bTime - aTime;
  });

  const sortedMyListings = [...myListings].sort((a, b) => {
    const aTime = new Date(a.createdAt as Date).getTime();
    const bTime = new Date(b.createdAt as Date).getTime();
    return bTime - aTime;
  });

  const selectedListingAvgRating =
    typeof selectedListing?.avgRating === "number" ? selectedListing.avgRating : 0;
  const selectedListingReviewCount =
    typeof selectedListing?.reviewCount === "number" ? selectedListing.reviewCount : 0;
  const addToCartDisabled =
    !!selectedListing &&
    (selectedListing.sellerId === currentUser?.uid || selectedListing.quantity <= 0);

  const formatOrderTitle = (order: Order) => {
    if (order.items && order.items.length > 0) {
      const firstTitle = order.items[0].title;
      const extraCount = order.items.length - 1;
      return extraCount > 0 ? `${firstTitle} +${extraCount} more` : firstTitle;
    }
    return order.listingSnapshot?.title || "Order";
  };

  const formatOrderLine = (order: Order) => {
    if (order.items && order.items.length > 0) {
      const totalQty = order.items.reduce((sum, item) => {
        if (typeof item.quantity === "number") return sum + item.quantity;
        if (typeof item.qty === "number") return sum + item.qty;
        return sum;
      }, 0);
      return `${totalQty} items • ${order.totalAmount ?? order.priceTotal ?? 0} ${order.currency}`;
    }
    return `${order.quantityOrdered ?? 0} ${order.listingSnapshot?.unit || ""} x ${
      order.pricePerUnit ?? 0
    } = ${order.priceTotal ?? 0} ${order.currency}`;
  };

  // Keep selected listing in sync with live browse updates (e.g., review aggregates).
  useEffect(() => {
    if (!selectedListing?.id) return;
    const updated = browseListings.find((listing) => listing.id === selectedListing.id);
    if (updated) {
      setSelectedListing(updated);
    }
  }, [browseListings, selectedListing?.id]);

  useEffect(() => {
    setShowSellerPhone(false);
  }, [selectedListing?.id]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const maskPhoneNumber = (phone: string) => {
    const trimmed = phone.trim();
    if (!trimmed) return "";
    const digits = trimmed.replace(/\D/g, "");
    if (digits.length < 4) return trimmed;

    const lastThree = digits.slice(-3);
    if (trimmed.startsWith("+254")) {
      return `+2547****${lastThree}`;
    }
    if (trimmed.startsWith("07")) {
      return `07****${lastThree}`;
    }
    return `${digits.slice(0, 2)}****${lastThree}`;
  };

  const handleCopyPhone = async (phone: string) => {
    try {
      await navigator.clipboard.writeText(phone);
      toast.success("Phone number copied.");
    } catch (error) {
      console.error("Copy phone failed:", error);
      toast.error("Failed to copy phone number.");
    }
  };

  const handleEditListing = (listing: Listing) => {
    setListingToEdit(listing);
    setShowEditModal(true);
  };

  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  const handleAddToCart = (listing: Listing, goToCheckout = false) => {
    if (!currentUser?.uid) {
      navigate("/login");
      return;
    }

    if (listing.sellerId === currentUser.uid) {
      toast.error("You cannot buy your own listing");
      return;
    }

    if (listing.quantity <= 0) {
      toast.error("This listing is out of stock");
      return;
    }

    addToCart(listing, 1);
    toast.success("Added to cart");

    if (goToCheckout) {
      navigate("/checkout");
    }
  };

  return (
    <div className="min-h-screen">
      <PageHeader title="Marketplace" subtitle="Buy & sell crops" icon={Store}>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="relative"
            onClick={() => navigate("/checkout")}
          >
            <ShoppingCart className="h-4 w-4" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 h-5 min-w-[20px] rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center px-1">
                {cartCount}
              </span>
            )}
          </Button>
          <Button size="sm" onClick={() => setShowListingModal(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">List Crop</span>
          </Button>
        </div>
      </PageHeader>

      <div className="p-4 md:p-6 space-y-6">
        {/* Farmer Count Badge */}
        {userLocation && farmerCount > 0 && (
          <AlertCard
            type="info"
            title={`${farmerCount} farmers nearby`}
            message="Connect with farmers in your area"
          />
        )}

        {/* Search and Filters */}
        <div className="flex gap-2 animate-fade-up">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search crops, varieties, locations..."
              className="pl-10 bg-card"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select
            value={sortBy}
            onValueChange={(value) => setSortBy(value as ListingSortBy)}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="price_low">Price: Low to High</SelectItem>
              <SelectItem value="price_high">Price: High to Low</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="animate-fade-up"
          style={{ animationDelay: "0.1s" }}
        >
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="browse">Browse</TabsTrigger>
            <TabsTrigger value="map">Map</TabsTrigger>
            <TabsTrigger value="my-orders">My Orders</TabsTrigger>
            <TabsTrigger value="my-listings">My Listings</TabsTrigger>
          </TabsList>

          {/* Browse Tab */}
          <TabsContent value="browse" className="mt-4">
            {listingsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-64 rounded-xl" />
                ))}
              </div>
            ) : sortedListings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedListings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    onClick={() => handleViewListing(listing)}
                    onAddToCart={() => handleAddToCart(listing)}
                    addToCartDisabled={
                      listing.sellerId === currentUser?.uid || listing.quantity <= 0
                    }
                  />
                ))}
              </div>
            ) : (
              <AlertCard
                type="info"
                title="No Listings Found"
                message={searchQuery ? `No listings match "${searchQuery}"` : "No listings available yet"}
              />
            )}
          </TabsContent>

          {/* Map Tab */}
          <TabsContent value="map" className="mt-4">
            <MarketplaceMap onViewDetails={handleViewListing} />
          </TabsContent>

                    {/* My Orders Tab */}
          <TabsContent value="my-orders" className="mt-4">
            {ordersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-3">
                  {buyerOrders.length > 0 ? (
                    buyerOrders.map((order) => (
                      <div
                        key={order.id}
                        className="bg-card rounded-xl p-4 border border-border/50"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-foreground">
                              {formatOrderTitle(order)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatOrderLine(order)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Status: {order.status}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-foreground">
                              {order.totalAmount ?? order.priceTotal ?? 0} {order.currency}
                            </p>
                            {order.status === "completed" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="mt-2"
                                onClick={() => {
                                  setCreatedOrder(order);
                                  setShowRatingModal(true);
                                }}
                              >
                                Rate Seller
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <AlertCard
                      type="info"
                      title="No Orders Yet"
                      message="Your orders will appear here once you make a purchase"
                    />
                  )}
                </div>

                <div className="space-y-3">
                  {incomingOrders.length > 0 ? (
                    incomingOrders.map((order) => (
                      <div
                        key={order.id}
                        className="bg-card rounded-xl p-4 border border-border/50"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-foreground">
                              Incoming order
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatOrderLine(order)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Status: {order.status}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-foreground">
                              {order.totalAmount ?? order.priceTotal ?? 0} {order.currency}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <AlertCard
                      type="info"
                      title="No Incoming Orders"
                      message="Orders placed on your listings will appear here"
                    />
                  )}
                </div>
              </div>
            )}
          </TabsContent>

                    {/* My Listings Tab */}
          <TabsContent value="my-listings" className="mt-4">
            {myListingsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-64 rounded-xl" />
                ))}
              </div>
            ) : sortedMyListings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedMyListings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    onClick={() => handleViewListing(listing)}
                    onEdit={
                      listing.sellerId === currentUser?.uid
                        ? () => handleEditListing(listing)
                        : undefined
                    }
                    editDisabled={listing.status === "pending_update"}
                    pendingLabel="Pending review"
                  />
                ))}
              </div>
            ) : (
              <AlertCard
                type="info"
                title="No Listings Yet"
                message="Create your first listing to start selling"
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Listing Detail Modal */}
      <Dialog open={!!selectedListing} onOpenChange={() => setSelectedListing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{selectedListing?.title}</span>
              {selectedListing?.status === "pending_update" && (
                <Badge variant="secondary">Update pending</Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedListing && (
            <div className="space-y-4 mt-4">
              {/* Images Carousel */}
              {selectedListing.images && selectedListing.images.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {selectedListing.images.slice(0, 4).map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`${selectedListing.title} ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.svg";
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Listing Rating Summary */}
              <div className="flex items-center gap-2">
                <ReviewStars rating={selectedListingAvgRating} size="md" />
                {selectedListingReviewCount > 0 ? (
                  <span className="text-sm text-muted-foreground">
                    {selectedListingAvgRating.toFixed(1)} ({selectedListingReviewCount})
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">No reviews yet</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Price</p>
                  <p className="text-2xl font-bold text-foreground">
                    {selectedListing.pricePerUnit} {selectedListing.currency}/{selectedListing.unit}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Available</p>
                  <p className="text-lg font-semibold text-foreground">
                    {selectedListing.quantity} {selectedListing.unit}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{selectedListing.location.county}</span>
              </div>

              {/* Seller Phone */}
              {selectedListing.phoneNumber && (
                <div className="rounded-lg border border-border/50 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Seller phone</p>
                      <p className="text-sm font-medium text-foreground">
                        {showSellerPhone
                          ? selectedListing.phoneNumber
                          : maskPhoneNumber(selectedListing.phoneNumber)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!showSellerPhone && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setShowSellerPhone(true)}
                        >
                          Contact Seller
                        </Button>
                      )}
                      {showSellerPhone && (
                        <>
                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                          >
                            <a href={`tel:${selectedListing.phoneNumber}`}>Call</a>
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopyPhone(selectedListing.phoneNumber)}
                          >
                            Copy
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {selectedListing.description && (
                <div>
                  <p className="text-sm font-semibold mb-2">Description</p>
                  <p className="text-sm text-muted-foreground">{selectedListing.description}</p>
                </div>
              )}

              {/* Market Price Reference */}
              <PriceReference listing={selectedListing} />

              {/* Reviews */}
              <ReviewsSection
                listing={selectedListing}
                currentUser={{ uid: currentUser?.uid, displayName: currentUser?.displayName }}
              />

              {/* Quantity Selector */}
              <div>
                <label className="text-sm font-medium mb-2 block">Quantity</label>
                <Input
                  type="number"
                  min="1"
                  max={selectedListing.quantity}
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(Math.max(1, Math.min(selectedListing.quantity, Number(e.target.value) || 1)))}
                  className="w-32"
                />
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button variant="outline" className="flex-1" onClick={handleContactSeller}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Contact Seller
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleAddToCart(selectedListing, true)}
                  disabled={addToCartDisabled}
                >
                  Add to Cart
                </Button>
                <Button className="flex-1" onClick={handlePlaceOrder}>
                  Place Order
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Listing Modal */}
      <Dialog open={showListingModal} onOpenChange={setShowListingModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <CreateListingForm
            onSuccess={() => {
              setShowListingModal(false);
            }}
            onCancel={() => setShowListingModal(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Listing Modal */}
      <EditListingModal
        open={showEditModal}
        listing={listingToEdit}
        onClose={() => {
          setShowEditModal(false);
          setListingToEdit(null);
        }}
        onSubmitted={() => {
          setShowEditModal(false);
          setListingToEdit(null);
        }}
      />

      {/* Chat Modal */}
      <Dialog open={showChatModal} onOpenChange={setShowChatModal}>
        <DialogContent className="max-w-2xl">
          {chatId && otherUserId && (
            <EnhancedChatWindow
              chatId={chatId}
              otherUserId={otherUserId}
              otherUserName={selectedListing?.sellerName}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent>
          {createdOrder && (
            <PaymentModal
              order={createdOrder}
              onSuccess={() => {
                setShowPaymentModal(false);
                setSelectedListing(null);
                setCreatedOrder(null);
                // Show rating modal after successful payment
                setTimeout(() => setShowRatingModal(true), 1000);
              }}
              onCancel={() => {
                setShowPaymentModal(false);
                setCreatedOrder(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Rating Modal */}
      <Dialog open={showRatingModal} onOpenChange={setShowRatingModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rate Your Experience</DialogTitle>
          </DialogHeader>
          {createdOrder && (
            <div className="space-y-4 mt-4">
              <StarRatingInput
                value={0}
                onChange={(rating) => {
                  handleSubmitRating(rating);
                }}
                label="Rate the seller"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}


