"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { verifyEmail } from "@/lib/actions/user.actions";
import Link from "next/link";
import { Loader2, CircleCheck, CircleX } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Props = {
  token: string;
};

export default function VerifyEmailClient({ token }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    const processVerification = async () => {
      if (!token) {
        setStatus("error");
        setMessage("No verification token found.");
        return;
      }

      const result = await verifyEmail(token);

      if (result.success) {
        setStatus("success");
        setMessage(result.message ?? "Verification successful!");
        toast({
          title: "Success!",
          description:
            "Your email has been verified. Redirecting to sign in...",
        });

        setTimeout(() => {
          router.push("/sign-in");
        }, 2000);
      } else {
        setStatus("error");
        setMessage(
          result.message ??
            "Verification failed. The link may be invalid or expired."
        );
      }
    };

    processVerification();
  }, [token, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 text-center">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full">
          {status === "verifying" && (
            <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
          )}
          {status === "success" && (
            <CircleCheck className="h-12 w-12 text-green-500" />
          )}
          {status === "error" && <CircleX className="h-12 w-12 text-red-500" />}
        </div>
        <p className="mt-4 text-xl font-semibold text-gray-700">{message}</p>
        {status === "error" && (
          <Link
            href="/sign-in"
            className="mt-8 inline-block w-full rounded-md bg-blue-600 px-6 py-3 text-center font-medium text-white shadow-sm hover:bg-blue-700"
          >
            Back to Sign In
          </Link>
        )}
      </div>
    </div>
  );
}
