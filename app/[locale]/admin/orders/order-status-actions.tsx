"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { IOrderList } from "@/types";
import { formatDateTime } from "@/lib/utils";
import {
  markOrderAsPaid,
  markOrderAsDelivered,
} from "@/lib/actions/order.actions";
import { TableCell } from "@/components/ui/table";

type Props = {
  order: IOrderList;
  pendingRequestType?: string;
  userRole: string;
};

export default function OrderStatusActions({
  order,
  pendingRequestType,
  userRole,
}: Props) {
  // 👇 These lines were missing
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const handleAction = (action: "paid" | "delivered") => {
    startTransition(async () => {
      const res =
        action === "paid"
          ? await markOrderAsPaid(order._id)
          : await markOrderAsDelivered(order._id);

      if (res.success) {
        toast({ description: res.message });
        router.refresh(); // Refresh the page to show the updated status
      } else {
        toast({ variant: "destructive", description: "An error occurred." });
      }
    });
  };
  // 👆 The logic above was missing

  const isPaidActionPending = pendingRequestType === "MARK_AS_PAID";
  const isDeliveredActionPending = pendingRequestType === "MARK_AS_DELIVERED";

  return (
    <>
      <TableCell>
        {/* 👇 This is the corrected logic */}
        {order.isPaid ? (
          formatDateTime(order.paidAt!).dateTime
        ) : isPaidActionPending && userRole !== "Admin" ? (
          <Button size="sm" disabled>
            Pending Approval
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={() => handleAction("paid")}
            disabled={isPending}
          >
            {isPending ? "Processing..." : "Mark as Paid"}
          </Button>
        )}
      </TableCell>
      <TableCell>
        {/* 👇 This is the corrected logic */}
        {order.isDelivered ? (
          formatDateTime(order.deliveredAt!).dateTime
        ) : isDeliveredActionPending && userRole !== "Admin" ? (
          <Button size="sm" disabled>
            Pending Approval
          </Button>
        ) : order.isPaid ? (
          <Button
            size="sm"
            onClick={() => handleAction("delivered")}
            disabled={isPending}
          >
            {isPending ? "Processing..." : "Mark as Delivered"}
          </Button>
        ) : (
          "No"
        )}
      </TableCell>
    </>
  );
}
