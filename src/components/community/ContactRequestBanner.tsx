import { CheckCircle2, Clock, PhoneCall, ShieldAlert, UserPlus, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ContactStatus } from "@/types/dm";

interface ContactRequestBannerProps {
  status: ContactStatus["status"];
  canCall: boolean;
  isRequester?: boolean;
  canRespond?: boolean;
  onRequest: () => void;
  onAccept: () => void;
  onReject: () => void;
  disabled?: boolean;
}

export function ContactRequestBanner({
  status,
  canCall,
  isRequester,
  canRespond,
  onRequest,
  onAccept,
  onReject,
  disabled,
}: ContactRequestBannerProps) {
  const baseClasses = "rounded-2xl border border-border/60 bg-card/80 px-4 py-3";

  if (status === "accepted") {
    return (
      <Card className={cn(baseClasses, "flex items-center justify-between gap-4")}
        aria-live="polite"
      >
        <div className="flex items-center gap-2 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          Contact approved. You can call safely.
        </div>
        {canCall ? (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <PhoneCall className="h-3 w-3" />
            Call enabled
          </span>
        ) : null}
      </Card>
    );
  }

  if (status === "rejected") {
    return (
      <Card className={cn(baseClasses, "flex items-center gap-2 text-sm text-muted-foreground")}
        aria-live="polite"
      >
        <ShieldAlert className="h-4 w-4 text-amber-600" />
        Contact request was declined. Messaging is disabled.
      </Card>
    );
  }

  if (status === "pending") {
    return (
      <Card className={cn(baseClasses, "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between")}
        aria-live="polite"
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          {isRequester ? "Waiting for approval" : "Contact request received"}
        </div>
        {canRespond ? (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={onReject} disabled={disabled}>
              <XCircle className="h-4 w-4" />
              Decline
            </Button>
            <Button size="sm" onClick={onAccept} disabled={disabled}>
              <CheckCircle2 className="h-4 w-4" />
              Accept
            </Button>
          </div>
        ) : null}
      </Card>
    );
  }

  return (
    <Card className={cn(baseClasses, "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between")}
      aria-live="polite"
    >
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <UserPlus className="h-4 w-4" />
        Request consent before chatting or calling.
      </div>
      <Button size="sm" onClick={onRequest} disabled={disabled}>
        Request Contact
      </Button>
    </Card>
  );
}
