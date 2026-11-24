"use client";

import React, { useState } from "react";
import { VocabeeTest } from "@/types/vocabee-test";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Layers,
  HelpCircle,
  FileText,
  ArrowLeft,
  Save,
  CheckCircle2,
  ChevronRight,
  ListOrdered,
  Sparkles,
} from "lucide-react";

interface TestPreviewProps {
  test: VocabeeTest;
  onBack: () => void;
  onConfirmSave: () => void;
  isSaving?: boolean;
}

const EXERCISE_TYPE_LABELS: Record<string, { title: string; desc: string }> = {
  matching: {
    title: "1. Matching (Nối từ & định nghĩa)",
    desc: "Ghép từ vựng với định nghĩa chính xác.",
  },
  sentence_completion: {
    title: "2. Sentence Completion (Hoàn thành câu)",
    desc: "Chọn từ trong Word Bank để điền vào chỗ trống.",
  },
  synonyms_matching: {
    title: "3. Synonyms Matching (Ghép từ đồng nghĩa)",
    desc: "Nối từ vựng với nhóm từ đồng nghĩa tương ứng.",
  },
  cloze_test: {
    title: "4. Cloze Test (Điền đoạn văn)",
    desc: "Đọc đoạn văn và điền các vị trí trống được đánh số.",
  },
};

export function TestPreview({
  test,
  onBack,
  onConfirmSave,
  isSaving = false,
}: TestPreviewProps) {
  const [selectedSetIndex, setSelectedSetIndex] = useState(0);
  const currentSet = test.sets[selectedSetIndex] || test.sets[0];

  return (
    <div className="space-y-5">
      {/* Test Overview Header */}
      <div className="rounded-2xl border border-primary/20 bg-linear-to-r from-primary/10 via-amber-500/5 to-transparent p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary text-primary-foreground font-semibold text-xs">
                {test.schema}
              </Badge>
              <span className="text-xs text-muted-foreground">Bản xem trước kiểm tra</span>
            </div>
            <h3 className="text-xl font-bold tracking-tight text-foreground">{test.title}</h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onBack}
              disabled={isSaving}
              className="gap-1.5 cursor-pointer text-xs h-9"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Sửa JSON</span>
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={onConfirmSave}
              disabled={isSaving}
              className="gap-1.5 cursor-pointer text-xs h-9 font-semibold shadow-xs"
            >
              <Save className="h-4 w-4" />
              <span>{isSaving ? "Đang lưu..." : "Xác nhận & Lưu bài kiểm tra"}</span>
            </Button>
          </div>
        </div>

        {/* Quick Metrics Bar */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-border/60 text-xs">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary shrink-0" />
            <div>
              <span className="text-muted-foreground">Tổng số Set: </span>
              <strong className="text-foreground">{test.total_sets}</strong>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary shrink-0" />
            <div>
              <span className="text-muted-foreground">Tổng từ vựng: </span>
              <strong className="text-foreground">{test.total_words} từ</strong>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ListOrdered className="h-4 w-4 text-primary shrink-0" />
            <div>
              <span className="text-muted-foreground">Tổng bài tập: </span>
              <strong className="text-foreground">{test.sets.length * 4}</strong>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            <div>
              <span className="text-muted-foreground">Trạng thái: </span>
              <strong className="text-emerald-600 dark:text-emerald-400">Đã kiểm duyệt</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Set Selector Tabs */}
      {test.sets.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {test.sets.map((set, idx) => {
            const isSelected = idx === selectedSetIndex;
            return (
              <button
                key={set.id}
                type="button"
                onClick={() => setSelectedSetIndex(idx)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>{set.label || `Set ${idx + 1}`}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    isSelected ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {set.words.length} từ
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Current Set Details */}
      <div className="space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/80">
          <div>
            <h4 className="text-base font-bold text-foreground">{currentSet.label}</h4>
            <div className="text-xs text-muted-foreground mt-0.5">Mã ID: {currentSet.id}</div>
          </div>

          {/* Words badges in this set */}
          <div className="flex flex-wrap items-center gap-1.5">
            {currentSet.words.map((word, wIdx) => (
              <Badge key={wIdx} variant="secondary" className="text-xs font-medium px-2 py-0.5">
                {word}
              </Badge>
            ))}
          </div>
        </div>

        {/* 4 Exercises Preview */}
        <div className="space-y-4">
          {currentSet.exercises.map((exercise, exIdx) => {
            const info = EXERCISE_TYPE_LABELS[exercise.type] || {
              title: exercise.type,
              desc: "",
            };

            return (
              <div
                key={exIdx}
                className="rounded-xl border border-border/70 bg-muted/20 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-sm font-bold text-foreground">{info.title}</h5>
                    <p className="text-xs text-muted-foreground">{info.desc}</p>
                  </div>
                  <Badge variant="outline" className="text-[11px] font-mono">
                    {exercise.type === "cloze_test"
                      ? `${exercise.answers.length} câu điền`
                      : `${exercise.items.length} câu hỏi`}
                  </Badge>
                </div>

                {/* Sample items preview */}
                <div className="rounded-lg bg-background/80 border border-border/60 p-3 text-xs space-y-2">
                  {exercise.type === "matching" && (
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Câu hỏi mẫu ({exercise.items.length} cặp):
                      </div>
                      {exercise.items.slice(0, 2).map((item) => (
                        <div key={item.id} className="flex items-start gap-2 text-xs">
                          <strong className="text-primary shrink-0">{item.word}:</strong>
                          <span className="text-muted-foreground truncate">{item.definition}</span>
                        </div>
                      ))}
                      {exercise.items.length > 2 && (
                        <div className="text-[11px] text-muted-foreground italic">
                          ... và thêm {exercise.items.length - 2} từ nữa
                        </div>
                      )}
                    </div>
                  )}

                  {exercise.type === "sentence_completion" && (
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="text-[11px] font-semibold text-muted-foreground">Word Bank:</span>
                        {exercise.word_bank.map((wb, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 rounded bg-muted text-[11px] text-foreground font-mono"
                          >
                            {wb}
                          </span>
                        ))}
                      </div>
                      <div className="text-xs text-foreground italic">
                        &quot;{exercise.items[0]?.sentence}&quot;
                      </div>
                    </div>
                  )}

                  {exercise.type === "synonyms_matching" && (
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Nhóm từ đồng nghĩa ({exercise.items.length} câu):
                      </div>
                      {exercise.items.slice(0, 2).map((item) => (
                        <div key={item.id} className="flex items-center gap-2">
                          <strong className="text-primary">{item.word}</strong>
                          <span className="text-muted-foreground">≈</span>
                          <span className="font-medium text-foreground">{item.synonyms.join(", ")}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {exercise.type === "cloze_test" && (
                    <div className="space-y-2">
                      <div className="text-xs text-foreground line-clamp-2 leading-relaxed">
                        {exercise.passage}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {exercise.answers.length} ô trống tương ứng:{" "}
                        {exercise.answers.map((a) => `___(${a.id})___`).join(", ")}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          size="default"
          onClick={onBack}
          disabled={isSaving}
          className="cursor-pointer gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại chỉnh sửa JSON</span>
        </Button>

        <Button
          type="button"
          variant="default"
          size="default"
          onClick={onConfirmSave}
          disabled={isSaving}
          className="cursor-pointer gap-2 font-semibold shadow-xs"
        >
          <Save className="h-4 w-4" />
          <span>{isSaving ? "Đang lưu bài..." : "Xác nhận & Lưu bài kiểm tra"}</span>
        </Button>
      </div>
    </div>
  );
}
