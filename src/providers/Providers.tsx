"use client";

import * as React from "react";
import { ThemeProvider } from "./ThemeProvider";
import { SidebarProvider } from "./SidebarProvider";
import { Toaster } from "@/components/ui/sonner";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SidebarProvider>
        {children}
        <Toaster position="top-right" richColors />
        <InstallPrompt />
        <ServiceWorkerRegister />
      </SidebarProvider>
    </ThemeProvider>
  );
}
