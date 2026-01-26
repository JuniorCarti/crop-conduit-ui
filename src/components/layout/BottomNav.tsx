import { NavLink, useLocation } from "react-router-dom";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getFeatureById } from "@/config/featureAccess";
import { usePremiumModalStore } from "@/store/premiumStore";
import { useTranslation } from "react-i18next";

const mainNavIds = ["dashboard", "market", "crops", "resources"];
const moreNavIds = ["irrigation", "asha", "climate", "harvest", "finance", "marketplace", "community"];

export function BottomNav() {
  const location = useLocation();
  const { open } = usePremiumModalStore();
  const { t } = useTranslation();
  const mainNavItems = mainNavIds
    .map((id) => getFeatureById(id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const moreNavItems = moreNavIds
    .map((id) => getFeatureById(id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const isMoreActive = moreNavItems.some((item) => location.pathname === item.route);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden animate-slide-in-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {mainNavItems.map((item) => {
          if (item.tier === "premium") {
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => open({ route: item.route, featureId: item.id })}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all duration-200",
                  "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="p-1.5 rounded-lg transition-all duration-200">
                  <item.icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-medium">{t(item.labelKey)}</span>
              </button>
            );
          }

          return (
            <NavLink
              key={item.id}
              to={item.route}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all duration-200",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={cn(
                      "p-1.5 rounded-lg transition-all duration-200",
                      isActive && "bg-primary/10"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-medium">{t(item.labelKey)}</span>
                </>
              )}
            </NavLink>
          );
        })}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all duration-200",
                isMoreActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-lg transition-all duration-200",
                isMoreActive && "bg-primary/10"
              )}>
                <MoreHorizontal className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-medium">{t("nav.more")}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 mb-2">
            {moreNavItems.map((item) => {
              if (item.tier === "premium") {
                return (
                  <DropdownMenuItem
                    key={item.id}
                    onSelect={(event) => {
                      event.preventDefault();
                      open({ route: item.route, featureId: item.id });
                    }}
                    className="flex items-center gap-3 w-full cursor-pointer"
                  >
                    <item.icon className="h-4 w-4" />
                    {t(item.labelKey)}
                  </DropdownMenuItem>
                );
              }

              return (
                <DropdownMenuItem key={item.id} asChild>
                  <NavLink
                    to={item.route}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 w-full cursor-pointer",
                        isActive && "text-primary font-medium"
                      )
                    }
                  >
                    <item.icon className="h-4 w-4" />
                    {t(item.labelKey)}
                  </NavLink>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
