"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PersonalTestRecord } from "@/types/vocabee-test";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  Layers,
  ListOrdered,
  Calendar,
  Clock,
  Trophy,
  Play,
  RotateCcw,
  BarChart3,
  Edit2,
  Trash2,
  MoreVertical,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  updatePersonalTestTitleAction,
  deletePersonalTestAction,
} from "@/actions/personal-test";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PersonalTestCardProps {
  test: PersonalTestRecord;
  onDeleted?: () => void;
  onUpdated?: () => void;
}

export function PersonalTestCard({
  test,
  onDeleted,
  onUpdated,
}: PersonalTestCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(test.title);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formattedCreated = format(new Date(test.created_at), "dd/MM/yyyy", {
    locale: vi,
  });

  const formattedLastPracticed = test.last_practiced_at
    ? formatDistanceToNow(new Date(test.last_practiced_at), {
        addSuffix: true,
        locale: vi,
      })
    : "Chưa làm lần nào";

  const handleUpdateTitle = async () => {
    if (!editTitle.trim()) {
      toast.error("Tiêu đề không được để trống");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await updatePersonalTestTitleAction(test.id, editTitle.trim());
      if (res.success) {
        toast.success("Đã cập nhật tiêu đề bài kiểm tra");
        setIsEditDialogOpen(false);
        onUpdated?.();
      } else {
        toast.error(res.error || "Không thể cập nhật tiêu đề");
      }
    } catch {
      toast.error("Lỗi khi cập nhật tiêu đề");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      const res = await deletePersonalTestAction(test.id);
      if (res.success) {
        toast.success("Đã xóa bài kiểm tra thành công");
        setIsDeleteDialogOpen(false);
        onDeleted?.();
      } else {
        toast.error(res.error || "Không thể xóa bài kiểm tra");
      }
    } catch {
      toast.error("Lỗi khi xóa bài kiểm tra");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card className="rounded-2xl border border-border/80 bg-card hover:border-primary/40 hover:shadow-md transition-all duration-200 overflow-hidden group">
        <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
          {/* Top: Header & Menu */}
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="text-[11px] font-semibold border-primary/30 text-primary bg-primary/5"
                  >
                    AI Personal Test
                  </Badge>
                  {test.has_active_attempt && (
                    <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px] font-semibold">
                      Chưa hoàn thành
                    </Badge>
                  )}
                </div>

                <h3
                  className="text-base font-bold text-foreground tracking-tight line-clamp-2 group-hover:text-primary transition-colors"
                  title={test.title}
                >
                  {test.title}
                </h3>
              </div>

              {/* Action dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground shrink-0 cursor-pointer hover:bg-muted/60 transition-colors">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Tùy chọn</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem
                    onClick={() => {
                      setEditTitle(test.title);
                      setIsEditDialogOpen(true);
                    }}
                    className="cursor-pointer gap-2 text-xs"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>Đổi tên bài thi</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="cursor-pointer gap-2 text-xs text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Xóa bài thi</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Metrics Chips */}
            <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
              <div className="flex items-center gap-1.5 rounded-lg bg-muted/40 p-2 text-muted-foreground">
                <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="font-semibold text-foreground">{test.total_words}</span>
                <span>từ</span>
              </div>

              <div className="flex items-center gap-1.5 rounded-lg bg-muted/40 p-2 text-muted-foreground">
                <Layers className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="font-semibold text-foreground">{test.total_sets}</span>
                <span>Sets</span>
              </div>

              <div className="flex items-center gap-1.5 rounded-lg bg-muted/40 p-2 text-muted-foreground">
                <ListOrdered className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="font-semibold text-foreground">{test.total_sets * 4}</span>
                <span>bài tập</span>
              </div>
            </div>
          </div>

          {/* Middle: Performance & Timestamps */}
          <div className="space-y-2 pt-2 border-t border-border/60 text-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>Tạo ngày: {formattedCreated}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>{formattedLastPracticed}</span>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-muted/30 px-2.5 py-1.5">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Trophy className="h-3.5 w-3.5 text-amber-500" />
                <span>Điểm cao nhất:</span>
              </div>
              <span className="font-bold text-foreground">
                {test.best_score !== null ? `${test.best_score} / 100` : "—"}
              </span>
            </div>

            <div className="text-[11px] text-muted-foreground">
              Số lượt làm bài: <strong className="text-foreground">{test.attempts_count ?? 0} lượt</strong>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="pt-2 flex items-center gap-2">
            {test.has_active_attempt ? (
              <Link
                href={`/u/personal-test/${test.id}`}
                className={cn(
                  buttonVariants({ variant: "default", size: "sm" }),
                  "flex-1 gap-1.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs h-9 cursor-pointer shadow-xs"
                )}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Tiếp tục bài thi</span>
              </Link>
            ) : (
              <Link
                href={`/u/personal-test/${test.id}`}
                className={cn(
                  buttonVariants({ variant: "default", size: "sm" }),
                  "flex-1 gap-1.5 font-semibold text-xs h-9 cursor-pointer shadow-xs"
                )}
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Bắt đầu thi</span>
              </Link>
            )}

            {test.attempts_count && test.attempts_count > 0 ? (
              <Link
                href={`/u/personal-test/${test.id}#history`}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "h-9 px-3 text-xs gap-1.5 cursor-pointer font-medium"
                )}
              >
                <BarChart3 className="h-3.5 w-3.5" />
                <span>Lịch sử</span>
              </Link>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Edit Title Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">
              Đổi tên bài kiểm tra
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Nhập tiêu đề mới cho bài kiểm tra cá nhân này.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Nhập tiêu đề bài kiểm tra..."
              className="text-sm"
              autoFocus
            />

            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isSubmitting}
                className="cursor-pointer text-xs"
              >
                Hủy
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleUpdateTitle}
                disabled={isSubmitting || !editTitle.trim()}
                className="cursor-pointer text-xs font-semibold"
              >
                {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-destructive">
              Xác nhận xóa bài kiểm tra
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Bạn có chắc chắn muốn xóa bài kiểm tra <strong>&quot;{test.title}&quot;</strong>? Hành động này sẽ xóa toàn bộ câu hỏi và lịch sử làm bài liên quan và không thể khôi phục.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isSubmitting}
              className="cursor-pointer text-xs"
            >
              Hủy bỏ
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="cursor-pointer text-xs font-semibold gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{isSubmitting ? "Đang xóa..." : "Xóa vĩnh viễn"}</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
