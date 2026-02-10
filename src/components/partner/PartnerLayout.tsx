import { NavLink, Outlet } from "react-router-dom";
import { BarChart3, FileSpreadsheet, Handshake, LayoutDashboard } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";

const items = [
  { to: "/partner", label: "Overview", icon: LayoutDashboard },
  { to: "/partner/sponsorships", label: "Sponsorships", icon: Handshake },
  { to: "/partner/impact", label: "Impact", icon: BarChart3 },
  { to: "/partner/reports", label: "Reports", icon: FileSpreadsheet },
];

export function PartnerLayout() {
  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Partner Portal" subtitle="Sponsorship operations and aggregate reporting." />
      <div className="app-page-shell py-6">
        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          <nav className="flex gap-2 overflow-x-auto lg:flex-col">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/partner"}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                    isActive ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="space-y-4">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
