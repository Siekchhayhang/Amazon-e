import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import SeparatorWithOr from "@/components/shared/separator-or";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { getSetting } from "@/lib/actions/setting.actions";
import CredentialsSignInForm from "./credentials-signin-form";
import { GoogleSignInForm } from "./google-signin-form";

export const metadata: Metadata = { title: "Sign In" };

export default async function SignInPage(props: {
  searchParams: Promise<{ callbackUrl: string }>;
}) {
  const searchParams = await props.searchParams;
  const { site } = await getSetting();

  const { callbackUrl = "/" } = searchParams;

  const session = await auth();
  if (session) {
    return redirect(callbackUrl);
  }

  return (
    <div className="w-full">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Sign In</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <CredentialsSignInForm />
            <Link
              href={`/forgot-password?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              className="text-sm text-center block"
            >
              <Button variant="link" className="w-full">
                Forgot password?
              </Button>
            </Link>

            <SeparatorWithOr />
            <div className="mt-4">
              <GoogleSignInForm />
            </div>
          </div>
        </CardContent>
      </Card>
      <SeparatorWithOr>New to {site.name}?</SeparatorWithOr>

      <Link href={`/sign-up?callbackUrl=${encodeURIComponent(callbackUrl)}`}>
        <Button className="w-full" variant="outline">
          Create your {site.name} account
        </Button>
      </Link>
    </div>
  );
}
