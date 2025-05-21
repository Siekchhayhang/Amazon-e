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
import { requestPasswordReset } from "@/lib/actions/user.actions";
import { ForgotPasswordSchema } from "@/lib/validator";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

type ForgotPasswordFormData = z.infer<typeof ForgotPasswordSchema>;

const forgotPasswordDefaultValues: ForgotPasswordFormData = {
  email:
    process.env.NODE_ENV === "development" ? "example@examplemail.com" : "",
};

export default function ForgotPasswordForm() {
  const router = useRouter();
  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: forgotPasswordDefaultValues,
  });

  const {
    control,
    handleSubmit,
    formState: { isValid },
  } = form;

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      const response = await requestPasswordReset(data.email);
      if (response?.success) {
        toast({
          title: "Check your email",
          description:
            "A password reset link has been sent to your email address.",
          variant: "default",
        });
        router.push("/reset-password");
      } else if (response?.status === 429 && response?.nextAvailable) {
        const formatted = new Date(response.nextAvailable).toLocaleString();
        toast({
          title: "You can only request a password reset once every 24 hours.",
          description: `${response.error} You can request again after ${formatted}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: response?.error || "Something went wrong.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error sending reset link:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={control}
            name="email"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div>
            <Button type="submit" disabled={!isValid}>
              Send Reset Link
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
