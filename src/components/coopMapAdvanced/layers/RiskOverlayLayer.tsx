import { Circle } from "react-leaflet";
import type { MemberMapPoint } from "@/hooks/useMemberMapData";
import type { RiskZone } from "@/components/coopMapAdvanced/hooks/useRiskOverlay";

const normalize = (value: string) => value.trim().toLowerCase();

const riskColor = (level: RiskZone["level"]) => {
  if (level === "high") return "#dc2626";
  if (level === "medium") return "#f97316";
  return "#16a34a";
};

export default function RiskOverlayLayer({
  plottedMembers,
  zoneMap,
}: {
  plottedMembers: MemberMapPoint[];
  zoneMap: Map<string, RiskZone>;
}) {
  return (
    <>
      {plottedMembers.map((member) => {
        const zone = zoneMap.get(normalize(member.county || ""));
        if (!zone) return null;
        const color = riskColor(zone.level);
        return (
          <Circle
            key={`risk-${member.memberId}`}
            center={[Number(member.lat), Number(member.lon)]}
            radius={5000}
            pathOptions={{ color, weight: 0, fillColor: color, fillOpacity: 0.12 }}
          />
        );
      })}
    </>
  );
}
