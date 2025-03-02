import { Metadata } from "next";
import Link from "next/link";
import AddressesFormPage from "./address-form";

const PAGE_TITLE = "Addresses";
export const metadata: Metadata = {
  title: PAGE_TITLE,
};

export default function AddressesPage() {
  return (
    <div>
      <div className="flex gap-2">
        <Link href="/account">Your Account</Link>
        <span>›</span>
        <span>{PAGE_TITLE}</span>
      </div>
      <h1 className="h1-bold py-4">{PAGE_TITLE}</h1>
      <AddressesFormPage />
    </div>
  );
}
