"use client";
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
import { toast } from "@/hooks/use-toast";
import { resetPassword } from "@/lib/actions/user.actions"; // You'll need to create this action
import { ResetPasswordSchema } from "@/lib/validator"; // You'll need to create this schema
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Define the type based on the schema
type ResetPasswordFormData = z.infer<typeof ResetPasswordSchema>;

const resetPasswordDefaultValues: ResetPasswordFormData =
  process.env.NODE_ENV === "development"
    ? { password: "", confirmPassword: "" }
    : { password: "", confirmPassword: "" };

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const callbackUrl = searchParams.get("callbackUrl") || "/reset-password";

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: resetPasswordDefaultValues,
  });

  const { control, handleSubmit } = form;

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      if (!token) {
        toast({
          title: "Error",
          description:
            "Reset token is missing. Please request a new password reset link.",
          variant: "destructive",
        });
        return;
      }

      const response = await resetPassword({
        token,
        newPassword: data.password,
      });

      if (response.success) {
        console.log(token);
        toast({
          title: "Password Reset Successful",
          description:
            "Your password has been reset successfully. You can now log in with your new password.",
          variant: "default",
        });
        router.push(callbackUrl);
      } else {
        toast({
          title: "Error",
          description: response.error || "Something went wrong.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <h2 className="text-2xl font-bold text-center">Reset Your Password</h2>
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="callbackUrl" value={callbackUrl} />

          <FormField
            control={control}
            name="password"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Enter your new password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Confirm your new password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div>
            <Button type="submit">Reset Password</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
