import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, icon: Icon, children, className }: PageHeaderProps) {
  return (
    <header className={cn(
      "sticky top-0 z-30 min-h-[72px] bg-background/80 backdrop-blur-md border-b border-border px-4 md:px-6 py-4",
      className
    )}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full items-center gap-3 sm:w-auto flex-shrink-0">
          {Icon && (
            <div className="h-10 w-10 flex-shrink-0 rounded-xl gradient-primary flex items-center justify-center shadow-sm">
              <Icon className="h-5 w-5 flex-shrink-0 text-primary-foreground" />
            </div>
          )}
          <div className="min-w-0 max-w-full flex-shrink-0">
            <h1 className="text-[1.1rem] font-bold leading-tight text-foreground break-words sm:text-xl sm:leading-snug">{title}</h1>
            {subtitle && (
              <p className="text-[0.85rem] leading-tight text-muted-foreground break-words sm:text-sm sm:leading-snug">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto flex-shrink-0">
          {children}
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
