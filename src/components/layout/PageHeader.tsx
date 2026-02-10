import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { Badge } from "@/components/ui/badge";
import { useUserRole } from "@/hooks/useUserRole";
import { AgriSmartLogo } from "@/components/Brand/AgriSmartLogo";
import { brand } from "@/theme/brand";

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
    <header className={cn("sticky top-0 z-30 border-b border-border/80 bg-background/95 px-4 py-4 backdrop-blur md:px-6", className)}>
      <div className="app-page-shell flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex flex-col gap-3 md:flex-row md:items-start">
          <AgriSmartLogo variant="inline" size="sm" showTagline />
          <div className="hidden h-12 w-px bg-border md:block" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {Icon ? <Icon className="h-4 w-4 text-muted-foreground" /> : null}
              <h1 className="text-[20px] font-semibold leading-tight text-foreground md:text-[24px]">{title}</h1>
            </div>
            {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
          </div>
        </div>
        <div className="flex w-full flex-wrap items-center justify-start gap-2 md:w-auto md:justify-end">
          {rightActions}
          <Badge variant="outline" className="text-[10px] uppercase tracking-wide" style={{ borderColor: brand.colors.border }}>
            Role: {role}
          </Badge>
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
