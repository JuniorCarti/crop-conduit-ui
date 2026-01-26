import { CheckCircle2, Sparkles } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { AlertItem } from "@/types/climate";
import type { AdvisoryGenerateResponse } from "@/types/advisory";
import type { AdvisoryItem, FrostRiskSummary, FrostRiskLevel } from "@/services/weatherProxyService";
import { PremiumLock } from "@/components/climate/PremiumLock";

interface AdvisoryCardProps {
  advisory: AdvisoryItem[];
  frostRisk: FrostRiskSummary | null;
  alerts: AlertItem[];
  aiData: AdvisoryGenerateResponse | null;
  aiLoading: boolean;
  aiError: string | null;
  onGenerateAi: () => void;
  aiLanguage: "en" | "sw";
  onChangeAiLanguage: (language: "en" | "sw") => void;
  aiCrop: string;
  onChangeAiCrop: (value: string) => void;
  aiStage: string;
  onChangeAiStage: (value: string) => void;
  cropOptions: Array<{ value: string; label: string }>;
  stageOptions: Array<{ value: string; label: string }>;
  aiDataUsed?: {
    locationName?: string | null;
    weatherHighlights?: string[];
  } | null;
  canGenerateAi: boolean;
  aiDisabledReason?: string | null;
  isLoading: boolean;
  isPremium: boolean;
  smsEnabled: boolean;
  hasPhoneNumber: boolean;
  isOffline: boolean;
  language: "sw" | "en";
  onToggleSms: (next: boolean) => void;
  t: (key: string, defaultValue?: string) => string;
  onUpgrade?: () => void;
}

const severityTone: Record<FrostRiskLevel, string> = {
  Low: "bg-success/10 text-success",
  Medium: "bg-warning/10 text-warning",
  High: "bg-destructive/10 text-destructive",
};

