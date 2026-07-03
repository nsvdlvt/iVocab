import React from "react";
import { User, Target, Monitor, Bell, Save } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { SectionHeader } from "@/components/common/SectionHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireUser } from "@/lib/auth/require-user";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const profile = await requireUser();

  // default profile name fallback if empty
  const displayName = profile.display_name || "Học viên";
  const userEmail = profile.email || "";

  return (
    <PageContainer className="max-w-4xl space-y-6 md:space-y-8">
      <PageHeader
        title="Cài đặt hệ thống"
        description="Quản lý cấu hình học tập, mục tiêu từ mới và tùy biến giao diện."
      />

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 rounded-xl bg-muted/65 p-1 max-w-md border border-border">
          <TabsTrigger value="profile" className="rounded-lg gap-1.5 text-xs md:text-sm cursor-pointer">
            <User className="h-4 w-4 shrink-0" />
            Hồ sơ
          </TabsTrigger>
          <TabsTrigger value="goal" className="rounded-lg gap-1.5 text-xs md:text-sm cursor-pointer">
            <Target className="h-4 w-4 shrink-0" />
            Mục tiêu
          </TabsTrigger>
          <TabsTrigger value="appearance" className="rounded-lg gap-1.5 text-xs md:text-sm cursor-pointer">
            <Monitor className="h-4 w-4 shrink-0" />
            Giao diện
          </TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-lg gap-1.5 text-xs md:text-sm cursor-pointer">
            <Bell className="h-4 w-4 shrink-0" />
            Thông báo
          </TabsTrigger>
        </TabsList>

        {/* PROFILE TAB */}
        <TabsContent value="profile">
          <SectionCard className="space-y-6">
            <SectionHeader
              title="Thông tin tài khoản"
              description="Cập nhật tên hiển thị và email của bạn"
            />
            <div className="space-y-4 max-w-md">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Họ và tên</label>
                <Input type="text" defaultValue={displayName} className="rounded-xl h-10 border-border" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Email liên hệ</label>
                <Input type="email" defaultValue={userEmail} disabled className="rounded-xl h-10 border-border opacity-70" />
              </div>
            </div>
            <div className="pt-2">
              <Button className="rounded-xl gap-2 cursor-pointer shadow-sm">
                <Save className="h-4 w-4" />
                Lưu thay đổi
              </Button>
            </div>
          </SectionCard>
        </TabsContent>

        {/* GOAL TAB */}
        <TabsContent value="goal">
          <SectionCard className="space-y-6">
            <SectionHeader
              title="Mục tiêu học tập"
              description="Điều chỉnh cường độ từ mới và cấu hình giọng đọc"
            />
            <div className="space-y-5 max-w-md">
              <div className="space-y-3">
                <label className="text-xs font-bold text-muted-foreground uppercase block">Mục tiêu từ mới mỗi ngày</label>
                <div className="grid grid-cols-3 gap-2">
                  {[10, 20, 50].map((num) => (
                    <Button
                      key={num}
                      type="button"
                      variant={num === 20 ? "default" : "outline"}
                      className="rounded-xl h-10 font-semibold cursor-pointer"
                    >
                      {num} từ / ngày
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-muted-foreground uppercase block">Giọng phát âm mặc định</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button type="button" variant="default" className="rounded-xl h-10 font-semibold cursor-pointer">
                    Anh - Mỹ (US Voice)
                  </Button>
                  <Button type="button" variant="outline" className="rounded-xl h-10 font-semibold cursor-pointer">
                    Anh - Anh (UK Voice)
                  </Button>
                </div>
              </div>
            </div>
            <div className="pt-2">
              <Button className="rounded-xl gap-2 cursor-pointer shadow-sm">
                <Save className="h-4 w-4" />
                Lưu mục tiêu
              </Button>
            </div>
          </SectionCard>
        </TabsContent>

        {/* APPEARANCE TAB */}
        <TabsContent value="appearance">
          <SectionCard className="space-y-6">
            <SectionHeader
              title="Tùy chọn giao diện"
              description="Lựa chọn chủ đề sáng/tối cho hệ thống"
            />
            <div className="grid gap-4 sm:grid-cols-3 max-w-2xl">
              <div className="border border-border rounded-2xl p-4 space-y-3 bg-card hover:border-primary/50 cursor-pointer transition-all">
                <div className="h-20 w-full rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-800 text-xs font-bold shadow-sm">
                  Chủ đề Sáng
                </div>
                <div className="text-center font-bold text-xs text-foreground">Sáng (Light)</div>
              </div>

              <div className="border border-primary rounded-2xl p-4 space-y-3 bg-card cursor-pointer transition-all shadow-sm">
                <div className="h-20 w-full rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-300 text-xs font-bold shadow-sm">
                  Chủ đề Tối
                </div>
                <div className="text-center font-bold text-xs text-foreground">Tối (Dark)</div>
              </div>

              <div className="border border-border rounded-2xl p-4 space-y-3 bg-card hover:border-primary/50 cursor-pointer transition-all">
                <div className="h-20 w-full rounded-xl bg-gradient-to-r from-slate-50 to-zinc-950 border border-border flex items-center justify-center text-foreground text-xs font-bold shadow-sm">
                  Mặc định hệ thống
                </div>
                <div className="text-center font-bold text-xs text-foreground">Hệ thống (System)</div>
              </div>
            </div>
            <div className="pt-2">
              <Button className="rounded-xl gap-2 cursor-pointer shadow-sm">
                <Save className="h-4 w-4" />
                Lưu giao diện
              </Button>
            </div>
          </SectionCard>
        </TabsContent>

        {/* NOTIFICATIONS TAB */}
        <TabsContent value="notifications">
          <SectionCard className="space-y-6">
            <SectionHeader
              title="Nhắc nhở học tập"
              description="Cấu hình hệ thống gửi thông báo nhắc nhở rèn luyện"
            />
            <div className="space-y-4 max-w-md">
              <div className="flex items-center justify-between border border-border rounded-2xl p-4 bg-card shadow-sm">
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-foreground">Thông báo nhắc nhở</div>
                  <p className="text-xs text-muted-foreground">Báo khi chưa học đủ chỉ tiêu từ vựng ngày</p>
                </div>
                <div className="h-6 w-11 bg-primary rounded-full p-0.5 flex items-center justify-end cursor-pointer transition-all">
                  <div className="h-5 w-5 bg-background rounded-full shadow-sm" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Giờ gửi thông báo</label>
                <Input type="time" defaultValue="20:00" className="rounded-xl h-10 border-border" />
              </div>
            </div>
            <div className="pt-2">
              <Button className="rounded-xl gap-2 cursor-pointer shadow-sm">
                <Save className="h-4 w-4" />
                Lưu cấu hình thông báo
              </Button>
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
