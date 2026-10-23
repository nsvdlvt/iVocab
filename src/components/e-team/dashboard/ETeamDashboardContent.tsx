"use client";

import React from "react";
import Link from "next/link";
import {
  Briefcase,
  GraduationCap,
  ShieldCheck,
  ArrowLeftRight,
  Sparkles,
  Inbox,
  Clock,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UserProfile } from "@/lib/auth/get-current-user";
import {
  canAccessVocabeer,
  canAccessAdmin,
  normalizeRole,
  ROLE_DISPLAY_NAMES,
  ROLE_BADGE_STYLES,
} from "@/lib/auth/roles";
import { ROUTES } from "@/constants/routes";

interface ETeamDashboardContentProps {
  profile: UserProfile;
}

export function ETeamDashboardContent({ profile }: ETeamDashboardContentProps) {
  const role = normalizeRole(profile.role);
  const roleName = ROLE_DISPLAY_NAMES[role];
  const roleStyle = ROLE_BADGE_STYLES[role];
  const displayName = profile.display_name || profile.email.split("@")[0] || "Thành viên";

  const hasVocabeer = canAccessVocabeer(profile.role);
  const isAdmin = canAccessAdmin(profile.role);

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-6 px-4 sm:px-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-linear-to-r from-purple-500/10 via-background to-background p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}
              >
                <Briefcase className="h-3 w-3" />
                {roleName}
              </span>
              <span className="text-xs text-muted-foreground">E-Team Workspace</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              E-Team Dashboard
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Xin chào, <span className="font-semibold text-foreground">{displayName}</span>! Chúc bạn một ngày làm việc hiệu quả.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link href={ROUTES.SELECT_WORKSPACE}>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs cursor-pointer"
              >
                <ArrowLeftRight className="h-3.5 w-3.5" />
                <span>Đổi không gian</span>
              </Button>
            </Link>
            {hasVocabeer && (
              <Link href={ROUTES.VOCABEER_DASHBOARD}>
                <Button
                  size="sm"
                  className="gap-1.5 text-xs bg-[#f9971d] hover:bg-[#e68817] text-white cursor-pointer"
                >
                  <GraduationCap className="h-3.5 w-3.5" />
                  <span>Vào Vocabeer</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Workspace Overview & Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Introduction Card */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">Giới thiệu Không gian E-Team</h2>
                <p className="text-xs text-muted-foreground">Cổng thông tin và điều hành nội bộ của nhóm dự án</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Không gian E-Team là môi trường cộng tác độc lập dành riêng cho các thành viên phụ trách nội dung, kiểm duyệt từ vựng và vận hành hệ thống Vocabee. Mọi hoạt động tại đây được tách biệt hoàn toàn với không gian học tập của học viên để đảm bảo tính chuyên biệt và bảo mật.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/40 border border-border/60">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-semibold text-foreground">Tài khoản được xác thực</div>
                  <div className="text-muted-foreground text-[11px] mt-0.5">Vai trò {roleName} có quyền truy cập cổng E-Team.</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/40 border border-border/60">
                <Lock className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-semibold text-foreground">Bảo mật đa tầng</div>
                  <div className="text-muted-foreground text-[11px] mt-0.5">Xác thực quyền từ máy chủ với Supabase RLS.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Honest Empty State for Business Modules */}
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 sm:p-12 text-center space-y-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <Inbox className="h-6 w-6" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-base font-semibold text-foreground">
                Chưa có dữ liệu nghiệp vụ
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Tài khoản của bạn hiện chưa được phân công nhiệm vụ cụ thể nào. Các công cụ kiểm duyệt từ vựng, tài liệu đọc hiểu và quy trình làm việc của E-Team sẽ được kích hoạt tại đây khi được quản trị viên phân bổ.
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full">
              <Clock className="h-3.5 w-3.5" />
              <span>Đang đồng bộ với hệ thống vận hành</span>
            </div>
          </div>
        </div>

        {/* Sidebar Info & Shortcuts */}
        <div className="space-y-6">
          {/* User Account Info */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Thông tin tài khoản
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium text-foreground max-w-[160px] truncate" title={profile.email}>
                  {profile.email}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <span className="text-muted-foreground">Vai trò:</span>
                <span className="font-semibold text-foreground">{roleName}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <span className="text-muted-foreground">Phạm vi truy cập:</span>
                <span className="text-foreground">E-Team Workspace</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Trạng thái:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Hoạt động</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Liên kết chuyển hướng
            </h3>
            <div className="space-y-2">
              <Link href={ROUTES.SELECT_WORKSPACE} className="block">
                <Button variant="outline" size="sm" className="w-full justify-start text-xs gap-2 cursor-pointer">
                  <ArrowLeftRight className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Màn hình chọn không gian</span>
                </Button>
              </Link>
              {hasVocabeer && (
                <Link href={ROUTES.VOCABEER_DASHBOARD} className="block">
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs gap-2 cursor-pointer">
                    <GraduationCap className="h-3.5 w-3.5 text-[#f9971d]" />
                    <span>Không gian học tập (Vocabeer)</span>
                  </Button>
                </Link>
              )}
              {isAdmin && (
                <Link href={ROUTES.ADMIN} className="block">
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs gap-2 cursor-pointer border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Trang quản trị (Admin Console)</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
