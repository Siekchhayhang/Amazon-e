"use client";

import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
//import { deliverOrder, updateOrderToPaid } from "@/lib/actions/order.actions";
import { IOrder } from "@/lib/db/models/order.model";
import { cn, formatDateTime } from "@/lib/utils";
import ActionButton from "../action-button";
import ProductPrice from "../product/product-price";
import {
  markOrderAsPaid,
  markOrderAsDelivered,
} from "@/lib/actions/order.actions";

export default function OrderDetailsForm({
  order,
  userRole,
  pendingRequestType,
}: {
  order: IOrder;
  userRole: string;
  pendingRequestType?: string | null;
}) {
  const {
    shippingAddress,
    items,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    paymentMethod,
    isPaid,
    paidAt,
    isDelivered,
    deliveredAt,
    expectedDeliveryDate,
  } = order;
  const hasPermission = userRole === "Admin" || userRole === "Sale";

  // 2. Check if a specific action is pending
  const isPaidActionPending = pendingRequestType === "MARK_AS_PAID";
  const isDeliveredActionPending = pendingRequestType === "MARK_AS_DELIVERED";

  return (
    <div className="grid md:grid-cols-3 md:gap-5">
      <div className="overflow-x-auto md:col-span-2 space-y-4">
        <Card>
          <CardContent className="p-4 gap-4">
            <h2 className="text-xl pb-4">Shipping Address</h2>
            <p>
              {shippingAddress.fullName} {shippingAddress.phone}
            </p>
            <p>
              {shippingAddress.street}, {shippingAddress.city},{" "}
              {shippingAddress.province}, {shippingAddress.postalCode},{" "}
              {shippingAddress.country}{" "}
            </p>

            {isDelivered ? (
              <Badge>
                Delivered at {formatDateTime(deliveredAt!).dateTime}
              </Badge>
            ) : (
              <div>
                {" "}
                <Badge variant="destructive">Not delivered</Badge>
                <div>
                  Expected delivery at{" "}
                  {formatDateTime(expectedDeliveryDate!).dateTime}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 gap-4">
            <h2 className="text-xl pb-4">Payment Method</h2>
            <p>{paymentMethod}</p>
            {isPaid ? (
              <Badge>Paid at {formatDateTime(paidAt!).dateTime}</Badge>
            ) : (
              <Badge variant="destructive">Not paid</Badge>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4   gap-4">
            <h2 className="text-xl pb-4">Order Items</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.slug}>
                    <TableCell>
                      <Link
                        href={`/product/${item.slug}`}
                        className="flex items-center"
                      >
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={50}
                          height={50}
                        ></Image>
                        <span className="px-2">{item.name}</span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span className="px-2">{item.quantity}</span>
                    </TableCell>
                    <TableCell className="text-right">${item.price}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <div>
        <Card>
          <CardContent className="p-4  space-y-4 gap-4">
            <h2 className="text-xl pb-4">Order Summary</h2>
            <div className="flex justify-between">
              <div>Items</div>
              <div>
                {" "}
                <ProductPrice price={itemsPrice} plain />
              </div>
            </div>
            <div className="flex justify-between">
              <div>Tax</div>
              <div>
                {" "}
                <ProductPrice price={taxPrice} plain />
              </div>
            </div>
            <div className="flex justify-between">
              <div>Shipping</div>
              <div>
                {" "}
                <ProductPrice price={shippingPrice} plain />
              </div>
            </div>
            <div className="flex justify-between">
              <div>Total</div>
              <div>
                {" "}
                <ProductPrice price={totalPrice} plain />
              </div>
            </div>

            {!isPaid && ["Stripe", "PayPal"].includes(paymentMethod) && (
              <Link
                className={cn(buttonVariants(), "w-full")}
                href={`/checkout/${order._id}`}
              >
                Pay Order
              </Link>
            )}

            {/* 👇 3. Update the button logic */}
            {hasPermission &&
              !isPaid &&
              paymentMethod === "Cash On Delivery" &&
              (isPaidActionPending ? (
                <Button className="w-full" disabled>
                  Pending Approval
                </Button>
              ) : (
                <ActionButton
                  caption="Mark as paid"
                  action={() => markOrderAsPaid(order._id)}
                />
              ))}

            {hasPermission &&
              isPaid &&
              !isDelivered &&
              (isDeliveredActionPending ? (
                <Button className="w-full" disabled>
                  Pending Approval
                </Button>
              ) : (
                <ActionButton
                  caption="Mark as delivered"
                  action={() => markOrderAsDelivered(order._id)}
                />
              ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
