import { useMemo, useState, useEffect, useRef } from "react";
import type { LatLngBoundsExpression, LatLngTuple } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { LocateFixed, MapPin } from "lucide-react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertCard } from "@/components/shared/AlertCard";
import { toast } from "sonner";
import type { Listing } from "@/features/marketplace/models/types";
import { db } from "@/lib/firebase";

// Fix default marker icons in Vite by providing explicit URLs.
// This runs once at module load.
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const KENYA_CENTER: LatLngTuple = [-1.286389, 36.817223];
const DEFAULT_ZOOM = 6;
const USER_LOCATION_ZOOM = 11;
const DEFAULT_RADIUS_KM = 500;

type LatLngPoint = {
  lat: number;
  lon: number;
};

type ListingWithCoords = {
  listing: Listing;
  lat: number;
  lng: number;
  countyLabel: string | null;
  imageUrl: string | null;
  distanceKm: number | null;
};

interface MarketplaceMapProps {
  listings?: Listing[];
  onViewDetails: (listing: Listing) => void;
}

function MapViewportUpdater({ center, zoom }: { center: LatLngTuple; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);

  return null;
}

function RouteBoundsFitter({ bounds }: { bounds: LatLngBoundsExpression | null }) {
  const map = useMap();

  useEffect(() => {
    if (!bounds) return;
    map.fitBounds(bounds, {
      padding: [48, 48],
      animate: true,
    });
  }, [bounds, map]);

  return null;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

function isValidLatLng(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

function extractCoords(listing: Listing): { lat: number; lng: number } | null {
  const anyListing = listing as Listing & {
    lat?: unknown;
    lng?: unknown;
    lon?: unknown;
    location?: {
      lat?: unknown;
      lng?: unknown;
      lon?: unknown;
      county?: string;
      address?: string;
      locationName?: string;
    };
    address?: string;
    locationName?: string;
  };

  const lat =
    toNumber(anyListing.location?.lat) ??
    toNumber(anyListing.lat);

  const lng =
    toNumber(anyListing.location?.lng) ??
    toNumber(anyListing.location?.lon) ??
    toNumber(anyListing.lng) ??
    toNumber(anyListing.lon);

  if (lat === null || lng === null) {
    return null;
  }

  return isValidLatLng(lat, lng) ? { lat, lng } : null;
}

function getCountyLabel(listing: Listing): string | null {
  const anyListing = listing as Listing & {
    location?: {
      county?: string;
      address?: string;
      locationName?: string;
    };
    county?: string;
    address?: string;
    locationName?: string;
  };

  const county = anyListing.location?.county ?? anyListing.county;
  return county && county.trim().length > 0 ? county : null;
}

function getPrimaryImage(listing: Listing): string | null {
  const images = Array.isArray(listing.images) ? listing.images : [];
  return images.length > 0 && images[0] ? images[0] : null;
}

// Haversine distance in KM rounded to 1 decimal place.
function haversineDistanceKm(from: LatLngTuple, to: LatLngTuple): number {
  const [lat1, lon1] = from;
  const [lat2, lon2] = to;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const rLat1 = toRad(lat1);
  const rLat2 = toRad(lat2);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rLat1) * Math.cos(rLat2) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const earthRadiusKm = 6371;
  const distance = earthRadiusKm * c;
  return Math.round(distance * 10) / 10;
}

type OsrmRouteResult = {
  path: LatLngTuple[];
  distanceKm: number;
  etaMinutes: number;
};

function roundKm1(distanceKm: number): number {
  return Math.round(distanceKm * 10) / 10;
}

async function fetchOsrmRoute(
  user: LatLngPoint,
  target: LatLngTuple,
  signal: AbortSignal
): Promise<OsrmRouteResult> {
  const [targetLat, targetLon] = target;
  const url = `https://router.project-osrm.org/route/v1/driving/${user.lon},${user.lat};${targetLon},${targetLat}?overview=full&geometries=geojson`;

  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`OSRM request failed with status ${response.status}`);
  }

  const data = (await response.json()) as {
    routes?: Array<{
      distance?: number;
      duration?: number;
      geometry?: { coordinates?: Array<[number, number]> };
    }>;
  };

  const route = data.routes?.[0];
  const coordinates = route?.geometry?.coordinates;
  const distanceMeters = route?.distance;
  const durationSeconds = route?.duration;

  if (!route || !coordinates || coordinates.length < 2 || typeof distanceMeters !== "number" || typeof durationSeconds !== "number") {
    throw new Error("OSRM returned no valid route");
  }

  const path: LatLngTuple[] = coordinates
    .map(([lon, lat]) => [lat, lon] as LatLngTuple)
    .filter(([lat, lon]) => Number.isFinite(lat) && Number.isFinite(lon));

  if (path.length < 2) {
    throw new Error("OSRM route geometry was invalid");
  }

  const distanceKm = roundKm1(distanceMeters / 1000);
  const etaMinutes = Math.round(durationSeconds / 60);

  return { path, distanceKm, etaMinutes };
}

