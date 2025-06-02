import { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { PasswordForm } from "./password-form"; // Import the PasswordForm

const PAGE_TITLE = "Change Your Password";
export const metadata: Metadata = {
  title: PAGE_TITLE,
};

export default async function PasswordUpdatePage() {
  const session = await auth();
  return (
    <div className="mb-24">
      <SessionProvider session={session}>
        <div className="flex gap-2 ">
          <Link href="/account">Your Account</Link>
          <span>›</span>
          <Link href="/account/manage">Login & Security</Link>
          <span>›</span>
          <span>{PAGE_TITLE}</span>
        </div>
        <h1 className="h1-bold py-4">{PAGE_TITLE}</h1>
        <Card className="max-w-2xl">
          <CardContent className="p-4 flex justify-between flex-wrap">
            <p className="text-sm py-2">
              Update your account password below. For security reasons, you
              might be asked to log in again after changing your password.
            </p>
            <PasswordForm />
          </CardContent>
        </Card>
      </SessionProvider>
    </div>
  );
}
