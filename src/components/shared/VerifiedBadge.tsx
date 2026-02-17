import { BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { VerifiedBadgeType } from "@/services/userVerificationService";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface VerifiedBadgeProps {
  type: VerifiedBadgeType;
  compact?: boolean;
  className?: string;
  tooltipText?: string;
}

const styles: Record<VerifiedBadgeType, string> = {
  farmer: "border-emerald-600 bg-emerald-100 text-emerald-900",
  buyer: "border-cyan-700 bg-cyan-100 text-cyan-900",
  cooperative: "border-indigo-700 bg-indigo-100 text-indigo-900",
};

const labels: Record<VerifiedBadgeType, string> = {
  farmer: "Verified Farmer",
  buyer: "Verified Buyer",
  cooperative: "Verified Cooperative",
};

export function VerifiedBadge({ type, compact = false, className, tooltipText = "Verified by AgriSmart" }: VerifiedBadgeProps) {
  const badge = (
    <Badge
      variant="outline"
      className={cn("gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", styles[type], className)}
      title={labels[type]}
    >
      <BadgeCheck className="h-3 w-3" />
      {!compact ? labels[type] : null}
    </Badge>
  );

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent>{tooltipText}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
