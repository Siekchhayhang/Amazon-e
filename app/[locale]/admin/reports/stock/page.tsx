import { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import AccessDeniedPage from "../../access-denied/page";
import { getStockMovements } from "@/lib/actions/stock.actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime, formatId } from "@/lib/utils";
import Pagination from "@/components/shared/pagination";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Stock Movement Report",
};

type StockMovementItem = {
  _id: string;
  createdAt: string;
  product: {
    name: string;
    slug: string;
  };
  type: "RESTOCK" | "SALE" | "ADJUSTMENT";
  quantityChange: number;
  orderId?: string;
  reason?: string;
  initiatedBy: {
    name: string;
  };
};

// 1. Correct the props definition to accept a Promise
export default async function StockReportPage(props: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  const userRole = session?.user?.role;

  if (userRole !== "Admin" && userRole !== "Stocker") {
    return <AccessDeniedPage />;
  }

  // 2. Await the promise first
  const searchParams = await props.searchParams;
  const page = Number(searchParams.page) || 1; // Now you can safely get the page

  const result = await getStockMovements({ page });

  return (
    <div className="space-y-4">
      <h1 className="h1-bold">Stock Movement Report</h1>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-center">Quantity Change</TableHead>
              <TableHead>Reason / Order ID</TableHead>
              <TableHead>Initiated By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No stock movements found.
                </TableCell>
              </TableRow>
            ) : (
              result.data.map((item: StockMovementItem) => (
                <TableRow key={item._id}>
                  <TableCell>
                    {formatDateTime(new Date(item.createdAt)).dateTime}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/product/${item.product.slug}`}
                      target="_blank"
                      className="hover:underline"
                    >
                      {item.product.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        item.type === "RESTOCK"
                          ? "default"
                          : item.type === "SALE"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {item.type}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-center font-bold",
                      item.quantityChange > 0
                        ? "text-green-600"
                        : "text-red-600"
                    )}
                  >
                    {item.quantityChange > 0
                      ? `+${item.quantityChange}`
                      : item.quantityChange}
                  </TableCell>
                  <TableCell>
                    {item.type === "SALE" && item.orderId ? (
                      <Link
                        href={`/admin/orders/${item.orderId}`}
                        className="hover:underline"
                      >
                        Order: {formatId(item.orderId)}
                      </Link>
                    ) : (
                      item.reason || "N/A"
                    )}
                  </TableCell>
                  <TableCell>{item.initiatedBy.name}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {result.totalPages > 1 && (
          <Pagination page={String(page)} totalPages={result.totalPages} />
        )}
      </div>
    </div>
  );
}
