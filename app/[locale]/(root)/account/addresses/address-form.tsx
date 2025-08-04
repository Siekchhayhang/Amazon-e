"use client";
import { shippingAddressDefaultValues } from "@/app/[locale]/checkout/checkout-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import useCartService from "@/hooks/use-cart-service";
import { useToast } from "@/hooks/use-toast";
import { ShippingAddressSchema } from "@/lib/validator";
import { ShippingAddress } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

export default function AddressesFormPage() {
  const { toast } = useToast();
  const router = useRouter();
  const {
    cart: { shippingAddress },
    editShippingAddress,
  } = useCartService();

  const address = useForm<ShippingAddress>({
    resolver: zodResolver(ShippingAddressSchema),
    defaultValues: shippingAddress || shippingAddressDefaultValues,
  });

  const onChangeShippingAddress = async (values: ShippingAddress) => {
    try {
      await editShippingAddress(values);

      toast({
        title: "Address Updated",
        description: "Your shipping address has been updated.",
      });

      router.push("/account");
    } catch (error) {
      console.error("Error saving address:", error);
      toast({
        title: "Error",
        description: "Failed to save address. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...address}>
      <form
        method="patch"
        onSubmit={address.handleSubmit(onChangeShippingAddress)}
        className="space-y-4"
      >
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="text-lg font-bold mb-2">Your address</div>

            {/* ✅ 1. ADDED MISSING FULLNAME FIELD */}
            <FormField
              control={address.control}
              name="fullName"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={address.control}
              name="street"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col gap-5 md:flex-row">
              {/* ✅ 2. CORRECTED THE MAPPING LOGIC */}
              {(["city", "province", "country"] as const).map((fieldName) => (
                <FormField
                  key={fieldName}
                  control={address.control}
                  name={fieldName}
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>
                        {/* Use the fieldName string directly */}
                        {fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}
                      </FormLabel>
                      <FormControl>
                        {/* Use the fieldName string for the placeholder */}
                        <Input placeholder={`Enter ${fieldName}`} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>

            <div className="flex flex-col gap-5 md:flex-row">
              {/* ✅ 2. CORRECTED THE MAPPING LOGIC */}
              {(["postalCode", "phone"] as const).map((fieldName) => (
                <FormField
                  key={fieldName}
                  control={address.control}
                  name={fieldName}
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>
                        {/* Use the fieldName string directly */}
                        {fieldName === "postalCode"
                          ? "Postal Code"
                          : "Phone Number"}
                      </FormLabel>
                      <FormControl>
                        {/* Use the fieldName string for the placeholder */}
                        <Input
                          placeholder={`Enter ${fieldName === "postalCode" ? "postal code" : "phone number"}`}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </CardContent>

          <CardFooter className="p-4">
            <Button
              type="submit"
              size="lg"
              disabled={
                !address.formState.isDirty || address.formState.isSubmitting
              }
              className="button col-span-2 w-full"
            >
              {address.formState.isSubmitting
                ? "Submitting..."
                : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
