import { Metadata } from "next";
import { getDeletedProducts } from "@/lib/actions/product.actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";
import RestoreButton from "./restore-button";
import { IProduct } from "@/lib/db/models/product.model";

export const metadata: Metadata = {
  title: "Deleted Products",
};

export default async function TrashPage() {
  const deletedProducts: IProduct[] = await getDeletedProducts();

  return (
    <div className="space-y-4">
      <h1 className="h1-bold">Deleted Products (Trash)</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Date Deleted</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deletedProducts.map((product: IProduct) => (
            <TableRow key={product._id}>
              <TableCell>{product.name}</TableCell>
              <TableCell>
                {formatDateTime(new Date(product.deletedAt!)).dateTime}
              </TableCell>
              <TableCell>
                <RestoreButton productId={product._id} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
