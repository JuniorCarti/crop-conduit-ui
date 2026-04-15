import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Printer, Eye } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { WeatherApiForecast } from "@/services/weatherProxyService";
import type { ClimateSignal } from "@/lib/climateInsights";
import type { DecisionSupportOutput } from "@/services/decisionSupportService";

interface Props {
  forecast: WeatherApiForecast | null;
  signals: ClimateSignal[];
  decisionSupport: DecisionSupportOutput;
  farmName?: string;
  crop?: string;
}

export function PrintClimateReport({ forecast, signals, decisionSupport, farmName = "Your Farm", crop = "Tomatoes" }: Props) {
  const [previewing, setPreviewing] = useState(false);
  const isMockup = !forecast?.forecast?.forecastday?.length;

  const days = forecast?.forecast?.forecastday ?? [];
  const today = days[0];
  const location = forecast?.location;

  const handlePrint = () => {
    const printContent = document.getElementById("climate-print-content");
    if (!printContent) return;
    const win = window.open("", "_blank", "width=800,height=600");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>AgriSmart Climate Report — ${farmName}</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 12px; color: #111; padding: 24px; max-width: 800px; margin: 0 auto; }
          h1 { font-size: 20px; margin-bottom: 4px; }
          h2 { font-size: 14px; margin: 16px 0 6px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
          th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; font-size: 11px; }
          th { background: #f5f5f5; font-weight: bold; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: bold; }
          .good { background: #dcfce7; color: #166534; }
          .warning { background: #fef9c3; color: #854d0e; }
          .critical { background: #fee2e2; color: #991b1b; }
          .meta { color: #666; font-size: 11px; margin-bottom: 16px; }
          ul { margin: 4px 0; padding-left: 20px; }
          li { margin-bottom: 2px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  const signalRows = signals.filter((s) => s.id !== "snapshot").slice(0, 8);
  const actionItems = decisionSupport.plantingAdvice.reasons.slice(0, 3);
  const riskItems = decisionSupport.riskAlert.tips.slice(0, 3);

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted/60">
              <Printer className="h-3.5 w-3.5 text-foreground" />
            </div>
            <CardTitle className="text-base">Print Climate Report</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {isMockup && <Badge variant="outline" className="text-[10px]">UI Mockup</Badge>}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Generate a clean print-friendly report for offline use or sharing</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Toggle preview */}
        <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setPreviewing((p) => !p)}>
          <Eye className="h-4 w-4" />
          {previewing ? "Hide preview" : "Preview report"}
        </Button>

        {/* Hidden print content — always rendered for printing */}
        <div id="climate-print-content" className={cn("rounded-xl border border-border/60 bg-white p-4 text-sm space-y-3", !previewing && "hidden")}>
          <div>
            <h1 className="text-lg font-bold text-gray-900">🌱 AgriSmart Climate Report</h1>
            <p className="text-xs text-gray-500">
              Farm: {farmName} · Crop: {crop} · {location ? `${location.name}, ${location.region}` : "Location not set"} · Generated: {new Date().toLocaleString()}
            </p>
          </div>

          {today && (
            <div>
              <h2 className="text-sm font-semibold text-gray-800 border-b border-gray-200 pb-1 mb-2">Today's Conditions</h2>
              <table className="w-full text-xs border-collapse">
                <thead><tr className="bg-gray-50">
                  <th className="border border-gray-200 px-2 py-1 text-left">Metric</th>
                  <th className="border border-gray-200 px-2 py-1 text-left">Value</th>
                </tr></thead>
                <tbody>
                  {[
                    ["Min Temperature", `${Math.round(today.day.mintemp_c)}°C`],
                    ["Max Temperature", `${Math.round(today.day.maxtemp_c)}°C`],
                    ["Rain Chance", `${Math.round(today.day.daily_chance_of_rain ?? 0)}%`],
                    ["Precipitation", `${Math.round((today.day.totalprecip_mm ?? 0) * 10) / 10} mm`],
                    ["Avg Humidity", `${Math.round(today.day.avghumidity ?? 0)}%`],
                    ["Max Wind", `${Math.round(today.day.maxwind_kph ?? 0)} kph`],
                  ].map(([k, v]) => (
                    <tr key={k}><td className="border border-gray-200 px-2 py-1 text-gray-600">{k}</td><td className="border border-gray-200 px-2 py-1 font-medium">{v}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {days.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-800 border-b border-gray-200 pb-1 mb-2">7-Day Forecast</h2>
              <table className="w-full text-xs border-collapse">
                <thead><tr className="bg-gray-50">
                  {["Date", "Min °C", "Max °C", "Rain %", "Precip mm"].map((h) => (
                    <th key={h} className="border border-gray-200 px-2 py-1 text-left">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {days.map((day) => (
                    <tr key={day.date}>
                      <td className="border border-gray-200 px-2 py-1">{day.date}</td>
                      <td className="border border-gray-200 px-2 py-1">{Math.round(day.day.mintemp_c)}</td>
                      <td className="border border-gray-200 px-2 py-1">{Math.round(day.day.maxtemp_c)}</td>
                      <td className="border border-gray-200 px-2 py-1">{Math.round(day.day.daily_chance_of_rain ?? 0)}%</td>
                      <td className="border border-gray-200 px-2 py-1">{Math.round((day.day.totalprecip_mm ?? 0) * 10) / 10}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {signalRows.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-800 border-b border-gray-200 pb-1 mb-2">Climate Signals</h2>
              <table className="w-full text-xs border-collapse">
                <thead><tr className="bg-gray-50">
                  <th className="border border-gray-200 px-2 py-1 text-left">Signal</th>
                  <th className="border border-gray-200 px-2 py-1 text-left">Level</th>
                  <th className="border border-gray-200 px-2 py-1 text-left">Observation</th>
                </tr></thead>
                <tbody>
                  {signalRows.map((s) => (
                    <tr key={s.id}>
                      <td className="border border-gray-200 px-2 py-1">{s.title}</td>
                      <td className="border border-gray-200 px-2 py-1 font-medium capitalize">{s.level}</td>
                      <td className="border border-gray-200 px-2 py-1 text-gray-600">{s.observations[0] ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div>
            <h2 className="text-sm font-semibold text-gray-800 border-b border-gray-200 pb-1 mb-2">Recommendations</h2>
            <p className="text-xs font-medium text-gray-700 mb-1">Planting: {decisionSupport.plantingAdvice.window}</p>
            <ul className="text-xs text-gray-600 list-disc pl-4 space-y-0.5">
              {actionItems.map((a) => <li key={a}>{a}</li>)}
            </ul>
            <p className="text-xs font-medium text-gray-700 mt-2 mb-1">Risk: {decisionSupport.riskAlert.title}</p>
            <ul className="text-xs text-gray-600 list-disc pl-4 space-y-0.5">
              {riskItems.map((r) => <li key={r}>{r}</li>)}
            </ul>
          </div>

          <p className="text-[10px] text-gray-400 border-t border-gray-100 pt-2">
            Generated by AgriSmart · agrismart.app · Data from WeatherAPI · For informational purposes only
          </p>
        </div>

        <Button type="button" className="w-full gap-2" onClick={handlePrint}>
          <Printer className="h-4 w-4" />
          Print / Save as PDF
        </Button>

        <p className="text-[10px] text-muted-foreground text-center">
          Opens a print dialog · Use "Save as PDF" in your browser to save a copy
        </p>
      </CardContent>
    </Card>
  );
}
