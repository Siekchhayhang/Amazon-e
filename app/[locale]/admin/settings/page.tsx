import SettingForm from "./setting-form";
import SettingNav from "./setting-nav";
import { getSetting } from "@/lib/actions/setting.actions";
import { auth } from "@/auth";
import { Metadata } from "next";
import AccessDeniedPage from "../access-denied/page";

export const metadata: Metadata = {
  title: "Setting",
};
const SettingPage = async () => {
  const session = await auth();
  if (session?.user.role !== "Admin") return <AccessDeniedPage />;
  const setting = await getSetting();
  return (
    <div className="grid md:grid-cols-5 max-w-6xl mx-auto gap-4">
      <SettingNav />
      <main className="col-span-4 ">
        <div className="my-8">
          <SettingForm setting={setting} />
        </div>
      </main>
    </div>
  );
};

export default SettingPage;
