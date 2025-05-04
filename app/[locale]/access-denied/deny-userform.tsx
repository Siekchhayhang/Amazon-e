"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AccessDeniedform() {
  const router = useRouter();
  const [count, setCount] = useState(5);

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/");
    }, 5000);

    const interval = setInterval(() => {
      setCount((prev) => prev - 1);
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4 text-center">
      <div className="bg-white shadow-xl rounded-2xl p-8 max-w-md w-full">
        <h1 className="text-4xl font-extrabold text-red-600 mb-4">
          Access Denied
        </h1>
        <p className="text-gray-600 mb-6">
          You do not have permission to view this page.
        </p>
        <p className="text-gray-500 mb-6">Redirecting in {count} seconds...</p>
        <Link href="/">
          <Button variant="default" size="lg">
            Go Back Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
