import { Metadata } from "next";
import dynamic from "next/dynamic";

// ✅ Dynamically import the client component (NO ssr: false)
const AccessDeniedform = dynamic(() => import("./deny-userform"));

export const metadata: Metadata = {
  title: "Access Denied",
};

export default function AccessDeniedPage() {
  return <AccessDeniedform />;
}
