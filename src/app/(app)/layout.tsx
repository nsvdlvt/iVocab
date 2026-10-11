import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { AppMain } from "@/components/layout/AppMain";
import { perfEnd, perfStart } from "@/lib/perf";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const timer = perfStart("route:app-layout");
  try {
    return (
      <div className="flex h-screen flex-col overflow-hidden">
        <Navbar />
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <Sidebar />
          <AppMain>
            {children}
          </AppMain>
        </div>
        <BottomNav />
      </div>
    );
  } finally {
    perfEnd(timer);
  }
}
