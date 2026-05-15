import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PublicRoute } from "@/components/auth/PublicRoute";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { OrgTypeGuard } from "@/components/auth/OrgTypeGuard";
import { OrgFeatureGuard } from "@/components/auth/OrgFeatureGuard";
import { OrgApprovalGuard } from "@/components/auth/OrgApprovalGuard";
import { GovTypeGuard } from "@/components/auth/GovTypeGuard";
import { AppLayout } from "@/components/layout/AppLayout";
import { PremiumRouteGuard } from "@/components/premium/PremiumRouteGuard";
import { OrgLayout } from "@/components/org/OrgLayout";
import { BuyerLayout } from "@/components/buyer/BuyerLayout";
import { PartnerLayout } from "@/components/partner/PartnerLayout";
import { GovLayout } from "@/components/gov/GovLayout";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

// Lazy-loaded page imports
const Index = lazy(() => import("./pages/Index"));
const Market = lazy(() => import("./pages/Market"));
const Crops = lazy(() => import("./pages/Crops"));
const Resources = lazy(() => import("./pages/Resources"));
const Irrigation = lazy(() => import("./pages/Irrigation"));
const Harvest = lazy(() => import("./pages/Harvest"));
const Finance = lazy(() => import("./pages/Finance"));
const MarketplaceEnhanced = lazy(() => import("./pages/MarketplaceEnhanced"));
const ListingDetails = lazy(() => import("./pages/ListingDetails"));
const Checkout = lazy(() => import("./pages/Checkout"));
const MarketPrices = lazy(() => import("./pages/MarketPrices"));
const MarketPricesEnhanced = lazy(() => import("./pages/MarketPricesEnhanced"));
const Community = lazy(() => import("./pages/Community"));
const CommunityMemberProfile = lazy(() => import("./pages/CommunityMemberProfile"));
const Inbox = lazy(() => import("./pages/Inbox"));
const Chat = lazy(() => import("./pages/Chat"));
const NotFound = lazy(() => import("./pages/NotFound"));
const FarmerRegistration = lazy(() => import("./pages/FarmerRegistration"));
const RegistrationHub = lazy(() => import("./pages/RegistrationHub"));
const BuyerRegistration = lazy(() => import("./pages/BuyerRegistration"));
const OrgRegistration = lazy(() => import("./pages/OrgRegistration"));
const TransportRegistration = lazy(() => import("./pages/TransportRegistration"));
const AccessSummary = lazy(() => import("./pages/AccessSummary"));
const SuperAdminPortal = lazy(() => import("./pages/SuperAdminPortal"));
const Signup = lazy(() => import("./pages/Signup"));
const Login = lazy(() => import("./pages/Login"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Homepage = lazy(() => import("./pages/Homepage"));
const ClimatePage = lazy(() => import("./pages/ClimatePage"));
const Upgrade = lazy(() => import("./pages/Upgrade"));
const AshaVoice = lazy(() => import("./pages/AshaVoice"));
const ProfileRouter = lazy(() => import("./pages/ProfileRouter"));
const Join = lazy(() => import("./pages/Join"));
const AdminPortal = lazy(() => import("./pages/AdminPortal"));
const OrgDashboard = lazy(() => import("./pages/org/OrgDashboard"));
const OrgProfile = lazy(() => import("./pages/org/OrgProfile"));
const OrgMembers = lazy(() => import("./pages/org/OrgMembers"));
const OrgMarketDashboard = lazy(() => import("./pages/org/OrgMarketDashboard"));
const OrgTraining = lazy(() => import("./pages/org/OrgTraining"));
const OrgContracts = lazy(() => import("./pages/org/OrgContracts"));
const OrgTraceability = lazy(() => import("./pages/org/OrgTraceability"));
const OrgCredit = lazy(() => import("./pages/org/OrgCredit"));
const OrgLoans = lazy(() => import("./pages/org/OrgLoans"));
const OrgRiskAlerts = lazy(() => import("./pages/org/OrgRiskAlerts"));
const OrgSubscription = lazy(() => import("./pages/org/OrgSubscription"));
const OrgVerification = lazy(() => import("./pages/org/OrgVerification"));
const OrgAggregation = lazy(() => import("./pages/org/OrgAggregation"));
const OrgPrices = lazy(() => import("./pages/org/OrgPrices"));
const OrgBilling = lazy(() => import("./pages/org/OrgBilling"));
const OrgTargetsRewards = lazy(() => import("./pages/org/OrgTargetsRewards"));
const OrgCertificates = lazy(() => import("./pages/org/OrgCertificates"));
const OrgUnderReview = lazy(() => import("./pages/org/OrgUnderReview"));
const OrgStaff = lazy(() => import("./pages/org/OrgStaff"));
const Cooperatives = lazy(() => import("./pages/Cooperatives"));
const OrgSponsorships = lazy(() => import("./pages/org/OrgSponsorships"));
const OrgSalesBatches = lazy(() => import("./pages/org/OrgSalesBatches"));
const OrgRevenueModel = lazy(() => import("./pages/org/OrgRevenueModel"));
const OrgImpact = lazy(() => import("./pages/org/OrgImpact"));
const OrgReports = lazy(() => import("./pages/org/OrgReports"));
const TradePage = lazy(() => import("./pages/org/TradePage"));
const OrgInternationalMarketsPage = lazy(() => import("./pages/org/OrgInternationalMarketsPage"));
const PartnerOverview = lazy(() => import("./pages/partner/PartnerOverview"));
const PartnerSponsorships = lazy(() => import("./pages/partner/PartnerSponsorships"));
const PartnerImpact = lazy(() => import("./pages/partner/PartnerImpact"));
const PartnerReports = lazy(() => import("./pages/partner/PartnerReports"));
const GovOverview = lazy(() => import("./pages/gov/GovOverview"));
const GovNationalStats = lazy(() => import("./pages/gov/GovNationalStats"));
const GovMarkets = lazy(() => import("./pages/gov/GovMarkets"));
const GovClimate = lazy(() => import("./pages/gov/GovClimate"));
const GovFoodSecurity = lazy(() => import("./pages/gov/GovFoodSecurity"));
const GovCooperatives = lazy(() => import("./pages/gov/GovCooperatives"));
const GovCooperativeDetail = lazy(() => import("./pages/gov/GovCooperativeDetail"));
const GovValueChains = lazy(() => import("./pages/gov/GovValueChains"));
const GovReports = lazy(() => import("./pages/gov/GovReports"));
const GovAlerts = lazy(() => import("./pages/gov/GovAlerts"));
const GovSettings = lazy(() => import("./pages/gov/GovSettings"));
const GovUnderReview = lazy(() => import("./pages/gov/GovUnderReview"));
const Unauthorized = lazy(() => import("./pages/Unauthorized"));
const BuyerTradeHome = lazy(() => import("./pages/buyer/BuyerTradeHome"));
const BuyerTradeListingDetails = lazy(() => import("./pages/buyer/BuyerTradeListingDetails"));
const BuyerTradeBids = lazy(() => import("./pages/buyer/BuyerTradeBids"));
const BuyerTradeContracts = lazy(() => import("./pages/buyer/BuyerTradeContracts"));
const BuyerTradeWallet = lazy(() => import("./pages/buyer/BuyerTradeWallet"));
const BuyerTradeSettings = lazy(() => import("./pages/buyer/BuyerTradeSettings"));
const FarmerBids = lazy(() => import("./pages/farmer/FarmerBids"));
const FarmerBidDetails = lazy(() => import("./pages/farmer/FarmerBidDetails"));
const BuyerProfile = lazy(() => import("./pages/BuyerProfile"));
const BuyerDashboardPage = lazy(() => import("./pages/buyer/BuyerDashboardPage"));
const BuyerBillingPage = lazy(() => import("./pages/buyer/BuyerBillingPage"));
const BuyerVerificationPendingPage = lazy(() => import("./pages/buyer/BuyerVerificationPendingPage"));
const BuyerAnalyticsDashboard = lazy(() => import("./pages/buyer/BuyerAnalyticsDashboard"));
const BuyerCustomReports = lazy(() => import("./pages/buyer/BuyerCustomReports"));
const BuyerDemandPlanning = lazy(() => import("./pages/buyer/BuyerDemandPlanning"));
const BuyerLogisticsTracking = lazy(() => import("./pages/buyer/BuyerLogisticsTracking"));
const BuyerSupplierRelationshipManagement = lazy(() => import("./pages/buyer/BuyerSupplierRelationshipManagement"));
const BuyerPurchaseOrderManagement = lazy(() => import("./pages/buyer/BuyerPurchaseOrderManagement"));
const BuyerQualityManagement = lazy(() => import("./pages/buyer/BuyerQualityManagement"));
const BuyerFinancialManagement = lazy(() => import("./pages/buyer/BuyerFinancialManagement"));
const BuyerMarketIntelligence = lazy(() => import("./pages/buyer/BuyerMarketIntelligence"));
const BuyerCollaborationCommunication = lazy(() => import("./pages/buyer/BuyerCollaborationCommunication"));
const Partnerships = lazy(() => import("./pages/Partnerships"));
const Policies = lazy(() => import("./pages/Policies"));
const DataPrivacyPolicy = lazy(() => import("./pages/policies/DataPrivacyPolicy"));
const SecurityPolicy = lazy(() => import("./pages/policies/SecurityPolicy"));
const ResponsibleAIPolicy = lazy(() => import("./pages/policies/ResponsibleAIPolicy"));
const TransparencyPolicy = lazy(() => import("./pages/policies/TransparencyPolicy"));
const DataOwnershipPolicy = lazy(() => import("./pages/policies/DataOwnershipPolicy"));
const PartnershipEthicsPolicy = lazy(() => import("./pages/policies/PartnershipEthicsPolicy"));
const TransportPortal = lazy(() => import("./pages/TransportPortal"));
const TransportMarketplace = lazy(() => import("./pages/TransportMarketplace"));
const TransportDriverUpdate = lazy(() => import("./pages/TransportDriverUpdate"));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
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
            <Route
              path="/transport-registration"
              element={
                <RoleGuard allowed={["transport_admin", "transport_staff", "admin", "unassigned"]} redirectTo="/registration">
                  <TransportRegistration />
                </RoleGuard>
              }
            />
            <Route element={<PublicRoute><Signup /></PublicRoute>} path="/signup" />
            <Route element={<PublicRoute><Login /></PublicRoute>} path="/login" />
            <Route element={<PublicRoute><ResetPassword /></PublicRoute>} path="/reset-password" />
            <Route path="/join" element={<Join />} />
            <Route path="/join/:code" element={<Join />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/" element={<Homepage />} />
            <Route path="/partnerships" element={<Partnerships />} />
            <Route path="/policies" element={<Policies />} />
            <Route path="/policies/data-privacy" element={<DataPrivacyPolicy />} />
            <Route path="/policies/security" element={<SecurityPolicy />} />
            <Route path="/policies/responsible-ai" element={<ResponsibleAIPolicy />} />
            <Route path="/policies/transparency" element={<TransparencyPolicy />} />
            <Route path="/policies/data-ownership" element={<DataOwnershipPolicy />} />
            <Route path="/policies/partnership-ethics" element={<PartnershipEthicsPolicy />} />

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
                <Route path="sponsorships" element={<OrgApprovalGuard><OrgTypeGuard allowed={["cooperative"]}><OrgSponsorships /></OrgTypeGuard></OrgApprovalGuard>} />
                <Route path="sales-batches" element={<OrgApprovalGuard><OrgTypeGuard allowed={["cooperative"]}><OrgSalesBatches /></OrgTypeGuard></OrgApprovalGuard>} />
                <Route path="revenue-model" element={<OrgApprovalGuard><OrgTypeGuard allowed={["cooperative"]}><OrgRevenueModel /></OrgTypeGuard></OrgApprovalGuard>} />
                <Route path="impact" element={<OrgApprovalGuard><OrgTypeGuard allowed={["cooperative"]}><OrgImpact /></OrgTypeGuard></OrgApprovalGuard>} />
                <Route path="reports" element={<OrgApprovalGuard><OrgTypeGuard allowed={["cooperative"]}><OrgReports /></OrgTypeGuard></OrgApprovalGuard>} />
                <Route path="trade" element={<OrgApprovalGuard><OrgTypeGuard allowed={["cooperative"]}><TradePage /></OrgTypeGuard></OrgApprovalGuard>} />
                <Route path="international" element={<OrgApprovalGuard><OrgTypeGuard allowed={["cooperative"]}><OrgInternationalMarketsPage /></OrgTypeGuard></OrgApprovalGuard>} />
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
              <Route
                path="/partner"
                element={
                  <RoleGuard allowed={["partner_admin", "partner_analyst", "partner_finance", "admin"]} redirectTo="/marketplace">
                    <PartnerLayout />
                  </RoleGuard>
                }
              >
                <Route index element={<PartnerOverview />} />
                <Route path="sponsorships" element={<PartnerSponsorships />} />
                <Route path="impact" element={<PartnerImpact />} />
                <Route path="reports" element={<PartnerReports />} />
              </Route>
              <Route
                path="/gov"
                element={
                  <RoleGuard allowed={["org_admin", "org_staff", "gov_admin", "gov_analyst", "gov_viewer", "admin", "superadmin"]} redirectTo="/profile">
                    <GovTypeGuard />
                  </RoleGuard>
                }
              >
                <Route element={<GovLayout />}>
                  <Route index element={<Navigate to="/gov/overview" replace />} />
                  <Route path="overview" element={<GovOverview />} />
                  <Route path="national-stats" element={<GovNationalStats />} />
                  <Route path="markets" element={<GovMarkets />} />
                  <Route path="climate" element={<GovClimate />} />
                  <Route path="food-security" element={<GovFoodSecurity />} />
                  <Route path="cooperatives" element={<GovCooperatives />} />
                  <Route path="cooperatives/:orgId" element={<GovCooperativeDetail />} />
                  <Route path="value-chains" element={<GovValueChains />} />
                  <Route path="reports" element={<GovReports />} />
                  <Route path="alerts" element={<GovAlerts />} />
                  <Route path="settings" element={<GovSettings />} />
                </Route>
              </Route>
              <Route
                path="/gov/under-review"
                element={
                  <RoleGuard allowed={["org_admin", "org_staff", "gov_admin", "gov_analyst", "gov_viewer", "admin", "superadmin"]} redirectTo="/profile">
                    <GovUnderReview />
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
                        "transport_admin",
                        "transport_staff",
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
                  path="/dashboard"
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
                  path="/transport-marketplace"
                  element={
                    <RoleGuard allowed={["farmer", "org_admin", "org_staff", "admin", "superadmin"]} redirectTo="/registration">
                      <TransportMarketplace />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/buyer"
                  element={
                    <RoleGuard allowed={["buyer"]} redirectTo="/unauthorized">
                      <div className="flex">
                        <BuyerLayout />
                        <main className="flex-1 ml-64">
                          <Outlet />
                        </main>
                      </div>
                    </RoleGuard>
                  }
                >
                  <Route index element={<Navigate to="/buyer/dashboard" replace />} />
                  <Route path="dashboard" element={<BuyerDashboardPage />} />
                  <Route path="verification-pending" element={<BuyerVerificationPendingPage />} />
                  <Route path="trade" element={<BuyerTradeHome />} />
                  <Route path="trade/listings/:listingId" element={<BuyerTradeListingDetails />} />
                  <Route path="trade/bids" element={<BuyerTradeBids />} />
                  <Route path="trade/contracts" element={<BuyerTradeContracts />} />
                  <Route path="trade/wallet" element={<BuyerTradeWallet />} />
                  <Route path="trade/settings" element={<BuyerTradeSettings />} />
                  <Route path="profile" element={<BuyerProfile />} />
                  <Route path="billing" element={<BuyerBillingPage />} />
                  <Route path="analytics" element={<BuyerAnalyticsDashboard />} />
                  <Route path="reports" element={<BuyerCustomReports />} />
                  <Route path="demand-planning" element={<BuyerDemandPlanning />} />
                  <Route path="logistics" element={<BuyerLogisticsTracking />} />
                  <Route path="suppliers" element={<BuyerSupplierRelationshipManagement />} />
                  <Route path="purchase-orders" element={<BuyerPurchaseOrderManagement />} />
                  <Route path="quality" element={<BuyerQualityManagement />} />
                  <Route path="financial" element={<BuyerFinancialManagement />} />
                  <Route path="market-intelligence" element={<BuyerMarketIntelligence />} />
                  <Route path="collaboration" element={<BuyerCollaborationCommunication />} />
                </Route>
                <Route path="/upgrade" element={<Upgrade />} />
                <Route
                  path="/transport"
                  element={
                    <RoleGuard allowed={["transport_admin", "transport_staff", "admin", "superadmin"]} redirectTo="/registration">
                      <TransportPortal />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/transport/driver"
                  element={
                    <RoleGuard allowed={["transport_admin", "transport_staff", "admin", "superadmin"]} redirectTo="/registration">
                      <TransportDriverUpdate />
                    </RoleGuard>
                  }
                />
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
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
