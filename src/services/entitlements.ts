import type { OrganizationSubscriptionDoc } from "@/services/orgService";
import type { UserProfileDoc } from "@/services/userProfileService";

export interface Entitlements {
  canAccessMarketDashboard: boolean;
  canAccessTrainingHub: boolean;
  canAccessContracts: boolean;
  canAccessTraceability: boolean;
  canAccessCreditScoring: boolean;
  canAccessRiskAlerts: boolean;
}

const defaultEntitlements: Entitlements = {
  canAccessMarketDashboard: false,
  canAccessTrainingHub: false,
  canAccessContracts: false,
  canAccessTraceability: false,
  canAccessCreditScoring: false,
  canAccessRiskAlerts: false,
};

export function getEntitlements(
  userProfile: UserProfileDoc | null,
  subscription: OrganizationSubscriptionDoc | null
): Entitlements {
  if (!userProfile) return defaultEntitlements;
  if (userProfile.premium) {
    return {
      canAccessMarketDashboard: true,
      canAccessTrainingHub: true,
      canAccessContracts: true,
      canAccessTraceability: true,
      canAccessCreditScoring: true,
      canAccessRiskAlerts: true,
    };
  }

  if (!subscription) return defaultEntitlements;

  const features = subscription.features || {};
  return {
    canAccessMarketDashboard: !!features.marketDashboard,
    canAccessTrainingHub: !!features.trainingHub,
    canAccessContracts: !!features.contracts,
    canAccessTraceability: !!features.traceability,
    canAccessCreditScoring: !!features.creditScoring,
    canAccessRiskAlerts: !!features.riskAlerts,
  };
}
