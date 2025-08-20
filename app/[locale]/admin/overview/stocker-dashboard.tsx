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
import { getAllProductsForAdmin } from "@/lib/actions/product.actions";
import { IProduct } from "@/lib/db/models/product.model";
import { Button } from "@/components/ui/button";
import StockStatus from "@/components/shared/stock-status";

export default async function StockerDashboard() {
  // Fetch all products to find low stock items
  const productsData = await getAllProductsForAdmin({
    query: "",
    page: 1,
    limit: 1000,
  }); // Fetch all
  const lowStockProducts = productsData.products.filter(
    (p: IProduct) => p.countInStock <= 10
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="h1-bold">Stock Dashboard</h1>
        <Link href="/admin/products">
          <Button>Manage All Products</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Products with Low Stock (10 or less)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lowStockProducts.map((product: IProduct) => (
                <TableRow key={product._id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>
                    {/* Re-using the StockStatus component is efficient! */}
                    <StockStatus countInStock={product.countInStock} />
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/products/${product._id}`}>
                      <span className="px-2">Edit</span>
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
