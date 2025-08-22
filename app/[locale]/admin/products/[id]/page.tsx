import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
// 1. Import the new action
import { getProductOrPendingData } from "@/lib/actions/product.actions";
import ProductForm from "../product-form";

export const metadata: Metadata = {
  title: "Edit Product",
};

type UpdateProductProps = {
  params: Promise<{
    id: string;
  }>;
};

const UpdateProduct = async (props: UpdateProductProps) => {
  const params = await props.params;
  const { id } = params;

  // 2. Call the new smarter action
  const result = await getProductOrPendingData(id);
  if (!result) notFound();

  const { data: product, isReviewMode, requestId } = result;

  return (
    <main className="max-w-6xl mx-auto p-4">
      <div className="flex mb-4">
        <Link href="/admin/products">Products</Link>
        <span className="mx-1">›</span>
        <Link href={`/admin/products/${product._id}`}>{product.name}</Link>
        {isReviewMode && (
          <span className="ml-2 font-semibold text-amber-600">
            (Pending Approval)
          </span>
        )}
      </div>

      <div className="my-8">
        {/* 3. Pass the new props to the ProductForm component */}
        <ProductForm
          type="Update"
          product={product}
          productId={isReviewMode ? undefined : product._id}
          pendingRequestType={isReviewMode ? "CREATE_PRODUCT" : undefined}
          isReviewMode={isReviewMode}
          requestId={requestId}
        />
      </div>
    </main>
  );
};

export default UpdateProduct;
