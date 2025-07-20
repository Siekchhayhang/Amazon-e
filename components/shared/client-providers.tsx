"use client";

import { SessionProvider } from "next-auth/react";
import useCartSidebar from "@/hooks/use-cart-sidebar";
import { ClientSetting } from "@/types";
import React from "react";
import { Toaster } from "../ui/toaster";
import AppInitializer from "./app-initializer";
import CartSidebar from "./cart-sidebar";
import Chat from "./chat/chat";
import { ThemeProvider } from "./theme-provider";
import ToastManager from "./toast-manager";

// 1. Create a new child component for the layout logic.
// This component will be rendered *inside* the SessionProvider.
function AppContent({ children }: { children: React.ReactNode }) {
  // 2. Call the hook here, safely within the provider's context.
  const visible = useCartSidebar();

  return (
    <>
      {visible ? (
        <div className="flex min-h-screen">
          <div className="flex-1 overflow-hidden">{children}</div>
          <CartSidebar />
        </div>
      ) : (
        <div>{children}</div>
      )}
      <Toaster />
      <Chat />
    </>
  );
}

export default function ClientProviders({
  setting,
  children,
}: {
  setting: ClientSetting;
  children: React.ReactNode;
}) {
  return (
    // 3. The SessionProvider wraps everything.
    <SessionProvider>
      <AppInitializer setting={setting}>
        <ThemeProvider
          attribute="class"
          defaultTheme={setting.common.defaultTheme.toLocaleLowerCase()}
        >
          {/* 4. Render the new child component here. */}
          <AppContent>{children}</AppContent>
          <ToastManager />
        </ThemeProvider>
      </AppInitializer>
    </SessionProvider>
  );
}
