import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Send, CheckCircle2, ExternalLink, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  locationName?: string;
  lat?: number | null;
  lon?: number | null;
}

const BOT_USERNAME = "@AgriSmartAlertsBot";
const BOT_LINK = "https://t.me/AgriSmartAlertsBot";

export function TelegramAlertSubscription({ locationName = "Your Farm", lat, lon }: Props) {
  const [chatId, setChatId] = useState("");
  const [wantsFrost, setWantsFrost] = useState(true);
  const [wantsRain, setWantsRain] = useState(true);
  const [wantsAdvisory, setWantsAdvisory] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const hasLocation = lat != null && lon != null;

  const handleCopyBot = () => {
    navigator.clipboard.writeText(BOT_USERNAME).catch(() => {});
    toast.success("Bot username copied!");
  };

  const handleSubscribe = () => {
    if (!chatId.trim()) {
      toast.error("Please enter your Telegram Chat ID");
      return;
    }
    setSubscribed(true);
    toast.success("Telegram alerts activated!");
  };

  const steps = [
    { num: 1, label: "Open Telegram bot",    done: step > 1 },
    { num: 2, label: "Get your Chat ID",     done: step > 2 },
    { num: 3, label: "Enter Chat ID below",  done: subscribed },
  ];

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-info/10">
              <Send className="h-3.5 w-3.5 text-info" />
            </div>
            <CardTitle className="text-base">Telegram Alerts</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              className={cn("border text-xs", subscribed
                ? "bg-success/10 text-success border-success/30"
                : "bg-muted/60 text-muted-foreground border-border"
              )}
            >
              {subscribed ? "Active" : "Not set up"}
            </Badge>
            <Badge variant="outline" className="text-[10px]">UI Mockup</Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Receive climate alerts directly in Telegram alongside WhatsApp, Email, and SMS
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Step tracker */}
        <div className="flex items-center gap-2">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center gap-2 flex-1">
              <div className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors",
                s.done || step === s.num
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}>
                {s.done ? <CheckCircle2 className="h-3.5 w-3.5" /> : s.num}
              </div>
              <span className={cn("text-xs truncate", step === s.num ? "text-foreground font-medium" : "text-muted-foreground")}>
                {s.label}
              </span>
              {i < steps.length - 1 && <div className="h-px flex-1 bg-border/60" />}
            </div>
          ))}
        </div>

        {/* Step 1: Open bot */}
        <div className={cn("rounded-xl border p-3 space-y-2", step === 1 ? "border-primary/40 bg-primary/5" : "border-border/60 bg-muted/20")}>
          <p className="text-xs font-semibold text-foreground">Step 1 — Start the AgriSmart bot</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-lg bg-muted px-3 py-1.5 text-xs font-mono text-foreground">{BOT_USERNAME}</code>
            <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs shrink-0" onClick={handleCopyBot}>
              <Copy className="h-3 w-3" /> Copy
            </Button>
            <Button type="button" size="sm" className="h-7 gap-1 text-xs shrink-0" onClick={() => { window.open(BOT_LINK, "_blank"); setStep(2); }}>
              <ExternalLink className="h-3 w-3" /> Open
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Send <code className="bg-muted px-1 rounded">/start</code> to the bot to activate it</p>
        </div>

        {/* Step 2: Get Chat ID */}
        <div className={cn("rounded-xl border p-3 space-y-2", step === 2 ? "border-primary/40 bg-primary/5" : "border-border/60 bg-muted/20")}>
          <p className="text-xs font-semibold text-foreground">Step 2 — Get your Chat ID</p>
          <p className="text-xs text-muted-foreground">
            After starting the bot, send <code className="bg-muted px-1 rounded">/myid</code> — the bot will reply with your unique Chat ID number.
          </p>
          {step === 2 && (
            <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => setStep(3)}>
              I have my Chat ID →
            </Button>
          )}
        </div>

        {/* Step 3: Enter Chat ID + subscribe */}
        <div className={cn("rounded-xl border p-3 space-y-3", step === 3 ? "border-primary/40 bg-primary/5" : "border-border/60 bg-muted/20")}>
          <p className="text-xs font-semibold text-foreground">Step 3 — Enter your Chat ID</p>

          <div className="space-y-1.5">
            <Label htmlFor="telegram-chatid" className="text-xs">Telegram Chat ID</Label>
            <Input
              id="telegram-chatid"
              placeholder="e.g. 123456789"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              className="h-8 text-sm"
              disabled={subscribed}
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Alert types</p>
            {[
              { id: "frost",    label: "Frost alerts",         checked: wantsFrost,    onChange: setWantsFrost    },
              { id: "rain",     label: "Heavy rain alerts",    checked: wantsRain,     onChange: setWantsRain     },
              { id: "advisory", label: "AI advisory ready",    checked: wantsAdvisory, onChange: setWantsAdvisory },
            ].map((item) => (
              <div key={item.id} className="flex items-center gap-2">
                <Checkbox
                  id={`tg-${item.id}`}
                  checked={item.checked}
                  onCheckedChange={(v) => item.onChange(v === true)}
                  disabled={subscribed}
                />
                <Label htmlFor={`tg-${item.id}`} className="text-xs cursor-pointer">{item.label}</Label>
              </div>
            ))}
          </div>

          <div className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Location:</span> {locationName}
            {hasLocation && <span className="ml-2 text-[10px]">({lat?.toFixed(3)}, {lon?.toFixed(3)})</span>}
          </div>
        </div>

        {!subscribed ? (
          <Button
            type="button"
            className="w-full gap-2"
            onClick={handleSubscribe}
            disabled={step < 3 || !chatId.trim()}
          >
            <Send className="h-4 w-4" />
            Activate Telegram alerts
          </Button>
        ) : (
          <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/5 p-3">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <div>
              <p className="text-sm font-semibold text-success">Telegram alerts active</p>
              <p className="text-xs text-muted-foreground">Chat ID: {chatId}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
