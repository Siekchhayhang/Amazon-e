"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { CalendarDateRangePicker } from "./date-range-picker";
import { DateRange } from "react-day-picker";
import { useTranslations } from "next-intl";

interface DashboardHeaderProps {
  title: string;
  date?: DateRange;
  setDate: React.Dispatch<React.SetStateAction<DateRange | undefined>>;
}

export default function DashboardHeader({
  title,
  date,
  setDate,
}: DashboardHeaderProps) {
  const t = useTranslations("Admin");

  return (
    <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-xl font-bold sm:text-2xl md:text-3xl">{title}</h1>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <CalendarDateRangePicker defaultDate={date} setDate={setDate} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-full sm:w-auto flex items-center justify-center"
            >
              <Download className="mr-2 h-4 w-4" />
              {t("Download Reports")}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 sm:w-56 md:w-64">
            {[
              {
                href: `/api/admin/reports/revenue?from=${date?.from?.toISOString()}&to=${date?.to?.toISOString()}`,
                label: t("Revenue"),
              },
              {
                href: `/api/admin/reports/orders?from=${date?.from?.toISOString()}&to=${date?.to?.toISOString()}`,
                label: t("Orders"),
              },
              {
                href: `/api/admin/reports/customers?from=${date?.from?.toISOString()}&to=${date?.to?.toISOString()}`,
                label: t("Customers"),
              },
              {
                href: `/api/admin/reports/products?from=${date?.from?.toISOString()}&to=${date?.to?.toISOString()}`,
                label: t("Products"),
              },
            ].map((item) => (
              <DropdownMenuItem key={item.label} asChild>
                <Link
                  href={item.href}
                  download
                  className="w-full text-sm py-1.5 px-2 hover:bg-accent rounded"
                >
                  {item.label}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
