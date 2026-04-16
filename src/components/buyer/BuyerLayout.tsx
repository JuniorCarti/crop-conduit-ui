import { NavLink, useNavigate } from "react-router-dom";
import {
  LogOut,
  User,
  Store,
  LayoutDashboard,
  CreditCard,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  FileCheck,
  Zap,
  Package,
  Users2,
  ShoppingCart,
  CheckSquare,
  DollarSign,
  TrendingDown,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { AgriSmartLogo } from "@/components/Brand/AgriSmartLogo";

export function BuyerLayout() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    main: true,
    portal: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      // Error already handled in AuthContext
    }
  };

  const mainNav = [
    { route: "/buyer/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { route: "/marketplace", label: "Marketplace", icon: Store },
    { route: "/buyer/trade", label: "Trade & Exchange", icon: ShoppingCart },
    { route: "/buyer/profile", label: "Profile", icon: User },
    { route: "/buyer/billing", label: "Billing", icon: CreditCard },
  ];

  const portalFeatures = [
    { route: "/buyer/analytics", label: "Analytics", icon: TrendingUp },
    { route: "/buyer/reports", label: "Reports", icon: FileCheck },
    { route: "/buyer/demand-planning", label: "Demand Planning", icon: Zap },
    { route: "/buyer/logistics", label: "Logistics", icon: Package },
    { route: "/buyer/suppliers", label: "Suppliers", icon: Users2 },
    { route: "/buyer/purchase-orders", label: "Purchase Orders", icon: ShoppingCart },
    { route: "/buyer/quality", label: "Quality", icon: CheckSquare },
    { route: "/buyer/financial", label: "Financial", icon: DollarSign },
    { route: "/buyer/market-intelligence", label: "Market Intel", icon: TrendingDown },
    { route: "/buyer/collaboration", label: "Collaboration", icon: MessageSquare },
  ];

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 flex-col bg-sidebar border-r border-sidebar-border z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
        <AgriSmartLogo variant="stacked" size="md" showTagline />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <div className="space-y-1">
          {/* Main Navigation */}
          <div className="mb-2">
            <button
              onClick={() => toggleSection("main")}
              className="flex items-center gap-2 px-3 py-2 w-full text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors"
            >
              {expandedSections.main ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              Main
            </button>
            {expandedSections.main && (
              <div className="space-y-1 mt-1">
                {mainNav.map((item) => (
                  <NavLink
                    key={item.route}
                    to={item.route}
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
                        <item.icon className="h-5 w-5" />
                        <p className="text-sm font-medium truncate">{item.label}</p>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            )}
          </div>

          {/* Portal Features */}
          <div className="mb-2">
            <button
              onClick={() => toggleSection("portal")}
              className="flex items-center gap-2 px-3 py-2 w-full text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors"
            >
              {expandedSections.portal ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              Portal Features
            </button>
            {expandedSections.portal && (
              <div className="space-y-1 mt-1">
                {portalFeatures.map((item) => (
                  <NavLink
                    key={item.route}
                    to={item.route}
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
                        <item.icon className="h-5 w-5" />
                        <p className="text-sm font-medium truncate">{item.label}</p>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* User Profile & Logout */}
      <div className="p-4 border-t border-border">
        <button
          type="button"
          onClick={() => navigate("/buyer/profile")}
          className="flex w-full items-center gap-3 rounded-lg px-2 py-2 mb-3 text-left transition-colors hover:bg-secondary/60"
        >
          <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center">
            <span className="text-sm font-semibold text-foreground">
              {currentUser?.displayName?.charAt(0).toUpperCase() ||
                currentUser?.email?.charAt(0).toUpperCase() ||
                "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {currentUser?.displayName || currentUser?.email?.split("@")[0] || "User"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {currentUser?.email || "No email"}
            </p>
          </div>
        </button>
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
