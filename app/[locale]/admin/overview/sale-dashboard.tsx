import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { getOrderSummary } from "@/lib/actions/order.actions";
import { formatDateTime } from "@/lib/utils";
import ProductPrice from "@/components/shared/product/product-price";
import { IOrderList } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// This is a Server Component, so it's clean and efficient
export default async function SaleDashboard() {
  // Fetch only the data a sales person needs
  const summary = await getOrderSummary({
    from: new Date(0), // from the beginning of time
    to: new Date(),
  });
  const latestOrders = summary.latestOrders;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="h1-bold">Sales Dashboard</h1>
        <Link href="/admin/orders">
          <Button>View All Orders</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Buyer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Delivered</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {latestOrders.map((order: IOrderList) => (
                <TableRow key={order._id}>
                  <TableCell>
                    {order.user ? order.user.name : "Deleted User"}
                  </TableCell>
                  <TableCell>
                    {formatDateTime(order.createdAt).dateOnly}
                  </TableCell>
                  <TableCell>
                    <ProductPrice price={order.totalPrice} plain />
                  </TableCell>
                  <TableCell>
                    {order.isPaid ? (
                      <Badge variant="default">Yes</Badge>
                    ) : (
                      <Badge variant="destructive">No</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {order.isDelivered ? (
                      <Badge variant="default">Yes</Badge>
                    ) : (
                      <Badge variant="destructive">No</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/orders/${order._id}`}>
                      <span className="px-2">Details</span>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
