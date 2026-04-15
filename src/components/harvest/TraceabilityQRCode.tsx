import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QrCode, Download, Share2, Copy, CheckCircle2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { HarvestSchedule } from "@/types/harvest";

interface Props {
  schedule: HarvestSchedule | null;
  farmName?: string;
  farmerName?: string;
  county?: string;
  grade?: string;
}

interface TraceData {
  batchId: string;
  crop: string;
  farm: string;
  farmer: string;
  county: string;
  field: string;
  quantity: string;
  grade: string;
  harvestDate: string;
  generatedAt: string;
}

function generateBatchId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `AGS-${ts}-${rand}`;
}

function buildTraceUrl(data: TraceData): string {
  const params = new URLSearchParams({
    batch: data.batchId,
    crop: data.crop,
    farm: data.farm,
    county: data.county,
    qty: data.quantity,
    grade: data.grade,
    date: data.harvestDate,
  });
  return `https://agrismart.app/trace?${params.toString()}`;
}

// Simple QR code using a free API (no npm package needed)
function QRCodeImage({ url, size = 160 }: { url: string; size?: number }) {
  const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&bgcolor=ffffff&color=005302&margin=8`;
  return (
    <img
      src={apiUrl}
      alt="QR Code"
      width={size}
      height={size}
      className="rounded-xl border border-border/60"
      onError={(e) => {
        // Fallback: show placeholder
        (e.target as HTMLImageElement).style.display = "none";
      }}
    />
  );
}

export function TraceabilityQRCode({ schedule, farmName = "Nakuru Farm", farmerName = "John Kamau", county = "Nakuru", grade = "A" }: Props) {
  const [batchId] = useState(generateBatchId);
  const [copied, setCopied] = useState(false);

  const traceData: TraceData = {
    batchId,
    crop: schedule?.cropName ?? "Tomatoes",
    farm: farmName,
    farmer: farmerName,
    county,
    field: schedule?.field ?? "Field A",
    quantity: `${schedule?.expectedYield ?? 500} ${schedule?.yieldUnit ?? "kg"}`,
    grade,
    harvestDate: schedule?.optimalDate ?? new Date().toISOString().slice(0, 10),
    generatedAt: new Date().toISOString(),
  };

  const traceUrl = buildTraceUrl(traceData);

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(traceUrl).catch(() => {});
    setCopied(true);
    toast.success("Trace URL copied");
    setTimeout(() => setCopied(false), 3000);
  };

  const handleShare = () => {
    const text = `🔍 Harvest Traceability — AgriSmart\n\nBatch: ${batchId}\nCrop: ${traceData.crop} (Grade ${traceData.grade})\nFarm: ${traceData.farm}, ${traceData.county}\nQuantity: ${traceData.quantity}\nHarvest: ${traceData.harvestDate}\n\nScan QR or visit:\n${traceUrl}`;
    if (navigator.share) {
      navigator.share({ title: "Harvest Trace", text, url: traceUrl }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => toast.success("Trace info copied"));
    }
  };

  const handleDownloadQR = () => {
    const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(traceUrl)}&bgcolor=ffffff&color=005302&margin=10`;
    const a = document.createElement("a");
    a.href = apiUrl;
    a.download = `harvest-qr-${batchId}.png`;
    a.target = "_blank";
    a.click();
    toast.success("QR code downloading");
  };

  const traceFields = [
    { label: "Batch ID",      value: batchId,           mono: true  },
    { label: "Crop",          value: traceData.crop                  },
    { label: "Grade",         value: `Grade ${traceData.grade}`      },
    { label: "Farm",          value: traceData.farm                  },
    { label: "County",        value: traceData.county                },
    { label: "Quantity",      value: traceData.quantity              },
    { label: "Harvest date",  value: traceData.harvestDate           },
  ];

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <QrCode className="h-3.5 w-3.5 text-primary" />
            </div>
            <CardTitle className="text-base">Traceability QR Code</CardTitle>
          </div>
          <Badge variant="secondary" className="text-[10px] font-mono">{batchId}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Generate a QR code linking to full harvest batch details for buyers and auditors
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* QR + trace data side by side */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {/* QR code */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            <QRCodeImage url={traceUrl} size={160} />
            <p className="text-[10px] text-muted-foreground text-center">Scan to view batch details</p>
          </div>

          {/* Trace data */}
          <div className="flex-1 space-y-1.5">
            {traceFields.map((f) => (
              <div key={f.label} className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/20 px-2.5 py-1.5">
                <span className="text-[10px] text-muted-foreground shrink-0">{f.label}</span>
                <span className={cn("text-xs font-medium text-foreground text-right truncate", f.mono && "font-mono text-[10px]")}>
                  {f.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* URL */}
        <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/20 px-3 py-2">
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <p className="text-[10px] text-muted-foreground truncate flex-1">{traceUrl}</p>
          <button type="button" onClick={handleCopyUrl} className="text-muted-foreground hover:text-primary shrink-0">
            {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Actions */}
        <div className="grid gap-2 sm:grid-cols-3">
          <Button type="button" className="gap-2" onClick={handleDownloadQR}>
            <Download className="h-4 w-4" />
            Download QR
          </Button>
          <Button type="button" variant="outline" className="gap-2" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          <Button type="button" variant="outline" className="gap-2" onClick={handleCopyUrl}>
            {copied ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
            Copy URL
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground text-center">
          QR links to a public trace page · Buyers can verify crop origin and quality
        </p>
      </CardContent>
    </Card>
  );
}
