"use client";

import React from "react";
import { Shuffle, SwitchCamera, Volume2, EyeOff, Eye, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FlashcardToolbarProps {
  isShuffle: boolean;
  isProgressMode: boolean;
  hideIpa: boolean;
  hideExample: boolean;
  onToggleShuffle: () => void;
  onToggleProgressMode: () => void;
  onToggleIpa: () => void;
  onToggleExample: () => void;
  onSpeak: () => void;
  onRestart: () => void;
}

export function FlashcardToolbar({
  isShuffle,
  isProgressMode,
  hideIpa,
  hideExample,
  onToggleShuffle,
  onToggleProgressMode,
  onToggleIpa,
  onToggleExample,
  onSpeak,
  onRestart,
}: FlashcardToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 max-w-xl mx-auto py-3 select-none">
      {/* Shuffle Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleShuffle}
        className={cn(
          "rounded-xl h-9.5 text-xs font-semibold gap-1.5 cursor-pointer transition-all shrink-0 px-3",
          isShuffle
            ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
        title="Trộn ngẫu nhiên thẻ"
      >
        <Shuffle className="h-3.5 w-3.5" />
        {isShuffle ? "Đã trộn" : "Trộn thẻ"}
      </Button>

      {/* Progress Mode Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleProgressMode}
        className={cn(
          "rounded-xl h-9.5 text-xs font-semibold gap-1.5 cursor-pointer transition-all shrink-0 px-3",
          isProgressMode
            ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
        title="Chế độ phân loại Tiến độ học tập"
      >
        <SwitchCamera className="h-3.5 w-3.5" />
        Tiến độ
      </Button>

      {/* Speak Audio Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onSpeak}
        className="rounded-xl h-9.5 text-xs font-semibold gap-1.5 cursor-pointer text-muted-foreground hover:bg-muted hover:text-foreground shrink-0 px-3"
        title="Phát phát âm từ vựng"
      >
        <Volume2 className="h-3.5 w-3.5" />
        Phát âm
      </Button>

      {/* Toggle IPA Visibility */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleIpa}
        className={cn(
          "rounded-xl h-9.5 text-xs font-semibold gap-1.5 cursor-pointer transition-all shrink-0 px-3",
          hideIpa ? "text-indigo-600 dark:text-indigo-400 bg-indigo-500/5" : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
        title={hideIpa ? "Hiện phiên âm" : "Ẩn phiên âm"}
      >
        {hideIpa ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
        Phiên âm
      </Button>

      {/* Toggle Example Visibility */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleExample}
        className={cn(
          "rounded-xl h-9.5 text-xs font-semibold gap-1.5 cursor-pointer transition-all shrink-0 px-3",
          hideExample ? "text-indigo-600 dark:text-indigo-400 bg-indigo-500/5" : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
        title={hideExample ? "Hiện câu ví dụ" : "Ẩn câu ví dụ"}
      >
        {hideExample ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
        Ví dụ
      </Button>

      {/* Restart Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onRestart}
        className="rounded-xl h-9.5 text-xs font-semibold gap-1.5 cursor-pointer text-rose-500 hover:text-rose-600 hover:bg-rose-500/5 shrink-0 px-3 ml-auto sm:ml-0"
        title="Làm mới lại toàn bộ phiên học"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Reset
      </Button>
    </div>
  );
}
