import React from "react";
import type { Metadata } from "next";
import { requireETeamUser } from "@/lib/auth/require-user";
import { ETeamSidebar } from "@/components/e-team/layout/ETeamSidebar";
import { ETeamNavbar } from "@/components/e-team/layout/ETeamNavbar";
import { perfEnd, perfStart } from "@/lib/perf";

export const metadata: Metadata = {
  title: {
    default: "E-Team Workspace",
    template: "%s | E-Team Vocabee",
  },
  description: "Không gian làm việc dành riêng cho thành viên E-Team Vocabee.",
};

export const dynamic = "force-dynamic";

interface ETeamLayoutProps {
  children: React.ReactNode;
}

export default async function ETeamLayout({ children }: ETeamLayoutProps) {
  const timer = perfStart("route:e-team-layout");
  try {
    const profile = await requireETeamUser();

    return (
      <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
        <ETeamNavbar profile={profile} />
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <ETeamSidebar profile={profile} />
          <main className="flex-1 overflow-y-auto min-w-0">
            {children}
          </main>
        </div>
      </div>
    );
  } finally {
    perfEnd(timer);
  }
}
