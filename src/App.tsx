import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PublicRoute } from "@/components/auth/PublicRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { PremiumRouteGuard } from "@/components/premium/PremiumRouteGuard";
import Index from "./pages/Index";
import Market from "./pages/Market";
import Crops from "./pages/Crops";
import Resources from "./pages/Resources";
import Irrigation from "./pages/Irrigation";
import Harvest from "./pages/Harvest";
import Finance from "./pages/Finance";
import MarketplaceEnhanced from "./pages/MarketplaceEnhanced";
import ListingDetails from "./pages/ListingDetails";
import Checkout from "./pages/Checkout";
import MarketPrices from "./pages/MarketPrices";
import Community from "./pages/Community";
import NotFound from "./pages/NotFound";
import FarmerRegistration from "./pages/FarmerRegistration";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import ClimatePage from "./pages/ClimatePage";
import Upgrade from "./pages/Upgrade";
import AshaVoice from "./pages/AshaVoice";
import FarmerProfile from "./pages/FarmerProfile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
            {/* Public Auth Routes */}
            <Route path="/farmer-registration" element={<FarmerRegistration />} />
            <Route element={<PublicRoute><Signup /></PublicRoute>} path="/signup" />
            <Route element={<PublicRoute><Login /></PublicRoute>} path="/login" />
            <Route element={<PublicRoute><ResetPassword /></PublicRoute>} path="/reset-password" />

            {/* Protected Main App Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Index />} />
                <Route path="/market" element={<Market />} />
                <Route
                  path="/crops"
                  element={
                    <PremiumRouteGuard featureId="crops">
                      <Crops />
                    </PremiumRouteGuard>
                  }
                />
                <Route
                  path="/resources"
                  element={
                    <PremiumRouteGuard featureId="resources">
                      <Resources />
                    </PremiumRouteGuard>
                  }
                />
                <Route
                  path="/irrigation"
                  element={
                    <PremiumRouteGuard featureId="irrigation">
                      <Irrigation />
                    </PremiumRouteGuard>
                  }
                />
                <Route path="/harvest" element={<Harvest />} />
                <Route
                  path="/finance"
                  element={
                    <PremiumRouteGuard featureId="finance">
                      <Finance />
                    </PremiumRouteGuard>
                  }
                />
                <Route
                  path="/marketplace"
                  element={
                    <PremiumRouteGuard featureId="marketplace">
                      <MarketplaceEnhanced />
                    </PremiumRouteGuard>
                  }
                />
                <Route
                  path="/marketplace/listings/:id"
                  element={
                    <PremiumRouteGuard featureId="marketplace">
                      <ListingDetails />
                    </PremiumRouteGuard>
                  }
                />
                <Route
                  path="/checkout"
                  element={
                    <PremiumRouteGuard featureId="marketplace">
                      <Checkout />
                    </PremiumRouteGuard>
                  }
                />
                <Route path="/market-prices" element={<MarketPrices />} />
                <Route
                  path="/community"
                  element={
                    <PremiumRouteGuard featureId="community">
                      <Community />
                    </PremiumRouteGuard>
                  }
                />
                <Route path="/climate" element={<ClimatePage />} />
                <Route path="/asha" element={<AshaVoice />} />
                <Route path="/profile" element={<FarmerProfile />} />
                <Route path="/upgrade" element={<Upgrade />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
