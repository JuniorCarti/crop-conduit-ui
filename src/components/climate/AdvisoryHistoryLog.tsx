import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History, ChevronDown, ChevronUp, Trash2, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdvisoryGenerateResponse } from "@/types/advisory";

export interface AdvisoryHistoryEntry {
  id: string;
  crop: string;
  stage: string;
  language: "en" | "sw";
  generatedAt: string;
  advisory: AdvisoryGenerateResponse;
}

interface Props {
  history: AdvisoryHistoryEntry[];
  onClear?: () => void;
}

const SAMPLE_HISTORY: AdvisoryHistoryEntry[] = [
  {
    id: "1",
    crop: "Tomatoes",
    stage: "Flowering",
    language: "en",
    generatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    advisory: {
      summary: "Moderate rain expected this week. Protect flowers from waterlogging and watch for blight.",
      actions: ["Apply fungicide before rain", "Stake plants to prevent lodging"],
      risks: ["Blight risk elevated due to humidity"],
    },
  },
  {
    id: "2",
    crop: "Maize",
    stage: "Vegetative",
    language: "en",
    generatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    advisory: {
      summary: "Dry spell expected. Irrigate every 3 days and monitor for fall armyworm.",
      actions: ["Irrigate early morning", "Scout for armyworm"],
      risks: ["Drought stress if no irrigation"],
    },
  },
  {
    id: "3",
    crop: "Kale",
    stage: "Harvest",
    language: "sw",
    generatedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    advisory: {
      summary: "Hali ya hewa nzuri kwa mavuno. Vuna asubuhi mapema kabla ya jua kali.",
      actions: ["Vuna asubuhi mapema", "Hifadhi mahali penye baridi"],
      risks: ["Joto kali mchana"],
    },
  },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

export function AdvisoryHistoryLog({ history, onClear }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const entries = history.length ? history : SAMPLE_HISTORY;
  const isMockup = history.length === 0;

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <History className="h-3.5 w-3.5 text-primary" />
            </div>
            <CardTitle className="text-base">Advisory History</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">{entries.length} saved</Badge>
            {isMockup && <Badge variant="outline" className="text-[10px]">UI Mockup</Badge>}
            {!isMockup && onClear && (
              <Button variant="ghost" size="sm" onClick={onClear} className="h-7 gap-1 text-xs text-muted-foreground">
                <Trash2 className="h-3 w-3" /> Clear
              </Button>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Past AI advisories generated for your farm</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {entries.map((entry) => {
          const isOpen = expandedId === entry.id;
          return (
            <div key={entry.id} className="rounded-xl border border-border/60 bg-background/60 overflow-hidden">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
                onClick={() => setExpandedId(isOpen ? null : entry.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground capitalize">{entry.crop}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 capitalize">{entry.stage}</Badge>
                      <Badge
                        className={cn("text-[10px] px-1.5", entry.language === "sw" ? "bg-info/10 text-info border-info/30 border" : "bg-muted/60 text-muted-foreground")}
                      >
                        {entry.language === "sw" ? "Kiswahili" : "English"}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground mt-0.5">{formatDate(entry.generatedAt)}</span>
                  </div>
                </div>
                {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
              </button>

              {isOpen && (
                <div className="border-t border-border/60 px-4 py-3 space-y-3 bg-muted/10">
                  {entry.advisory.summary && (
                    <p className="text-sm text-foreground">{entry.advisory.summary}</p>
                  )}
                  {entry.advisory.actions && entry.advisory.actions.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Actions</p>
                      {entry.advisory.actions.map((a, i) => (
                        <p key={i} className="text-xs text-foreground flex gap-2">
                          <span className="text-success">✓</span> {a}
                        </p>
                      ))}
                    </div>
                  )}
                  {entry.advisory.risks && entry.advisory.risks.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Risks</p>
                      {entry.advisory.risks.map((r, i) => (
                        <p key={i} className="text-xs text-foreground flex gap-2">
                          <span className="text-warning">⚠</span> {r}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {entries.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <History className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No advisory history yet</p>
            <p className="text-xs text-muted-foreground">Generate an advisory above to start building your history</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
