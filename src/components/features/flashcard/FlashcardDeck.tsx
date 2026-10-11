"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { RotateCw, Settings2, Star, Volume2 } from "lucide-react";
import { FlashcardFrontMode } from "./FlashcardSettingsDialog";
import { FlashcardRow, getPartOfSpeechLabel } from "./flashcard-utils";
import { cn } from "@/lib/utils";

interface FlashcardDeckProps {
  word: FlashcardRow | null;
  flipped: boolean;
  frontMode: FlashcardFrontMode;
  onFlip: () => void;
  onSpeak: () => void;
  onOpenSettings: () => void;
  onToggleAutoSpeak: () => void;
  onToggleStar: () => void;
  autoSpeak: boolean;
  isStarred: boolean;
  readOnly: boolean;
}

export function FlashcardDeck({
  word,
  flipped,
  frontMode,
  onFlip,
  onSpeak,
  onOpenSettings,
  onToggleAutoSpeak,
  onToggleStar,
  autoSpeak,
  isStarred,
  readOnly,
}: FlashcardDeckProps) {
  if (!word) return null;

  const pos = getPartOfSpeechLabel(word.part_of_speech);
  const synonyms = word.synonyms?.filter(Boolean) ?? [];

  const renderTopBar = (sideLabel: string) => (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={(event) => {
            event.stopPropagation();
            onOpenSettings();
          }}
          className="rounded-lg text-muted-foreground hover:text-foreground"
          aria-label="Cài đặt thẻ từ"
          title="Cài đặt thẻ từ"
        >
          <Settings2 className="h-4 w-4" />
        </Button>
        <Badge variant="secondary" className="text-[11px] font-medium">
          {sideLabel}
        </Badge>
      </div>

      {!readOnly ? (
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={(event) => {
            event.stopPropagation();
            onToggleStar();
          }}
          className={cn(
            "rounded-lg transition-colors",
            isStarred
              ? "border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500/15"
              : "text-muted-foreground hover:text-amber-500 hover:border-amber-500/30"
          )}
          aria-label={isStarred ? "Bỏ đánh dấu sao" : "Đánh dấu sao"}
          title={isStarred ? "Bỏ đánh dấu sao" : "Đánh dấu sao"}
        >
          <Star
            className={cn(
              "h-4 w-4",
              isStarred && "fill-amber-400 text-amber-500"
            )}
          />
        </Button>
      ) : (
        <div className="h-8 w-8" />
      )}
    </div>
  );

  const renderBottomBar = () => (
    <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/60">
      <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <RotateCw className="h-3.5 w-3.5 text-primary/80" />
        <span>Nhấn vào thẻ hoặc bấm</span>
        <kbd className="hidden sm:inline-flex">Space</kbd>
        <span className="hidden sm:inline">để lật</span>
      </div>

      <div className="flex items-center gap-2.5">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={(event) => {
            event.stopPropagation();
            onSpeak();
          }}
          className="h-8 gap-1.5 rounded-lg px-2.5 text-xs"
          aria-label="Phát âm từ vựng"
        >
          <Volume2 className="h-3.5 w-3.5 text-primary" />
          <span className="hidden sm:inline">Phát âm</span>
        </Button>
        <div
          className="flex items-center gap-1.5 text-xs text-muted-foreground"
          onClick={(event) => event.stopPropagation()}
          title="Tự động phát âm khi chuyển thẻ"
        >
          <span className="hidden md:inline text-[11px]">Tự phát</span>
          <Switch
            checked={autoSpeak}
            onChange={onToggleAutoSpeak}
            ariaLabel="Tự động phát âm"
          />
        </div>
      </div>
    </div>
  );

  const renderFrontContent = () => {
    const title = frontMode === "definition" ? word.meaning : word.word;

    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-4 text-center px-2">
        <h2 className="text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl md:text-5xl break-words max-w-full">
          {title}
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {pos && (
            <Badge variant="outline" className="capitalize text-xs px-2.5 py-0.5">
              {pos}
            </Badge>
          )}
          {word.ipa && (
            <span className="font-mono text-sm sm:text-base text-muted-foreground bg-muted/50 px-2.5 py-0.5 rounded-md border border-border/60">
              {word.ipa}
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderBackContent = () => {
    const answer = frontMode === "definition" ? word.word : word.meaning;

    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 items-center justify-center overflow-y-auto px-2 py-2">
        <div className="flex w-full flex-col items-center gap-4 text-center">
          <section className="space-y-2.5">
            <h2 className="text-2xl font-bold leading-snug tracking-tight text-foreground sm:text-3xl md:text-4xl break-words">
              {answer}
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {pos && (
                <Badge variant="outline" className="capitalize text-xs px-2.5 py-0.5">
                  {pos}
                </Badge>
              )}
              {word.ipa && (
                <span className="font-mono text-sm text-muted-foreground bg-muted/50 px-2.5 py-0.5 rounded-md border border-border/60">
                  {word.ipa}
                </span>
              )}
            </div>
          </section>

          {word.example ? (
            <div className="w-full max-w-xl rounded-xl border border-border/70 bg-muted/25 px-4 py-3 text-center space-y-1">
              <p className="text-sm sm:text-base italic leading-relaxed text-foreground/90">
                &ldquo;{word.example}&rdquo;
              </p>
              {word.example_translation && (
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {word.example_translation}
                </p>
              )}
            </div>
          ) : null}

          {synonyms.length > 0 ? (
            <div className="flex max-w-xl flex-wrap items-center justify-center gap-1.5 pt-1">
              <span className="text-[11px] font-medium text-muted-foreground mr-1">
                Đồng nghĩa:
              </span>
              {synonyms.slice(0, 6).map((synonym) => (
                <Badge key={synonym} variant="secondary" className="text-xs font-normal">
                  {synonym}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md">
        <motion.div
          className="relative h-[26rem] sm:h-[28rem] md:h-[30rem] w-full overflow-hidden rounded-2xl touch-pan-y bg-card cursor-pointer select-none"
          style={{ willChange: "transform" }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.1}
          dragMomentum={false}
          onDragEnd={(_, info) => {
            if (Math.abs(info.offset.x) < 75) return;
            if (info.offset.x > 0) onFlip();
          }}
        >
          <motion.div
            className="relative h-full w-full"
            style={{ transformStyle: "preserve-3d", perspective: "1200px" }}
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 150, damping: 22, mass: 0.9 }}
            onClick={onFlip}
          >
            {/* Front Face */}
            <section
              className="absolute inset-0 flex h-full w-full flex-col justify-between rounded-2xl bg-card p-5 sm:p-6 md:p-8"
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: "translateZ(0)",
              }}
            >
              {renderTopBar(
                frontMode === "definition" ? "Mặt trước • Định nghĩa" : "Mặt trước • Thuật ngữ"
              )}
              <div className="flex flex-1 items-center justify-center py-4">
                {renderFrontContent()}
              </div>
              {renderBottomBar()}
            </section>

            {/* Back Face */}
            <section
              className="absolute inset-0 flex h-full w-full flex-col justify-between rounded-2xl bg-card p-5 sm:p-6 md:p-8"
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: "rotateY(180deg) translateZ(0)",
              }}
            >
              {renderTopBar(
                frontMode === "definition" ? "Mặt sau • Thuật ngữ" : "Mặt sau • Nghĩa & Ví dụ"
              )}
              <div className="flex flex-1 overflow-hidden py-2">
                {renderBackContent()}
              </div>
              {renderBottomBar()}
            </section>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