function mapSnapshotToListing(snap: QueryDocumentSnapshot<DocumentData>): Listing {
  const data = snap.data() as Listing & {
    images?: unknown;
    location?: Listing["location"] & { lon?: unknown; lng?: unknown; lat?: unknown; county?: string };
    county?: string;
  };

  const rawLng = data.location?.lng ?? (data.location as { lon?: unknown } | undefined)?.lon;

  return {
    ...data,
    id: snap.id,
    images: Array.isArray(data.images) ? data.images : [],
    location: {
      county: data.location?.county || data.county || "",
      address: data.location?.address || "",
      lat: data.location?.lat as number,
      lng: rawLng as number,
    },
  } as Listing;
}

export function MarketplaceMap({ listings: listingsProp, onViewDetails }: MarketplaceMapProps) {
  const [mapCenter, setMapCenter] = useState<LatLngTuple>(KENYA_CENTER);
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);
  const [userLocation, setUserLocation] = useState<LatLngPoint | null>(null);
  const [locating, setLocating] = useState(false);
  const [radiusKm, setRadiusKm] = useState<number>(DEFAULT_RADIUS_KM);
  const [mapListings, setMapListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(!listingsProp);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [routePath, setRoutePath] = useState<LatLngTuple[]>([]);
  const [routeDistanceKm, setRouteDistanceKm] = useState<number | null>(null);
  const [routeEtaMinutes, setRouteEtaMinutes] = useState<number | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const routeAbortRef = useRef<AbortController | null>(null);
  const routeRequestIdRef = useRef(0);

  // Subscribe to all listings for the Map tab when listings are not supplied via props.
  // We filter by coordinates client-side to avoid new Firestore indexes.
  useEffect(() => {
    if (listingsProp) {
      setMapListings(listingsProp);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const listingsQuery = query(collection(db, "listings"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      listingsQuery,
      (snapshot) => {
        const nextListings = snapshot.docs.map(mapSnapshotToListing);
        setMapListings(nextListings);
        setIsLoading(false);
      },
      (error) => {
        console.error("Map listings subscription error:", error);
        toast.error("Failed to load map listings.");
        setMapListings([]);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [listingsProp]);

  const listings = listingsProp ?? mapListings;

  const userLatLng = useMemo<LatLngTuple | null>(() => {
    if (!userLocation) return null;
    return [userLocation.lat, userLocation.lon];
  }, [userLocation]);

  const centerForRadius = userLatLng ?? mapCenter;

  const userLocationIcon = useMemo(
    () =>
      L.divIcon({
        className: "marketplace-user-location-icon",
        html:
          '<div style="width:16px;height:16px;border-radius:9999px;background:#2563eb;border:2px solid white;box-shadow:0 0 0 2px rgba(37,99,235,0.25);"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      }),
    []
  );

  const listingsWithCoords = useMemo<ListingWithCoords[]>(() => {
    return listings.flatMap((listing) => {
      const coords = extractCoords(listing);
      if (!coords) return [];

      return [
        {
          listing,
          lat: coords.lat,
          lng: coords.lng,
          countyLabel: getCountyLabel(listing),
          imageUrl: getPrimaryImage(listing),
          distanceKm: null,
        },
      ];
    });
  }, [listings]);

  const listingsWithinRadius = useMemo<ListingWithCoords[]>(() => {
    return listingsWithCoords
      .map((entry) => {
        const distanceKm = haversineDistanceKm(centerForRadius, [entry.lat, entry.lng]);
        return { ...entry, distanceKm };
      })
      .filter((entry) => entry.distanceKm !== null && entry.distanceKm <= radiusKm);
  }, [centerForRadius, listingsWithCoords, radiusKm]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported on this device.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const nextCenter: LatLngTuple = [lat, lon];
        setUserLocation({ lat, lon });
        setMapCenter(nextCenter);
        setMapZoom(USER_LOCATION_ZOOM);
        setLocating(false);
        toast.success("Centered map on your location.");
      },
      (error) => {
        console.warn("Geolocation error:", error);
        setLocating(false);
        toast.warning("Location permission was denied. You can still browse the map.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const handleClearRoute = () => {
    routeAbortRef.current?.abort();
    setSelectedListingId(null);
    setRoutePath([]);
    setRouteDistanceKm(null);
    setRouteEtaMinutes(null);
    setRouteLoading(false);
  };

  const handleListingMarkerClick = async (entry: ListingWithCoords) => {
    if (!userLocation || !userLatLng) {
      toast.warning("Turn on location to calculate route.");
      return;
    }

    const listingId = entry.listing.id ?? null;
    if (routeLoading && listingId === selectedListingId) {
      return;
    }

    // Abort any in-flight route request before starting a new one.
    routeAbortRef.current?.abort();
    const controller = new AbortController();
    routeAbortRef.current = controller;

    // Clear previous route visuals/info immediately.
    setSelectedListingId(listingId);
    setRoutePath([]);
    setRouteDistanceKm(null);
    setRouteEtaMinutes(null);
    setRouteLoading(true);

    const requestId = ++routeRequestIdRef.current;
    const target: LatLngTuple = [entry.lat, entry.lng];

    try {
      const result = await fetchOsrmRoute(userLocation, target, controller.signal);
      if (requestId !== routeRequestIdRef.current) {
        return;
      }
      setRoutePath(result.path);
      setRouteDistanceKm(result.distanceKm);
      setRouteEtaMinutes(result.etaMinutes);
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }
      console.warn("OSRM route error:", error);
      toast.error("Route service unavailable, try again.");
      if (requestId === routeRequestIdRef.current) {
        setRoutePath([]);
        setRouteDistanceKm(null);
        setRouteEtaMinutes(null);
      }
    } finally {
      if (requestId === routeRequestIdRef.current) {
        setRouteLoading(false);
      }
    }
  };

  const routeBounds = useMemo<LatLngBoundsExpression | null>(() => {
    if (routePath.length < 2) return null;
    return L.latLngBounds(routePath);
  }, [routePath]);

  const routeActive = routePath.length >= 2 && routeDistanceKm !== null && routeEtaMinutes !== null;
  const routeLabel = routeActive
    ? `Route: ${routeDistanceKm.toFixed(1)} km - ~${routeEtaMinutes} min`
    : null;

  useEffect(() => {
    if (!selectedListingId) return;
    const stillVisible = listingsWithinRadius.some((entry) => entry.listing.id === selectedListingId);
    if (!stillVisible) {
      routeAbortRef.current?.abort();
      setSelectedListingId(null);
      setRoutePath([]);
      setRouteDistanceKm(null);
      setRouteEtaMinutes(null);
      setRouteLoading(false);
    }
  }, [selectedListingId, listingsWithinRadius]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-end gap-3">
          <div className="space-y-1">
            <Label htmlFor="map-radius" className="text-xs text-muted-foreground">
              Radius (km)
            </Label>
            <Input
              id="map-radius"
              type="number"
              min={1}
              max={1500}
              value={radiusKm}
              onChange={(e) => {
                const nextValue = Number(e.target.value);
                const safeValue = Number.isFinite(nextValue) && nextValue > 0 ? nextValue : DEFAULT_RADIUS_KM;
                setRadiusKm(Math.min(1500, Math.max(1, safeValue)));
              }}
              className="h-9 w-28"
            />
          </div>
          <Badge variant="outline" className="h-9 flex items-center">
            {listingsWithinRadius.length} listings within {radiusKm}km
          </Badge>
          {routeLoading && (
            <Badge variant="secondary" className="h-9 flex items-center">
              Calculating route...
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {(routeActive || routeLoading) && (
            <Button type="button" size="sm" variant="ghost" onClick={handleClearRoute}>
              Clear route
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={handleUseMyLocation}
            disabled={locating}
          >
            <LocateFixed className="h-4 w-4" />
            Use my location
          </Button>
        </div>
      </div>

      {routeLoading && (
        <div className="text-sm text-muted-foreground">Calculating route...</div>
      )}

      {routeActive && routeLabel && (
        <div className="rounded-lg border border-border/50 bg-card px-4 py-2 text-sm text-foreground">
          {routeLabel}
        </div>
      )}

      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        <div className="h-[460px] sm:h-[500px] lg:h-[540px] w-full">
          {isLoading ? (
            <div className="h-full w-full p-3">
              <div className="h-full w-full animate-pulse rounded-lg bg-muted" />
            </div>
          ) : (
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              scrollWheelZoom
              className="h-full w-full"
            >
              <MapViewportUpdater center={mapCenter} zoom={mapZoom} />
              <RouteBoundsFitter bounds={routeBounds} />
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {userLatLng && (
                <Marker position={userLatLng} icon={userLocationIcon}>
                  <Popup>
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground">You are here</p>
                      <p className="text-xs text-muted-foreground">
                        Your current location
                      </p>
                    </div>
                  </Popup>
                </Marker>
              )}

              {routePath.length >= 2 && (
                <Polyline
                  positions={routePath}
                  pathOptions={{ color: "#2563eb", weight: 4 }}
                />
              )}

              {listingsWithinRadius.map((entry) => {
                const { listing, lat, lng, countyLabel, imageUrl } = entry;
                const currency = listing.currency ?? "KES";
                const isSelected = selectedListingId !== null && listing.id === selectedListingId;
                const routeInfoLabel =
                  isSelected && routeActive && routeLabel
                    ? routeLabel
                    : null;

                return (
                  <Marker
                    key={listing.id ?? `${listing.title}-${lat}-${lng}`}
                    position={[lat, lng]}
                    eventHandlers={{
                      click: () => handleListingMarkerClick(entry),
                    }}
                  >
                    <Popup>
                      <div className="space-y-2 min-w-[220px]">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={listing.title}
                            className="h-28 w-full rounded-md object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="h-28 w-full rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground">
                            No image
                          </div>
                        )}

                        <div>
                          <p className="font-semibold text-foreground">{listing.title}</p>
                          {countyLabel && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3" />
                              {countyLabel}
                            </p>
                          )}
                        </div>

                        <p className="text-sm font-medium text-foreground">
                          {listing.pricePerUnit} {currency} / {listing.unit}
                        </p>

                        {routeInfoLabel && (
                          <p className="text-xs text-muted-foreground">
                            {routeInfoLabel}
                          </p>
                        )}

                        <Button
                          type="button"
                          size="sm"
                          className="w-full"
                          onClick={() => onViewDetails(listing)}
                        >
                          View Details
                        </Button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          )}
        </div>
      </div>

      {!isLoading && listingsWithinRadius.length === 0 && (
        <AlertCard
          type="info"
          title="No listings found within selected radius"
          message="Try increasing the radius or use your location."
        />
      )}
    </div>
  );
}

export default MarketplaceMap;
