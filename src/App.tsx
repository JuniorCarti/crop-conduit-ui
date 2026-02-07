import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import Inbox from "./pages/Inbox";
import Chat from "./pages/Chat";
import NotFound from "./pages/NotFound";
import FarmerRegistration from "./pages/FarmerRegistration";
import RegistrationHub from "./pages/RegistrationHub";
import BuyerRegistration from "./pages/BuyerRegistration";
import OrgRegistration from "./pages/OrgRegistration";
import AccessSummary from "./pages/AccessSummary";
import SuperAdminPortal from "./pages/SuperAdminPortal";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import ClimatePage from "./pages/ClimatePage";
import Upgrade from "./pages/Upgrade";
import AshaVoice from "./pages/AshaVoice";
import ProfileRouter from "./pages/ProfileRouter";
import Join from "./pages/Join";
import AdminPortal from "./pages/AdminPortal";
import { OrgLayout } from "@/components/org/OrgLayout";
import OrgDashboard from "./pages/org/OrgDashboard";
import OrgProfile from "./pages/org/OrgProfile";
import OrgMembers from "./pages/org/OrgMembers";
import OrgMarketDashboard from "./pages/org/OrgMarketDashboard";
import OrgTraining from "./pages/org/OrgTraining";
import OrgContracts from "./pages/org/OrgContracts";
import OrgTraceability from "./pages/org/OrgTraceability";
import OrgCredit from "./pages/org/OrgCredit";
import OrgLoans from "./pages/org/OrgLoans";
import OrgRiskAlerts from "./pages/org/OrgRiskAlerts";
import OrgSubscription from "./pages/org/OrgSubscription";
import OrgVerification from "./pages/org/OrgVerification";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { OrgTypeGuard } from "@/components/auth/OrgTypeGuard";
import { OrgFeatureGuard } from "@/components/auth/OrgFeatureGuard";
import { OrgApprovalGuard } from "@/components/auth/OrgApprovalGuard";
import OrgAggregation from "./pages/org/OrgAggregation";
import OrgPrices from "./pages/org/OrgPrices";
import OrgBilling from "./pages/org/OrgBilling";
import OrgTargetsRewards from "./pages/org/OrgTargetsRewards";
import OrgCertificates from "./pages/org/OrgCertificates";
import OrgUnderReview from "./pages/org/OrgUnderReview";
import OrgStaff from "./pages/org/OrgStaff";
import Cooperatives from "./pages/Cooperatives";

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
            <Route
              path="/farmer-registration"
              element={
                <RoleGuard allowed={["farmer", "admin", "unassigned"]} redirectTo="/registration">
                  <FarmerRegistration />
                </RoleGuard>
              }
            />
            <Route path="/registration" element={<RegistrationHub />} />
            <Route
              path="/buyer-registration"
              element={
                <RoleGuard allowed={["buyer", "admin", "unassigned"]} redirectTo="/registration">
                  <BuyerRegistration />
                </RoleGuard>
              }
            />
            <Route
              path="/org-registration"
              element={
                <RoleGuard allowed={["org_admin", "admin", "unassigned"]} redirectTo="/registration">
                  <OrgRegistration />
                </RoleGuard>
              }
            />
            <Route element={<PublicRoute><Signup /></PublicRoute>} path="/signup" />
            <Route element={<PublicRoute><Login /></PublicRoute>} path="/login" />
            <Route element={<PublicRoute><ResetPassword /></PublicRoute>} path="/reset-password" />
            <Route path="/join/:code" element={<Join />} />

            {/* Protected Main App Routes */}
            <Route element={<ProtectedRoute />}>
              <Route
                path="/org"
                element={
                  <RoleGuard allowed={["org_admin", "org_staff", "admin"]} redirectTo="/marketplace">
                    <OrgLayout />
                  </RoleGuard>
                }
              >
                <Route
                  index
                  element={
                    <OrgApprovalGuard>
                      <OrgTypeGuard allowed={["cooperative"]}>
                        <OrgDashboard />
                      </OrgTypeGuard>
                    </OrgApprovalGuard>
                  }
                />
                <Route
                  path="profile"
                  element={
                    <OrgApprovalGuard>
                      <OrgProfile />
                    </OrgApprovalGuard>
                  }
                />
                <Route
                  path="members"
                  element={
                    <OrgApprovalGuard>
                      <OrgTypeGuard allowed={["cooperative"]}>
                        <OrgMembers />
                      </OrgTypeGuard>
                    </OrgApprovalGuard>
                  }
                />
                <Route
                  path="staff"
                  element={
                    <OrgApprovalGuard>
                      <OrgTypeGuard allowed={["cooperative"]}>
                        <OrgStaff />
                      </OrgTypeGuard>
                    </OrgApprovalGuard>
                  }
                />
                <Route
                  path="aggregation"
                  element={
                    <OrgApprovalGuard>
                      <OrgTypeGuard allowed={["cooperative"]}>
                        <OrgFeatureGuard feature="harvestPlanner">
                          <OrgAggregation />
                        </OrgFeatureGuard>
                      </OrgTypeGuard>
                    </OrgApprovalGuard>
                  }
                />
                <Route
                  path="aggregation/new"
                  element={
                    <OrgApprovalGuard>
                      <OrgTypeGuard allowed={["cooperative"]}>
                        <OrgFeatureGuard feature="harvestPlanner">
                          <OrgAggregation />
                        </OrgFeatureGuard>
                      </OrgTypeGuard>
                    </OrgApprovalGuard>
                  }
                />
                <Route
                  path="group-prices"
                  element={
                    <OrgApprovalGuard>
                      <OrgTypeGuard allowed={["cooperative"]}>
                        <OrgFeatureGuard feature="groupPrices">
                          <OrgPrices />
                        </OrgFeatureGuard>
                      </OrgTypeGuard>
                    </OrgApprovalGuard>
                  }
                />
                <Route path="prices" element={<Navigate to="/org/group-prices" replace />} />
                <Route
                  path="training"
                  element={
                    <OrgApprovalGuard>
                      <OrgTypeGuard allowed={["cooperative"]}>
                        <OrgFeatureGuard feature="training">
                          <OrgTraining />
                        </OrgFeatureGuard>
                      </OrgTypeGuard>
                    </OrgApprovalGuard>
                  }
                />
                <Route
                  path="certificates"
                  element={
                    <OrgApprovalGuard>
                      <OrgTypeGuard allowed={["cooperative"]}>
                        <OrgFeatureGuard feature="certificates">
                          <OrgCertificates />
                        </OrgFeatureGuard>
                      </OrgTypeGuard>
                    </OrgApprovalGuard>
                  }
                />
                <Route
                  path="targets"
                  element={
                    <OrgApprovalGuard>
                      <OrgTypeGuard allowed={["cooperative"]}>
                        <OrgFeatureGuard feature="targetsRewards">
                          <OrgTargetsRewards />
                        </OrgFeatureGuard>
                      </OrgTypeGuard>
                    </OrgApprovalGuard>
                  }
                />
                <Route
                  path="billing"
                  element={
                    <OrgApprovalGuard>
                      <OrgTypeGuard allowed={["cooperative"]}>
                        <OrgBilling />
                      </OrgTypeGuard>
                    </OrgApprovalGuard>
                  }
                />
                <Route path="market-dashboard" element={<OrgApprovalGuard><OrgMarketDashboard /></OrgApprovalGuard>} />
                <Route path="contracts" element={<OrgApprovalGuard><OrgContracts /></OrgApprovalGuard>} />
                <Route path="traceability" element={<OrgApprovalGuard><OrgTraceability /></OrgApprovalGuard>} />
                <Route path="credit" element={<OrgApprovalGuard><OrgCredit /></OrgApprovalGuard>} />
                <Route path="loans" element={<OrgApprovalGuard><OrgLoans /></OrgApprovalGuard>} />
                <Route path="risk-alerts" element={<OrgApprovalGuard><OrgRiskAlerts /></OrgApprovalGuard>} />
                <Route path="subscription" element={<OrgApprovalGuard><OrgSubscription /></OrgApprovalGuard>} />
                <Route path="verification" element={<OrgApprovalGuard><OrgVerification /></OrgApprovalGuard>} />
              </Route>
              <Route
                path="/org/under-review"
                element={
                  <RoleGuard allowed={["org_admin", "org_staff", "admin"]} redirectTo="/marketplace">
                    <OrgUnderReview />
                  </RoleGuard>
                }
              />
              <Route element={<AppLayout />}>
                <Route
                  path="/access-summary"
                  element={
                    <RoleGuard
                      allowed={[
                        "farmer",
                        "buyer",
                        "org_admin",
                        "org_staff",
                        "admin",
                        "superadmin",
                        "unassigned",
                      ]}
                      redirectTo="/profile"
                    >
                      <AccessSummary />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/"
                  element={
                    <RoleGuard allowed={["farmer", "admin"]} redirectTo="/registration">
                      <Index />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/market"
                  element={
                    <RoleGuard allowed={["farmer", "admin"]} redirectTo="/marketplace">
                      <Market />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/crops"
                  element={
                    <RoleGuard allowed={["farmer", "admin"]} redirectTo="/marketplace">
                      <PremiumRouteGuard featureId="crops">
                        <Crops />
                      </PremiumRouteGuard>
                    </RoleGuard>
                  }
                />
                <Route
                  path="/resources"
                  element={
                    <RoleGuard allowed={["farmer", "admin"]} redirectTo="/marketplace">
                      <PremiumRouteGuard featureId="resources">
                        <Resources />
                      </PremiumRouteGuard>
                    </RoleGuard>
                  }
                />
                <Route
                  path="/irrigation"
                  element={
                    <RoleGuard allowed={["farmer", "admin"]} redirectTo="/marketplace">
                      <PremiumRouteGuard featureId="irrigation">
                        <Irrigation />
                      </PremiumRouteGuard>
                    </RoleGuard>
                  }
                />
                <Route
                  path="/harvest"
                  element={
                    <RoleGuard allowed={["farmer", "admin"]} redirectTo="/marketplace">
                      <Harvest />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/finance"
                  element={
                    <RoleGuard allowed={["farmer", "admin"]} redirectTo="/marketplace">
                      <PremiumRouteGuard featureId="finance">
                        <Finance />
                      </PremiumRouteGuard>
                    </RoleGuard>
                  }
                />
                <Route
                  path="/marketplace"
                  element={
                    <RoleGuard allowed={["buyer", "farmer", "admin"]} redirectTo="/registration">
                      <PremiumRouteGuard featureId="marketplace">
                        <MarketplaceEnhanced />
                      </PremiumRouteGuard>
                    </RoleGuard>
                  }
                />
                <Route
                  path="/cooperatives"
                  element={
                    <RoleGuard allowed={["farmer", "admin"]} redirectTo="/marketplace">
                      <Cooperatives />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/marketplace/listings/:id"
                  element={
                    <RoleGuard allowed={["buyer", "farmer", "admin"]} redirectTo="/registration">
                      <PremiumRouteGuard featureId="marketplace">
                        <ListingDetails />
                      </PremiumRouteGuard>
                    </RoleGuard>
                  }
                />
                <Route
                  path="/checkout"
                  element={
                    <RoleGuard allowed={["buyer", "farmer", "admin"]} redirectTo="/registration">
                      <PremiumRouteGuard featureId="marketplace">
                        <Checkout />
                      </PremiumRouteGuard>
                    </RoleGuard>
                  }
                />
                <Route
                  path="/market-prices"
                  element={
                    <RoleGuard allowed={["farmer", "admin"]} redirectTo="/marketplace">
                      <MarketPrices />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/community"
                  element={
                    <RoleGuard allowed={["farmer", "buyer", "admin"]} redirectTo="/marketplace">
                      <PremiumRouteGuard featureId="community">
                        <Community />
                      </PremiumRouteGuard>
                    </RoleGuard>
                  }
                />
                <Route
                  path="/community/inbox"
                  element={
                    <RoleGuard allowed={["farmer", "buyer", "admin"]} redirectTo="/marketplace">
                      <PremiumRouteGuard featureId="community">
                        <Inbox />
                      </PremiumRouteGuard>
                    </RoleGuard>
                  }
                />
                <Route
                  path="/community/chat/:conversationId"
                  element={
                    <RoleGuard allowed={["farmer", "buyer", "admin"]} redirectTo="/marketplace">
                      <PremiumRouteGuard featureId="community">
                        <Chat />
                      </PremiumRouteGuard>
                    </RoleGuard>
                  }
                />
                <Route
                  path="/climate"
                  element={
                    <RoleGuard allowed={["farmer", "admin"]} redirectTo="/marketplace">
                      <ClimatePage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/asha"
                  element={
                    <RoleGuard allowed={["farmer", "admin"]} redirectTo="/marketplace">
                      <AshaVoice />
                    </RoleGuard>
                  }
                />
                <Route path="/profile" element={<ProfileRouter />} />
                <Route path="/upgrade" element={<Upgrade />} />
              </Route>
              <Route
                path="/admin"
                element={
                  <RoleGuard allowed={["admin"]} redirectTo="/marketplace">
                    <AdminPortal />
                  </RoleGuard>
                }
              />
              <Route
                path="/superadmin"
                element={
                  <RoleGuard allowed={["superadmin"]} redirectTo="/profile">
                    <SuperAdminPortal />
                  </RoleGuard>
                }
              />
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
