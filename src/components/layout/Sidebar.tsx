import { NavLink, useNavigate } from "react-router-dom";
import { 
  Home, 
  TrendingUp, 
  Leaf, 
  Package, 
  Droplets,
  Truck, 
  Wallet, 
  Store, 
  Users,
  Sprout,
  User,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/", icon: Home, label: "Dashboard", description: "Overview" },
  { to: "/market", icon: TrendingUp, label: "Market", description: "Oracle Agent" },
  { to: "/crops", icon: Leaf, label: "Crops", description: "Sentinel Agent" },
  { to: "/resources", icon: Package, label: "Resources", description: "Quartermaster" },
  { to: "/irrigation", icon: Droplets, label: "Irrigation", description: "Scheduler" },
  { to: "/harvest", icon: Truck, label: "Harvest", description: "Foreman Agent" },
  { to: "/finance", icon: Wallet, label: "Finance", description: "Chancellor" },
  { to: "/marketplace", icon: Store, label: "Marketplace", description: "Buy & Sell" },
  { to: "/community", icon: Users, label: "Community", description: "Connect" },
];

export function Sidebar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

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
          <h1 className="text-lg font-bold text-foreground">AgriSmart</h1>
          <p className="text-xs text-muted-foreground">Farm Intelligence</p>
        </div>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <div className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
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
                  <item.icon className={cn(
                    "h-5 w-5 transition-transform duration-200",
                    !isActive && "group-hover:scale-110"
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.label}</p>
                    <p className={cn(
                      "text-[10px] truncate transition-colors",
                      isActive ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}>
                      {item.description}
                    </p>
                  </div>
                </>
              )}
            </NavLink>
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
              {currentUser?.displayName || currentUser?.email?.split("@")[0] || "User"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {currentUser?.email || "No email"}
            </p>
          </div>
        </div>
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
