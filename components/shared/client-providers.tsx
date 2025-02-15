"use client";
import useCartSidebar from "@/hooks/use-cart-sidebar";
import { ClientSetting } from "@/types";
import React from "react";
import { Toaster } from "../ui/toaster";
import AppInitializer from "./app-initializer";
import CartSidebar from "./cart-sidebar";
import { ThemeProvider } from "./theme-provider";

export default function ClientProviders({
  setting,
  children,
}: {
  setting: ClientSetting;
  children: React.ReactNode;
}) {
  const visible = useCartSidebar();

  return (
    <AppInitializer setting={setting}>
      <ThemeProvider
        attribute="class"
        defaultTheme={setting.common.defaultTheme.toLocaleLowerCase()}
      >
        {visible ? (
          <div className="flex min-h-screen">
            <div className="flex-1 overflow-hidden">{children}</div>
            <CartSidebar />
          </div>
        ) : (
          <div>{children}</div>
        )}
        <Toaster />
      </ThemeProvider>
    </AppInitializer>
  );
}
