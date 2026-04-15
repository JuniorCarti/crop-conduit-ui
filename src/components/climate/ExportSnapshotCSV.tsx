import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Download, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { WeatherApiForecast } from "@/services/weatherProxyService";

interface Props {
  forecast: WeatherApiForecast | null;
  farmName?: string;
}

interface SnapshotRow {
  date: string;
  minTemp: number;
  maxTemp: number;
  rainChancePct: number;
  precipMm: number;
  humidity: number;
  windKph: number;
  condition: string;
}

const SAMPLE_ROWS: SnapshotRow[] = [
  { date: "2025-01-20", minTemp: 14, maxTemp: 26, rainChancePct: 10, precipMm: 0,    humidity: 62, windKph: 12, condition: "Dry"   },
  { date: "2025-01-21", minTemp: 15, maxTemp: 28, rainChancePct: 45, precipMm: 3.2,  humidity: 71, windKph: 18, condition: "Mixed" },
  { date: "2025-01-22", minTemp: 13, maxTemp: 22, rainChancePct: 80, precipMm: 12.5, humidity: 88, windKph: 14, condition: "Wet"   },
  { date: "2025-01-23", minTemp: 16, maxTemp: 25, rainChancePct: 65, precipMm: 6.1,  humidity: 82, windKph: 10, condition: "Wet"   },
  { date: "2025-01-24", minTemp: 17, maxTemp: 30, rainChancePct: 20, precipMm: 0.5,  humidity: 58, windKph: 22, condition: "Dry"   },
  { date: "2025-01-25", minTemp: 15, maxTemp: 27, rainChancePct: 5,  precipMm: 0,    humidity: 55, windKph: 16, condition: "Dry"   },
  { date: "2025-01-26", minTemp: 14, maxTemp: 24, rainChancePct: 70, precipMm: 8.4,  humidity: 85, windKph: 11, condition: "Wet"   },
];

function buildRows(forecast: WeatherApiForecast | null): SnapshotRow[] {
  const days = forecast?.forecast?.forecastday ?? [];
  if (!days.length) return SAMPLE_ROWS;
  return days.map((day) => {
    const rain = day.day.daily_chance_of_rain ?? 0;
    const precip = day.day.totalprecip_mm ?? 0;
    return {
      date: day.date,
      minTemp: Math.round(day.day.mintemp_c),
      maxTemp: Math.round(day.day.maxtemp_c),
      rainChancePct: Math.round(rain),
      precipMm: Math.round(precip * 10) / 10,
      humidity: Math.round(day.day.avghumidity ?? 0),
      windKph: Math.round(day.day.maxwind_kph ?? 0),
      condition: rain >= 60 || precip >= 8 ? "Wet" : rain >= 30 || precip >= 2 ? "Mixed" : "Dry",
    };
  });
}

function rowsToCSV(rows: SnapshotRow[], farmName: string): string {
  const header = ["Date", "Min Temp (°C)", "Max Temp (°C)", "Rain Chance (%)", "Precipitation (mm)", "Avg Humidity (%)", "Max Wind (kph)", "Condition"];
  const meta = [
    `# AgriSmart 7-Day Climate Snapshot`,
    `# Farm: ${farmName}`,
    `# Exported: ${new Date().toLocaleString()}`,
    `# `,
  ];
  const dataRows = rows.map((r) =>
    [r.date, r.minTemp, r.maxTemp, r.rainChancePct, r.precipMm, r.humidity, r.windKph, r.condition].join(",")
  );
  return [...meta, header.join(","), ...dataRows].join("\n");
}

export function ExportSnapshotCSV({ forecast, farmName = "Your Farm" }: Props) {
  const [exported, setExported] = useState(false);
  const rows = buildRows(forecast);
  const isMockup = !forecast?.forecast?.forecastday?.length;

  const handleExport = () => {
    const csv = rowsToCSV(rows, farmName);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agrismart-climate-${farmName.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExported(true);
    toast.success("CSV downloaded successfully");
    setTimeout(() => setExported(false), 3000);
  };

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-success/10">
              <FileSpreadsheet className="h-3.5 w-3.5 text-success" />
            </div>
            <CardTitle className="text-base">Export Forecast as CSV</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">{rows.length} days</Badge>
            {isMockup && <Badge variant="outline" className="text-[10px]">UI Mockup</Badge>}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Download the 7-day forecast snapshot as a spreadsheet</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preview table */}
        <div className="overflow-x-auto rounded-xl border border-border/60">
          <table className="w-full text-xs">
            <thead className="bg-muted/40">
              <tr>
                {["Date", "Min °C", "Max °C", "Rain %", "Precip mm", "Humidity", "Wind kph", "Condition"].map((h) => (
                  <th key={h} className="px-2 py-1.5 text-left text-muted-foreground font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.date} className="border-t border-border/60">
                  <td className="px-2 py-1.5 text-foreground font-medium">{row.date}</td>
                  <td className="px-2 py-1.5 text-info">{row.minTemp}</td>
                  <td className="px-2 py-1.5 text-warning">{row.maxTemp}</td>
                  <td className="px-2 py-1.5">{row.rainChancePct}%</td>
                  <td className="px-2 py-1.5">{row.precipMm}</td>
                  <td className="px-2 py-1.5">{row.humidity}%</td>
                  <td className="px-2 py-1.5">{row.windKph}</td>
                  <td className="px-2 py-1.5">
                    <span className={
                      row.condition === "Wet" ? "text-info" :
                      row.condition === "Mixed" ? "text-warning" : "text-success"
                    }>{row.condition}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Button type="button" className="w-full gap-2" onClick={handleExport}>
          {exported ? <CheckCircle2 className="h-4 w-4" /> : <Download className="h-4 w-4" />}
          {exported ? "Downloaded!" : `Download CSV — ${farmName}`}
        </Button>

        <p className="text-[10px] text-muted-foreground text-center">
          Includes date, temperature, rain chance, precipitation, humidity, wind, and condition
        </p>
      </CardContent>
    </Card>
  );
}
