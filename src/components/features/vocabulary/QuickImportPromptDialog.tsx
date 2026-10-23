"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check, Sparkles, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export const AI_VOCABULARY_PROMPT = `Bạn là chuyên gia từ vựng tiếng Anh. Hãy chuyển danh sách từ vựng tôi cung cấp thành bảng hoàn chỉnh với **đúng 7 cột theo thứ tự**:

1. Từ vựng
2. Ý nghĩa
3. IPA
4. Từ loại
5. Câu ví dụ
6. Nghĩa của ví dụ
7. Từ đồng nghĩa

**Yêu cầu:**
- Chuẩn hóa từ vựng về dạng từ điển (lemma/base form), sửa lỗi chính tả và loại bỏ từ trùng lặp; giữ nguyên các cụm từ, thành ngữ và cụm động từ.
- Cung cấp nghĩa tiếng Việt ngắn gọn, IPA chính xác, từ loại ghi đầy đủ bằng tiếng Anh.
- Mỗi từ có một câu ví dụ tiếng Anh tự nhiên, đúng ngữ pháp và phù hợp với nghĩa đã cho; dịch câu ví dụ sang tiếng Việt chính xác.
- Cung cấp 1–3 từ đồng nghĩa tiếng Anh phù hợp với ngữ cảnh; để trống nếu không có từ đồng nghĩa thích hợp.
- Sắp xếp danh sách theo thứ tự bảng chữ cái A–Z.
- Đảm bảo thông tin giữa các cột nhất quán, không bịa dữ liệu hoặc bỏ sót từ vựng.
- Nếu đầu vào là file hoặc hình ảnh, hãy trích xuất và xử lý toàn bộ danh sách.`;

const VOCABULARY_TABLE_GENERATOR_URL =
  "https://chatgpt.com/g/g-69da4bb466048191b6955d29d8cb1518-vocabulary-table-generator";

interface QuickImportPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickImportPromptDialog({
  open,
  onOpenChange,
}: QuickImportPromptDialogProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(AI_VOCABULARY_PROMPT);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = AI_VOCABULARY_PROMPT;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      toast.success("Đã sao chép prompt vào bộ nhớ tạm!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Không thể sao chép prompt. Vui lòng sao chép thủ công.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="z-[70] bg-black/60 backdrop-blur-xs"
        className="z-[70] flex max-h-[92vh] w-full max-w-[calc(100%-2rem)] flex-col gap-4 overflow-hidden rounded-2xl border border-border/80 bg-background p-4 sm:max-w-xl sm:p-6 shadow-2xl"
      >
        <DialogHeader className="shrink-0 border-b border-border/70 pb-3.5 select-none">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="h-4.5 w-4.5 text-primary" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base font-semibold text-foreground">
                Tạo bảng từ vựng tự động bằng AI
              </DialogTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Sử dụng ChatGPT hoặc bất kỳ mô hình AI nào để sinh bảng chuẩn 7 cột
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-hidden">
          {/* Instruction banner */}
          <div className="shrink-0 rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-xs text-foreground font-medium flex items-start gap-2.5">
            <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Dán Prompt này vào Chat GPT để tạo bảng từ vựng tự động, sau đó dán bảng từ vựng vào Vocabee
            </p>
          </div>

          {/* Prompt card with preview and copy */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/80 bg-muted/20">
            <div className="flex shrink-0 items-center justify-between border-b border-border/70 bg-muted/30 px-3.5 py-2">
              <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                Prompt chuẩn hóa 7 cột
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-7 gap-1.5 px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-emerald-600 font-medium">Đã sao chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Sao chép</span>
                  </>
                )}
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-3.5 text-xs leading-relaxed text-foreground select-all whitespace-pre-wrap font-mono sm:text-[12.5px]">
              {AI_VOCABULARY_PROMPT}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex shrink-0 items-center justify-between border-t border-border/70 pt-3.5 select-none">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              window.open(
                VOCABULARY_TABLE_GENERATOR_URL,
                "_blank",
                "noopener,noreferrer"
              )
            }
            className="h-8 gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="h-3.5 w-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Mở ChatGPT</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 text-xs font-medium"
            >
              Đóng
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleCopy}
              className="h-8 gap-1.5 text-xs font-semibold shadow-xs"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-300" />
                  <span>Đã sao chép</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy prompt</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
