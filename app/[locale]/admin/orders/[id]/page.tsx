import { notFound } from "next/navigation";
import React from "react";

import { auth } from "@/auth";
import { getOrderById } from "@/lib/actions/order.actions";
import OrderDetailsForm from "@/components/shared/order/order-details-form";
import Link from "next/link";
import { getPendingRequestTypeForOrder } from "@/lib/actions/approval.actions";

export const metadata = {
  title: "Admin Order Details",
};

const AdminOrderDetailsPage = async (props: {
  params: Promise<{
    id: string;
  }>;
}) => {
  const params = await props.params;

  const { id } = params;

  const order = await getOrderById(id);
  if (!order) notFound();

  const session = await auth();
  const userRole = session?.user?.role || "User";

  // 2. Fetch the pending status for this specific order
  const pendingRequestType = await getPendingRequestTypeForOrder(id);

  return (
    <main className="max-w-6xl mx-auto p-4">
      <div className="flex mb-4">
        <Link href="/admin/orders">Orders</Link> <span className="mx-1">›</span>
        <Link href={`/admin/orders/${order._id}`}>{order._id}</Link>
      </div>
      {/* 3. Pass the new prop to the form component */}
      <OrderDetailsForm
        order={order}
        userRole={userRole}
        pendingRequestType={pendingRequestType}
      />
    </main>
  );
};

export default AdminOrderDetailsPage;
