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

export type EditableVocabulary = {
  id: string;
  word: string;
  meaning: string;
  ipa: string | null;
  part_of_speech: string | null;
  example: string | null;
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
    synonyms: item?.synonyms?.join(", ") ?? "",
    notes: item?.note ?? "",
  });

  // Keep form in sync with the item using item.id as a reset key.
  // Callers should pass key={item?.id} to this component when switching items.

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl w-[95%] rounded-xl border-border/80 p-6">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-base font-semibold text-foreground">
            Chỉnh sửa từ vựng
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Cập nhật thông tin từ vựng, phiên âm, ví dụ và ghi chú học tập.
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
              label="Câu ví dụ"
              placeholder="Ví dụ: She is a resilient leader who adapts quickly."
              value={form.example}
              onChange={(v) => setForm((p) => ({ ...p, example: v }))}
            />
          </div>
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
