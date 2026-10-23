"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  User,
  LogOut,
  ChevronsUpDown,
  Loader2,
  Settings,
  BarChart3,
  Bell,
  ShieldCheck,
  ArrowLeftRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { logoutAction } from "@/actions/auth/logout";
import { Database } from "@/types/database";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/lib/auth/get-current-user";
import { canSwitchWorkspace, normalizeRole, ROLE_DISPLAY_NAMES } from "@/lib/auth/roles";
import { ROUTES } from "@/constants/routes";
import { useSidebar } from "@/hooks/use-sidebar";
import { toast } from "sonner";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface UserMenuProps {
  profile?: UserProfile | null;
  collapsed?: boolean;
}

export function UserMenu({ profile: initialProfile, collapsed = false }: UserMenuProps) {
  const router = useRouter();
  const { setMobileOpen } = useSidebar();
  const [clientProfile, setClientProfile] = useState<Profile | null>(null);
  const [isClientLoading, setIsClientLoading] = useState(!initialProfile);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  // Use initialProfile from server if provided, otherwise fallback to client fetched profile
  const profile = initialProfile ?? clientProfile;
  const isLoading = !initialProfile && isClientLoading;

  useEffect(() => {
    // If server profile is provided, no need to fetch on client
    if (initialProfile) {
      return;
    }

    let isMounted = true;

    async function fetchProfile() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          if (isMounted) {
            setClientProfile(null);
            setIsClientLoading(false);
          }
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (!error && data && isMounted) {
          setClientProfile(data);
        }
      } catch (error) {
        console.error("Lỗi lấy thông tin người dùng:", error);
      } finally {
        if (isMounted) {
          setIsClientLoading(false);
        }
      }
    }

    fetchProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && isMounted) {
        setClientProfile(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, initialProfile]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      // 1. Sign out on client to clear browser storage and auth token listeners
      const { error: clientError } = await supabase.auth.signOut().catch((err) => ({
        error: err instanceof Error ? err : new Error(String(err)),
      }));

      // 2. Clear server session and purge all auth cookies via Server Action
      const serverResult = await logoutAction().catch((err) => ({
        success: false,
        error: err instanceof Error ? err.message : String(err),
        redirectTo: ROUTES.LOGIN,
      }));

      if (clientError && !serverResult?.success) {
        throw new Error(clientError.message || serverResult?.error || "Đăng xuất thất bại");
      }

      // 3. Clear local component state
      setClientProfile(null);

      // 4. Perform hard redirect to login page.
      // Using window.location.replace ensures:
      // - The history entry is replaced (prevents Back button from restoring protected state)
      // - All in-memory React state, client-side Router Cache, and active subscriptions are destroyed
      // - Next.js server receives a clean GET request with empty cookies, so middleware evaluates the user as logged out
      const destination = serverResult?.redirectTo || ROUTES.LOGIN;
      window.location.replace(destination);
    } catch (error) {
      console.error("Lỗi đăng xuất:", error);
      setIsLoggingOut(false);
      toast.error("Không thể đăng xuất. Vui lòng thử lại sau.");
    }
  };

  const closeMobileNav = () => {
    setMobileOpen(false);
  };

  const name = profile?.display_name || "Học viên";
  const email = profile?.email || "";
  const avatar = profile?.avatar_url || "";
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  // Only consider admin if not in loading state and verified role is "admin" from database
  const appRole = normalizeRole(profile?.role);
  const roleName = ROLE_DISPLAY_NAMES[appRole];
  const isAdmin = !isLoading && appRole === "admin";
  const canSwitch = !isLoading && canSwitchWorkspace(profile?.role);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            title={collapsed ? name : undefined}
            className={cn(
              "flex items-center justify-between gap-2.5 w-full rounded-lg p-2 cursor-pointer hover:bg-muted/80 active:bg-muted transition-colors select-none border border-transparent outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
              collapsed && "justify-center p-1.5"
            )}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar className="h-8 w-8 shrink-0 ring-1 ring-border">
                <AvatarImage src={avatar} alt={name} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {isLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  ) : initials ? (
                    initials
                  ) : (
                    <User className="h-3.5 w-3.5" />
                  )}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex flex-col text-left min-w-0">
                  <span className="text-xs font-semibold text-foreground truncate leading-snug">
                    {name}
                  </span>
                  <span className="text-[11px] text-muted-foreground truncate leading-tight">
                    {email || "Tài khoản học viên"}
                  </span>
                </div>
              )}
            </div>
            {!collapsed && (
              <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
            )}
          </button>
        }
      />
      <DropdownMenuContent
        align="start"
        side="top"
        sideOffset={8}
        className="w-64 rounded-xl p-1.5 shadow-lg border border-border bg-popover text-popover-foreground z-50 select-none"
      >
        <div className="px-2.5 py-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar className="h-9 w-9 shrink-0 ring-1 ring-border">
              <AvatarImage src={avatar} alt={name} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {initials || <User className="h-4 w-4" />}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 text-left">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs font-semibold leading-snug text-foreground truncate">
                  {name}
                </span>
                <span
                  className="inline-flex items-center rounded-full border border-[#f9971d]/30 bg-[#f9971d]/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#d97706] dark:text-[#f9971d] dark:bg-[#030f31]/60 dark:border-[#f9971d]/40 shrink-0 select-none"
                  title={`Cấp độ tài khoản: ${roleName}`}
                >
                  {roleName.toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] leading-tight text-muted-foreground truncate mt-0.5">
                {email || "Tài khoản học viên"}
              </p>
            </div>
          </div>
        </div>

        <DropdownMenuSeparator className="my-1 bg-border/60" />

        {canSwitch && (
          <>
            <DropdownMenuItem
              onClick={() => {
                closeMobileNav();
                router.push(ROUTES.SELECT_WORKSPACE);
              }}
              className="rounded-lg px-2.5 py-1.5 text-xs font-semibold cursor-pointer flex items-center gap-2 text-primary focus:bg-primary/10"
            >
              <ArrowLeftRight className="h-3.5 w-3.5 text-primary" />
              <span>Chuyển đổi không gian</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1 bg-border/60" />
          </>
        )}

        <DropdownMenuItem
          onClick={() => {
            closeMobileNav();
            router.push(ROUTES.SETTINGS_PROFILE);
          }}
          className="rounded-lg px-2.5 py-1.5 text-xs font-medium cursor-pointer flex items-center gap-2"
        >
          <User className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Hồ sơ cá nhân</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => {
            closeMobileNav();
            router.push(ROUTES.STATISTICS);
          }}
          className="rounded-lg px-2.5 py-1.5 text-xs font-medium cursor-pointer flex items-center gap-2"
        >
          <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Thống kê học tập</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => {
            closeMobileNav();
            router.push(ROUTES.NOTIFICATIONS);
          }}
          className="rounded-lg px-2.5 py-1.5 text-xs font-medium cursor-pointer flex items-center gap-2"
        >
          <Bell className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Thông báo</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => {
            closeMobileNav();
            router.push(ROUTES.SETTINGS);
          }}
          className="rounded-lg px-2.5 py-1.5 text-xs font-medium cursor-pointer flex items-center gap-2"
        >
          <Settings className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Cài đặt</span>
        </DropdownMenuItem>

        {isAdmin && (
          <DropdownMenuItem
            onClick={() => {
              closeMobileNav();
              router.push("/admin");
            }}
            className="rounded-lg px-2.5 py-1.5 text-xs font-medium cursor-pointer flex items-center gap-2 text-foreground"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Trang quản trị</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator className="my-1 bg-border/60" />

        {profile ? (
          <DropdownMenuItem
            onClick={handleLogout}
            disabled={isLoggingOut}
            variant="destructive"
            className="rounded-lg px-2.5 py-1.5 text-xs font-medium cursor-pointer flex items-center gap-2"
          >
            {isLoggingOut ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <LogOut className="h-3.5 w-3.5" />
            )}
            <span>{isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}</span>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onClick={() => {
              closeMobileNav();
              router.push("/login");
            }}
            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-primary focus:bg-primary/10 cursor-pointer flex items-center gap-2"
          >
            <User className="h-3.5 w-3.5" />
            <span>Đăng nhập</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
