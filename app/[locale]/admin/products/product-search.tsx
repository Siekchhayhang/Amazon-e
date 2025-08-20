"use client";

import { Input } from "@/components/ui/input";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProductSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [inputValue, setInputValue] = useState(searchParams.get("query") || "");

  useEffect(() => {
    const debounce = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (inputValue) {
        params.set("query", inputValue);
        params.set("page", "1");
      } else {
        params.delete("query");
      }
      router.replace(`${pathname}?${params.toString()}`);
    }, 500);

    return () => clearTimeout(debounce);
  }, [inputValue, pathname, router, searchParams]);

  return (
    <Input
      className="w-auto"
      type="text"
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      placeholder="Filter name..."
    />
  );
}
