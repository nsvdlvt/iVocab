"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Bookmark, Check, FolderPlus, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface VocabSetOption {
  id: string;
  title: string;
  color?: string | null;
  icon?: string | null;
  description?: string | null;
}

interface SaveWordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: {
    word: string;
    meaning?: string;
    partOfSpeech?: string;
    ipa?: string;
    example?: string;
    exampleTranslation?: string;
    synonyms?: string[];
  };
}

function SaveWordModalContent({
  onOpenChange,
  initialData,
}: {
  onOpenChange: (open: boolean) => void;
  initialData: SaveWordModalProps["initialData"];
}) {
  const [sets, setSets] = useState<VocabSetOption[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<string>("");
  const [loadingSets, setLoadingSets] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState<{
    id: string;
    word: string;
    meaning: string;
  } | null>(null);

  // Form states initialized directly from initialData
  const [word, setWord] = useState(initialData.word || "");
  const [meaning, setMeaning] = useState(initialData.meaning || "");
  const [partOfSpeech, setPartOfSpeech] = useState(initialData.partOfSpeech || "noun");
  const [ipa, setIpa] = useState(initialData.ipa || "");
  const [example, setExample] = useState(initialData.example || "");
  const [exampleTranslation, setExampleTranslation] = useState(initialData.exampleTranslation || "");

  // Load user's vocabulary sets
  useEffect(() => {
    let isMounted = true;

    fetch("/api/dictionary/save")
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success && Array.isArray(data.sets)) {
          setSets(data.sets);
          if (data.sets.length > 0) {
            setSelectedSetId(data.sets[0].id);
          }
        }
      })
      .catch(() => {
        // Not logged in or error
      })
      .finally(() => {
        if (isMounted) setLoadingSets(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Check duplicate when target set or word changes (debounced)
  useEffect(() => {
    if (!selectedSetId || !word.trim()) return;

    let isMounted = true;
    const timer = setTimeout(() => {
      if (!isMounted) return;
      setCheckingDuplicate(true);

      const checkUrl = `/api/dictionary/save?checkWord=${encodeURIComponent(
        word.trim()
      )}&setId=${encodeURIComponent(selectedSetId)}`;

      fetch(checkUrl)
        .then((res) => res.json())
        .then((data) => {
          if (!isMounted) return;
          if (data.success && data.isDuplicate && data.existingWord) {
            setDuplicateInfo(data.existingWord);
          } else {
            setDuplicateInfo(null);
          }
        })
        .catch(() => {
          if (isMounted) setDuplicateInfo(null);
        })
        .finally(() => {
          if (isMounted) setCheckingDuplicate(false);
        });
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [selectedSetId, word]);

  const handleSave = async (forceUpdate = false) => {
    if (!selectedSetId) {
      toast.error("Vui lòng chọn một bộ từ vựng.");
      return;
    }

    if (!word.trim()) {
      toast.error("Từ vựng không được để trống.");
      return;
    }

    if (!meaning.trim()) {
      toast.error("Nghĩa tiếng Việt không được để trống.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/dictionary/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          setId: selectedSetId,
          word: word.trim(),
          meaning: meaning.trim(),
          partOfSpeech: partOfSpeech.trim() || "noun",
          ipa: ipa.trim() || undefined,
          example: example.trim() || undefined,
          exampleTranslation: exampleTranslation.trim() || undefined,
          synonyms: initialData.synonyms || [],
          forceUpdate,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.duplicate) {
          setDuplicateInfo(data.existingWord);
          toast.warning(data.message || "Từ đã có trong bộ từ.");
          return;
        }
        throw new Error(data.error || "Không thể lưu từ vựng.");
      }

      toast.success(data.message || `Đã lưu "${word}" vào bộ từ!`);
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi lưu từ vựng.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto rounded-3xl border-border/80">
      <DialogHeader>
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Bookmark className="h-5 w-5" />
          </div>
          <div>
            <DialogTitle className="text-lg font-bold text-foreground">
              Lưu từ vào kho từ vựng
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              Thêm từ đã tra cứu vào bộ từ cá nhân để ôn tập theo thuật toán SRS.
            </p>
          </div>
        </div>
      </DialogHeader>

      <div className="space-y-4 py-2">
        {/* Target Vocab Set Selection */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground">Chọn bộ từ vựng</Label>
          {loadingSets ? (
            <div className="h-10 rounded-xl bg-muted/50 animate-pulse flex items-center px-3 text-xs text-muted-foreground">
              Đang tải danh sách bộ từ...
            </div>
          ) : sets.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
              Bạn chưa có bộ từ nào. Vui lòng tạo bộ từ trong mục &ldquo;Bộ từ vựng&rdquo; trước.
            </div>
          ) : (
            <select
              value={selectedSetId}
              onChange={(e) => setSelectedSetId(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {sets.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Duplicate warning notification */}
        {duplicateInfo && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Từ này đã có trong bộ từ đã chọn</span>
            </div>
            <p className="text-muted-foreground">
              Nghĩa hiện tại: <span className="font-medium text-foreground">{duplicateInfo.meaning}</span>
            </p>
          </div>
        )}

        {/* Word & POS */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Từ vựng (English)</Label>
            <Input
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="e.g. eloquent"
              className="h-9 rounded-xl font-semibold"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Từ loại</Label>
            <Input
              value={partOfSpeech}
              onChange={(e) => setPartOfSpeech(e.target.value)}
              placeholder="noun, verb..."
              className="h-9 rounded-xl text-xs uppercase"
            />
          </div>
        </div>

        {/* IPA & Meaning */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground">Phiên âm IPA</Label>
          <Input
            value={ipa}
            onChange={(e) => setIpa(e.target.value)}
            placeholder="/ˈɛləkwənt/"
            className="h-9 rounded-xl font-mono text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground">Nghĩa tiếng Việt *</Label>
          <Input
            value={meaning}
            onChange={(e) => setMeaning(e.target.value)}
            placeholder="e.g. hùng biện, lưu loát, truyền cảm"
            className="h-9 rounded-xl"
          />
        </div>

        {/* Example & Translation */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground">Câu ví dụ (English)</Label>
          <Textarea
            value={example}
            onChange={(e) => setExample(e.target.value)}
            placeholder="An eloquent speech that inspired everyone."
            rows={2}
            className="rounded-xl text-xs resize-none"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground">Dịch câu ví dụ</Label>
          <Input
            value={exampleTranslation}
            onChange={(e) => setExampleTranslation(e.target.value)}
            placeholder="Một bài phát biểu hùng biện đã truyền cảm hứng cho mọi người."
            className="h-9 rounded-xl text-xs"
          />
        </div>
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          className="rounded-xl"
        >
          Hủy
        </Button>

        {duplicateInfo ? (
          <Button
            type="button"
            onClick={() => handleSave(true)}
            disabled={saving || checkingDuplicate}
            className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold gap-1.5"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Cập nhật từ này
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => handleSave(false)}
            disabled={saving || checkingDuplicate || sets.length === 0}
            className="rounded-xl font-bold gap-1.5"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderPlus className="h-4 w-4" />}
            Lưu vào bộ từ
          </Button>
        )}
      </DialogFooter>
    </DialogContent>
  );
}

export function SaveWordModal({ open, onOpenChange, initialData }: SaveWordModalProps) {
  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SaveWordModalContent onOpenChange={onOpenChange} initialData={initialData} />
    </Dialog>
  );
}
