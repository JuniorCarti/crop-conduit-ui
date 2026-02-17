import { CircleMarker, Marker, Tooltip } from "react-leaflet";
import L from "leaflet";
import type { MarketOpportunityPoint } from "@/components/coopMapAdvanced/hooks/useMarketOpportunity";

const buildMarketIcon = (rank: number) =>
  L.divIcon({
    className: "market-opportunity-icon",
    html: `<div style="background:#14532d;color:#fff;border-radius:9999px;padding:3px 7px;font-size:11px;font-weight:700;box-shadow:0 1px 6px rgba(0,0,0,.25)">M${rank}</div>`,
    iconSize: [30, 24],
    iconAnchor: [15, 12],
  });

export default function MarketOpportunityLayer({ points }: { points: MarketOpportunityPoint[] }) {
  return (
    <>
      {points.map((point, index) => (
        <Marker key={`${point.market}-${index}`} position={[point.lat, point.lon]} icon={buildMarketIcon(index + 1)}>
          <Tooltip direction="top" sticky>
            <div className="text-xs">
              <p className="font-semibold">{point.label}</p>
              <p>KES {point.pricePerKg.toFixed(0)}/kg</p>
              <p>Distance {point.distanceKm.toFixed(1)} km</p>
            </div>
          </Tooltip>
        </Marker>
      ))}

      {points.map((point, index) => (
        <CircleMarker
          key={`hint-${point.market}-${index}`}
          center={[point.lat, point.lon]}
          radius={8}
          pathOptions={{ color: "#166534", fillColor: "#22c55e", fillOpacity: 0.2, weight: 1 }}
        />
      ))}
    </>
  );
}
