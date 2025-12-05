/**
 * Map View Component
 * Shows farmers on a map with proximity counting
 */

import { useState, useEffect, useRef } from "react";
import { MapPin, Users, List, Star } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCard } from "@/components/shared/AlertCard";
import { subscribeToFarmersInRadius, findFarmersInRadius } from "../services/GeolocationService";
import type { UserProfile } from "../models/types";

interface MapViewProps {
  centerLat: number;
  centerLng: number;
  radiusKm?: number;
  onFarmerSelect?: (farmer: UserProfile) => void;
}

export function MapView({ centerLat, centerLng, radiusKm = 10, onFarmerSelect }: MapViewProps) {
  const [farmers, setFarmers] = useState<UserProfile[]>([]);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [customRadius, setCustomRadius] = useState(radiusKm);
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToFarmersInRadius(
      centerLat,
      centerLng,
      customRadius,
      (data, farmerCount) => {
        setFarmers(data);
        setCount(farmerCount);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [centerLat, centerLng, customRadius]);

  // Initialize map (simplified - in production use Google Maps or Mapbox)
  useEffect(() => {
    if (viewMode === "map" && mapRef.current && !isLoading) {
      // In production, initialize Google Maps or Mapbox here
      // For now, show a placeholder
      mapRef.current.innerHTML = `
        <div style="width: 100%; height: 100%; background: #e5e7eb; display: flex; align-items: center; justify-content: center; border-radius: 8px;">
          <div style="text-align: center; color: #6b7280;">
            <p style="font-weight: 600; margin-bottom: 8px;">Map View</p>
            <p style="font-size: 14px;">${count} farmers within ${customRadius}km</p>
            <p style="font-size: 12px; margin-top: 8px;">Integrate Google Maps or Mapbox for full map</p>
          </div>
        </div>
      `;
    }
  }, [viewMode, farmers, count, customRadius, isLoading]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Nearby Farmers
            </CardTitle>
            <CardDescription>
              Farmers within {customRadius}km of your location
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="radius" className="text-xs">Radius (km)</Label>
              <Input
                id="radius"
                type="number"
                min="1"
                max="100"
                value={customRadius}
                onChange={(e) => setCustomRadius(Number(e.target.value) || 10)}
                className="w-20 h-8"
              />
            </div>
            <div className="flex gap-1 border rounded-lg">
              <Button
                variant={viewMode === "map" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("map")}
              >
                <MapPin className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Count Badge */}
        <div className="mb-4 flex items-center gap-2">
          <Badge variant="outline" className="text-lg px-3 py-1">
            <Users className="h-4 w-4 mr-2" />
            {count} {count === 1 ? "farmer" : "farmers"} found
          </Badge>
        </div>

        {isLoading ? (
          <Skeleton className="h-96 rounded-lg" />
        ) : viewMode === "map" ? (
          <div ref={mapRef} className="h-96 w-full rounded-lg overflow-hidden" />
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {farmers.length > 0 ? (
              farmers.map((farmer) => (
                <div
                  key={farmer.uid}
                  className="border border-border/50 rounded-lg p-3 hover:border-primary/30 transition cursor-pointer"
                  onClick={() => onFarmerSelect?.(farmer)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{farmer.displayName}</p>
                      {farmer.location && (
                        <p className="text-sm text-muted-foreground">
                          {farmer.location.county || "Unknown location"}
                        </p>
                      )}
                      {farmer.rating && (
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs font-medium">
                            {farmer.rating.average.toFixed(1)} ({farmer.rating.count})
                          </span>
                        </div>
                      )}
                    </div>
                    <Badge variant="outline">{farmer.role}</Badge>
                  </div>
                </div>
              ))
            ) : (
              <AlertCard
                type="info"
                title="No farmers found"
                message={`No farmers found within ${customRadius}km radius. Try increasing the radius.`}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
