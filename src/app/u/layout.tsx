import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { AppMain } from "@/components/layout/AppMain";
import { PushNotificationPromptBanner } from "@/components/notifications/PushNotificationPromptBanner";
import { NotificationPermissionModal } from "@/components/notifications/NotificationPermissionModal";
import { perfEnd, perfStart } from "@/lib/perf";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { canAccessMember } from "@/lib/auth/roles";
import { redirect } from "next/navigation";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default async function MemberLayout({ children }: AppLayoutProps) {
  const timer = perfStart("route:member-layout");
  try {
    const profile = await getCurrentUser();

    if (profile && !canAccessMember(profile.role)) {
      redirect("/403");
    }

    return (
      <div className="flex h-screen flex-col overflow-hidden">
        <Navbar profile={profile} />
        <PushNotificationPromptBanner />
        <NotificationPermissionModal />
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <Sidebar profile={profile} />
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
