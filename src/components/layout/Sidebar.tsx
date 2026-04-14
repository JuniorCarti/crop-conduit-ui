import { NavLink, useNavigate } from "react-router-dom";
import {
  Lock,
  LogOut,
  User,
  Building2,
  Users,
  FileText,
  Store,
  ShoppingCart,
  ClipboardList,
  BarChart3,
  GraduationCap,
  Trophy,
  Award,
  Gavel,
  LayoutDashboard,
  CreditCard,
  Truck,
  MapPin,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FEATURES } from "@/config/featureAccess";
import { usePremiumModalStore } from "@/store/premiumStore";
import { useTranslation } from "react-i18next";
import { useUserRole } from "@/hooks/useUserRole";
import { useOrgType } from "@/hooks/useOrgType";
import { hasOrgCapability } from "@/config/orgCapabilities";
import { AgriSmartLogo } from "@/components/Brand/AgriSmartLogo";
import { BUYER_TRADE_ENABLED } from "@/services/buyerTradeService";
import { BUYER_BILLING_ENABLED, BUYER_DASHBOARD_ENABLED } from "@/config/buyerFeatures";
import { useState } from "react";

export function Sidebar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { open } = usePremiumModalStore();
  const { role } = useUserRole();
  const { orgType } = useOrgType();
  const profileRoute = role === "buyer" ? "/buyer/profile" : "/profile";

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    core: true,
    marketplace: true,
    premium: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const farmerNav = FEATURES.filter((feature) =>
    ["dashboard", "market", "climate", "asha", "harvest", "community"].includes(feature.id)
  );
  const farmerFreeNav = farmerNav.filter((feature) => feature.tier === "free");
  const farmerPremiumNav = farmerNav.filter((feature) => feature.tier === "premium");

  const roleNav = () => {
    if (role === "buyer") {
      const items = [
        BUYER_DASHBOARD_ENABLED ? { route: "/buyer/dashboard", label: "Dashboard", icon: LayoutDashboard } : null,
        { route: "/marketplace", label: "Marketplace", icon: Store },
        BUYER_TRADE_ENABLED ? { route: "/buyer/trade", label: "Trade & Exchange", icon: BarChart3 } : null,
        { route: "/buyer/profile", label: "Profile", icon: User },
        BUYER_BILLING_ENABLED ? { route: "/buyer/billing", label: "Billing", icon: CreditCard } : null,
      ];
      return items.filter(Boolean) as Array<{ route: string; label: string; icon: typeof Store }>;
    }
    if (role === "org_admin" || role === "org_staff") {
      const items = [
        hasOrgCapability(orgType, "members") && { route: "/org", label: "Org Dashboard", icon: Building2 },
        hasOrgCapability(orgType, "members") && { route: "/org/members", label: "Members", icon: Users },
        hasOrgCapability(orgType, "aggregation") && { route: "/org/aggregation", label: "Aggregation", icon: ShoppingCart },
        hasOrgCapability(orgType, "prices") && { route: "/org/group-prices", label: "Group Prices", icon: BarChart3 },
        hasOrgCapability(orgType, "training") && { route: "/org/training", label: "Training", icon: GraduationCap },
        hasOrgCapability(orgType, "certificates") && { route: "/org/certificates", label: "Certificates", icon: Award },
        hasOrgCapability(orgType, "targets") && { route: "/org/targets", label: "Targets & Rewards", icon: Trophy },
        hasOrgCapability(orgType, "billing") && { route: "/org/billing", label: "Billing", icon: FileText },
        { route: "/transport-marketplace", label: "Transport", icon: Truck },
      ].filter(Boolean) as Array<{ route: string; label: string; icon: typeof Building2 }>;
      return items.length ? items : [{ route: "/org", label: "Org Portal", icon: Building2 }];
    }
    if (role === "transport_admin" || role === "transport_staff") {
      return [
        { route: "/transport", label: "Transport Portal", icon: Truck },
        { route: "/transport/driver", label: "Driver Updates", icon: MapPin },
      ];
    }
    if (role === "admin") {
      return [{ route: "/admin", label: "Admin", icon: ShoppingCart }];
    }
    if (role === "superadmin") {
      return [{ route: "/superadmin", label: "SuperAdmin", icon: ShoppingCart }];
    }
    if (role === "unassigned") {
      return [
        { route: "/registration", label: "Complete Registration", icon: ClipboardList },
      ];
    }
    return [];
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      // Error already handled in AuthContext
    }
  };

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 flex-col bg-sidebar border-r border-sidebar-border z-40">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
        <AgriSmartLogo variant="stacked" size="md" showTagline />
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <div className="space-y-1">
          {role === "farmer" && (
            <>
              {/* Core Features Section */}
              <div className="mb-2">
                <button
                  onClick={() => toggleSection("core")}
                  className="flex items-center gap-2 px-3 py-2 w-full text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors"
                >
                  {expandedSections.core ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                  Core Features
                </button>
                {expandedSections.core && (
                  <div className="space-y-1 mt-1">
                    {farmerFreeNav.map((item) => (
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
                  </div>
                )}
              </div>

              {/* Marketplace & Services Section */}
              <div className="mb-2">
                <button
                  onClick={() => toggleSection("marketplace")}
                  className="flex items-center gap-2 px-3 py-2 w-full text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors"
                >
                  {expandedSections.marketplace ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                  Marketplace & Services
                </button>
                {expandedSections.marketplace && (
                  <div className="space-y-1 mt-1">
                    <NavLink
                      to="/marketplace"
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
                          <Store
                            className={cn(
                              "h-5 w-5 transition-transform duration-200",
                              !isActive && "group-hover:scale-110"
                            )}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">Marketplace</p>
                          </div>
                        </>
                      )}
                    </NavLink>
                    <NavLink
                      to="/transport-marketplace"
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
                          <Truck
                            className={cn(
                              "h-5 w-5 transition-transform duration-200",
                              !isActive && "group-hover:scale-110"
                            )}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">Transport</p>
                          </div>
                        </>
                      )}
                    </NavLink>
                    <NavLink
                      to="/cooperatives"
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
                          <Users
                            className={cn(
                              "h-5 w-5 transition-transform duration-200",
                              !isActive && "group-hover:scale-110"
                            )}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">Cooperatives</p>
                          </div>
                        </>
                      )}
                    </NavLink>
                    <NavLink
                      to="/farmer/bids"
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
                          <Gavel
                            className={cn(
                              "h-5 w-5 transition-transform duration-200",
                              !isActive && "group-hover:scale-110"
                            )}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">Bids & Results</p>
                          </div>
                        </>
                      )}
                    </NavLink>
                  </div>
                )}
              </div>

              {/* Premium Features Section */}
              {farmerPremiumNav.length > 0 && (
                <div className="mb-2">
                  <button
                    onClick={() => toggleSection("premium")}
                    className="flex items-center gap-2 px-3 py-2 w-full text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {expandedSections.premium ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                    {t("premium.sectionLabel")}
                  </button>
                  {expandedSections.premium && (
                    <div className="space-y-1 mt-1">
                      {farmerPremiumNav.map((item) => (
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
                  )}
                </div>
              )}

              <div className="border-t border-border my-2" />

              {/* Profile */}
              <NavLink
                to={profileRoute}
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
                    <User
                      className={cn(
                        "h-5 w-5 transition-transform duration-200",
                        !isActive && "group-hover:scale-110"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{t("nav.profile")}</p>
                      <p
                        className={cn(
                          "text-[10px] truncate transition-colors",
                          isActive ? "text-primary-foreground/70" : "text-muted-foreground"
                        )}
                      >
                        {t("navDescriptions.profile")}
                      </p>
                    </div>
                  </>
                )}
              </NavLink>
            </>
          )}

          {role !== "farmer" &&
            roleNav().map((item) => (
              <NavLink
                key={item.route}
                to={item.route}
                end={item.route === "/org"}
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
                      <p className="text-sm font-medium truncate">{item.label}</p>
                    </div>
                  </>
                )}
              </NavLink>
            ))}
          {role === "buyer" && (
            <NavLink
              to={profileRoute}
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
                  <User
                    className={cn(
                      "h-5 w-5 transition-transform duration-200",
                      !isActive && "group-hover:scale-110"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t("nav.profile")}</p>
                  </div>
                </>
              )}
            </NavLink>
          )}
        </div>
      </nav>
      
      <div className="p-4 border-t border-border">
        <button
          type="button"
          onClick={() => navigate(profileRoute)}
          className="flex w-full items-center gap-3 rounded-lg px-2 py-2 mb-3 text-left transition-colors hover:bg-secondary/60"
        >
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
        </button>
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
