import { Metadata } from "next";
import { auth } from "@/auth";
import AccessDeniedPage from "../access-denied/page";
import AdminDashboard from "./admin-dashboard";
import SaleDashboard from "./sale-dashboard";
import StockerDashboard from "./stocker-dashboard";

export const metadata: Metadata = {
  title: "Dashboard",
};

const DashboardPage = async () => {
  const session = await auth();
  const role = session?.user?.role;

  // 🏛️ This page now acts as a router based on user role
  switch (role) {
    case "Admin":
      return <AdminDashboard />;
    case "Sale":
      return <SaleDashboard />;
    case "Stocker":
      return <StockerDashboard />;
    default:
      // If the user has no role or an unrecognized role, deny access
      return <AccessDeniedPage />;
  }
};

export default DashboardPage;
