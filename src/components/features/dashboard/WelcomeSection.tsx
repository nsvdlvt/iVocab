"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export function WelcomeSection() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();
          if (data) {
            setProfile(data);
          }
        }
      } catch (error) {
        console.error("Lỗi lấy thông tin lời chào:", error);
      }
    }
    fetchProfile();
  }, [supabase]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Chào buổi sáng";
    if (hour < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  };

  const displayName = profile?.display_name || "Học viên";

  return (
    <div className="space-y-1.5 py-1">
      <h2 className="text-xl md:text-2xl font-bold tracking-tight">
        {getGreeting()}, <span className="text-primary">{displayName}</span>! 👋
      </h2>
      <p className="text-xs md:text-sm text-muted-foreground italic leading-relaxed">
        &ldquo;Học một ngoại ngữ mới không chỉ là học những từ khác nhau cho cùng một thứ, mà là học một cách nghĩ khác về mọi thứ.&rdquo;
      </p>
    </div>
  );
}
