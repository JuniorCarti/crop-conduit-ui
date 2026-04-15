import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Copy, Share2, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { AdvisoryGenerateResponse } from "@/types/advisory";

interface Props {
  advisory: AdvisoryGenerateResponse | null;
  farmName?: string;
  crop?: string;
}

const SAMPLE_ADVISORY: AdvisoryGenerateResponse = {
  summary: "Moderate rain expected this week. Apply fungicide before rain window closes on Wednesday.",
  actions: ["Apply mancozeb fungicide today", "Stake tomato plants before rain", "Harvest mature fruits by Tuesday"],
  risks: ["Blight risk elevated due to high humidity", "Waterlogging possible in low-lying areas"],
};

function buildWhatsAppText(advisory: AdvisoryGenerateResponse, farmName: string, crop: string): string {
  const lines: string[] = [
    `🌱 *AgriSmart Advisory — ${farmName}*`,
    `🌾 Crop: ${crop}`,
    `📅 ${new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "short" })}`,
    "",
    `📋 *Summary*`,
    advisory.summary ?? "No summary available.",
    "",
  ];

  if (advisory.actions?.length) {
    lines.push("✅ *What to do today*");
    advisory.actions.forEach((a) => lines.push(`• ${a}`));
    lines.push("");
  }

  if (advisory.risks?.length) {
    lines.push("⚠️ *Watch out for*");
    advisory.risks.forEach((r) => lines.push(`• ${r}`));
    lines.push("");
  }

  lines.push("_Powered by AgriSmart · agrismart.app_");
  return lines.join("\n");
}

export function ShareAdvisoryWhatsApp({ advisory, farmName = "Your Farm", crop = "Tomatoes" }: Props) {
  const [copied, setCopied] = useState(false);
  const source = advisory ?? SAMPLE_ADVISORY;
  const isMockup = !advisory;
  const text = buildWhatsAppText(source, farmName, crop);
  const encoded = encodeURIComponent(text);
  const waUrl = `https://wa.me/?text=${encoded}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Advisory copied to clipboard");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "AgriSmart Advisory", text });
        return;
      } catch {
        // fall through to WhatsApp link
      }
    }
    window.open(waUrl, "_blank");
  };

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-success/10">
              <MessageSquare className="h-3.5 w-3.5 text-success" />
            </div>
            <CardTitle className="text-base">Share Advisory via WhatsApp</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {isMockup && <Badge variant="outline" className="text-[10px]">UI Mockup</Badge>}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Share your AI advisory with other farmers or cooperative members</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preview */}
        <div className="rounded-xl border border-border/60 bg-muted/20 p-3 max-h-48 overflow-y-auto">
          <pre className="text-xs text-foreground whitespace-pre-wrap font-sans leading-relaxed">{text}</pre>
        </div>

        {/* Action buttons */}
        <div className="grid gap-2 sm:grid-cols-3">
          <Button
            type="button"
            className="gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white"
            onClick={() => window.open(waUrl, "_blank")}
          >
            <MessageSquare className="h-4 w-4" />
            WhatsApp
          </Button>
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={handleCopy}
          >
            {copied ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy text"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground text-center">
          Opens WhatsApp with the advisory pre-filled · Works on mobile and desktop
        </p>
      </CardContent>
    </Card>
  );
}
