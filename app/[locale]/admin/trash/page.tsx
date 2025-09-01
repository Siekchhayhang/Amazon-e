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
import AccessDeniedPage from "../access-denied/page";
import { auth } from "@/auth";
import { getPendingRestoreRequestIds } from "@/lib/actions/approval.actions";

export const metadata: Metadata = {
  title: "Deleted Products",
};

export default async function TrashPage() {
  const session = await auth();
  const userRole = session?.user?.role;
  if (userRole !== "Admin" && userRole !== "Stocker") {
    return <AccessDeniedPage />;
  }

  const deletedProducts: IProduct[] = await getDeletedProducts();
  const pendingRestoreIds = await getPendingRestoreRequestIds();

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
          {deletedProducts.map((product: IProduct) => {
            const isRestorePending = pendingRestoreIds.includes(product._id);
            return (
              <TableRow key={product._id}>
                <TableCell>{product.name}</TableCell>
                <TableCell>
                  {formatDateTime(new Date(product.deletedAt!)).dateTime}
                </TableCell>
                <TableCell>
                  {/* Pass the pending status to the button */}
                  <RestoreButton
                    productId={product._id}
                    isRestorePending={isRestorePending}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
