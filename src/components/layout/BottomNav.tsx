import { NavLink, useLocation } from "react-router-dom";
import {
  MoreHorizontal,
  Building2,
  Store,
  User,
  BarChart3,
  GraduationCap,
  FileText,
  Users,
  Trophy,
  Award,
  Gavel,
  LayoutDashboard,
  CreditCard,
} from "lucide-react";
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
import { useUserRole } from "@/hooks/useUserRole";
import { useOrgType } from "@/hooks/useOrgType";
import { hasOrgCapability } from "@/config/orgCapabilities";
import { BUYER_TRADE_ENABLED } from "@/services/buyerTradeService";
import { BUYER_BILLING_ENABLED, BUYER_DASHBOARD_ENABLED } from "@/config/buyerFeatures";

const farmerMainNavIds = ["dashboard", "market", "climate", "asha"];
const farmerMoreNavIds = ["harvest", "community"];

export function BottomNav() {
  const location = useLocation();
  const { open } = usePremiumModalStore();
  const { t } = useTranslation();
  const { role } = useUserRole();
  const { orgType } = useOrgType();
  const mainNavItems = farmerMainNavIds
    .map((id) => getFeatureById(id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const moreNavItems = farmerMoreNavIds
    .map((id) => getFeatureById(id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const isMoreActive = moreNavItems.some((item) => location.pathname === item.route)
    || (role === "farmer" && ["/marketplace", "/cooperatives"].includes(location.pathname));

  if (role === "buyer") {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden animate-slide-in-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {BUYER_DASHBOARD_ENABLED && (
            <NavLink
              to="/buyer/dashboard"
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all duration-200",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              <div className="p-1.5 rounded-lg">
                <LayoutDashboard className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-medium">Dashboard</span>
            </NavLink>
          )}
          <NavLink
            to="/marketplace"
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all duration-200",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )
            }
          >
            <div className="p-1.5 rounded-lg">
              <Store className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-medium">Marketplace</span>
          </NavLink>
          {BUYER_TRADE_ENABLED && (
            <NavLink
              to="/buyer/trade"
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all duration-200",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              <div className="p-1.5 rounded-lg">
                <BarChart3 className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-medium">Trade</span>
            </NavLink>
          )}
          <NavLink
            to="/buyer/profile"
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all duration-200",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )
            }
          >
            <div className="p-1.5 rounded-lg">
              <User className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-medium">Profile</span>
          </NavLink>
          {BUYER_BILLING_ENABLED && (
            <NavLink
              to="/buyer/billing"
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all duration-200",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              <div className="p-1.5 rounded-lg">
                <CreditCard className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-medium">Billing</span>
            </NavLink>
          )}
        </div>
      </nav>
    );
  }

  if (role === "org_admin" || role === "org_staff") {
    const orgItems = [
      hasOrgCapability(orgType, "members") && { to: "/org", label: "Org", icon: Building2 },
      hasOrgCapability(orgType, "members") && { to: "/org/members", label: "Members", icon: Users },
      hasOrgCapability(orgType, "prices") && { to: "/org/group-prices", label: "Prices", icon: BarChart3 },
      hasOrgCapability(orgType, "training") && { to: "/org/training", label: "Training", icon: GraduationCap },
      hasOrgCapability(orgType, "certificates") && { to: "/org/certificates", label: "Certs", icon: Award },
      hasOrgCapability(orgType, "targets") && { to: "/org/targets", label: "Targets", icon: Trophy },
      hasOrgCapability(orgType, "billing") && { to: "/org/billing", label: "Billing", icon: FileText },
    ].filter(Boolean) as Array<{ to: string; label: string; icon: typeof Building2 }>;
    const resolvedOrgItems = orgItems.length ? orgItems : [{ to: "/org", label: "Org", icon: Building2 }];

    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden animate-slide-in-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {resolvedOrgItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all duration-200",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              <div className="p-1.5 rounded-lg">
                <item.icon className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    );
  }

  if (role === "admin") {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden animate-slide-in-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all duration-200",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )
            }
          >
            <div className="p-1.5 rounded-lg">
              <Building2 className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-medium">Admin</span>
          </NavLink>
        </div>
      </nav>
    );
  }

  if (role === "superadmin") {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden animate-slide-in-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          <NavLink
            to="/superadmin"
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all duration-200",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )
            }
          >
            <div className="p-1.5 rounded-lg">
              <Building2 className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-medium">SuperAdmin</span>
          </NavLink>
        </div>
      </nav>
    );
  }

  if (role === "unassigned") {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden animate-slide-in-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          <NavLink
            to="/registration"
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all duration-200",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )
            }
          >
            <div className="p-1.5 rounded-lg">
              <MoreHorizontal className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-medium">Register</span>
          </NavLink>
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all duration-200",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )
            }
          >
            <div className="p-1.5 rounded-lg">
              <User className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-medium">Profile</span>
          </NavLink>
        </div>
      </nav>
    );
  }

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
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className={cn("p-1.5 rounded-lg transition-all duration-200", isActive && "bg-primary/10")}>
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
                isMoreActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn("p-1.5 rounded-lg transition-all duration-200", isMoreActive && "bg-primary/10")}>
                <MoreHorizontal className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-medium">{t("nav.more")}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 mb-2">
            {role === "farmer" && (
              <>
                <DropdownMenuItem key="marketplace" asChild>
                  <NavLink
                    to="/marketplace"
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 w-full cursor-pointer",
                        isActive && "text-primary font-medium"
                      )
                    }
                  >
                    <Store className="h-4 w-4" />
                    Marketplace
                  </NavLink>
                </DropdownMenuItem>
                <DropdownMenuItem key="cooperatives" asChild>
                  <NavLink
                    to="/cooperatives"
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 w-full cursor-pointer",
                        isActive && "text-primary font-medium"
                      )
                    }
                  >
                    <Users className="h-4 w-4" />
                    Cooperatives
                  </NavLink>
                </DropdownMenuItem>
                <DropdownMenuItem key="farmer-bids" asChild>
                  <NavLink
                    to="/farmer/bids"
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 w-full cursor-pointer",
                        isActive && "text-primary font-medium"
                      )
                    }
                  >
                    <Gavel className="h-4 w-4" />
                    Bids & Results
                  </NavLink>
                </DropdownMenuItem>
              </>
            )}
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
