"use client";

import * as React from "react";
import { ThemeProvider } from "./ThemeProvider";
import { SidebarProvider } from "./SidebarProvider";
import { Toaster } from "@/components/ui/sonner";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { SmartTextSelectionTranslator } from "@/components/features/selection-translation/SmartTextSelectionTranslator";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <SidebarProvider>
        {children}
        <Toaster position="top-right" richColors />
        <InstallPrompt />
        <ServiceWorkerRegister />
        <SmartTextSelectionTranslator />
      </SidebarProvider>
    </ThemeProvider>
  );
}
