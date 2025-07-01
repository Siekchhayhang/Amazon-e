"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { toast } from "@/hooks/use-toast";
import {
  resendVerificationEmail,
  signInWithCredentials,
} from "@/lib/actions/user.actions";
import { UserSignInSchema } from "@/lib/validator";
import { IUserSignIn } from "@/types";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Loader2 } from "lucide-react";

const signInDefaultValues =
  process.env.NODE_ENV === "development"
    ? {
        email: "admin@example.com",
        password: "123456",
      }
    : {
        email: "",
        password: "",
      };

export default function CredentialsSignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const form = useForm<IUserSignIn>({
    resolver: zodResolver(UserSignInSchema),
    defaultValues: signInDefaultValues,
  });

  const { control, handleSubmit } = form;

  // --- ✨ This is the updated onSubmit function ---
  const onSubmit = async (data: IUserSignIn) => {
    setIsSubmitting(true);
    try {
      await signInWithCredentials({ ...data });
      toast({
        title: "Success",
        description: "You have successfully signed in.",
      });
      redirect(callbackUrl);
    } catch (error: unknown) {
      setIsSubmitting(false);
      if (isRedirectError(error)) throw error;

      // ✨ Handle specific error for unverified email
      if (
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof (error as { message: string }).message === "string" &&
        ((error as { message: string }).message === "NEXT_REDIRECT" ||
          (error as { message: string }).message.includes("EMAIL_NOT_VERIFIED"))
      ) {
        toast({
          title: "Email Not Verified",
          description: "Please check your inbox to verify your email address.",
          variant: "destructive",
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await resendVerificationEmail(data.email);
                toast({ title: "Verification email resent successfully." });
              }}
            >
              Resend Email
            </Button>
          ),
        });
      } else {
        // Handle all other errors (e.g., wrong password)
        toast({
          title: "Sign-In Error",
          description: "Invalid email or password. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter email address"
                  type="email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    maxLength={30}
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? "Signing In..." : "Sign In"}
        </Button>
      </form>
    </Form>
  );
}
