"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function ActionButton({
  caption,
  action,
  className = "w-full",
  variant = "default",
  size = "default",
  disabled: parentDisabled, // Add a disabled prop
}: {
  caption: string;
  action: () => Promise<{ success: boolean; message: string }>;
  className?: string;
  variant?: "default" | "outline" | "destructive";
  size?: "default" | "sm" | "lg";
  disabled?: boolean; // Define the disabled prop type
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const handleClick = () => {
    startTransition(async () => {
      const res = await action();
      toast({
        variant: res.success ? "default" : "destructive",
        description: res.message,
      });
      if (res.success) {
        router.refresh(); // Refresh the page on success
      }
    });
  };

  return (
    <Button
      type="button"
      className={cn("rounded-full", className)}
      variant={variant}
      size={size}
      disabled={isPending || parentDisabled}
      onClick={handleClick}
    >
      {isPending ? "Processing..." : caption}
    </Button>
  );
}
