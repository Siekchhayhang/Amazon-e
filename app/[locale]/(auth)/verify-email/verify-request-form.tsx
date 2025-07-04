"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { MailCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { resendVerificationEmail } from "@/lib/actions/user.actions";
import { toast } from "@/hooks/use-toast";

// A small wrapper component to handle Suspense for useSearchParams
export default function VerifyRequestForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  const [isLoading, setIsLoading] = useState(false);
  const [isResent, setIsResent] = useState(false);

  if (!email) {
    // If no email is in the URL, guide the user back to sign up
    // This is a fallback for edge cases.
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-3 rounded-full">
            <MailCheck className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="mt-4 text-2xl">Something went wrong</CardTitle>
          <CardDescription>
            We couldn&apos;t identify your email. Please try signing up again.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center">
          <Button asChild>
            <Link href="/sign-up">Back to Sign Up</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const handleResend = async () => {
    setIsLoading(true);
    setIsResent(false);
    try {
      const result = await resendVerificationEmail(email);
      if (result.success) {
        toast({
          title: "Verification email sent!",
          description: "Please check your inbox (and spam folder).",
          variant: "default",
        });
        setIsResent(true);
      } else {
        toast({
          title: "Failed to resend email",
          description: result.error || "An unknown error occurred.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "An unexpected error occurred.",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <MailCheck className="h-10 w-10 text-green-600" />
        </div>
        <CardTitle className="mt-4 text-2xl font-bold">
          Verify Your Email
        </CardTitle>
        <CardDescription className="mt-2 text-base text-muted-foreground">
          We&apos;ve sent a verification link to{" "}
          <span className="font-semibold text-primary">{email}</span>.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-muted-foreground">
          Please click the link in the email to activate your account. This link
          will expire in 24 hours.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          Didn&apos;t receive the email? Check your spam folder or click below
          to resend.
        </p>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <Button
          onClick={handleResend}
          disabled={isLoading || isResent}
          className="w-full"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isResent ? "Email Sent!" : "Resend Verification Email"}
        </Button>
        <Button variant="ghost" className="w-full" asChild>
          <Link href="/sign-in">Back to Sign In</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
