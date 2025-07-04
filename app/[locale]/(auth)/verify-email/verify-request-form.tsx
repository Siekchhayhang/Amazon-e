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

export default function VerifyRequestForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  const [isLoading, setIsLoading] = useState(false);
  const [isResent, setIsResent] = useState(false);

  if (!email) {
    return (
      <Card className="w-full max-w-md mx-auto mt-12 shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto bg-red-100 p-3 rounded-full">
            <MailCheck className="h-8 w-8 text-red-500" />
          </div>
          <CardTitle className="mt-4 text-xl font-semibold text-red-600">
            Something went wrong
          </CardTitle>
          <CardDescription className="mt-1 text-sm text-muted-foreground">
            We couldn&apos;t identify your email. Please try signing up again.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center mt-4">
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
        title: "Unexpected error",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto mt-12 shadow-lg">
      <CardHeader className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <MailCheck className="h-10 w-10 text-green-600" />
        </div>
        <CardTitle className="mt-4 text-2xl font-bold text-green-700">
          Verify Your Email
        </CardTitle>
        <CardDescription className="mt-1 text-sm text-muted-foreground">
          We&apos;ve sent a verification link to{" "}
          <span className="font-medium text-primary">{email}</span>.
        </CardDescription>
      </CardHeader>

      <CardContent className="text-center space-y-4">
        <p className="text-sm text-muted-foreground">
          Please click the link in the email to activate your account.
          <br />
          The link expires in 24 hours.
        </p>
        <p className="text-xs text-muted-foreground">
          Didn&apos;t receive it? Check spam or resend it below.
        </p>
      </CardContent>

      <CardFooter className="flex flex-col gap-3 p-6">
        <Button
          onClick={handleResend}
          disabled={isLoading || isResent}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : isResent ? (
            "Email Sent!"
          ) : (
            "Resend Verification Email"
          )}
        </Button>

        <Button variant="ghost" className="w-full text-sm" asChild>
          <Link href="/sign-in">Back to Sign In</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
