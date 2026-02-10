import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { PremiumModal } from "@/components/premium/PremiumModal";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="bg-background pb-20 md:ml-64 md:pb-0">
        <div className="app-page-shell">
          <Outlet />
        </div>
      </main>
      <PremiumModal />
      <BottomNav />
    </div>
  );
}
