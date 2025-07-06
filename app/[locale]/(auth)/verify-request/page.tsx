import { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import VerifyRequestForm from "./verify-request-form";
import { Suspense } from "react";

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
    return redirect(callbackUrl || "/");
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4">
      {/* The Suspense boundary is required because the child component uses the useSearchParams hook. */}
      <Suspense fallback={<div>Loading...</div>}>
        <VerifyRequestForm />
      </Suspense>
    </div>
  );
}
