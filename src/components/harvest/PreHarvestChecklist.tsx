import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronUp, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ChecklistItem {
  id: string;
  category: string;
  label: string;
  description: string;
  critical: boolean;
  checked: boolean;
}

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  // Food safety
  { id: "c1",  category: "Food Safety",    label: "Pesticide withdrawal period observed",    description: "Ensure the required days have passed since last pesticide application (check product label)",  critical: true,  checked: false },
  { id: "c2",  category: "Food Safety",    label: "No visible pest or disease damage",       description: "Inspect crop for signs of blight, rot, or pest infestation before harvesting",                critical: true,  checked: false },
  { id: "c3",  category: "Food Safety",    label: "Water source is clean",                   description: "Irrigation water should be from a clean, uncontaminated source",                               critical: true,  checked: false },
  { id: "c4",  category: "Food Safety",    label: "Workers have clean hands / gloves",       description: "All harvest workers should wash hands or wear gloves to prevent contamination",                critical: true,  checked: false },
  // Packaging
  { id: "c5",  category: "Packaging",      label: "Clean crates / bags available",           description: "Ensure packaging materials are clean, dry, and free from previous crop residue",              critical: true,  checked: false },
  { id: "c6",  category: "Packaging",      label: "Packaging labelled correctly",            description: "Label includes crop name, grade, weight, farm name, and harvest date",                        critical: false, checked: false },
  { id: "c7",  category: "Packaging",      label: "Sufficient packaging quantity",           description: "Enough crates/bags for the expected yield",                                                    critical: false, checked: false },
  // Transport
  { id: "c8",  category: "Transport",      label: "Vehicle is clean and dry",                description: "Transport vehicle should be free from previous cargo, chemicals, or moisture",                critical: true,  checked: false },
  { id: "c9",  category: "Transport",      label: "Transport booked / confirmed",            description: "Vehicle and driver confirmed for harvest day",                                                  critical: false, checked: false },
  { id: "c10", category: "Transport",      label: "Route to market planned",                 description: "Optimal route identified, road conditions checked",                                            critical: false, checked: false },
  // Market
  { id: "c11", category: "Market",         label: "Buyer confirmed",                         description: "Buyer or market stall confirmed and ready to receive produce",                                 critical: false, checked: false },
  { id: "c12", category: "Market",         label: "Price agreed with buyer",                 description: "Price per kg agreed verbally or in writing before harvest",                                    critical: false, checked: false },
  // Workers
  { id: "c13", category: "Workers",        label: "Sufficient workers available",            description: "Enough harvesters, supervisors, and transporters confirmed for the day",                      critical: true,  checked: false },
  { id: "c14", category: "Workers",        label: "Workers briefed on quality standards",    description: "Workers know which produce to pick, reject, and how to handle it",                            critical: false, checked: false },
  // Equipment
  { id: "c15", category: "Equipment",      label: "Harvest tools clean and ready",           description: "Knives, scissors, baskets clean and in good condition",                                       critical: false, checked: false },
  { id: "c16", category: "Equipment",      label: "Weighing scale available",                description: "Calibrated scale available for accurate weight recording",                                     critical: false, checked: false },
];

const CATEGORY_ICONS: Record<string, string> = {
  "Food Safety": "🛡️",
  "Packaging":   "📦",
  "Transport":   "🚛",
  "Market":      "🏪",
  "Workers":     "👷",
  "Equipment":   "🔧",
};

