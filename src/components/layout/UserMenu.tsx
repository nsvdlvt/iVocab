"use client";

import React, { useEffect, useState } from "react";
import { User, LogOut, ChevronsUpDown, Loader2 } from "lucide-react";
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

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface UserMenuProps {
  profile?: Profile | null;
}

export function UserMenu({ profile: initialProfile }: UserMenuProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(initialProfile || null);
  const [isLoading, setIsLoading] = useState(!initialProfile);
  const supabase = createClient();

  useEffect(() => {
    if (initialProfile) {
      const handle = setTimeout(() => {
        setProfile(initialProfile);
        setIsLoading(false);
      }, 0);
      return () => clearTimeout(handle);
    }

    async function fetchProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="flex items-center justify-between gap-3 w-full p-2.5 rounded-xl cursor-pointer hover:bg-muted/80 active:bg-muted transition-all select-none border border-transparent outline-none focus-visible:ring-1 focus-visible:ring-primary/30"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="h-9 w-9 shrink-0 ring-1 ring-border/20">
                <AvatarImage src={avatar} alt={name} />
                <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    name.substring(0, 2).toUpperCase()
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col text-left min-w-0">
                <span className="text-xs font-semibold text-foreground truncate leading-snug">
                  {name}
                </span>
                <span className="text-[10px] text-muted-foreground truncate leading-normal mt-0.5">
                  {email}
                </span>
              </div>
            </div>
            <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
          </button>
        }
      />
      <DropdownMenuContent
        align="start"
        side="top"
        sideOffset={8}
        className="w-64 rounded-2xl p-2.5 shadow-xl border border-[#E5E7EB] dark:border-border/60 bg-popover text-popover-foreground z-50 select-none animate-in slide-in-from-bottom-2 duration-150"
      >
        <div className="font-normal px-2.5 py-2">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarImage src={avatar} alt={name} />
              <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                {name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 text-left">
              <p className="text-xs font-bold leading-snug text-foreground truncate">{name}</p>
              <p className="text-[10px] leading-normal text-muted-foreground truncate mt-0.5">{email}</p>
            </div>
          </div>
        </div>
        
        <DropdownMenuSeparator className="-mx-2.5 my-2 bg-border/40" />
        
        <DropdownMenuItem
          onClick={() => router.push("/settings/profile")}
          className="rounded-xl px-2.5 py-2 text-xs font-medium cursor-pointer flex items-center gap-2 hover:bg-muted transition-colors"
        >
          <User className="h-4 w-4 text-muted-foreground" />
          <span>Thông tin cá nhân</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="-mx-2.5 my-2 bg-border/40" />
        
        <DropdownMenuItem
          onClick={handleLogout}
          variant="destructive"
          className="rounded-xl px-2.5 py-2 text-xs font-semibold cursor-pointer flex items-center gap-2 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Đăng xuất</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
