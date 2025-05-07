import { Metadata } from "next";
import AccessDeniedform from "./deny-userform";

export const metadata: Metadata = {
  title: "Access Denied",
};

export default async function AccessDeniedPage() {
  return <AccessDeniedform />;
}
