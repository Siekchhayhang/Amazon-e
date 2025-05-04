"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AccessDeniedform() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4 text-center">
      <div className="bg-white shadow-xl rounded-2xl p-8 max-w-md w-full">
        <h1 className="text-4xl font-extrabold text-red-600 mb-4">
          Access Denied
        </h1>
        <p className="text-gray-600 mb-6">
          You do not have permission to view this page.
        </p>

        <Link href="/">
          <Button variant="default" size="lg" className="w-full mt-4">
            Go Back Home Page
          </Button>
        </Link>
      </div>
    </div>
  );
}
