"use client";

import React from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateVocabulary } from "@/actions/vocabulary/update";
import { HighlightedExample } from "@/components/common/HighlightedExample";

export type EditableVocabulary = {
  id: string;
  word: string;
  meaning: string;
  ipa: string | null;
  part_of_speech: string | null;
  example: string | null;
  example_translation: string | null;
  synonyms: string[] | null;
  note: string | null;
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: EditableVocabulary | null;
  onSaved: (updated: EditableVocabulary) => void;
}

export function EditVocabularyDialog({
  open,
  onOpenChange,
  item,
  onSaved,
}: Props) {
  const [isSaving, setIsSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    word: item?.word ?? "",
    meaning: item?.meaning ?? "",
    ipa: item?.ipa ?? "",
    partOfSpeech: item?.part_of_speech ?? "",
    example: item?.example ?? "",
    example_translation: item?.example_translation ?? "",
    synonyms: item?.synonyms?.join(", ") ?? "",
    notes: item?.note ?? "",
  });

  // Keep form in sync when item changes
  React.useEffect(() => {
    if (item) {
      setForm({
        word: item.word ?? "",
        meaning: item.meaning ?? "",
        ipa: item.ipa ?? "",
        partOfSpeech: item.part_of_speech ?? "",
        example: item.example ?? "",
        example_translation: item.example_translation ?? "",
        synonyms: item.synonyms?.join(", ") ?? "",
        notes: item.note ?? "",
      });
    }
  }, [item]);

  const handleSave = async () => {
    if (!item) return;
    if (!form.word.trim() || !form.meaning.trim()) {
      toast.error("Từ vựng và nghĩa không được để trống.");
      return;
    }
    setIsSaving(true);
    try {
      const res = await updateVocabulary(item.id, {
        word: form.word.trim(),
        meaning: form.meaning.trim(),
        ipa: form.ipa.trim(),
        partOfSpeech: form.partOfSpeech.trim(),
        example: form.example.trim(),
        example_translation: form.example_translation.trim(),
        synonyms: form.synonyms
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        note: form.notes.trim(),
      });

      if (!res.success) {
        toast.error(res.error || "Không thể cập nhật từ vựng.");
        return;
      }

      toast.success("Đã cập nhật từ vựng.");
      const updated: EditableVocabulary = {
        id: item.id,
        word: form.word.trim(),
        meaning: form.meaning.trim(),
        ipa: form.ipa.trim() || null,
        part_of_speech: form.partOfSpeech.trim() || null,
        example: form.example.trim() || null,
        example_translation: form.example_translation.trim() || null,
        synonyms: form.synonyms
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        note: form.notes.trim() || null,
      };
      onOpenChange(false);
      onSaved(updated);
    } catch {
      toast.error("Lỗi kết nối máy chủ.");
    } finally {
      setIsSaving(false);
    }
  };

  const hasExamplePreview = Boolean(form.example.trim() || form.example_translation.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl w-[95%] max-h-[90vh] overflow-y-auto rounded-2xl border-border/80 p-6">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-base font-semibold text-foreground">
            Chỉnh sửa từ vựng
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Cập nhật thông tin từ vựng, phiên âm, ví dụ và nghĩa của ví dụ.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <Field
            label="Từ vựng *"
            placeholder="Ví dụ: resilient"
            value={form.word}
            onChange={(v) => setForm((p) => ({ ...p, word: v }))}
          />
          <Field
            label="Ý nghĩa *"
            placeholder="Ví dụ: kiên cường, bền bỉ"
            value={form.meaning}
            onChange={(v) => setForm((p) => ({ ...p, meaning: v }))}
          />
          <Field
            label="Phiên âm (IPA)"
            placeholder="Ví dụ: /rɪˈzɪl.i.ənt/"
            value={form.ipa}
            onChange={(v) => setForm((p) => ({ ...p, ipa: v }))}
          />
          <Field
            label="Từ loại"
            placeholder="Ví dụ: adjective, noun, verb..."
            value={form.partOfSpeech}
            onChange={(v) => setForm((p) => ({ ...p, partOfSpeech: v }))}
          />
          <div className="sm:col-span-2">
            <Field
              label="Câu ví dụ (Tiếng Anh)"
              placeholder="Ví dụ: She is a resilient leader who adapts quickly."
              value={form.example}
              onChange={(v) => setForm((p) => ({ ...p, example: v }))}
            />
          </div>
          <div className="sm:col-span-2">
            <Field
              label="Nghĩa của ví dụ"
              placeholder="Ví dụ: Cô ấy là một nhà lãnh đạo kiên cường, thích nghi nhanh chóng."
              value={form.example_translation}
              onChange={(v) => setForm((p) => ({ ...p, example_translation: v }))}
            />
          </div>

          {hasExamplePreview && (
            <div className="sm:col-span-2 space-y-1">
              <Label className="text-xs font-medium text-muted-foreground">
                Xem trước ví dụ & nghĩa câu với từ nổi bật:
              </Label>
              <HighlightedExample
                word={form.word}
                meaning={form.meaning}
                example={form.example}
                exampleTranslation={form.example_translation}
                compact
                showLabels
              />
            </div>
          )}

          <div className="sm:col-span-2">
            <Field
              label="Từ đồng nghĩa (ngăn cách bởi dấu phẩy)"
              placeholder="Ví dụ: tough, adaptable, strong"
              value={form.synonyms}
              onChange={(v) => setForm((p) => ({ ...p, synonyms: v }))}
            />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label className="text-xs font-medium text-foreground">
              Ghi chú
            </Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              className="min-h-20 rounded-lg text-sm"
              placeholder="Mẹo ghi nhớ, ngữ cảnh sử dụng..."
            />
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-foreground">{label}</Label>
      <Input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-lg text-sm"
      />
    </div>
  );
}
