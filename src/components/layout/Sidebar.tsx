import { NavLink, useNavigate } from "react-router-dom";
import { Lock, LogOut, Sprout } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FEATURES } from "@/config/featureAccess";
import { usePremiumModalStore } from "@/store/premiumStore";
import { useTranslation } from "react-i18next";

export function Sidebar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { open } = usePremiumModalStore();
  const freeFeatures = FEATURES.filter((feature) => feature.tier === "free");
  const premiumFeatures = FEATURES.filter((feature) => feature.tier === "premium");

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      // Error already handled in AuthContext
    }
  };

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 flex-col bg-card border-r border-border z-40">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
        <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
          <Sprout className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">{t("common.appName")}</h1>
          <p className="text-xs text-muted-foreground">{t("common.appTagline")}</p>
        </div>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <div className="space-y-1">
          {freeFeatures.map((item) => (
            <NavLink
              key={item.id}
              to={item.route}
              end={item.route === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={cn(
                      "h-5 w-5 transition-transform duration-200",
                      !isActive && "group-hover:scale-110"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t(item.labelKey)}</p>
                    <p
                      className={cn(
                        "text-[10px] truncate transition-colors",
                        isActive ? "text-primary-foreground/70" : "text-muted-foreground"
                      )}
                    >
                      {t(item.navDescriptionKey)}
                    </p>
                  </div>
                </>
              )}
            </NavLink>
          ))}
          <div className="pt-3">
            <p className="px-3 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/80">
              {t("premium.sectionLabel")}
            </p>
          </div>
          {premiumFeatures.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => open({ featureId: item.id, route: item.route })}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group w-full text-left",
                "text-muted-foreground/70 hover:bg-secondary/60",
                "cursor-not-allowed"
              )}
              aria-disabled
            >
              <item.icon className="h-5 w-5 opacity-70" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{t(item.labelKey)}</p>
                  <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                    {t("premium.badge")}
                  </Badge>
                </div>
                <p className="text-[10px] truncate text-muted-foreground/80">
                  {t(item.navDescriptionKey)}
                </p>
              </div>
              <Lock className="h-4 w-4 opacity-70" />
            </button>
          ))}
        </div>
      </nav>
      
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center">
            <span className="text-sm font-semibold text-foreground">
              {currentUser?.displayName?.charAt(0).toUpperCase() || currentUser?.email?.charAt(0).toUpperCase() || "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {currentUser?.displayName || currentUser?.email?.split("@")[0] || t("common.user")}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {currentUser?.email || t("common.noEmail")}
            </p>
          </div>
        </div>
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          {t("nav.logout")}
        </Button>
      </div>
    </aside>
  );
}
