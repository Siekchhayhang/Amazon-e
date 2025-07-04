"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { verifyEmail } from "@/lib/actions/user.actions";
import { toast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function VerifyEmailHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("t");

  const [verificationStatus, setVerificationStatus] = useState("loading"); // loading, success, error
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const handleVerification = async () => {
      if (!token) {
        setVerificationStatus("error");
        setErrorMessage("No verification token found.");
        return;
      }

      try {
        const result = await verifyEmail(token);
        if (result.success) {
          setVerificationStatus("success");
          toast({
            title: "Email Verified!",
            description: "Your email has been successfully verified. You can now sign in.",
          });
          // Optionally redirect after a short delay
          setTimeout(() => {
            router.push("/sign-in");
          }, 3000);
        } else {
          setVerificationStatus("error");
          setErrorMessage(result.error || "An unknown error occurred during verification.");
          toast({
            title: "Verification Failed",
            description: result.error || "Please try again or request a new link.",
            variant: "destructive",
          });
        }
      } catch (error) {
        setVerificationStatus("error");
        setErrorMessage("An unexpected error occurred. Please try again later.");
        console.error("Email verification error:", error);
        toast({
          title: "Verification Error",
          description: "An unexpected error occurred. Please try again later.",
          variant: "destructive",
        });
      }
    };

    handleVerification();
  }, [token, router]);

  return (
    <Card className="w-full max-w-md mx-auto mt-12 shadow-lg text-center">
      <CardHeader>
        {verificationStatus === "loading" && (
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
          </div>
        )}
        {verificationStatus === "success" && (
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
        )}
        {verificationStatus === "error" && (
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
        )}
        <CardTitle className="mt-4 text-2xl font-bold">
          {verificationStatus === "loading" && "Verifying Your Email..."}
          {verificationStatus === "success" && "Email Verified!"}
          {verificationStatus === "error" && "Verification Failed"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {verificationStatus === "loading" && (
          <CardDescription>Please wait while we verify your email address.</CardDescription>
        )}
        {verificationStatus === "success" && (
          <CardDescription>
            Your email has been successfully verified. You will be redirected to the sign-in page shortly.
          </CardDescription>
        )}
        {verificationStatus === "error" && (
          <CardDescription className="text-red-500">
            {errorMessage || "An unexpected error occurred. Please try again."}
          </CardDescription>
        )}
        {verificationStatus === "error" && (
          <Button asChild className="mt-4">
            <Link href="/sign-up">Back to Sign Up</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
