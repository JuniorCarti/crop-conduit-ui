import { CheckCircle2, Sparkles } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { AdvisoryGenerateResponse } from "@/types/advisory";
import { PremiumLock } from "@/components/climate/PremiumLock";

interface AdvisoryCardProps {
  aiData: AdvisoryGenerateResponse | null;
  aiLoading: boolean;
  aiError: string | null;
  onGenerateAi: () => void;
  aiProgress?: string | null;
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
    weatherSource?: string | null;
    weatherTimestamp?: string | null;
    marketHighlights?: string[];
    marketTimestamp?: string | null;
    dataQualityMessages?: string[];
  } | null;
  canGenerateAi: boolean;
  aiDisabledReason?: string | null;
  isLoading: boolean;
  isPremium: boolean;
  t: (key: string, defaultValue?: string) => string;
  onUpgrade?: () => void;
}

export function AdvisoryCard({
  aiData,
  aiLoading,
  aiError,
  onGenerateAi,
  aiProgress,
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
  t,
  onUpgrade,
}: AdvisoryCardProps) {
  if (isLoading) {
    return (
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>{t("climate.aiAdvisory.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  const hasAiResponse = Boolean(aiData);
  const aiSummary = aiData?.summary || aiData?.title || "";
  const aiActions = aiData?.actions ?? [];
  const aiRisks = aiData?.risks ?? [];
  const aiLocationName =
    aiData?.dataUsed?.locationName || aiDataUsed?.locationName || "";
  const aiHighlights =
    aiData?.dataUsed?.weatherHighlights || aiDataUsed?.weatherHighlights || [];
  const aiWeatherSource =
    aiData?.dataUsed?.weatherSource || aiDataUsed?.weatherSource || "";
  const aiWeatherTimestamp =
    aiData?.dataUsed?.weatherTimestamp || aiDataUsed?.weatherTimestamp || "";
  const aiMarketHighlights =
    aiData?.dataUsed?.marketHighlights || aiDataUsed?.marketHighlights || [];
  const aiMarketTimestamp =
    aiData?.dataUsed?.marketTimestamp || aiDataUsed?.marketTimestamp || "";
  const aiDataQualityMessages =
    aiData?.dataUsed?.dataQualityMessages || aiDataUsed?.dataQualityMessages || [];

  const card = (
    <Card className="border-border/60">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">{t("climate.aiAdvisory.title")}</CardTitle>
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
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">{t("climate.aiAdvisory.subtitle")}</p>
          {aiDisabledReason && (
            <p className="text-xs text-muted-foreground">{aiDisabledReason}</p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={onGenerateAi}
              disabled={!canGenerateAi || aiLoading}
            >
              {aiLoading ? t("climate.aiAdvisory.generating") : t("climate.aiAdvisory.generate")}
            </Button>
          </div>

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
              {aiProgress && (
                <p className="text-xs text-muted-foreground">{aiProgress}</p>
              )}
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
              {aiDataQualityMessages.length > 0 && (
                <Alert>
                  <AlertTitle>{t("climate.aiAdvisory.dataLimitations", "Data limitations")}</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc space-y-1 pl-4 text-xs">
                      {aiDataQualityMessages.map((item, index) => (
                        <li key={`${item}-${index}`}>{item}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
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
                {aiWeatherSource && (
                  <p className="text-xs text-muted-foreground">
                    {t("climate.aiAdvisory.weatherSource", "Weather source")}: {aiWeatherSource}
                    {aiWeatherTimestamp ? ` - ${aiWeatherTimestamp}` : ""}
                  </p>
                )}
                {aiHighlights.length > 0 && (
                  <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                    {aiHighlights.map((item, index) => (
                      <li key={`${item}-${index}`}>{item}</li>
                    ))}
                  </ul>
                )}
                {aiMarketHighlights.length > 0 && (
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>{t("climate.aiAdvisory.marketUsed", "Markets considered")}:</p>
                    <ul className="list-disc space-y-1 pl-4">
                      {aiMarketHighlights.map((item, index) => (
                        <li key={`${item}-${index}`}>{item}</li>
                      ))}
                    </ul>
                    {aiMarketTimestamp && (
                      <p>{t("climate.aiAdvisory.marketUpdated", "Market updated")}: {aiMarketTimestamp}</p>
                    )}
                  </div>
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
