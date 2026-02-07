import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DecisionSupportCardProps {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeTone?: "success" | "warning" | "danger" | "neutral";
  icon?: ReactNode;
  items?: string[];
  footer?: string;
  children?: ReactNode;
}

const badgeStyles: Record<NonNullable<DecisionSupportCardProps["badgeTone"]>, string> = {
  success: "bg-success/10 text-success border-success/30",
  warning: "bg-warning/10 text-warning border-warning/30",
  danger: "bg-destructive/10 text-destructive border-destructive/30",
  neutral: "bg-muted/60 text-muted-foreground border-border",
};

export function DecisionSupportCard({
  title,
  subtitle,
  badge,
  badgeTone = "neutral",
  icon,
  items,
  footer,
  children,
}: DecisionSupportCardProps) {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
          </div>
          {badge && (
            <Badge className={cn("border text-[11px] font-semibold", badgeStyles[badgeTone])}>
              {badge}
            </Badge>
          )}
        </div>
        {subtitle && (
          <p className="text-sm text-muted-foreground whitespace-normal break-words leading-relaxed">
            {subtitle}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {children}
        {items && items.length > 0 && (
          <ul className="space-y-2 text-sm text-muted-foreground">
            {items.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-primary/70" />
                <span className="whitespace-normal break-words">{item}</span>
              </li>
            ))}
          </ul>
        )}
        {footer && (
          <p className="text-xs text-muted-foreground whitespace-normal break-words leading-relaxed">
            {footer}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
