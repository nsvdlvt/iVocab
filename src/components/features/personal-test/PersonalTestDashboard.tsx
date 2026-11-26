"use client";

import React, { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Sparkles,
  FileCheck2,
  Clock,
  ArrowRight,
  BookOpen,
  Plus,
  MoreHorizontal,
} from "lucide-react";
import { PersonalTestRecord, PersonalTestAttemptRecord } from "@/types/vocabee-test";
import type { SelectableVocabSet } from "@/lib/personal-test/vocabulary-selection";
import { PersonalTestCard } from "./PersonalTestCard";
import { PersonalTestBuilder } from "./PersonalTestBuilder";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface PersonalTestDashboardProps {
  selectableSets: SelectableVocabSet[];
  tests: PersonalTestRecord[];
  recentAttempts: Array<PersonalTestAttemptRecord & { test_title: string }>;
}

export function PersonalTestDashboard({
  selectableSets,
  tests,
  recentAttempts,
}: PersonalTestDashboardProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Personal Test
            </h1>
            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold gap-1">
              <Sparkles className="h-3 w-3" />
              <span>AI Generator</span>
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý và thực hành các bài kiểm tra từ vựng cá nhân hóa 4 kỹ năng do Vocabee AI biên soạn từ kho từ vựng của bạn.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => setCreateDialogOpen(true)}
          size="default"
          className="gap-2 cursor-pointer font-bold shadow-xs shrink-0 rounded-xl"
        >
          <Plus className="h-4 w-4" />
          <span>Tạo bài kiểm tra mới</span>
        </Button>
      </div>

      {/* Saved Tests Grid (Default View) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileCheck2 className="h-5 w-5 text-primary" />
            <h2 className="text-lg sm:text-xl font-bold text-foreground">
              Bài kiểm tra của tôi
            </h2>
            <Badge variant="secondary" className="text-xs font-mono">
              {tests.length}
            </Badge>
          </div>
        </div>

        {tests.length === 0 ? (
          <Card className="rounded-2xl border-dashed border-2 border-border/80 bg-muted/15 p-8 text-center">
            <CardContent className="flex flex-col items-center justify-center p-0 space-y-4 max-w-md mx-auto">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
                <BookOpen className="h-8 w-8" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-foreground">
                  Chưa có bài kiểm tra nào
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Bấm tạo bài kiểm tra mới để chọn bộ từ vựng, tùy chỉnh danh sách từ muốn ôn và để Vocabee AI tạo đề 4 kỹ năng cho bạn.
                </p>
              </div>
              <Button
                type="button"
                onClick={() => setCreateDialogOpen(true)}
                className="gap-2 cursor-pointer font-semibold text-xs sm:text-sm rounded-xl h-10 px-5"
              >
                <Plus className="h-4 w-4" />
                <span>Tạo bài kiểm tra đầu tiên</span>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {tests.map((test) => (
              <PersonalTestCard key={test.id} test={test} />
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity Section */}
      {recentAttempts.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="text-lg sm:text-xl font-bold text-foreground">
              Hoạt động gần đây
            </h2>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card divide-y divide-border/60 overflow-hidden">
            {recentAttempts.map((attempt) => {
              const timeAgo = formatDistanceToNow(
                new Date(attempt.started_at),
                { addSuffix: true, locale: vi }
              );

              return (
                <div
                  key={attempt.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-xs",
                        attempt.status === "completed"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                      )}
                    >
                      {attempt.status === "completed" ? (
                        <span>{Math.round(attempt.score)}đ</span>
                      ) : (
                        <MoreHorizontal className="h-4 w-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-foreground truncate">
                          {attempt.test_title}
                        </h4>
                        <Badge variant="outline" className="text-[10px] font-medium">
                          {attempt.mode === "practice" ? "Luyện tập" : "Thi thử"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span>{timeAgo}</span>
                        <span className="text-border">|</span>
                        <span>
                          {attempt.status === "completed"
                            ? `Đúng ${attempt.correct_answers}/${attempt.total_questions} câu`
                            : "Đang làm dở"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    {attempt.status === "completed" ? (
                      <Link
                        href={`/u/personal-test/${attempt.test_id}/result/${attempt.id}`}
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                          "text-xs gap-1.5 h-8 font-medium cursor-pointer"
                        )}
                      >
                        <span>Xem kết quả</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    ) : (
                      <Link
                        href={`/u/personal-test/${attempt.test_id}`}
                        className={cn(
                          buttonVariants({ variant: "default", size: "sm" }),
                          "text-xs gap-1.5 h-8 font-medium bg-amber-500 hover:bg-amber-600 text-white cursor-pointer"
                        )}
                      >
                        <span>Làm tiếp</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create New Personal Test Modal (Pop-up Builder) */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent
          overlayClassName="bg-black/45"
          className="sm:max-w-5xl w-[95vw] max-h-[90vh] overflow-y-auto p-5 sm:p-6 rounded-2xl gap-5"
        >
          <DialogHeader className="pb-2 border-b border-border/60 pr-8">
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl font-bold text-foreground">
              <Sparkles className="h-5 w-5 text-primary shrink-0" />
              <span>Tạo bài kiểm tra cá nhân mới</span>
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
              Tìm và chọn bộ từ vựng, chọn từng từ bạn muốn kiểm tra, rồi để Vocabee AI tạo đề 4 kỹ năng.
            </DialogDescription>
          </DialogHeader>

          <PersonalTestBuilder
            selectableSets={selectableSets}
            onSuccess={() => setCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
