import { Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface CallActionBarProps {
  canCall: boolean;
  phone?: string | null;
  disabled?: boolean;
}

export function CallActionBar({ canCall, phone, disabled }: CallActionBarProps) {
  if (!canCall) return null;

  const handleCall = () => {
    if (!phone) return;
    window.location.href = `tel:${phone}`;
  };

  const handleWhatsApp = () => {
    if (!phone) return;
    const normalized = phone.startsWith("+") ? phone.slice(1) : phone;
    window.open(`https://wa.me/${normalized}`, "_blank", "noopener,noreferrer");
  };

  return (
    <Card className="flex flex-col gap-2 border-emerald-100 bg-emerald-50/60 p-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-muted-foreground">
        Calling is enabled after consent. We do not store phone numbers.
      </p>
      {phone ? (
        <div className="flex gap-2">
          <Button size="sm" onClick={handleCall} disabled={disabled} className="h-9">
            <Phone className="h-4 w-4" />
            Call
          </Button>
          <Button size="sm" variant="outline" onClick={handleWhatsApp} disabled={disabled} className="h-9">
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </Button>
        </div>
      ) : (
        <p className="text-xs text-amber-700">Calling requires a verified phone number in profile.</p>
      )}
    </Card>
  );
}
