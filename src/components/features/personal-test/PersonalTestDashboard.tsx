"use client";

import React, { useState } from "react";
import { PersonalTestRecord, PersonalTestAttemptRecord } from "@/types/vocabee-test";
import { PersonalTestCard } from "./PersonalTestCard";
import { TestImportDialog } from "./TestImportDialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Plus,
  Code,
  UploadCloud,
  FileCheck2,
  Clock,
  Trophy,
  ArrowRight,
  BookOpen,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface PersonalTestDashboardProps {
  tests: PersonalTestRecord[];
  recentAttempts: Array<PersonalTestAttemptRecord & { test_title: string }>;
}

export function PersonalTestDashboard({
  tests,
  recentAttempts,
}: PersonalTestDashboardProps) {
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importDefaultTab, setImportDefaultTab] = useState<"paste" | "upload">("paste");

  const openImport = (tab: "paste" | "upload") => {
    setImportDefaultTab(tab);
    setImportDialogOpen(true);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* 3.1 Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Personal Test
            </h1>
            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold">
              BETA
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Create, import and practice your own vocabulary tests.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => openImport("paste")}
          size="default"
          className="gap-2 cursor-pointer font-bold shadow-xs shrink-0 rounded-xl"
        >
          <Plus className="h-4 w-4" />
          <span>+ Tạo bài kiểm tra mới</span>
        </Button>
      </div>

      {/* 3.2 A. Create Test Quick Card */}
      <div className="rounded-2xl border border-primary/20 bg-linear-to-br from-primary/10 via-amber-500/5 to-muted/20 p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
              <Sparkles className="h-4 w-4" />
              <span>Hệ thống chuyển đổi đề thi tự động</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-foreground">
              Nhập JSON theo chuẩn vocabee-test-v1
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Dán mã hoặc tải lên tệp JSON chứa các câu hỏi từ vựng. Vocabee sẽ tự động thẩm định ngữ nghĩa, tạo giao diện bài tập tương tác 4 kỹ năng (Matching, Điền câu, Từ đồng nghĩa, Cloze Test) và chấm điểm tự động.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              type="button"
              variant="default"
              onClick={() => openImport("paste")}
              className="gap-2 cursor-pointer font-semibold text-xs sm:text-sm h-10 px-4 rounded-xl shadow-xs"
            >
              <Code className="h-4 w-4" />
              <span>Dán mã JSON</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => openImport("upload")}
              className="gap-2 cursor-pointer font-semibold text-xs sm:text-sm h-10 px-4 rounded-xl bg-background/80 hover:bg-background"
            >
              <UploadCloud className="h-4 w-4 text-primary" />
              <span>Tải tệp .json</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 3.2 B. My Tests Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
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
          // Empty State
          <Card className="rounded-2xl border-dashed border-2 border-border/80 bg-muted/15 p-8 text-center">
            <CardContent className="flex flex-col items-center justify-center p-0 space-y-4 max-w-md mx-auto">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
                <BookOpen className="h-8 w-8" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-foreground">
                  Chưa có bài kiểm tra nào được tạo
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Bắt đầu tự luyện tập từ vựng bằng cách nhập hoặc dán tệp JSON đầu tiên theo định dạng vocabee-test-v1. Bạn cũng có thể dùng mẫu có sẵn để trải nghiệm ngay!
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Button
                  type="button"
                  variant="default"
                  onClick={() => openImport("paste")}
                  className="gap-2 cursor-pointer font-semibold text-xs rounded-xl"
                >
                  <Plus className="h-4 w-4" />
                  <span>Tạo bài kiểm tra đầu tiên</span>
                </Button>
              </div>
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

      {/* 3.2 C. Recent Activity Section */}
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
              const timeAgo = formatDistanceToNow(new Date(attempt.started_at), {
                addSuffix: true,
                locale: vi,
              });

              return (
                <div
                  key={attempt.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-xs ${
                        attempt.status === "completed"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      {attempt.status === "completed" ? (
                        <span>{Math.round(attempt.score)}đ</span>
                      ) : (
                        <span>...</span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-foreground truncate">
                          {attempt.test_title}
                        </h4>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-medium"
                        >
                          {attempt.mode === "practice" ? "Luyện tập" : "Thi thử"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span>{timeAgo}</span>
                        <span>•</span>
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

      {/* Import Modal */}
      <TestImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        defaultTab={importDefaultTab}
      />
    </div>
  );
}
