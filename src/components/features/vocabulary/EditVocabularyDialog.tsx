"use client";

import React from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  onSaved: () => void;
}

export function EditVocabularyDialog({ open, onOpenChange, item, onSaved }: Props) {
  const [isSaving, setIsSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    word: "",
    meaning: "",
    ipa: "",
    partOfSpeech: "",
    example: "",
    synonyms: "",
    notes: "",
  });

  React.useEffect(() => {
    if (!item) return;
    setForm({
      word: item.word ?? "",
      meaning: item.meaning ?? "",
      ipa: item.ipa ?? "",
      partOfSpeech: item.part_of_speech ?? "",
      example: item.example ?? "",
      synonyms: item.synonyms?.join(", ") ?? "",
      notes: item.note ?? "",
    });
  }, [item]);

  const handleSave = async () => {
    if (!item) return;
    setIsSaving(true);
    try {
      const res = await updateVocabulary(item.id, {
        word: form.word,
        meaning: form.meaning,
        ipa: form.ipa,
        partOfSpeech: form.partOfSpeech,
        example: form.example,
        synonyms: form.synonyms
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        note: form.notes,
      });

      if (!res.success) {
        toast.error(res.error || "Không thể cập nhật từ vựng.");
        return;
      }

      toast.success("Đã cập nhật từ vựng.");
      onOpenChange(false);
      onSaved();
    } catch {
      toast.error("Lỗi kết nối máy chủ.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa từ</DialogTitle>
          <DialogDescription>Cập nhật nội dung từ vựng ngay trong trang này.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Từ" value={form.word} onChange={(v) => setForm((p) => ({ ...p, word: v }))} />
          <Field label="Nghĩa" value={form.meaning} onChange={(v) => setForm((p) => ({ ...p, meaning: v }))} />
          <Field label="IPA" value={form.ipa} onChange={(v) => setForm((p) => ({ ...p, ipa: v }))} />
          <Field label="Từ loại" value={form.partOfSpeech} onChange={(v) => setForm((p) => ({ ...p, partOfSpeech: v }))} />
          <div className="sm:col-span-2">
            <Field label="Ví dụ" value={form.example} onChange={(v) => setForm((p) => ({ ...p, example: v }))} />
          </div>
          <div className="sm:col-span-2">
            <Field label="Từ đồng nghĩa" value={form.synonyms} onChange={(v) => setForm((p) => ({ ...p, synonyms: v }))} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-medium text-foreground">Ghi chú</label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              className="min-h-24"
              placeholder="Ghi chú"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
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

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">{label}</label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
