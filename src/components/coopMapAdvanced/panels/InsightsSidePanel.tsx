import { Button } from "@/components/ui/button";
import type { MemberMapPoint } from "@/hooks/useMemberMapData";
import { X } from "lucide-react";

type PanelStats = {
  membersCount: number;
  verifiedCount: number;
  topMain: string[];
  topSecondary: string[];
  productionTotal: number;
  readinessCounts: Record<string, number>;
};

export default function InsightsSidePanel({
  label,
  members,
  stats,
  onClose,
  onExport,
  onOpenSingle,
}: {
  label: string;
  members: MemberMapPoint[];
  stats: PanelStats;
  onClose: () => void;
  onExport: () => void;
  onOpenSingle: (memberId: string) => void;
}) {
  return (
    <div className="absolute top-2 right-2 bottom-2 w-[320px] max-w-[88vw] rounded-lg border border-border/60 bg-background/95 p-3 shadow-md overflow-auto z-20">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{label}</p>
          <p className="text-xs text-muted-foreground">Selected area insights</p>
        </div>
        <Button size="icon" variant="ghost" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-3 grid gap-2 text-sm">
        <div className="rounded border border-border/60 p-2">
          <p className="text-xs text-muted-foreground">Members count</p>
          <p className="font-semibold">{stats.membersCount}</p>
        </div>
        <div className="rounded border border-border/60 p-2">
          <p className="text-xs text-muted-foreground">Verified members</p>
          <p className="font-semibold">{stats.verifiedCount}</p>
        </div>
        <div className="rounded border border-border/60 p-2">
          <p className="text-xs text-muted-foreground">Estimated production</p>
          <p className="font-semibold">{stats.productionTotal.toFixed(1)}</p>
        </div>
        <div className="rounded border border-border/60 p-2">
          <p className="text-xs text-muted-foreground">Top main crops</p>
          <p className="font-semibold">{stats.topMain.join(", ") || "N/A"}</p>
        </div>
        <div className="rounded border border-border/60 p-2">
          <p className="text-xs text-muted-foreground">Top secondary crops</p>
          <p className="font-semibold">{stats.topSecondary.join(", ") || "N/A"}</p>
        </div>
        <div className="rounded border border-border/60 p-2">
          <p className="text-xs text-muted-foreground">Aggregation readiness</p>
          <p className="font-semibold">
            Ready {stats.readinessCounts.Ready} - Growing {stats.readinessCounts.Growing} - Off-season {stats.readinessCounts["Off-season"]} - Unknown {stats.readinessCounts.Unknown}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" onClick={onExport}>Export summary</Button>
        {members.length === 1 && (
          <Button size="sm" variant="outline" onClick={() => onOpenSingle(members[0].memberId)}>
            View Member Profile
          </Button>
        )}
      </div>
    </div>
  );
}
