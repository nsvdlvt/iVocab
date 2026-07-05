import React from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { requireUser } from "@/lib/auth/require-user";
import { SectionCard } from "@/components/common/SectionCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const dynamic = "force-dynamic";

export default async function SettingsProfilePage() {
  const profile = await requireUser();

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Thông tin cá nhân"
        description="Quản lý thông tin tài khoản hiển thị của bạn."
      />

      <SectionCard className="max-w-xl p-6 space-y-6 border-border bg-card rounded-2xl">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile.avatar_url || ""} />
            <AvatarFallback className="bg-primary/5 text-primary text-lg font-bold">
              {profile.display_name?.substring(0, 2).toUpperCase() || "IV"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-base font-bold text-foreground">{profile.display_name || "Học viên"}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{profile.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 pt-2 border-t border-border/40 text-xs">
          <div className="flex justify-between py-1.5 border-b border-border/20">
            <span className="font-medium text-muted-foreground">Mã học viên</span>
            <span className="font-bold text-foreground select-all">{profile.id}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-border/20">
            <span className="font-medium text-muted-foreground">Tên hiển thị</span>
            <span className="font-bold text-foreground">{profile.display_name || "-"}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-border/20">
            <span className="font-medium text-muted-foreground">Email đăng ký</span>
            <span className="font-bold text-foreground">{profile.email || "-"}</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="font-medium text-muted-foreground">Trình độ mục tiêu</span>
            <span className="font-bold text-foreground capitalize">{profile.level || "basic"}</span>
          </div>
        </div>
      </SectionCard>
    </PageContainer>
  );
}
