import { GeoJSON } from "react-leaflet";
import countiesGeoJson from "@/data/kenya_counties.geojson.json";
import type { MemberMapPoint } from "@/hooks/useMemberMapData";
import { getTopCrops } from "@/components/coopMapAdvanced/hooks/useMapPlanningData";

export default function CountyLayer({
  countyAggregates,
  maxCountyCount,
  onSelect,
}: {
  countyAggregates: Map<string, MemberMapPoint[]>;
  maxCountyCount: number;
  onSelect: (label: string, rows: MemberMapPoint[]) => void;
}) {
  const getCountyStyle = (countyName: string) => {
    const rows = countyAggregates.get(countyName) ?? countyAggregates.get(countyName.toLowerCase()) ?? [];
    const count = rows.length;
    const intensity = maxCountyCount > 0 ? count / maxCountyCount : 0;
    const fillColor = intensity > 0.66 ? "#dc2626" : intensity > 0.33 ? "#fdba74" : "#fef3c7";
    return {
      color: "#475569",
      weight: 1,
      fillColor,
      fillOpacity: count > 0 ? 0.55 : 0.12,
    };
  };

  return (
    <GeoJSON
      data={countiesGeoJson as any}
      style={(feature) => getCountyStyle(String((feature?.properties as any)?.name ?? ""))}
      onEachFeature={(feature, layer) => {
        const countyName = String((feature?.properties as any)?.name ?? "Unknown");
        const rows = countyAggregates.get(countyName) ?? countyAggregates.get(countyName.toLowerCase()) ?? [];
        const topMain = getTopCrops(rows, "mainCrops").join(", ") || "N/A";
        layer.bindTooltip(`${countyName}\nMembers: ${rows.length}\nTop crops: ${topMain}`, { sticky: true });
        layer.on("click", () => onSelect(countyName, rows));
      }}
    />
  );
}
