import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ForgotPasswordForm from "./forgot-password-form";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Forgot Password" };

const ForgotPasswordPage = async () => {
  const session = await auth();
  if (session) {
    redirect("/");
  }

  return (
    <div className="w-full ">
      <Card className="max-w-md w-full p-6">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-center">
            Forgot Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ForgotPasswordForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;
