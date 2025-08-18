"use client";
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const OrderIdSearch = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize state from URL search param to persist value on refresh
  const [inputValue, setInputValue] = useState(searchParams.get("query") || "");

  useEffect(() => {
    // Use a debounce timeout to avoid updating the URL on every keystroke
    const debounce = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (inputValue) {
        params.set("query", inputValue);
        // Reset to page 1 when starting a new search
        params.set("page", "1");
      } else {
        params.delete("query");
      }
      // Use router.replace to update the URL without adding to history
      router.replace(`${pathname}?${params.toString()}`);
    }, 500); // 500ms delay

    return () => clearTimeout(debounce);
  }, [inputValue, pathname, router, searchParams]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        className="w-auto"
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Search By Order ID..."
      />
    </div>
  );
};

export default OrderIdSearch;
