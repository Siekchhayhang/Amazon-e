"use client";

import ProductPrice from "@/components/shared/product/product-price";
import { getMonthName } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import React from "react";

type TableChartProps = {
  labelType: "month" | "product";
  data: {
    label: string;
    image?: string;
    value: number;
    id?: string;
  }[];
};

// ProgressBar component using Flexbox to align the bar to the right
const ProgressBar: React.FC<{ value: number }> = ({ value }) => {
  const boundedValue = Math.min(100, Math.max(0, value));
  return (
    // This container fills the available space
    <div className="flex-grow h-2 bg-muted rounded-full">
      {/* This inner bar has a width based on the value */}
      <div
        className="bg-primary h-full rounded-full"
        style={{ width: `${boundedValue}%` }}
      />
    </div>
  );
};

export default function TableChart({
  labelType = "month",
  data = [],
}: TableChartProps) {
  if (!data || data.length === 0) return null;

  const max = Math.max(...data.map((item) => item.value));
  const dataWithPercentage = data.map((x) => ({
    ...x,
    label: labelType === "month" ? getMonthName(x.label) : x.label,
    percentage: max > 0 ? Math.round((x.value / max) * 100) : 0,
  }));

  return (
    <div className="space-y-4">
      {dataWithPercentage.map(({ label, id, value, image, percentage }) => (
        // FIX: Changed to a 2-column grid for consistent layout
        <div
          key={id || label}
          className="grid grid-cols-[minmax(100px,_250px)_1fr] gap-4 items-center"
        >
          {/* COLUMN 1: LABEL & IMAGE */}
          {image ? (
            <Link
              className="flex items-center gap-2"
              href={`/admin/products/${id}`}
            >
              <Image
                className="rounded border aspect-square object-contain"
                src={image}
                alt={label}
                width={36}
                height={36}
              />
              <p className="text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                {label}
              </p>
            </Link>
          ) : (
            <div className="text-sm font-medium">{label}</div>
          )}

          {/* COLUMN 2: PROGRESS BAR & PRICE (Grouped Together) */}
          <div className="flex items-center gap-4 justify-end">
            <ProgressBar value={percentage} />
            <div className="w-20 text-sm font-semibold text-right">
              <ProductPrice price={value} plain />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
