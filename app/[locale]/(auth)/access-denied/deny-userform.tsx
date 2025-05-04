"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AccessDeniedform() {
  const router = useRouter();
  const [count, setCount] = useState(5);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    console.log("AccessDeniedform mounted in production environment");

    const interval = setInterval(() => {
      setCount((prev) => {
        const nextCount = prev - 1;
        console.log(`Countdown: ${nextCount}`);
        if (nextCount <= 0) {
          console.log("Countdown reached 0. Setting shouldRedirect to true.");
          clearInterval(interval);
          setShouldRedirect(true);
          return 0;
        }
        return nextCount;
      });
    }, 1000);

    return () => {
      console.log("AccessDeniedform unmounted. Clearing interval.");
      clearInterval(interval);
    };
  }, []); // Empty dependency array for the countdown timer

  useEffect(() => {
    if (shouldRedirect) {
      console.log("shouldRedirect is true. Initiating router.push('/')");
      router.push("/");
      console.log("router.push('/') called.");
    }
  }, [shouldRedirect, router]); // Dependency array for the redirection effect

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4 text-center">
      <div className="bg-white shadow-xl rounded-2xl p-8 max-w-md w-full">
        <h1 className="text-4xl font-extrabold text-red-600 mb-4">
          Access Denied
        </h1>
        <p className="text-gray-600 mb-6">
          You do not have permission to view this page.
        </p>
        <p className="text-gray-500 mb-6">
          {shouldRedirect
            ? "Redirecting..."
            : `Redirecting in ${count} seconds...`}
        </p>
        <Link href="/">
          <Button variant="default" size="lg" disabled={shouldRedirect}>
            Go Back Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
