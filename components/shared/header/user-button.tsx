"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ChevronDownIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useSession } from "next-auth/react";
import useCartService from "@/hooks/use-cart-service";

export default function UserButton() {
  const t = useTranslations();
  const { data: session } = useSession();
  const { signOut } = useCartService();

  return (
    <div className="flex gap-2 items-center">
      <DropdownMenu>
        <DropdownMenuTrigger className="header-button" asChild>
          <div className="flex items-center">
            <div className="flex flex-col text-xs text-left">
              <span className="hidden md:block font-normal">
                {t("Header.Hello")},{" "}
                {session ? session.user.name : t("Header.sign in")}
              </span>
              <span className="font-semibold">
                {t("Header.Account & Orders")}
              </span>
            </div>
            <ChevronDownIcon />
          </div>
        </DropdownMenuTrigger>
        {session ? (
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {session.user.name}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {session.user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              <Link className="w-full" href="/account">
                <DropdownMenuItem>{t("Header.Your account")}</DropdownMenuItem>
              </Link>
              <Link className="w-full" href="/account/orders">
                <DropdownMenuItem>{t("Header.Your orders")}</DropdownMenuItem>
              </Link>

              {session.user.role === "Admin" && (
                <Link className="w-full" href="/admin/overview">
                  <DropdownMenuItem>{t("Header.Admin")}</DropdownMenuItem>
                </Link>
              )}
            </DropdownMenuGroup>
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              className="p-0 mb-1"
            >
              <Button
                onClick={() => signOut()}
                className="w-full py-4 px-2 h-4 justify-start"
                variant="ghost"
              >
                {t("Header.Sign out")}
              </Button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        ) : (
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Link
                  className={cn(buttonVariants(), "w-full")}
                  href="/sign-in"
                >
                  {t("Header.Sign in")}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuLabel>
              <div className="font-normal">
                {t("Header.New Customer")}?{" "}
                <Link href="/sign-up">{t("Header.Sign up")}</Link>
              </div>
            </DropdownMenuLabel>
          </DropdownMenuContent>
        )}
      </DropdownMenu>
    </div>
  );
}
