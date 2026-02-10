import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  BellRing,
  Building2,
  ChartColumn,
  FileSpreadsheet,
  Leaf,
  LineChart,
  ShieldAlert,
  Store,
  Tractor,
  Wrench,
} from "lucide-react";
import { useMemo } from "react";
import { PageHeader } from "@/components/layout/PageHeader";

const navItems = [
  { to: "/gov/overview", label: "Overview", icon: Building2 },
  { to: "/gov/national-stats", label: "National Stats", icon: ChartColumn },
  { to: "/gov/markets", label: "Markets", icon: Store },
  { to: "/gov/climate", label: "Climate & Risk", icon: ShieldAlert },
  { to: "/gov/food-security", label: "Food Security", icon: Leaf },
  { to: "/gov/cooperatives", label: "Cooperatives", icon: Tractor },
  { to: "/gov/value-chains", label: "Value Chains", icon: LineChart },
  { to: "/gov/reports", label: "Reports", icon: FileSpreadsheet },
  { to: "/gov/alerts", label: "Alerts", icon: BellRing },
  { to: "/gov/settings", label: "Settings", icon: Wrench },
];

const routeTitles: Record<string, string> = {
  "/gov/overview": "Overview",
  "/gov/national-stats": "National Statistics",
  "/gov/markets": "Markets Intelligence",
  "/gov/climate": "Climate & Risk",
  "/gov/food-security": "Food Security",
  "/gov/cooperatives": "Cooperatives Directory",
  "/gov/value-chains": "Value Chains",
  "/gov/reports": "Reports",
  "/gov/alerts": "Alerts & Notices",
  "/gov/settings": "Settings",
};

export function GovLayout() {
  const location = useLocation();
  const activeTitle = useMemo(() => routeTitles[location.pathname] ?? "Government Portal", [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title={activeTitle}
        subtitle="Government Portal"
      />
      <div className="app-page-shell py-6">
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <nav className="flex gap-2 overflow-x-auto lg:flex-col">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-lg px-3 py-2 text-sm whitespace-nowrap ${
                    isActive ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="space-y-4 min-w-0">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
