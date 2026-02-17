import type { MemberMapPoint } from "@/hooks/useMemberMapData";
import { getProductionEstimate } from "@/components/coopMapAdvanced/hooks/useMapPlanningData";

const toCsvCell = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;

export const downloadCsv = (filename: string, headers: string[], rows: Array<Array<unknown>>) => {
  const body = rows.map((row) => row.map(toCsvCell).join(",")).join("\n");
  const csv = [headers.join(","), body].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const exportMembersCsv = (rows: MemberMapPoint[], filename: string) => {
  const headers = [
    "memberId",
    "county",
    "ward",
    "lat",
    "lon",
    "mainCrops",
    "secondaryCrops",
    "verified",
    "productionEstimate",
  ];

  const data = rows.map((row) => [
    row.memberId,
    row.county,
    row.ward,
    row.lat ?? "",
    row.lon ?? "",
    row.mainCrops.join("|"),
    row.secondaryCrops.join("|"),
    row.status === "verified" ? "true" : "false",
    getProductionEstimate(row).toFixed(2),
  ]);

  downloadCsv(filename, headers, data);
};

export const exportPdfPlaceholder = () => {
  return { ok: false, message: "Export PNG/PDF coming soon." };
};
