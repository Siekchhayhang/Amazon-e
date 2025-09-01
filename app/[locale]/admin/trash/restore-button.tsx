"use client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { restoreProduct } from "@/lib/actions/product.actions";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function RestoreButton({
  productId,
  isRestorePending,
}: {
  productId: string;
  isRestorePending: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const handleRestore = () => {
    startTransition(async () => {
      const res = await restoreProduct(productId);
      if (res.success) {
        toast({ description: res.message });
        router.refresh();
      } else {
        toast({ variant: "destructive", description: res.message });
      }
    });
  };

  if (isRestorePending) {
    return (
      <Button disabled size="sm">
        Pending Approval
      </Button>
    );
  }

  return (
    <Button onClick={handleRestore} disabled={isPending} size="sm">
      {isPending ? "Restoring..." : "Restore"}
    </Button>
  );
}
