"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  createProduct,
  deleteProduct,
  updateProduct,
  requestRestock,
} from "@/lib/actions/product.actions";
import { IProduct } from "@/lib/db/models/product.model";
import { UploadButton } from "@/lib/uploadthing";
import { ProductInputSchema, ProductUpdateSchema } from "@/lib/validator";
import { Checkbox } from "@/components/ui/checkbox";
import { toSlug } from "@/lib/utils";
import { IProductInput } from "@/types";
import DeleteDialog from "@/components/shared/delete-dialog";
import ActionButton from "@/components/shared/action-button";
import {
  isDuplicateCreateRequestPending,
  processRequest,
} from "@/lib/actions/approval.actions";
import { useSession } from "next-auth/react";
import React, { useState, useTransition } from "react";

const productDefaultValues: IProductInput = {
  name: "",
  slug: "",
  category: "",
  images: [],
  brand: "",
  description: "",
  price: 0,
  listPrice: 0,
  countInStock: 0,
  numReviews: 0,
  avgRating: 0,
  numSales: 0,
  isPublished: false,
  tags: [],
  sizes: [],
  colors: [],
  ratingDistribution: [],
  reviews: [],
};

const ProductForm = ({
  type,
  product,
  productId,
  pendingRequestType,
  isReviewMode,
  requestId,
}: {
  type: "Create" | "Update";
  product?: IProduct;
  productId?: string;
  pendingRequestType?: string | null;
  isReviewMode?: boolean;
  requestId?: string;
}) => {
  const router = useRouter();
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const { toast } = useToast();

  const form = useForm<IProductInput>({
    resolver:
      type === "Update"
        ? zodResolver(ProductUpdateSchema)
        : zodResolver(ProductInputSchema),
    defaultValues:
      product && (type === "Update" || isReviewMode)
        ? product
        : productDefaultValues,
  });

  const [isRestockPending, startRestockTransition] = useTransition();
  const [restockQuantity, setRestockQuantity] = useState(0);
  const [restockReason, setRestockReason] = useState("");

  const handleRestockRequest = () => {
    if (!productId || restockQuantity <= 0) return;
    startRestockTransition(async () => {
      const res = await requestRestock({
        productId,
        quantity: Number(restockQuantity),
        reason: restockReason || "Manual Restock",
      });
      if (res.success) {
        toast({ description: res.message });
        setRestockQuantity(0);
        setRestockReason("");
        router.push("/admin/products");
      } else {
        toast({ variant: "destructive", description: res.message });
      }
    });
  };

  async function onSubmit(values: IProductInput) {
    let res;
    if (type === "Create") {
      if (userRole === "Stocker") {
        const isDuplicate = await isDuplicateCreateRequestPending(values.slug);
        if (isDuplicate) {
          toast({
            variant: "destructive",
            description:
              "A product with this name/slug is already pending approval.",
          });
          return;
        }
      }
      res = await createProduct(values);
    } else {
      if (!productId) return router.push(`/admin/products`);
      res = await updateProduct({ ...values, _id: productId });
    }

    if (!res.success) {
      toast({ variant: "destructive", description: res.message });
    } else {
      toast({ description: res.message });
      if (res.message?.includes("approval")) {
        router.push(`/admin/products`);
      } else {
        router.push(`/admin/products`);
      }
    }
  }
  const images = form.watch("images");

  return (
    <Form {...form}>
      <form
        onSubmit={
          !isReviewMode
            ? form.handleSubmit(onSubmit)
            : (e) => e.preventDefault()
        }
        className="space-y-8"
      >
        <fieldset disabled={isReviewMode} className="space-y-8">
          <div className="flex flex-col gap-5 md:flex-row">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter product name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input placeholder="Enter product slug" {...field} />
                      <button
                        type="button"
                        onClick={() => {
                          form.setValue("slug", toSlug(form.getValues("name")));
                        }}
                        className="absolute right-2 top-2.5 text-sm text-gray-500 hover:text-gray-800"
                      >
                        Generate
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="flex flex-col gap-5 md:flex-row">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter category" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="brand"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Brand</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter product brand" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="flex flex-col gap-5 md:flex-row">
            <FormField
              control={form.control}
              name="listPrice"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>List Price</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Enter product list price"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Net Price</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Enter product price"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="countInStock"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Count In Stock</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter product count in stock"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="images"
            render={() => (
              <FormItem className="w-full">
                <FormLabel>Images</FormLabel>
                <Card>
                  <CardContent className="space-y-2 mt-2 min-h-48">
                    <div className="flex justify-start items-center space-x-2 flex-wrap gap-2">
                      {images.map((image: string) => (
                        <Image
                          key={image}
                          src={image}
                          alt="product image"
                          className="w-20 h-20 object-cover object-center rounded-sm"
                          width={100}
                          height={100}
                        />
                      ))}
                      <FormControl>
                        <UploadButton
                          endpoint="imageUploader"
                          onClientUploadComplete={(res: { url: string }[]) => {
                            form.setValue("images", [...images, res[0].url]);
                          }}
                          onUploadError={(error: Error) => {
                            toast({
                              variant: "destructive",
                              description: `ERROR! ${error.message}`,
                            });
                          }}
                        />
                      </FormControl>
                    </div>
                  </CardContent>
                </Card>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell us a little bit about your product"
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="isPublished"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Is Published?</FormLabel>
                  <FormDescription>
                    This product will be visible to your customers.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </fieldset>

        {type === "Update" &&
          (userRole === "Admin" || userRole === "Stocker") && (
            <Card>
              <CardHeader>
                <CardTitle>Stock Management</CardTitle>
                <CardDescription>
                  Request a restock for this product. This will require admin
                  approval.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col md:flex-row gap-4 items-end">
                <FormItem className="w-full">
                  <FormLabel>Restock Quantity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 50"
                      value={restockQuantity || ""}
                      onChange={(e) =>
                        setRestockQuantity(Number(e.target.value))
                      }
                    />
                  </FormControl>
                </FormItem>
                <FormItem className="w-full">
                  <FormLabel>Reason / Reference</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., New shipment from supplier"
                      value={restockReason}
                      onChange={(e) => setRestockReason(e.target.value)}
                    />
                  </FormControl>
                </FormItem>
                <Button
                  type="button"
                  onClick={handleRestockRequest}
                  disabled={isRestockPending || restockQuantity <= 0}
                  className="w-full md:w-auto"
                >
                  {isRestockPending ? "Submitting..." : "Submit Request"}
                </Button>
              </CardContent>
            </Card>
          )}

        <div className="flex flex-col md:flex-row gap-4">
          {isReviewMode && requestId ? (
            <>
              <ActionButton
                caption="Approve Creation"
                action={() => processRequest(requestId, "approve")}
              />
              <ActionButton
                caption="Reject"
                variant="destructive"
                action={() => processRequest(requestId, "reject")}
              />
            </>
          ) : (
            <>
              <Button
                type="submit"
                size="lg"
                disabled={form.formState.isSubmitting || !!pendingRequestType}
                className="w-full"
              >
                {pendingRequestType
                  ? "Pending Approval"
                  : form.formState.isSubmitting
                    ? "Submitting..."
                    : `${type} Product`}
              </Button>
              {type === "Update" &&
                productId &&
                (!!pendingRequestType ? (
                  <Button
                    variant="destructive"
                    disabled
                    className="w-full"
                    size="lg"
                  >
                    {pendingRequestType === "DELETE_PRODUCT"
                      ? "Pending Deletion"
                      : "Action Pending"}
                  </Button>
                ) : (
                  <DeleteDialog id={productId} action={deleteProduct} />
                ))}
            </>
          )}
        </div>
      </form>
    </Form>
  );
};

export default ProductForm;
