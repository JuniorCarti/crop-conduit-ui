import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Download, Eye, Printer, Share2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatKsh } from "@/lib/currency";
import type { HarvestSchedule } from "@/types/harvest";

interface CertificateData {
  cropName: string;
  field: string;
  farmName: string;
  farmerName: string;
  county: string;
  quantityKg: number;
  unit: string;
  grade: string;
  harvestDate: string;
  certNumber: string;
  pricePerKg?: number;
}

interface Props {
  schedule: HarvestSchedule | null;
  farmName?: string;
  farmerName?: string;
  county?: string;
}

function generateCertNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `AGS-${year}-${rand}`;
}

export function HarvestCertificateGenerator({ schedule, farmName = "Nakuru Farm", farmerName = "John Kamau", county = "Nakuru" }: Props) {
  const [previewing, setPreviewing] = useState(false);
  const [certData, setCertData] = useState<CertificateData>({
    cropName: schedule?.cropName ?? "Tomatoes",
    field: schedule?.field ?? "Field A",
    farmName,
    farmerName,
    county,
    quantityKg: schedule?.expectedYield ?? 500,
    unit: schedule?.yieldUnit ?? "kg",
    grade: "A",
    harvestDate: schedule?.optimalDate ?? new Date().toISOString().slice(0, 10),
    certNumber: generateCertNumber(),
    pricePerKg: 65,
  });

  const totalValue = certData.pricePerKg ? certData.quantityKg * certData.pricePerKg : undefined;

  const handlePrint = () => {
    const win = window.open("", "_blank", "width=800,height=600");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Harvest Certificate — ${certData.certNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 700px; margin: 0 auto; color: #111; }
          .header { text-align: center; border-bottom: 3px solid #005302; padding-bottom: 20px; margin-bottom: 24px; }
          .logo { font-size: 24px; font-weight: bold; color: #005302; }
          .tagline { font-size: 12px; color: #666; margin-top: 4px; }
          h1 { font-size: 20px; margin: 12px 0 4px; color: #111; }
          .cert-number { font-size: 13px; color: #666; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 20px 0; }
          .field { background: #f9f9f9; border: 1px solid #e5e5e5; border-radius: 8px; padding: 12px; }
          .field-label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
          .field-value { font-size: 15px; font-weight: bold; color: #111; margin-top: 2px; }
          .highlight { background: #f0fdf4; border-color: #86efac; }
          .footer { margin-top: 32px; border-top: 1px solid #e5e5e5; padding-top: 16px; font-size: 11px; color: #888; text-align: center; }
          .seal { display: inline-block; border: 2px solid #005302; border-radius: 50%; padding: 8px 16px; color: #005302; font-weight: bold; font-size: 12px; margin: 16px auto; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">🌱 AgriSmart</div>
          <div class="tagline">Agricultural Intelligence Platform · Kenya</div>
          <h1>Harvest Certificate</h1>
          <div class="cert-number">Certificate No: ${certData.certNumber}</div>
        </div>
        <div class="grid">
          <div class="field"><div class="field-label">Farmer</div><div class="field-value">${certData.farmerName}</div></div>
          <div class="field"><div class="field-label">Farm</div><div class="field-value">${certData.farmName}</div></div>
          <div class="field"><div class="field-label">County</div><div class="field-value">${certData.county}</div></div>
          <div class="field"><div class="field-label">Field</div><div class="field-value">${certData.field}</div></div>
          <div class="field highlight"><div class="field-label">Crop</div><div class="field-value">${certData.cropName}</div></div>
          <div class="field highlight"><div class="field-label">Grade</div><div class="field-value">Grade ${certData.grade}</div></div>
          <div class="field highlight"><div class="field-label">Quantity</div><div class="field-value">${certData.quantityKg.toLocaleString()} ${certData.unit}</div></div>
          <div class="field highlight"><div class="field-label">Harvest Date</div><div class="field-value">${certData.harvestDate}</div></div>
          ${certData.pricePerKg ? `<div class="field"><div class="field-label">Price per kg</div><div class="field-value">KES ${certData.pricePerKg}</div></div>` : ""}
          ${totalValue ? `<div class="field"><div class="field-label">Total Value</div><div class="field-value">KES ${totalValue.toLocaleString()}</div></div>` : ""}
        </div>
        <div style="text-align:center">
          <div class="seal">✓ AgriSmart Verified</div>
        </div>
        <div class="footer">
          Generated by AgriSmart · agrismart.app · ${new Date().toLocaleString()}<br/>
          This certificate is for informational purposes. For official certification, contact your county agriculture office.
        </div>
      </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
    toast.success("Certificate opened for printing");
  };

  const handleShare = () => {
    const text = `📋 Harvest Certificate — AgriSmart\n\nCert No: ${certData.certNumber}\nFarmer: ${certData.farmerName}\nFarm: ${certData.farmName}, ${certData.county}\nCrop: ${certData.cropName} (Grade ${certData.grade})\nQuantity: ${certData.quantityKg} ${certData.unit}\nHarvest date: ${certData.harvestDate}${totalValue ? `\nValue: KES ${totalValue.toLocaleString()}` : ""}\n\nVerified by AgriSmart · agrismart.app`;
    if (navigator.share) {
      navigator.share({ title: "Harvest Certificate", text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => toast.success("Certificate details copied"));
    }
  };

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-3.5 w-3.5 text-primary" />
            </div>
            <CardTitle className="text-base">Harvest Certificate</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs font-mono">{certData.certNumber}</Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Generate a printable harvest summary for buyers and records</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Editable fields */}
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            { key: "farmerName",  label: "Farmer name",    type: "text"   },
            { key: "farmName",    label: "Farm name",      type: "text"   },
            { key: "county",      label: "County",         type: "text"   },
            { key: "cropName",    label: "Crop",           type: "text"   },
            { key: "quantityKg",  label: "Quantity (kg)",  type: "number" },
            { key: "grade",       label: "Grade",          type: "text"   },
            { key: "harvestDate", label: "Harvest date",   type: "date"   },
            { key: "pricePerKg",  label: "Price/kg (KES)", type: "number" },
          ].map(({ key, label, type }) => (
            <div key={key} className="space-y-1">
              <Label className="text-xs">{label}</Label>
              <Input
                type={type}
                value={(certData as any)[key] ?? ""}
                onChange={(e) => setCertData((p) => ({ ...p, [key]: type === "number" ? parseFloat(e.target.value) || 0 : e.target.value }))}
                className="h-8 text-xs"
              />
            </div>
          ))}
        </div>

        {/* Preview toggle */}
        <Button type="button" variant="outline" size="sm" className="gap-2 w-full" onClick={() => setPreviewing((p) => !p)}>
          <Eye className="h-3.5 w-3.5" />
          {previewing ? "Hide preview" : "Preview certificate"}
        </Button>

        {/* Certificate preview */}
        {previewing && (
          <div className="rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-card to-card p-5 space-y-4">
            <div className="text-center border-b border-primary/20 pb-4">
              <p className="text-lg font-bold text-primary">🌱 AgriSmart</p>
              <p className="text-[10px] text-muted-foreground">Agricultural Intelligence Platform · Kenya</p>
              <p className="text-base font-bold text-foreground mt-2">Harvest Certificate</p>
              <p className="text-xs text-muted-foreground font-mono">{certData.certNumber}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Farmer",       value: certData.farmerName                    },
                { label: "Farm",         value: certData.farmName                      },
                { label: "County",       value: certData.county                        },
                { label: "Field",        value: certData.field                         },
                { label: "Crop",         value: certData.cropName,   highlight: true   },
                { label: "Grade",        value: `Grade ${certData.grade}`, highlight: true },
                { label: "Quantity",     value: `${certData.quantityKg.toLocaleString()} ${certData.unit}`, highlight: true },
                { label: "Harvest date", value: certData.harvestDate, highlight: true  },
                ...(certData.pricePerKg ? [{ label: "Price/kg", value: `KES ${certData.pricePerKg}` }] : []),
                ...(totalValue ? [{ label: "Total value", value: `KES ${totalValue.toLocaleString()}` }] : []),
              ].map((f) => (
                <div key={f.label} className={cn("rounded-lg p-2", (f as any).highlight ? "bg-success/10 border border-success/20" : "bg-muted/30")}>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wide">{f.label}</p>
                  <p className="text-xs font-semibold text-foreground">{f.value}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-center">
              <div className="flex items-center gap-1.5 rounded-full border-2 border-primary px-4 py-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-bold text-primary">AgriSmart Verified</span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="grid gap-2 sm:grid-cols-3">
          <Button type="button" className="gap-2" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
            Print / PDF
          </Button>
          <Button type="button" variant="outline" className="gap-2" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          <Button type="button" variant="outline" className="gap-2" onClick={() => setCertData((p) => ({ ...p, certNumber: generateCertNumber() }))}>
            <FileText className="h-4 w-4" />
            New cert no.
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
