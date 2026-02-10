import FarmerProfile from "@/pages/FarmerProfile";
import BuyerProfile from "@/pages/BuyerProfile";
import { useUserRole } from "@/hooks/useUserRole";
import { useOrgType } from "@/hooks/useOrgType";
import { Navigate } from "react-router-dom";

export default function ProfileRouter() {
  const { role, isLoading } = useUserRole();
  const { orgType, isLoading: orgTypeLoading } = useOrgType();

  if (isLoading || orgTypeLoading) return null;

  if (role === "buyer") {
    return <BuyerProfile />;
  }

  if (role === "gov_admin" || role === "gov_analyst" || role === "gov_viewer") {
    return <Navigate to="/gov/overview" replace />;
  }

  if (role === "org_admin" || role === "org_staff") {
    if (orgType === "government_national" || orgType === "gov_national") {
      return <Navigate to="/gov/overview" replace />;
    }
    return <Navigate to="/org/profile" replace />;
  }

  return <FarmerProfile />;
}
