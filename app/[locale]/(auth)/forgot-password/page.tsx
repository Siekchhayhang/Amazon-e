import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ForgotPasswordForm from "./forgot-password-form";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Forgot Password" };

type ForgotPasswordPageProps = {
  params: Promise<{ locale: string }>; // Updated params type
  searchParams: Promise<{ callbackUrl: string }>;
};

export default async function ForgotPasswordPage({
  params, // Receive the params prop
  searchParams,
}: ForgotPasswordPageProps) {
  const { locale } = await params; // Await the params to access locale
  const callbackUrl = await searchParams.then(
    (params) => params.callbackUrl || "/"
  );

  const session = await auth();
  if (session) {
    redirect(callbackUrl);
  }

  return (
    <div className="w-full">
      <p
        style={{
          overflow: "hidden",
          whiteSpace: "nowrap",
          animation: "slide 5s linear infinite",
        }}
      >
        Your Current Language: {locale}
      </p>
      <style>{`
        @keyframes slide {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
      `}</style>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Forgot Password</CardTitle>
        </CardHeader>
        <CardContent>
          <ForgotPasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
