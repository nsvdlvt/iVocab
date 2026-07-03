"use client";

import React from "react";
import { Award, RefreshCw, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/common/SectionCard";

export function QuizResultPlaceholder() {
  return (
    <SectionCard className="border border-border bg-muted/10 p-6 md:p-8 text-center max-w-xl mx-auto space-y-5 rounded-2xl">
      <div className="mx-auto rounded-full bg-amber-500/10 p-3 text-amber-500 w-14 h-14 flex items-center justify-center">
        <Award className="h-8 w-8" />
      </div>
      <div className="space-y-1">
        <h4 className="text-lg font-bold text-foreground">Hoàn thành bài Quiz thử nghiệm!</h4>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
          Đây là màn hình kết quả minh họa giao diện sau khi bạn trả lời xong toàn bộ các câu hỏi.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 py-2 max-w-sm mx-auto">
        <div className="bg-card border border-border p-3 rounded-xl">
          <div className="text-xl font-bold text-primary">3/4</div>
          <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Số câu đúng</div>
        </div>
        <div className="bg-card border border-border p-3 rounded-xl">
          <div className="text-xl font-bold text-emerald-500">75%</div>
          <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Chính xác</div>
        </div>
        <div className="bg-card border border-border p-3 rounded-xl">
          <div className="text-xl font-bold text-violet-500">60</div>
          <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Điểm thưởng</div>
        </div>
      </div>

      <div className="flex justify-center gap-3 pt-2">
        <Button variant="outline" className="rounded-xl gap-2 cursor-pointer">
          <RefreshCw className="h-4 w-4" />
          Làm lại
        </Button>
        <Button className="rounded-xl gap-2 cursor-pointer shadow-sm">
          Tiếp tục
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </SectionCard>
  );
}
