"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";

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
import { useToast } from "@/hooks/use-toast";
import { UserPasswordUpdateSchema } from "@/lib/validator";
import { updateUserPassword } from "@/lib/actions/user.actions";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

type PasswordFormData = z.infer<typeof UserPasswordUpdateSchema>;
const passwordFormDefaultValues: PasswordFormData = {
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export const PasswordForm = () => {
  const router = useRouter();
  const { toast } = useToast();
  const form = useForm<PasswordFormData>({
    resolver: zodResolver(UserPasswordUpdateSchema),
    defaultValues: passwordFormDefaultValues,
  });

  const {
    control,
    handleSubmit,
    formState: { isValid, isSubmitting },
  } = form;

  const onSubmit = async (values: PasswordFormData) => {
    const res = await updateUserPassword(values);
    if (!res.success) {
      return toast({
        variant: "destructive",
        description: res.message,
      });
    }

    toast({
      description: res.message,
    });
    router.push("/account/manage");
  };

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const toggleOldPasswordVisibility = () => setShowOldPassword((prev) => !prev);
  const toggleNewPasswordVisibility = () => setShowNewPassword((prev) => !prev);
  const toggleConfirmPasswordVisibility = () =>
    setShowConfirmPassword((prev) => !prev);

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <div className="flex flex-col gap-5">
          <FormField
            control={control}
            name="oldPassword"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel className="font-bold">Current Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showOldPassword ? "text" : "password"}
                      placeholder="Current Password"
                      maxLength={30}
                      {...field}
                      className="input-field"
                    />
                    <button
                      type="button"
                      onClick={toggleOldPasswordVisibility}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      tabIndex={-1}
                    >
                      {showOldPassword ? (
                        <EyeOff className="h-3 w-3 " />
                      ) : (
                        <Eye className="h-3 w-3  " />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="newPassword"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel className="font-bold">New Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="New Password"
                      maxLength={30}
                      {...field}
                      className="input-field"
                    />
                    <button
                      type="button"
                      onClick={toggleNewPasswordVisibility}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      tabIndex={-1}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-3 w-3 " />
                      ) : (
                        <Eye className="h-3 w-3  " />
                      )}
                    </button>
                  </div>
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
                <FormLabel className="font-bold">
                  Confirm New Password
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm New Password"
                      maxLength={30}
                      {...field}
                      className="input-field"
                    />
                    <button
                      type="button"
                      onClick={toggleConfirmPasswordVisibility}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-3 w-3 " />
                      ) : (
                        <Eye className="h-3 w-3  " />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={!isValid}
          className="button col-span-2 w-full"
        >
          {isSubmitting ? "Updating..." : "Update Password"}
        </Button>
      </form>
    </Form>
  );
};
