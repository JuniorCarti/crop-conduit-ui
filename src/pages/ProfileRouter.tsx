import FarmerProfile from "@/pages/FarmerProfile";
import BuyerProfile from "@/pages/BuyerProfile";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigate } from "react-router-dom";

export default function ProfileRouter() {
  const { role, isLoading } = useUserRole();

  if (isLoading) return null;

  if (role === "buyer") {
    return <BuyerProfile />;
  }

  if (role === "org_admin" || role === "org_staff") {
    return <Navigate to="/org/profile" replace />;
  }

  return <FarmerProfile />;
}
