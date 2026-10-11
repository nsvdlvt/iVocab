"use client";

import React, { useEffect, useState } from "react";
import { User, LogOut, ChevronsUpDown, Loader2, Settings, BarChart3 } from "lucide-react";
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

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface UserMenuProps {
  profile?: UserProfile | null;
  collapsed?: boolean;
}

export function UserMenu({ profile: initialProfile, collapsed = false }: UserMenuProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(initialProfile || null);
  const [isLoading, setIsLoading] = useState(!initialProfile);
  const supabase = createClient();

  useEffect(() => {
    if (initialProfile) {
      return;
    }

    async function fetchProfile() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();
          if (!error && data) {
            setProfile(data);
          }
        }
      } catch (error) {
        console.error("Lỗi lấy thông tin người dùng:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, [supabase, initialProfile]);

  const handleLogout = async () => {
    try {
      await logoutAction();
    } catch (error) {
      console.error("Lỗi đăng xuất:", error);
    }
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
        className="w-60 rounded-xl p-1.5 shadow-lg border border-border bg-popover text-popover-foreground z-50 select-none"
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
              <p className="text-xs font-semibold leading-snug text-foreground truncate">
                {name}
              </p>
              <p className="text-[11px] leading-tight text-muted-foreground truncate mt-0.5">
                {email}
              </p>
            </div>
          </div>
        </div>

        <DropdownMenuSeparator className="my-1 bg-border/60" />

        <DropdownMenuItem
          onClick={() => router.push("/settings/profile")}
          className="rounded-lg px-2.5 py-1.5 text-xs font-medium cursor-pointer flex items-center gap-2"
        >
          <User className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Hồ sơ cá nhân</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => router.push("/statistics")}
          className="rounded-lg px-2.5 py-1.5 text-xs font-medium cursor-pointer flex items-center gap-2"
        >
          <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Thống kê học tập</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => router.push("/settings")}
          className="rounded-lg px-2.5 py-1.5 text-xs font-medium cursor-pointer flex items-center gap-2"
        >
          <Settings className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Cài đặt</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-1 bg-border/60" />

        <DropdownMenuItem
          onClick={handleLogout}
          variant="destructive"
          className="rounded-lg px-2.5 py-1.5 text-xs font-medium cursor-pointer flex items-center gap-2"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Đăng xuất</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
