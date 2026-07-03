"use client";

import * as React from "react";
import { ThemeProvider } from "./ThemeProvider";
import { SidebarProvider } from "./SidebarProvider";
import { Toaster } from "@/components/ui/sonner";

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
      </SidebarProvider>
    </ThemeProvider>
  );
}
