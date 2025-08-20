"use client";
import Link from "next/link";

import DeleteDialog from "@/components/shared/delete-dialog";
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
import { IProduct } from "@/lib/db/models/product.model";

import Pagination from "@/components/shared/pagination";
import StockStatus from "@/components/shared/stock-status";
import { formatId } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import ProductSearch from "./product-search";

type ProductListDataProps = {
  products: IProduct[];
  totalPages: number;
  totalProducts: number;
  to: number;
  from: number;
};

// This component now just displays the data it's given
export default function ProductList({
  data,
  pendingRequestsMap,
  userRole,
}: {
  data: ProductListDataProps;
  pendingRequestsMap: Record<string, string>;
  userRole: string;
}) {
  const searchParams = useSearchParams();
  const page = searchParams.get("page") || "1";

  return (
    <div className="space-y-4">
      <div className="flex-between flex-wrap gap-2">
        <div className="flex flex-wrap items-center gap-2 ">
          <h1 className="h1-bold">Products</h1>
          <ProductSearch />
        </div>
        <Button asChild variant="default">
          <Link href="/admin/products/create">Create Product</Link>
        </Button>
      </div>
      <div>
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
            {data.products.map((product: IProduct) => {
              // Check if this product has a pending request
              const isPending = !!pendingRequestsMap[product._id];
              return (
                <TableRow key={product._id}>
                  <TableCell>{formatId(product._id)}</TableCell>
                  <TableCell>
                    <Link href={`/admin/products/${product._id}`}>
                      {product.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">${product.price}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>
                    <StockStatus countInStock={product.countInStock} />
                  </TableCell>
                  <TableCell>{product.isPublished ? "Yes" : "No"}</TableCell>
                  <TableCell className="flex gap-1">
                    {/* Conditionally render a disabled "Pending" button */}
                    {isPending ? (
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
            })}
          </TableBody>
        </Table>
        {data.totalPages > 1 && (
          <Pagination page={page} totalPages={data.totalPages} />
        )}
      </div>
    </div>
  );
}
