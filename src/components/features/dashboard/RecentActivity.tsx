import React from "react";
import { Clock } from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { SectionHeader } from "@/components/common/SectionHeader";

/**
 * RecentActivity — shows a placeholder until the activity log table
 * is implemented in a future phase. No fake data is rendered.
 */
export function RecentActivity() {
  return (
    <SectionCard className="h-full flex flex-col">
      <SectionHeader
        title="Hoạt động gần đây"
        description="Lịch sử học tập của bạn"
      />
      <div className="flex-1 flex flex-col items-center justify-center py-8 text-center gap-3">
        <div className="rounded-2xl bg-muted/60 p-3">
          <Clock className="h-6 w-6 text-muted-foreground/50" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Chưa có hoạt động</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-[180px] leading-relaxed">
            Lịch sử hoạt động sẽ hiển thị tại đây sau khi bạn bắt đầu học.
          </p>
        </div>
      </div>
    </SectionCard>
  );
}
