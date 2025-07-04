import { RESEND_API_KEY, SENDER_EMAIL, SENDER_NAME } from "@/lib/constants";
import { IOrder } from "@/lib/db/models/order.model";
import { Resend } from "resend";
import AskReviewOrderItemsEmail from "./ask-review-order-items";
import PurchaseReceiptEmail from "./purchase-receipt";
import ResetPasswordEmail from "./reset-password-email";
import VerificationEmail from "./verification-email";

const resend = new Resend(RESEND_API_KEY as string);

export const sendPurchaseReceipt = async ({ order }: { order: IOrder }) => {
  await resend.emails.send({
    from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
    to: (order.user as { email: string }).email,
    subject: "Order Confirmation",
    react: <PurchaseReceiptEmail order={order} />,
  });
};

export const sendAskReviewOrderItems = async ({ order }: { order: IOrder }) => {
  const oneDayFromNow = new Date(
    Date.now() + 1000 * 60 * 60 * 24
  ).toISOString();

  await resend.emails.send({
    from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
    to: (order.user as { email: string }).email,
    subject: "Review your order items",
    react: <AskReviewOrderItemsEmail order={order} />,
    scheduledAt: oneDayFromNow,
  });
};

export const sendVerificationEmail = async ({
  email,
  token,
}: {
  email: string;
  token: string;
}) => {
  await resend.emails.send({
    from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
    to: email,
    subject: "Verify your email address",
    react: <VerificationEmail email={email} token={token} />,
  });
};

export const sendResetPasswordEmail = async ({
  email,
  token,
}: {
  email: string;
  token: string;
}) => {
  await resend.emails.send({
    from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
    to: email,
    subject: "Reset your password",
    react: <ResetPasswordEmail email={email} token={token} />,
  });
};
