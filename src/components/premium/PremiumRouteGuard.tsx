import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isPremiumFeature, PREMIUM_PREVIEW_ENABLED } from "@/config/featureAccess";
import { usePremiumModalStore } from "@/store/premiumStore";

type PremiumRouteGuardProps = {
  featureId: string;
  children: React.ReactNode;
};

export function PremiumRouteGuard({ featureId, children }: PremiumRouteGuardProps) {
  const location = useLocation();
  const { open, allowedFeatures } = usePremiumModalStore();
  const locked = isPremiumFeature(featureId);
  const previewAllowed = PREMIUM_PREVIEW_ENABLED && allowedFeatures[featureId];

  useEffect(() => {
    if (locked && !previewAllowed) {
      open({ featureId, route: location.pathname });
    }
  }, [featureId, locked, location.pathname, open, previewAllowed]);

  if (locked && !previewAllowed) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
