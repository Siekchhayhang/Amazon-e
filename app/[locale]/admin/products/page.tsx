import { auth } from "@/auth";
import { getPendingProductRequestsMap } from "@/lib/actions/approval.actions";
import { getAllProductsForAdmin } from "@/lib/actions/product.actions";
import { IProduct } from "@/lib/db/models/product.model";
import { Metadata } from "next";
import Link from "next/link";
import AccessDeniedPage from "../access-denied/page";

import DeleteDialog from "@/components/shared/delete-dialog";
import Pagination from "@/components/shared/pagination";
import StockStatus from "@/components/shared/stock-status";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteProduct } from "@/lib/actions/product.actions";
import { formatId } from "@/lib/utils";
import ProductSearch from "./product-search";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Admin Products",
};

// 1. Correct the props definition to accept a Promise
export default async function ProductsPage(props: {
  searchParams: Promise<{ page?: string; query?: string }>;
}) {
  const session = await auth();
  const userRole = session?.user?.role;
  if (userRole !== "Admin" && userRole !== "Stocker") {
    return <AccessDeniedPage />;
  }

  // 2. Await the promise first
  const searchParams = await props.searchParams;
  const page = Number(searchParams.page) || 1;
  const query = searchParams.query || "";

  // Fetch both products and pending requests on the server
  const productsData = await getAllProductsForAdmin({ query, page });
  const pendingRequestsMap = await getPendingProductRequestsMap();

  return (
    <div className="space-y-4">
      <div className="flex-between flex-wrap gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="h1-bold">Products</h1>
          <ProductSearch />
        </div>
        <Button asChild variant="default">
          <Link href="/admin/products/create">Create Product</Link>
        </Button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Id</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Published</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productsData.products.map(
              (product: IProduct & { isPendingCreation?: boolean }) => {
                // Check for pending updates on existing products
                const isPendingUpdate = !!pendingRequestsMap[product._id];
                // The main check: is it a pending creation OR a pending update?
                const isPending = product.isPendingCreation || isPendingUpdate;

                return (
                  <TableRow
                    key={product._id}
                    className={product.isPendingCreation ? "bg-amber-50" : ""}
                  >
                    <TableCell>{formatId(product._id)}</TableCell>
                    <TableCell>
                      <Link href={`/admin/products/${product._id}`}>
                        {product.name}
                        {product.isPendingCreation && (
                          <Badge variant="outline" className="ml-2">
                            Pending
                          </Badge>
                        )}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">
                      ${product.price}
                    </TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>
                      <StockStatus countInStock={product.countInStock} />
                    </TableCell>
                    <TableCell>
                      {/* Update the 'Published' column */}
                      {product.isPendingCreation ? (
                        <Badge variant="secondary">Pending Approval</Badge>
                      ) : product.isPublished ? (
                        "Yes"
                      ) : (
                        "No"
                      )}
                    </TableCell>
                    <TableCell className="flex gap-1">
                      {/* Update the 'Actions' column */}
                      {isPending && userRole !== "Admin" ? (
                        <Button variant="outline" size="sm" disabled>
                          Pending
                        </Button>
                      ) : (
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/admin/products/${product._id}`}>
                            Edit
                          </Link>
                        </Button>
                      )}
                      <Button asChild variant="outline" size="sm">
                        <Link target="_blank" href={`/product/${product.slug}`}>
                          View
                        </Link>
                      </Button>
                      {userRole === "Admin" && (
                        <DeleteDialog id={product._id} action={deleteProduct} />
                      )}
                    </TableCell>
                  </TableRow>
                );
              }
            )}
          </TableBody>
        </Table>
        {productsData.totalPages > 1 && (
          <Pagination
            page={String(page)}
            totalPages={productsData.totalPages}
          />
        )}
      </div>
    </div>
  );
}
