"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { processRequest } from "@/lib/actions/approval.actions";

export default function ApprovalActions({ requestId }: { requestId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const handleAction = (action: "approve" | "reject") => {
    startTransition(async () => {
      const res = await processRequest(requestId, action);
      if (res.success) {
        toast({ description: res.message });
        router.refresh(); // Refresh the page to update the list
      } else {
        toast({ variant: "destructive", description: "An error occurred." });
      }
    });
  };

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        onClick={() => handleAction("approve")}
        disabled={isPending}
      >
        {isPending ? "Processing..." : "Approve"}
      </Button>
      <Button
        size="sm"
        variant="destructive"
        onClick={() => handleAction("reject")}
        disabled={isPending}
      >
        {isPending ? "..." : "Reject"}
      </Button>
    </div>
  );
}
