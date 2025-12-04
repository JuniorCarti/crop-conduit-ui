import { NavLink, useLocation } from "react-router-dom";
import { 
  Home, 
  TrendingUp, 
  Leaf, 
  Package, 
  Truck, 
  Wallet, 
  Store, 
  Users,
  MoreHorizontal 
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const mainNavItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/market", icon: TrendingUp, label: "Market" },
  { to: "/crops", icon: Leaf, label: "Crops" },
  { to: "/resources", icon: Package, label: "Resources" },
];

const moreNavItems = [
  { to: "/harvest", icon: Truck, label: "Harvest" },
  { to: "/finance", icon: Wallet, label: "Finance" },
  { to: "/marketplace", icon: Store, label: "Marketplace" },
  { to: "/community", icon: Users, label: "Community" },
];

export function BottomNav() {
  const location = useLocation();
  const isMoreActive = moreNavItems.some(item => location.pathname === item.to);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden animate-slide-in-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {mainNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
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
                <div className={cn(
                  "p-1.5 rounded-lg transition-all duration-200",
                  isActive && "bg-primary/10"
                )}>
                  <item.icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
        
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
              <span className="text-[10px] font-medium">More</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 mb-2">
            {moreNavItems.map((item) => (
              <DropdownMenuItem key={item.to} asChild>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 w-full cursor-pointer",
                      isActive && "text-primary font-medium"
                    )
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