export function AdvisoryCard({
  advisory,
  frostRisk,
  alerts,
  aiData,
  aiLoading,
  aiError,
  onGenerateAi,
  aiLanguage,
  onChangeAiLanguage,
  aiCrop,
  onChangeAiCrop,
  aiStage,
  onChangeAiStage,
  cropOptions,
  stageOptions,
  aiDataUsed,
  canGenerateAi,
  aiDisabledReason,
  isLoading,
  isPremium,
  smsEnabled,
  hasPhoneNumber,
  isOffline,
  language,
  onToggleSms,
  t,
  onUpgrade,
}: AdvisoryCardProps) {
  if (isLoading) {
    return (
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>{t("climate.advisory.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  const frostSeverity = frostRisk?.riskLevel || "Low";
  const primaryAdvisory = advisory[0];
  const hasAiResponse = Boolean(aiData);
  const aiSummary = aiData?.summary || aiData?.title || "";
  const aiActions = aiData?.actions ?? [];
  const aiRisks = aiData?.risks ?? [];
  const aiLocationName =
    aiData?.dataUsed?.locationName || aiDataUsed?.locationName || "";
  const aiHighlights =
    aiData?.dataUsed?.weatherHighlights || aiDataUsed?.weatherHighlights || [];

  const card = (
    <Card className="border-border/60">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{t("climate.advisory.title")}</CardTitle>
        <Badge variant="outline">
          {primaryAdvisory ? t(primaryAdvisory.title) : t("climate.advisory.none")}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md bg-muted/60 p-3 text-sm">
          {primaryAdvisory ? (
            <>
              <p className="font-semibold mb-1">{t(primaryAdvisory.title)}</p>
              <p className="text-muted-foreground">{t(primaryAdvisory.body)}</p>
            </>
          ) : (
            <p className="text-muted-foreground">{t("climate.advisory.none")}</p>
          )}
        </div>

        <div className="flex items-center justify-between rounded-md border border-border/60 p-3">
          <div>
            <p className="text-sm font-semibold">{t("climate.sms.title")}</p>
            <p className="text-xs text-muted-foreground">
              {isOffline ? t("climate.sms.offlineHint") : t("climate.sms.helper")}
            </p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Switch
                  checked={smsEnabled}
                  disabled={!hasPhoneNumber || !isPremium}
                  onCheckedChange={onToggleSms}
                />
              </div>
            </TooltipTrigger>
            {!hasPhoneNumber && (
              <TooltipContent>
                <p>{t("climate.sms.needsPhone")}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">{t("climate.advisory.recentAlerts")}</p>
            <Badge className={severityTone[frostSeverity]}>
              {t(`climate.risk.${frostSeverity.toLowerCase()}`)}
            </Badge>
          </div>
          {alerts.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t("climate.advisory.noAlerts")}</p>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div key={alert.id} className="rounded-md border border-border/60 p-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{t(`climate.alerts.${alert.type}`)}</span>
                    <Badge className={severityTone[alert.severity]}>
                      {t(`climate.risk.${alert.severity.toLowerCase()}`)}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mt-1">
                    {language === "sw"
                      ? alert.messageSw || alert.messageEn
                      : alert.messageEn || alert.messageSw}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">{t("climate.aiAdvisory.title")}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant={aiLanguage === "en" ? "default" : "outline"}
                onClick={() => onChangeAiLanguage("en")}
              >
                {t("language.english")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant={aiLanguage === "sw" ? "default" : "outline"}
                onClick={() => onChangeAiLanguage("sw")}
              >
                {t("language.swahili")}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={onGenerateAi}
                disabled={!canGenerateAi || aiLoading}
              >
                {aiLoading ? t("climate.aiAdvisory.generating") : t("climate.aiAdvisory.generate")}
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">{t("climate.aiAdvisory.subtitle")}</p>
          {aiDisabledReason && (
            <p className="text-xs text-muted-foreground">{aiDisabledReason}</p>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ai-crop">{t("climate.aiAdvisory.cropLabel")}</Label>
              <Select value={aiCrop} onValueChange={onChangeAiCrop}>
                <SelectTrigger id="ai-crop">
                  <SelectValue placeholder={t("climate.aiAdvisory.cropPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {cropOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ai-stage">{t("climate.aiAdvisory.stageLabel")}</Label>
              <Select value={aiStage} onValueChange={onChangeAiStage}>
                <SelectTrigger id="ai-stage">
                  <SelectValue placeholder={t("climate.aiAdvisory.stagePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {stageOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {aiLoading && (
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          )}

          {aiError && (
            <Alert variant="destructive">
              <AlertTitle>{t("climate.aiAdvisory.errorTitle")}</AlertTitle>
              <AlertDescription className="flex items-center justify-between gap-3">
                <span>{aiError}</span>
                <Button size="sm" variant="outline" onClick={onGenerateAi}>
                  {t("common.retry")}
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {!aiLoading && !aiError && !hasAiResponse && (
            <p className="text-xs text-muted-foreground">{t("climate.aiAdvisory.empty")}</p>
          )}

          {!aiLoading && aiData && (
            <div className="space-y-4">
              <div className="rounded-md border border-border/60 p-3 text-sm">
                <p className="text-xs text-muted-foreground">{t("climate.aiAdvisory.summary")}</p>
                <p className="mt-1 font-semibold">{aiSummary || t("climate.aiAdvisory.noSummary")}</p>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">{t("climate.aiAdvisory.actions")}</p>
                {aiActions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {t("climate.aiAdvisory.actionsEmpty")}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {aiActions.map((action, index) => (
                      <div key={`${action}-${index}`} className="flex gap-2 text-sm">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-success" />
                        <p>{action}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">{t("climate.aiAdvisory.risks")}</p>
                {aiRisks.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {t("climate.aiAdvisory.risksEmpty")}
                  </p>
                ) : (
                  <ul className="list-disc space-y-1 pl-4 text-sm">
                    {aiRisks.map((risk, index) => (
                      <li key={`${risk}-${index}`}>{risk}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-md border border-border/60 p-3 text-sm space-y-2">
                <p className="text-xs text-muted-foreground">{t("climate.aiAdvisory.dataUsed")}</p>
                <p className="font-semibold">
                  {aiLocationName || t("climate.aiAdvisory.locationUnknown")}
                </p>
                {aiHighlights.length > 0 && (
                  <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                    {aiHighlights.map((item, index) => (
                      <li key={`${item}-${index}`}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <PremiumLock
      locked={!isPremium}
      title={t("climate.premium.lockTitle")}
      description={t("climate.premium.lockBody")}
      ctaLabel={t("climate.premium.upgrade")}
      onUpgrade={onUpgrade}
    >
      {card}
    </PremiumLock>
  );
}
