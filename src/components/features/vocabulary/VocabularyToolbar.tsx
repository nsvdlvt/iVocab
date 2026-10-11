"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Globe, Lock, Save } from "lucide-react";
import Link from "next/link";
import { QuickImportDialog } from "./QuickImportDialog";
import { AIImportDialog } from "./AIImportDialog";
import { cn } from "@/lib/utils";

interface ImportedCard {
  word: string;
  meaning: string;
  ipa?: string;
  partOfSpeech?: string;
  example?: string;
  exampleSentence?: string;
  synonyms?: string[] | string;
  topic?: string;
}

interface VocabularyToolbarProps {
  visibility: "private" | "public" | "unlisted";
  onChangeVisibility: (val: "private" | "public" | "unlisted") => void;
  isPending: boolean;
  onCreateClick: () => void;
  onImportCards: (newCards: ImportedCard[]) => void;
  existingWords: Array<{ word: string; meaning: string }>;
  isEditMode?: boolean;
  backHref?: string;
}

export function VocabularyToolbar({
  visibility,
  onChangeVisibility,
  isPending,
  onCreateClick,
  onImportCards,
  existingWords,
  isEditMode = false,
  backHref = "/vocabulary",
}: VocabularyToolbarProps) {
  const filledCount = existingWords.filter(
    (w) => w.word.trim() || w.meaning.trim()
  ).length;

  const toggleVisibility = () => {
    onChangeVisibility(visibility === "private" ? "public" : "private");
  };

  return (
    <div className="sticky top-0 z-30 -mx-4 border-b border-border/80 bg-background/90 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 select-none">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Back & Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <Link
            href={backHref}
            aria-label="Quay lại"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold tracking-tight text-foreground sm:text-lg">
              {isEditMode ? "Chỉnh sửa bộ từ vựng" : "Tạo bộ từ vựng mới"}
            </h1>
            <p className="text-xs text-muted-foreground tabular-nums">
              Đã nhập{" "}
              <strong className="font-semibold text-foreground">
                {filledCount}
              </strong>{" "}
              từ vựng
            </p>
          </div>
        </div>

        {/* Right: Import, Visibility & Save */}
        <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
          <div className="flex items-center gap-1.5">
            <QuickImportDialog onImport={onImportCards} isPending={isPending} />

            <AIImportDialog
              onImport={onImportCards}
              existingWords={existingWords}
              isPending={isPending}
            />

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggleVisibility}
              disabled={isPending}
              className={cn(
                "h-9 gap-1.5 rounded-lg px-3 text-xs font-medium",
                visibility === "public" &&
                  "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              )}
              title="Chuyển đổi quyền hiển thị"
            >
              {visibility === "private" ? (
                <>
                  <Lock className="h-3.5 w-3.5" />
                  <span>Riêng tư</span>
                </>
              ) : (
                <>
                  <Globe className="h-3.5 w-3.5" />
                  <span>Công khai</span>
                </>
              )}
            </Button>
          </div>

          <Button
            type="button"
            onClick={onCreateClick}
            disabled={isPending}
            className="h-9 gap-1.5 rounded-lg px-4 text-xs sm:text-sm font-semibold shadow-xs"
          >
            <Save className="h-3.5 w-3.5" />
            <span>
              {isPending
                ? "Đang lưu..."
                : isEditMode
                  ? "Lưu thay đổi"
                  : "Lưu bộ từ"}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
