import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { MessageSquare, Copy, Share2, CheckCircle2, Truck, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatKsh } from "@/lib/currency";
import type { HarvestSchedule } from "@/types/harvest";

interface Props {
  schedule: HarvestSchedule | null;
  cropName?: string;
  quantityKg?: number;
  pricePerKg?: number;
  deliveryDate?: string;
  farmLocation?: string;
}

type RecipientType = "buyer" | "transporter" | "cooperative";

const TEMPLATES: Record<RecipientType, (p: {
  cropName: string; qty: number; price: number; date: string; location: string; farmerName: string;
}) => string> = {
  buyer: ({ cropName, qty, price, date, location, farmerName }) =>
    `🌱 *Harvest Ready — AgriSmart*\n\nHi, I have *${qty} kg of ${cropName}* ready for delivery.\n\n📦 Quantity: ${qty} kg\n💰 Price: KES ${price}/kg\n📅 Available from: ${date}\n📍 Location: ${location}\n\nTotal value: KES ${(qty * price).toLocaleString()}\n\nPlease confirm if you're interested.\n\n— ${farmerName} (via AgriSmart)`,

  transporter: ({ cropName, qty, date, location, farmerName }) =>
    `🚛 *Transport Request — AgriSmart*\n\nHi, I need transport for a harvest.\n\n🌾 Crop: ${cropName}\n📦 Quantity: ${qty} kg\n📅 Pickup date: ${date}\n📍 Pickup: ${location}\n\nPlease confirm availability and quote your rate.\n\n— ${farmerName} (via AgriSmart)`,

  cooperative: ({ cropName, qty, price, date, location, farmerName }) =>
    `🤝 *Group Sale Opportunity — AgriSmart*\n\nHello cooperative members,\n\nI have *${qty} kg of ${cropName}* ready. Looking to pool with others for a better deal.\n\n💰 Target price: KES ${price}/kg\n📅 Delivery: ${date}\n📍 Farm: ${location}\n\nReply with your available quantity to join the group sale.\n\n— ${farmerName}`,
};

export function WhatsAppHarvestAlert({ schedule, cropName = "Tomatoes", quantityKg = 300, pricePerKg = 65, deliveryDate, farmLocation = "Nakuru / Bahati" }: Props) {
  const [recipientType, setRecipientType] = useState<RecipientType>("buyer");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [farmerName, setFarmerName] = useState("Farmer");
  const [copied, setCopied] = useState(false);

  const crop = schedule?.cropName ?? cropName;
  const qty = schedule?.expectedYield ?? quantityKg;
  const date = deliveryDate ?? schedule?.optimalDate ?? new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);

  const message = TEMPLATES[recipientType]({ cropName: crop, qty, price: pricePerKg, date, location: farmLocation, farmerName });
  const encoded = encodeURIComponent(message);
  const waUrl = recipientPhone
    ? `https://wa.me/${recipientPhone.replace(/\D/g, "")}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message).catch(() => {});
    setCopied(true);
    toast.success("Message copied to clipboard");
    setTimeout(() => setCopied(false), 3000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Harvest Alert", text: message });
        return;
      } catch { /* fall through */ }
    }
    window.open(waUrl, "_blank");
  };

  const RECIPIENT_TABS: { type: RecipientType; label: string; icon: React.ElementType }[] = [
    { type: "buyer",       label: "Buyer",       icon: Users        },
    { type: "transporter", label: "Transporter", icon: Truck        },
    { type: "cooperative", label: "Cooperative", icon: MessageSquare },
  ];

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-success/10">
              <MessageSquare className="h-3.5 w-3.5 text-success" />
            </div>
            <CardTitle className="text-base">WhatsApp Harvest Alert</CardTitle>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          One-tap share of harvest details to buyer, transporter, or cooperative
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recipient type tabs */}
        <div className="flex gap-1.5">
          {RECIPIENT_TABS.map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              type="button"
              onClick={() => setRecipientType(type)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-medium transition-colors",
                recipientType === type
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/60 bg-background text-muted-foreground hover:bg-muted/30"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Farmer name + phone */}
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">Your name</Label>
            <Input value={farmerName} onChange={(e) => setFarmerName(e.target.value)} className="h-8 text-xs" placeholder="Your name" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Recipient phone (optional)</Label>
            <Input value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} className="h-8 text-xs" placeholder="+254..." />
          </div>
        </div>

        {/* Message preview */}
        <div className="space-y-1.5">
          <Label className="text-xs">Message preview</Label>
          <div className="rounded-xl border border-border/60 bg-muted/20 p-3 max-h-48 overflow-y-auto">
            <pre className="text-xs text-foreground whitespace-pre-wrap font-sans leading-relaxed">{message}</pre>
          </div>
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
          <Button type="button" variant="outline" className="gap-2" onClick={handleCopy}>
            {copied ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy"}
          </Button>
          <Button type="button" variant="outline" className="gap-2" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground text-center">
          Opens WhatsApp with message pre-filled · Works on mobile and desktop
        </p>
      </CardContent>
    </Card>
  );
}
