import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PublicRoute } from "@/components/auth/PublicRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Market from "./pages/Market";
import Crops from "./pages/Crops";
import Resources from "./pages/Resources";
import Irrigation from "./pages/Irrigation";
import Harvest from "./pages/Harvest";
import Finance from "./pages/Finance";
import Marketplace from "./pages/Marketplace";
import Community from "./pages/Community";
import NotFound from "./pages/NotFound";
import FarmerRegistration from "./pages/FarmerRegistration";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Auth Routes */}
            <Route element={<PublicRoute><FarmerRegistration /></PublicRoute>} path="/farmer-registration" />
            <Route element={<PublicRoute><Signup /></PublicRoute>} path="/signup" />
            <Route element={<PublicRoute><Login /></PublicRoute>} path="/login" />
            <Route element={<PublicRoute><ResetPassword /></PublicRoute>} path="/reset-password" />
            
            {/* Protected Main App Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Index />} />
                <Route path="/market" element={<Market />} />
                <Route path="/crops" element={<Crops />} />
                <Route path="/resources" element={<Resources />} />
                <Route path="/irrigation" element={<Irrigation />} />
                <Route path="/harvest" element={<Harvest />} />
                <Route path="/finance" element={<Finance />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/community" element={<Community />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
