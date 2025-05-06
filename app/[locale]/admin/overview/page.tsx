import { Metadata } from "next";

import OverviewReport from "./overview-report";
import { auth } from "@/auth";
import AccessDeniedPage from "../../access-denied/page";
export const metadata: Metadata = {
  title: "Admin Dashboard",
};
const DashboardPage = async () => {
  const session = await auth();
  if (session?.user.role !== "Admin") <AccessDeniedPage />;

  return <OverviewReport />;
};

export default DashboardPage;
