"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { vocabSetSchema, type VocabSetFormValues } from "@/lib/validators/vocab-set";
import { updateVocabularySet } from "@/actions/vocab-sets/update";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { COLOR_OPTIONS, ICON_OPTIONS } from "@/constants/vocab-set";
import { Database } from "@/types/database";
import * as Icons from "lucide-react";

type VocabSetRow = Database["public"]["Tables"]["vocab_sets"]["Row"];

interface EditSetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vocabSet: VocabSetRow | null;
}

export function EditSetDialog({ open, onOpenChange, vocabSet }: EditSetDialogProps) {
  const [isPending, setIsPending] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<VocabSetFormValues>({
    resolver: zodResolver(vocabSetSchema),
  });

  useEffect(() => {
    if (vocabSet) {
      reset({
        title: vocabSet.title,
        description: vocabSet.description || "",
        source_language: vocabSet.source_language || "en",
        target_language: vocabSet.target_language || "vi",
        color: vocabSet.color || "blue",
        icon: vocabSet.icon || "BookOpen",
        visibility: (vocabSet.visibility as VocabSetFormValues["visibility"]) || "private",
      });
    }
  }, [vocabSet, reset]);

  const onSubmit = async (data: VocabSetFormValues) => {
    if (!vocabSet) return;
    setIsPending(true);
    try {
      const res = await updateVocabularySet(vocabSet.id, data);
      if (res.success) {
        toast.success("Cập nhật bộ từ vựng thành công!");
        onOpenChange(false);
      } else {
        toast.error(res.error || "Không thể cập nhật bộ từ vựng.");
      }
    } catch {
      toast.error("Lỗi kết nối máy chủ.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!isPending) onOpenChange(val); }}>
      <DialogContent className="max-w-md w-[95%] rounded-xl">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa bộ từ vựng</DialogTitle>
          <DialogDescription>
            Cập nhật lại thông tin, ngôn ngữ hoặc hiển thị của bộ từ vựng này.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-title">Tên bộ từ vựng</Label>
            <Input id="edit-title" placeholder="Ví dụ: IELTS Vocabulary..." {...register("title")} disabled={isPending} />
            {errors.title && <p className="text-xs text-rose-500">{errors.title.message}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-description">Mô tả (Không bắt buộc)</Label>
            <Input id="edit-description" placeholder="Mô tả ngắn gọn về bộ từ vựng này..." {...register("description")} disabled={isPending} />
            {errors.description && <p className="text-xs text-rose-500">{errors.description.message}</p>}
          </div>

          {/* Languages */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-source_language">Ngôn ngữ gốc</Label>
              <Select key={vocabSet?.id + "-src"} defaultValue={vocabSet?.source_language || "en"} onValueChange={(val) => setValue("source_language", val || "en")} disabled={isPending}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">Tiếng Anh (EN)</SelectItem>
                  <SelectItem value="vi">Tiếng Việt (VI)</SelectItem>
                  <SelectItem value="ja">Tiếng Nhật (JA)</SelectItem>
                  <SelectItem value="ko">Tiếng Hàn (KO)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-target_language">Ngôn ngữ dịch</Label>
              <Select key={vocabSet?.id + "-tgt"} defaultValue={vocabSet?.target_language || "vi"} onValueChange={(val) => setValue("target_language", val || "vi")} disabled={isPending}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vi">Tiếng Việt (VI)</SelectItem>
                  <SelectItem value="en">Tiếng Anh (EN)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Icon & Color Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Biểu tượng hiển thị</Label>
              <Select key={vocabSet?.id + "-icon"} defaultValue={vocabSet?.icon || "BookOpen"} onValueChange={(val) => setValue("icon", val || "BookOpen")} disabled={isPending}>
                <SelectTrigger className="flex items-center gap-2">
                  <SelectValue placeholder="Chọn biểu tượng" />
                </SelectTrigger>
                <SelectContent>
                  {ICON_OPTIONS.map((opt) => {
                    const LucideIcon = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[opt.value] || Icons.BookOpen;
                    return (
                      <SelectItem key={opt.value} value={opt.value}>
                        <span className="flex items-center gap-2">
                          <LucideIcon className="h-4 w-4" />
                          {opt.name}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Màu sắc chủ đạo</Label>
              <Select key={vocabSet?.id + "-color"} defaultValue={vocabSet?.color || "blue"} onValueChange={(val) => setValue("color", val || "blue")} disabled={isPending}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn màu sắc" />
                </SelectTrigger>
                <SelectContent>
                  {COLOR_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <span className="flex items-center gap-2">
                        <span className={`h-3 w-3 rounded-full ${opt.bg}`} />
                        {opt.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Visibility */}
          <div className="space-y-1.5">
            <Label>Trạng thái hiển thị</Label>
            <Select key={vocabSet?.id + "-vis"} defaultValue={vocabSet?.visibility || "private"} onValueChange={(val) => setValue("visibility", (val || "private") as VocabSetFormValues["visibility"])} disabled={isPending}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn trạng thái hiển thị" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Riêng tư (Chỉ mình bạn xem)</SelectItem>
                <SelectItem value="unlisted">Không công khai (Xem qua liên kết)</SelectItem>
                <SelectItem value="public">Công khai (Mọi người đều thấy)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Hủy
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Đang xử lý..." : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
