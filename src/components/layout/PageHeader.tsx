import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { Badge } from "@/components/ui/badge";
import { useUserRole } from "@/hooks/useUserRole";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, icon: Icon, actions, children, className }: PageHeaderProps) {
  const { role } = useUserRole();
  const rightActions = actions ?? children;

  return (
    <header className={cn("sticky top-0 z-30 border-b border-border/80 bg-background/90 px-4 py-4 backdrop-blur md:px-6", className)}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {Icon ? <Icon className="h-4 w-4 text-muted-foreground" /> : null}
            <h1 className="text-xl font-semibold leading-tight text-foreground md:text-2xl">{title}</h1>
          </div>
          {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
        <div className="flex w-full items-center justify-start gap-2 md:w-auto md:justify-end">
          {rightActions}
          <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
            Role: {role}
          </Badge>
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
