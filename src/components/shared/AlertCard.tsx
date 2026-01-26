import { LucideIcon, AlertTriangle, CheckCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface AlertCardProps {
  type: "warning" | "success" | "info" | "danger";
  title: string;
  message: string;
  action?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  className?: string;
}

const alertConfig = {
  warning: {
    icon: AlertTriangle,
    bg: "bg-warning/10",
    border: "border-warning/30",
    iconColor: "text-warning",
    titleColor: "text-warning",
  },
  success: {
    icon: CheckCircle,
    bg: "bg-success/10",
    border: "border-success/30",
    iconColor: "text-success",
    titleColor: "text-success",
  },
  info: {
    icon: Info,
    bg: "bg-info/10",
    border: "border-info/30",
    iconColor: "text-info",
    titleColor: "text-info",
  },
  danger: {
    icon: AlertTriangle,
    bg: "bg-destructive/10",
    border: "border-destructive/30",
    iconColor: "text-destructive",
    titleColor: "text-destructive",
  },
};

export function AlertCard({ 
  type, 
  title, 
  message, 
  action, 
  onAction, 
  onDismiss,
  className 
}: AlertCardProps) {
  const config = alertConfig[type];
  const Icon = config.icon;

  return (
    <div className={cn(
      "rounded-xl p-4 border",
      config.bg,
      config.border,
      className
    )}>
      <div className="flex gap-3">
        <Icon className={cn("h-5 w-5 flex-shrink-0 mt-0.5", config.iconColor)} />
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-semibold", config.titleColor)}>{title}</p>
          <p className="text-sm text-foreground/80 mt-1">{message}</p>
          {action && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="mt-2 h-8 px-0 text-primary hover:text-primary/80 hover:bg-transparent"
              onClick={onAction}
            >
              {action}
            </Button>
          )}
        </div>
        {onDismiss && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 -mt-1 -mr-1 text-muted-foreground hover:text-foreground"
            onClick={onDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
