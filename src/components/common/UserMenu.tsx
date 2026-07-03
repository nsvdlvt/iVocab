"use client";

import React, { useEffect, useState } from "react";
import { User, Settings, LogOut, Award, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { logoutAction } from "@/actions/auth/logout";
import { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export function UserMenu() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
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
  }, [supabase]);

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
  const level = profile?.level || "Basic (A1)";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center justify-center rounded-full ring-2 ring-primary/10 hover:ring-primary/20 transition-all outline-none cursor-pointer">
        <Avatar className="h-9 w-9">
          <AvatarImage src={avatar} alt={name} />
          <AvatarFallback className="bg-primary/5 text-primary text-xs font-semibold">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              name.substring(0, 2).toUpperCase()
            )}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 rounded-2xl p-2" align="end">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-semibold leading-none line-clamp-1">{name}</p>
            <p className="text-xs leading-none text-muted-foreground line-clamp-1">{email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem className="rounded-xl cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Trang cá nhân</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="rounded-xl cursor-pointer">
            <Award className="mr-2 h-4 w-4 text-amber-500" />
            <span className="flex items-center gap-1">
              Hạng: <span className="font-medium text-amber-600 dark:text-amber-400">{level}</span>
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem className="rounded-xl cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Cài đặt</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="rounded-xl text-destructive focus:text-destructive cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Đăng xuất</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
