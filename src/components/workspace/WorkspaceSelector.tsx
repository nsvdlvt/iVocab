"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Briefcase,
  ArrowRight,
  ShieldCheck,
  LogOut,
  Sparkles,
} from "lucide-react";
import { BrandLogo } from "@/components/common/BrandLogo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import type { UserProfile } from "@/lib/auth/get-current-user";
import {
  canAccessVocabeer,
  canAccessETeam,
  canAccessAdmin,
  normalizeRole,
  ROLE_DISPLAY_NAMES,
  ROLE_BADGE_STYLES,
} from "@/lib/auth/roles";
import { ROUTES } from "@/constants/routes";
import { logoutAction } from "@/actions/auth/logout";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface WorkspaceSelectorProps {
  profile: UserProfile;
}

export function WorkspaceSelector({ profile }: WorkspaceSelectorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedDestination, setSelectedDestination] = React.useState<string | null>(null);

  const role = normalizeRole(profile.role);
  const roleName = ROLE_DISPLAY_NAMES[role];
  const roleStyle = ROLE_BADGE_STYLES[role];

  const hasVocabeer = canAccessVocabeer(profile.role);
  const hasETeam = canAccessETeam(profile.role);
  const isAdmin = canAccessAdmin(profile.role);

  const authorizedCount = [hasVocabeer, hasETeam, isAdmin].filter(Boolean).length;

  const handleSelectWorkspace = (destination: string) => {
    setSelectedDestination(destination);
    // Remember last chosen workspace in a secure 30-day cookie
    try {
      document.cookie = `vocabee_last_workspace=${encodeURIComponent(
        destination
      )}; path=/; max-age=2592000; SameSite=Lax`;
    } catch {}

    startTransition(() => {
      router.push(destination);
    });
  };

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut().catch(() => {});
      const res = await logoutAction().catch(() => ({ redirectTo: ROUTES.LOGIN }));
      window.location.replace(res?.redirectTo || ROUTES.LOGIN);
    } catch {
      toast.error("Không thể đăng xuất. Vui lòng thử lại.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#030f31] text-foreground transition-colors selection:bg-[#f9971d]/20">
      {/* Top Header */}
      <header className="w-full border-b border-border/70 bg-background/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <BrandLogo
            className="gap-2"
            imageClassName="h-8 w-8"
            textClassName="text-xl"
          />

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full border border-border/80 bg-background text-xs">
              <span className="text-muted-foreground">Xin chào,</span>
              <span className="font-semibold text-foreground max-w-[150px] truncate">
                {profile.display_name || profile.email}
              </span>
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}
              >
                {roleName}
              </span>
            </div>

            <ThemeToggle />

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-xs text-muted-foreground hover:text-destructive cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5 mr-1" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
        <div
          className={`w-full space-y-8 my-auto transition-all duration-200 ${
            authorizedCount === 1
              ? "max-w-md mx-auto"
              : authorizedCount === 2
              ? "max-w-3xl mx-auto"
              : "max-w-5xl mx-auto"
          }`}
        >
          {/* Title and Description */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#f9971d]/30 bg-[#f9971d]/10 text-xs font-semibold text-[#f9971d]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Vocabee Platform</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
              Chọn không gian làm việc
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
              {authorizedCount === 1
                ? "Không gian học tập sẵn sàng cho bạn tiếp tục."
                : "Chọn không gian làm việc bạn muốn truy cập."}
            </p>
          </div>

          {/* Cards Grid */}
          <div
            className={`grid gap-6 ${
              authorizedCount === 1
                ? "grid-cols-1"
                : authorizedCount === 2
                ? "grid-cols-1 md:grid-cols-2"
                : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {/* Card Vocabeer */}
            {hasVocabeer && (
              <div
                className={`relative flex flex-col justify-between rounded-2xl border bg-card p-6 sm:p-8 shadow-sm hover:shadow-md transition-all duration-200 group ${
                  selectedDestination === ROUTES.VOCABEER_DASHBOARD
                    ? "ring-2 ring-[#f9971d] border-transparent"
                    : "border-border hover:border-[#f9971d]/50"
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-12 w-12 rounded-xl bg-[#f9971d]/10 border border-[#f9971d]/20 flex items-center justify-center text-[#f9971d]">
                      <GraduationCap className="h-6 w-6" />
                    </div>
                    <span className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                      Học tập
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h2 className="text-xl font-bold text-foreground group-hover:text-[#f9971d] transition-colors">
                      Vocabeer
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      Không gian học tập và chinh phục từ vựng tiếng Anh cá nhân.
                    </p>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-border/60">
                  <Button
                    type="button"
                    onClick={() => handleSelectWorkspace(ROUTES.VOCABEER_DASHBOARD)}
                    disabled={isPending}
                    className="w-full bg-[#f9971d] hover:bg-[#e68817] text-white font-semibold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <span>Vào không gian học tập</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* Card E-Team */}
            {hasETeam && (
              <div
                className={`relative flex flex-col justify-between rounded-2xl border bg-card p-6 sm:p-8 shadow-sm hover:shadow-md transition-all duration-200 group ${
                  selectedDestination === ROUTES.ETEAM_DASHBOARD
                    ? "ring-2 ring-purple-600 border-transparent"
                    : "border-border hover:border-purple-500/50"
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-12 w-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                      <Briefcase className="h-6 w-6" />
                    </div>
                    <span className="text-[11px] font-semibold tracking-wider uppercase text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md">
                      Workspace
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h2 className="text-xl font-bold text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      E-Team
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      Không gian làm việc và quản lý từ vựng dành cho thành viên E-Team.
                    </p>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-border/60">
                  <Button
                    type="button"
                    onClick={() => handleSelectWorkspace(ROUTES.ETEAM_DASHBOARD)}
                    disabled={isPending}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <span>Vào E-Team</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* Card Admin Console */}
            {isAdmin && (
              <div
                className={`relative flex flex-col justify-between rounded-2xl border bg-card p-6 sm:p-8 shadow-sm hover:shadow-md transition-all duration-200 group ${
                  selectedDestination === ROUTES.ADMIN
                    ? "ring-2 ring-amber-500 border-transparent"
                    : "border-border hover:border-amber-500/50"
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <span className="text-[11px] font-semibold tracking-wider uppercase text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                      Quản trị
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h2 className="text-xl font-bold text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      Admin Console
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      Không gian quản trị hệ thống, dữ liệu từ vựng và tài khoản người dùng.
                    </p>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-border/60">
                  <Button
                    type="button"
                    onClick={() => handleSelectWorkspace(ROUTES.ADMIN)}
                    disabled={isPending}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <span>Vào trang Quản trị</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-muted-foreground border-t border-border/50">
        Vocabee Platform &copy; 2026. Tất cả các quyền được bảo lưu.
      </footer>
    </div>
  );
}
