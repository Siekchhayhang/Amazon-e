// app/(auth)/reset-password/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ResetPassword from "./reset-password-form";
import React from "react";

export const metadata = {
  title: "Reset Password",
  description: "Reset your password",
};
const ResetPasswordPage = async ({
  searchParams,
}: {
  searchParams: Promise<{
    callbackUrl: string;
  }>;
}) => {
  const { callbackUrl = "/" } = await searchParams;

  const session = await auth();
  if (session) {
    return redirect(callbackUrl);
  }
  return <ResetPassword />;
};

export default ResetPasswordPage;
