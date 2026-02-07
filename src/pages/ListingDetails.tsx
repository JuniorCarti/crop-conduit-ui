import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, ShoppingCart } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { AlertCard } from "@/components/shared/AlertCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { formatPricePerUnit } from "@/lib/currency";
import { getListing } from "@/features/marketplace/services/ListingService";
import type { Listing } from "@/features/marketplace/models/types";
import { toast } from "sonner";

export default function ListingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { addItem } = useCart();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!id) {
      setError("Listing not found.");
      setLoading(false);
      return () => {
        // no-op
      };
    }

    setLoading(true);
    setError(null);
    getListing(id)
      .then((data) => {
        if (!isMounted) return;
        if (!data) {
          setError("Listing not found.");
          setListing(null);
          return;
        }
        setListing(data);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Failed to load listing:", err);
        setError("Unable to load listing.");
        setListing(null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleAddToCart = () => {
    if (!listing) return;
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
    addItem(listing, 1);
    toast.success("Added to cart");
  };

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Listing Details"
        subtitle={listing?.title || "Marketplace"}
        icon={ShoppingCart}
      >
        <Button variant="outline" size="sm" onClick={() => navigate("/marketplace")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Marketplace
        </Button>
      </PageHeader>

      <div className="p-4 md:p-6 space-y-4">
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading listing...
          </div>
        )}

        {!loading && error && (
          <AlertCard type="danger" title="Listing unavailable" message={error} />
        )}

        {!loading && listing && (
          <Card className="overflow-hidden">
            <CardContent className="grid gap-6 p-6 md:grid-cols-[280px_1fr]">
              <div className="space-y-3">
                <div className="aspect-square overflow-hidden rounded-xl border bg-muted">
                  <img
                    src={listing.images?.[0] || "/placeholder.svg"}
                    alt={listing.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <Button className="w-full" onClick={handleAddToCart}>
                  Add to cart
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">{listing.title}</h2>
                  <p className="text-sm text-muted-foreground">
                    {listing.cropType} • {listing.location?.county || "Kenya"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    {formatPricePerUnit(listing.pricePerUnit, listing.unit)}
                  </Badge>
                  <Badge variant="outline">
                    {listing.quantity} {listing.unit} available
                  </Badge>
                  {listing.status && (
                    <Badge variant="outline">{listing.status}</Badge>
                  )}
                </div>

                {listing.description && (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {listing.description}
                  </p>
                )}

                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>Seller: {listing.sellerName || "Verified farmer"}</p>
                  {listing.coopVerified && listing.coopName && (
                    <p className="text-emerald-700">Verified by {listing.coopName}</p>
                  )}
                  {listing.phoneNumber && <p>Phone: {listing.phoneNumber}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
