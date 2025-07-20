"use client";
import { useSearchParams } from "next/navigation";

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
import useSettingStore from "@/hooks/use-setting-store";
import { signInWithCredentials } from "@/lib/actions/user.actions";
import { IUserSignIn } from "@/types";
import Link from "next/link";
import { useForm } from "react-hook-form";

import { toast } from "@/hooks/use-toast";
import { UserSignInSchema } from "@/lib/validator";
import { zodResolver } from "@hookform/resolvers/zod";
import { isRedirectError } from "next/dist/client/components/redirect-error";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

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
  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    setting: { site },
  } = useSettingStore();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const form = useForm<IUserSignIn>({
    resolver: zodResolver(UserSignInSchema),
    defaultValues: signInDefaultValues,
  });

  const { control, handleSubmit } = form;

  const onSubmit = async (data: IUserSignIn) => {
    setIsSubmitting(true);
    try {
      const result = await signInWithCredentials({ ...data });
      if (!result.success) {
        toast({
          title: "Sign In Failed",
          description: result.message,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      toast({
        title: "Success",
        description: result.message || "You have successfully signed in.",
      });
      // Use window.location.href to force a full page reload.
      // This ensures the session is updated across the entire application.
      window.location.href = callbackUrl;
    } catch (error) {
      if (isRedirectError(error)) throw error;

      console.error("SignIn Error:", error);

      if (
        error instanceof Error &&
        error.message.includes("TOO_MANY_REQUESTS")
      ) {
        toast({
          title: "Too Many Attempts",
          description:
            "You have made too many sign-in attempts. Please try again later.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sign In Error",
          description: "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <div className="space-y-6">
          <FormField
            control={control}
            name="email"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="Enter email address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="password"
            render={({ field }) => (
              <FormItem className="w-full">
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
                      onClick={togglePasswordVisibility}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 " />
                      ) : (
                        <Eye className="h-4 w-4  " />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Signing In..." : "Sign In"}
            </Button>
          </div>
          <div className="text-sm">
            By signing in, you agree to {site.name}&apos;s{" "}
            <Link href="/page/conditions-of-use">Conditions of Use</Link> and{" "}
            <Link href="/page/privacy-policy">Privacy Notice.</Link>
          </div>
        </div>
      </form>
    </Form>
  );
}
