import { auth } from "@/auth";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import VerifyRequestForm from "./verify-request-form";

export const metadata: Metadata = {
  title: "Verify-request",
};

export default async function VerifyRequestPage(props: {
  searchParams: Promise<{
    callbackUrl: string;
  }>;
}) {
  const searchParams = await props.searchParams;

  const { callbackUrl } = searchParams;

  const session = await auth();
  if (session) {
    return redirect(callbackUrl);
  }

  return <VerifyRequestForm />;
}
