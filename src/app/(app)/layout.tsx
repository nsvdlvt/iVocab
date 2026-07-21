import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
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
          <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    );
  } finally {
    perfEnd(timer);
  }
}
