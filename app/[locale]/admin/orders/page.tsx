import { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import DeleteDialog from "@/components/shared/delete-dialog";
import Pagination from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteOrder, getAllOrders } from "@/lib/actions/order.actions";
import { formatDateTime, formatId } from "@/lib/utils";
import { IOrderList } from "@/types";
import ProductPrice from "@/components/shared/product/product-price";
import AccessDeniedPage from "../access-denied/page";
import OrderIdSearch from "./order-id-search";
import { getPendingOrderRequestsMap } from "@/lib/actions/approval.actions";
import OrderStatusActions from "./order-status-actions";

export const metadata: Metadata = {
  title: "Admin Orders",
};

export default async function OrdersPage(props: {
  searchParams: Promise<{ page?: string; query?: string }>;
}) {
  const searchParams = await props.searchParams;
  const page = searchParams.page || "1";
  const query = searchParams.query || "";

  const session = await auth();
  const userRole = session?.user?.role;
  if (userRole !== "Admin" && userRole !== "Sale") return <AccessDeniedPage />;

  const orders = await getAllOrders({
    page: Number(page),
    query,
  });

  const pendingRequestsMap = await getPendingOrderRequestsMap();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="h1-bold">Orders</h1>
        <OrderIdSearch />
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Id</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Buyer</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Delivered</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.data.map((order: IOrderList) => {
              // Get the list of all pending request types for this order
              const pendingRequestTypes = pendingRequestsMap[order._id] || [];
              // Determine if the row should be locked (if any request is pending)
              const isLocked = pendingRequestTypes.length > 0;

              return (
                <TableRow key={order._id}>
                  <TableCell>{formatId(order._id)}</TableCell>
                  <TableCell>
                    {formatDateTime(order.createdAt!).dateTime}
                  </TableCell>
                  <TableCell>
                    {order.user ? order.user.name : "Deleted User"}
                  </TableCell>
                  <TableCell>
                    <ProductPrice price={order.totalPrice} plain />
                  </TableCell>

                  <OrderStatusActions
                    order={order}
                    pendingRequestTypes={pendingRequestTypes}
                    userRole={userRole}
                  />

                  <TableCell className="flex gap-1">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/orders/${order._id}`}>Details</Link>
                    </Button>

                    {/* This is the final, correct logic for the Delete button */}
                    {(userRole === "Admin" || userRole === "Sale") &&
                      // If a DELETE request is specifically pending, show the "Pending" button
                      (pendingRequestTypes.includes("DELETE_ORDER") &&
                      userRole !== "Admin" ? (
                        <Button size="sm" variant="destructive" disabled>
                          Pending
                        </Button>
                      ) : (
                        // Otherwise, show the dialog but disable it if the row is locked by another action
                        <DeleteDialog
                          id={order._id}
                          action={deleteOrder}
                          disabled={isLocked && userRole !== "Admin"}
                        />
                      ))}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {orders.totalPages > 1 && (
          <Pagination page={page} totalPages={orders.totalPages!} />
        )}
      </div>
    </div>
  );
}