export function PreHarvestChecklist() {
  const [items, setItems] = useState<ChecklistItem[]>(DEFAULT_CHECKLIST);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["Food Safety", "Packaging"]));

  const toggle = (id: string) => {
    setItems((p) => p.map((item) => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const toggleCategory = (cat: string) => {
    setExpandedCategories((p) => {
      const next = new Set(p);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const categories = [...new Set(items.map((i) => i.category))];
  const totalItems = items.length;
  const checkedItems = items.filter((i) => i.checked).length;
  const criticalItems = items.filter((i) => i.critical);
  const criticalChecked = criticalItems.filter((i) => i.checked).length;
  const allCriticalDone = criticalChecked === criticalItems.length;
  const completionPct = Math.round((checkedItems / totalItems) * 100);

  const isReadyToHarvest = allCriticalDone && completionPct >= 70;

  const handleShare = () => {
    const unchecked = items.filter((i) => !i.checked);
    const text = `📋 Pre-Harvest Checklist — AgriSmart\n\n✅ Completed: ${checkedItems}/${totalItems} (${completionPct}%)\n${allCriticalDone ? "✅ All critical items done" : "⚠️ Critical items pending"}\n\n${unchecked.length > 0 ? `Pending:\n${unchecked.map((i) => `• ${i.label}`).join("\n")}` : "All items complete!"}\n\n— AgriSmart Harvest Planner`;
    if (navigator.share) {
      navigator.share({ title: "Pre-Harvest Checklist", text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => toast.success("Checklist copied"));
    }
  };

  const resetAll = () => {
    setItems((p) => p.map((i) => ({ ...i, checked: false })));
    toast.success("Checklist reset");
  };

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <ClipboardCheck className="h-3.5 w-3.5 text-primary" />
            </div>
            <CardTitle className="text-base">Pre-Harvest Compliance Checklist</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={cn("border text-xs",
              isReadyToHarvest ? "bg-success/10 text-success border-success/30" :
              allCriticalDone ? "bg-warning/10 text-warning border-warning/30" :
              "bg-destructive/10 text-destructive border-destructive/30"
            )}>
              {isReadyToHarvest ? "Ready to harvest" : allCriticalDone ? "Almost ready" : "Not ready"}
            </Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Food safety, packaging, transport, and compliance checks before harvest
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{checkedItems} / {totalItems} items complete</span>
            <span className={cn("font-semibold", isReadyToHarvest ? "text-success" : "text-muted-foreground")}>{completionPct}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", isReadyToHarvest ? "bg-success" : allCriticalDone ? "bg-warning" : "bg-primary")}
              style={{ width: `${completionPct}%` }}
            />
          </div>
          <div className="flex items-center gap-2 text-xs">
            {allCriticalDone ? (
              <span className="flex items-center gap-1 text-success"><CheckCircle2 className="h-3.5 w-3.5" /> All {criticalItems.length} critical items done</span>
            ) : (
              <span className="flex items-center gap-1 text-destructive"><AlertTriangle className="h-3.5 w-3.5" /> {criticalItems.length - criticalChecked} critical item{criticalItems.length - criticalChecked !== 1 ? "s" : ""} remaining</span>
            )}
          </div>
        </div>

        {/* Category sections */}
        <div className="space-y-2">
          {categories.map((cat) => {
            const catItems = items.filter((i) => i.category === cat);
            const catChecked = catItems.filter((i) => i.checked).length;
            const catCritical = catItems.filter((i) => i.critical && !i.checked).length;
            const isExpanded = expandedCategories.has(cat);

            return (
              <div key={cat} className="rounded-xl border border-border/60 overflow-hidden">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 px-3 py-2.5 bg-muted/20 hover:bg-muted/40 transition-colors text-left"
                  onClick={() => toggleCategory(cat)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{CATEGORY_ICONS[cat] ?? "📋"}</span>
                    <span className="text-sm font-semibold text-foreground">{cat}</span>
                    {catCritical > 0 && (
                      <Badge className="bg-destructive/10 text-destructive border-destructive/30 border text-[10px] px-1.5">
                        {catCritical} critical
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">{catChecked}/{catItems.length}</span>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="divide-y divide-border/40">
                    {catItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggle(item.id)}
                        className={cn(
                          "flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/20",
                          item.checked && "bg-success/5"
                        )}
                      >
                        <div className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-md mt-0.5 transition-colors",
                          item.checked ? "bg-success/20 text-success" : "bg-muted/40 text-muted-foreground"
                        )}>
                          {item.checked
                            ? <CheckCircle2 className="h-3.5 w-3.5" />
                            : <XCircle className="h-3.5 w-3.5 opacity-40" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={cn("text-xs font-medium", item.checked ? "text-muted-foreground line-through" : "text-foreground")}>
                              {item.label}
                            </span>
                            {item.critical && !item.checked && (
                              <Badge className="bg-destructive/10 text-destructive border-destructive/30 border text-[9px] px-1">Critical</Badge>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{item.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" className="gap-2 flex-1" onClick={handleShare}>
            <Share2 className="h-3.5 w-3.5" />
            Share checklist
          </Button>
          <Button type="button" variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={resetAll}>
            Reset all
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
