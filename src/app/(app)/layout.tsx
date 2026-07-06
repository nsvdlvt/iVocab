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
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    );
  } finally {
    perfEnd(timer);
  }
}
