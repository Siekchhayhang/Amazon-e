"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { getDirection } from "@/i18n-config";
import { ChevronRight, MenuIcon, UserCircle, X } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";

export default function Sidebar({ categories }: { categories: string[] }) {
  const { data: session } = useSession();
  const locale = useLocale();
  const t = useTranslations();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <Drawer
      open={isDrawerOpen}
      onOpenChange={setIsDrawerOpen}
      direction={getDirection(locale) === "rtl" ? "left" : "left"}
    >
      <DrawerTrigger className="header-button flex items-center !p-2">
        <MenuIcon className="h-5 w-5 mr-1" />
        {t("Header.All")}
      </DrawerTrigger>
      <DrawerContent className="w-[350px] mt-0 top-0">
        <div className="flex flex-col h-full">
          {/* User Sign In Section */}
          <div className="dark bg-gray-800 text-foreground flex items-center justify-between">
            <DrawerHeader>
              <DrawerTitle className="flex items-center">
                <UserCircle className="h-6 w-6 mr-2" />
                {session ? (
                  <DrawerClose asChild>
                    <Link href="/account">
                      <span className="text-lg font-semibold">
                        {t("Header.Hello")}, {session.user.name}
                      </span>
                    </Link>
                  </DrawerClose>
                ) : (
                  <DrawerClose asChild>
                    <Link href="/sign-in">
                      <span className="text-lg font-semibold">
                        {t("Header.Hello")}, {t("Header.sign in")}
                      </span>
                    </Link>
                  </DrawerClose>
                )}
              </DrawerTitle>
              <DrawerDescription></DrawerDescription>
            </DrawerHeader>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="mr-2">
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </Button>
            </DrawerClose>
          </div>

          {/* Shop By Category */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">
                {t("Header.Shop By Department")}
              </h2>
            </div>
            <nav className="flex flex-col">
              {categories.map((category) => (
                <DrawerClose asChild key={category}>
                  <Link
                    href={`/search?category=${category}`}
                    className={`flex items-center justify-between item-button`}
                  >
                    <span>{category}</span>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </DrawerClose>
              ))}
            </nav>
          </div>

          {/* Setting and Help */}
          <div className="border-t flex flex-col">
            <div className="p-4">
              <h2 className="text-lg font-semibold">
                {t("Header.Help & Settings")}
              </h2>
            </div>
            <DrawerClose asChild>
              <Link href="/account" className="item-button">
                {t("Header.Your account")}
              </Link>
            </DrawerClose>{" "}
            <DrawerClose asChild>
              <Link href="/page/customer-service" className="item-button">
                {t("Header.Customer Service")}
              </Link>
            </DrawerClose>
            {session ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    onClick={() => setIsDrawerOpen(false)}
                    className="w-full justify-start item-button text-base"
                    variant="ghost"
                  >
                    {t("Header.Sign out")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="w-[90vw] max-w-md rounded-md">
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you sure you want to sign out?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      You will be logged out of your account.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() =>
                        signOut({ callbackUrl: "/?signed_out=true" })
                      }
                    >
                      Sign Out
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <DrawerClose asChild>
                <Link href="/sign-in" className="item-button">
                  {t("Header.Sign in")}
                </Link>
              </DrawerClose>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
