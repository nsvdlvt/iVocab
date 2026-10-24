"use client";

import React from "react";
import Link from "next/link";
import { Briefcase, ArrowLeftRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { BrandLogo } from "@/components/common/BrandLogo";
import { ROUTES } from "@/constants/routes";
import type { UserProfile } from "@/lib/auth/get-current-user";
import { normalizeRole, ROLE_DISPLAY_NAMES, ROLE_BADGE_STYLES } from "@/lib/auth/roles";

interface ETeamNavbarProps {
  profile?: UserProfile | null;
}

export function ETeamNavbar({ profile }: ETeamNavbarProps) {
  const role = normalizeRole(profile?.role);
  const roleName = ROLE_DISPLAY_NAMES[role];
  const roleStyle = ROLE_BADGE_STYLES[role];

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-background/85 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <Link href={ROUTES?.ETEAM_DASHBOARD || "/e-team/dashboard"} className="flex items-center md:hidden">
            <BrandLogo
              className="gap-2"
              imageClassName="h-7 w-7"
              textClassName="text-lg"
            />
          </Link>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <Briefcase className="h-3.5 w-3.5" />
              <span>E-Team Workspace</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {profile && (
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">{profile.display_name || profile.email}</span>
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}
              >
                {roleName}
              </span>
            </div>
          )}

          <Link
            href={ROUTES?.SELECT_WORKSPACE || "/select-workspace"}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs h-8 gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground")}
            title="Chuyển đổi không gian làm việc"
            aria-label="Chuyển đổi không gian làm việc"
          >
            <ArrowLeftRight className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Đổi không gian</span>
          </Link>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
