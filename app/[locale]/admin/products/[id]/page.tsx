import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { getProductById } from "@/lib/actions/product.actions";
import ProductForm from "../product-form";
import { getPendingRequestTypeForProduct } from "@/lib/actions/approval.actions";
import { auth } from "@/auth";
import AccessDeniedPage from "../../access-denied/page";

export const metadata: Metadata = {
  title: "Edit Product",
};

type UpdateProductProps = {
  params: Promise<{
    id: string;
  }>;
};

const UpdateProduct = async (props: UpdateProductProps) => {
  const session = await auth();
  const userRole = session?.user?.role;
  if (userRole !== "Admin" && userRole !== "Stocker") {
    return <AccessDeniedPage />;
  }

  const params = await props.params;
  const { id } = params;

  const product = await getProductById(id);
  if (!product) notFound();

  const pendingRequestType = await getPendingRequestTypeForProduct(id);

  return (
    <main className="max-w-6xl mx-auto p-4">
      <div className="flex mb-4">
        <Link href="/admin/products">Products</Link>
        <span className="mx-1">›</span>
        <Link href={`/admin/products/${product._id}`}>{product._id}</Link>
      </div>

      <div className="my-8">
        <ProductForm
          type="Update"
          product={product}
          productId={product._id}
          pendingRequestType={pendingRequestType}
        />
      </div>
    </main>
  );
};

export default UpdateProduct;
