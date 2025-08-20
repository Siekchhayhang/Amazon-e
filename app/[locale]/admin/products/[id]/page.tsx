import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { getProductById } from "@/lib/actions/product.actions";
import ProductForm from "../product-form";
import { getPendingRequestTypeForProduct } from "@/lib/actions/approval.actions";

export const metadata: Metadata = {
  title: "Edit Product",
};

// 1. Correct the type to show that params is a Promise
type UpdateProductProps = {
  params: Promise<{
    id: string;
  }>;
};

// 2. Accept the whole props object
const UpdateProduct = async (props: UpdateProductProps) => {
  // 3. Await the params promise to get the object
  const params = await props.params;
  const { id } = params; // Now you can safely get the id

  const product = await getProductById(id);
  if (!product) notFound();

  // Fetch the pending status for this specific product
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
