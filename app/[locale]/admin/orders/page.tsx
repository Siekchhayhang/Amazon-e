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

  // Fetch the map of pending requests
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
            {orders.data.length > 0 ? (
              orders.data.map((order: IOrderList) => (
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

                  {/* This component now handles the Paid/Delivered columns and disables buttons if a request is pending */}
                  <OrderStatusActions
                    order={order}
                    pendingRequestType={pendingRequestsMap[order._id]}
                  />

                  <TableCell className="flex gap-1">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/orders/${order._id}`}>Details</Link>
                    </Button>

                    {/* Logic to disable the delete button for Admins and Sales */}
                    {userRole === "Admin" && (
                      <DeleteDialog id={order._id} action={deleteOrder} />
                    )}
                    {userRole === "Sale" &&
                      (pendingRequestsMap[order._id] === "DELETE_ORDER" ? (
                        <Button size="sm" variant="destructive" disabled>
                          Pending
                        </Button>
                      ) : (
                        <DeleteDialog id={order._id} action={deleteOrder} />
                      ))}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No orders found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {orders.totalPages > 1 && (
          <Pagination page={page} totalPages={orders.totalPages!} />
        )}
      </div>
    </div>
  );
}
