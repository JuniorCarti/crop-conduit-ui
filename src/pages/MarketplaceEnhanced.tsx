/**
 * Enhanced Marketplace Page
 * Full-featured marketplace with live ratings, real-time chat, multiple payments, and map
 */

import { useState, useEffect } from "react";
import { Store, Search, Plus, Filter, MapPin, Star, MessageSquare } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCard } from "@/components/shared/AlertCard";
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
import { useSearchListings, useUserOrders, useCreateOrder } from "@/features/marketplace/hooks/useMarketplace";
import { useListingRatings, useSellerRatingSummary, useCreateRating } from "@/features/marketplace/hooks/useRatings";
import { ListingCard } from "@/features/marketplace/components/ListingCard";
import { CreateListingForm } from "@/features/marketplace/components/CreateListingForm";
import { EnhancedChatWindow } from "@/features/marketplace/components/EnhancedChatWindow";
import { PaymentModal } from "@/features/marketplace/components/PaymentModal";
import { StarRating, StarRatingInput } from "@/features/marketplace/components/StarRating";
import { MapView } from "@/features/marketplace/components/MapView";
import { PriceReference } from "@/features/marketplace/components/PriceReference";
import { useAuth } from "@/contexts/AuthContext";
import { initializeFCM } from "@/features/marketplace/services/NotificationService";
import { setUserOnline, setUserOffline } from "@/features/marketplace/services/PresenceService";
import { getOrCreateChat } from "@/features/marketplace/services/ChatService";
import { getOrder } from "@/features/marketplace/services/OrderService";
import { findFarmersInRadius } from "@/features/marketplace/services/GeolocationService";
import type { Listing, ListingFilters, ListingSortBy, Order, Rating } from "@/features/marketplace/models/types";
import { formatKsh } from "@/lib/currency";

export default function MarketplaceEnhanced() {
  const { currentUser } = useAuth();
  const [showListingModal, setShowListingModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [otherUserId, setOtherUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<ListingFilters>({});
  const [sortBy, setSortBy] = useState<ListingSortBy>("newest");
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [farmerCount, setFarmerCount] = useState(0);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

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

  // Fetch listings
  const { data: searchResults, isLoading: listingsLoading } = useSearchListings(filters, sortBy);
  const listings = searchResults?.listings || [];

  // Fetch user's orders
  const { orders: buyerOrders, isLoading: ordersLoading } = useUserOrders("buyer");
  const { orders: sellerOrders } = useUserOrders("seller");

  // Get ratings for selected listing
  const { ratings: listingRatings } = useListingRatings(selectedListing?.id || null);
  const { summary: sellerRatingSummary } = useSellerRatingSummary(selectedListing?.sellerId || null);

  const createOrder = useCreateOrder();
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
      const orderId = await createOrder.mutateAsync({
        listingId: selectedListing.id!,
        sellerId: selectedListing.sellerId,
        quantityOrdered: orderQuantity,
        pricePerUnit: selectedListing.pricePerUnit,
        priceTotal: selectedListing.pricePerUnit * orderQuantity,
        currency: selectedListing.currency,
      });

      const order = await getOrder(orderId);
      if (order) {
        setCreatedOrder(order);
        setShowPaymentModal(true);
      }
    } catch (error) {
      console.error("Error creating order:", error);
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

  const filteredListings = listings.filter((listing) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      listing.title.toLowerCase().includes(query) ||
      listing.cropType.toLowerCase().includes(query) ||
      listing.location.county.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen">
      <PageHeader title="Marketplace" subtitle="Buy & sell crops" icon={Store}>
        <Button size="sm" onClick={() => setShowListingModal(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">List Crop</span>
        </Button>
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

        <Tabs defaultValue="browse" className="animate-fade-up" style={{ animationDelay: "0.1s" }}>
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
            ) : filteredListings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredListings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    onClick={() => handleViewListing(listing)}
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
            {userLocation ? (
              <MapView
                centerLat={userLocation.lat}
                centerLng={userLocation.lng}
                radiusKm={10}
                onFarmerSelect={(farmer) => {
                  // Open chat or view farmer profile
                  console.log("Selected farmer:", farmer);
                }}
              />
            ) : (
              <Skeleton className="h-96 rounded-lg" />
            )}
          </TabsContent>

          {/* My Orders Tab */}
          <TabsContent value="my-orders" className="mt-4">
            {ordersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
              </div>
            ) : buyerOrders.length > 0 ? (
              <div className="space-y-3">
                {buyerOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-card rounded-xl p-4 border border-border/50"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-foreground">
                          {order.listingSnapshot?.title || "Order"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {order.quantityOrdered} {order.listingSnapshot?.unit} ×{" "}
                          {order.pricePerUnit} = {order.priceTotal} {order.currency}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Status: {order.status}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-foreground">
                          {order.priceTotal} {order.currency}
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
                ))}
              </div>
            ) : (
              <AlertCard
                type="info"
                title="No Orders Yet"
                message="Your orders will appear here once you make a purchase"
              />
            )}
          </TabsContent>

          {/* My Listings Tab */}
          <TabsContent value="my-listings" className="mt-4">
            {sellerOrders.length > 0 ? (
              <div className="space-y-3">
                {sellerOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-card rounded-xl p-4 border border-border/50"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-foreground">
                          Order from {order.buyerName || "Buyer"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {order.quantityOrdered} {order.listingSnapshot?.unit}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Status: {order.status}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-foreground">
                          {order.priceTotal} {order.currency}
                        </p>
                      </div>
                    </div>
                  </div>
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
            <DialogTitle>{selectedListing?.title}</DialogTitle>
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

              {/* Rating Display */}
              {sellerRatingSummary && (
                <div className="flex items-center gap-2">
                  <StarRating
                    rating={sellerRatingSummary.avg}
                    count={sellerRatingSummary.count}
                    size="md"
                  />
                </div>
              )}

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

              {selectedListing.description && (
                <div>
                  <p className="text-sm font-semibold mb-2">Description</p>
                  <p className="text-sm text-muted-foreground">{selectedListing.description}</p>
                </div>
              )}

              {/* Market Price Reference */}
              <PriceReference listing={selectedListing} />

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
