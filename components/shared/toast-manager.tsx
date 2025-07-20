"use client";

import { useToast } from "@/hooks/use-toast";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ToastManager() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Check if the 'signed_out' parameter is in the URL
    if (searchParams.get("signed_out") === "true") {
      toast({
        description: "You have been signed out successfully.",
      });
      // Clean the URL by removing the query parameter, so the toast
      // doesn't reappear if the user refreshes the page.
      router.replace("/", { scroll: false });
    }
  }, [searchParams, router, toast]);

  // This component doesn't render anything visible
  return null;
}
