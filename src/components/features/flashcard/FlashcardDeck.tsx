"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Settings2, Star, Volume2 } from "lucide-react";
import { FlashcardFrontMode } from "./FlashcardSettingsDialog";
import { FlashcardRow, getPartOfSpeechLabel } from "./flashcard-utils";

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

  const renderTopBar = () => (
    <div className="flex items-start justify-between gap-3">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={(event) => {
          event.stopPropagation();
          onOpenSettings();
        }}
        className="h-11 w-11 rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50 hover:text-slate-900"
      >
        <Settings2 className="h-4 w-4" />
      </Button>

      {!readOnly ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={(event) => {
            event.stopPropagation();
            onToggleStar();
          }}
          className={[
            "h-11 w-11 rounded-full border shadow-sm transition-colors",
            isStarred
              ? "border-amber-200 bg-amber-50 text-amber-500 hover:bg-amber-100"
              : "border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-amber-500",
          ].join(" ")}
          aria-label="Toggle star"
        >
          <Star className={["h-4 w-4", isStarred ? "fill-amber-400 text-amber-500" : ""].join(" ")} />
        </Button>
      ) : (
        <div className="h-11 w-11" />
      )}
    </div>
  );

  const renderAudioControl = () => (
    <div className="absolute bottom-4 right-4 flex items-center gap-2 sm:bottom-5 sm:right-5 md:bottom-6 md:right-6">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={(event) => {
          event.stopPropagation();
          onSpeak();
        }}
        className="h-9 w-9 rounded-full text-slate-500 hover:bg-slate-100 hover:text-sky-600"
        aria-label="Speak"
      >
        <Volume2 className="h-4 w-4" />
      </Button>
      <div onClick={(event) => event.stopPropagation()}>
        <Switch checked={autoSpeak} onChange={onToggleAutoSpeak} ariaLabel="Auto speak" />
      </div>
    </div>
  );

  const renderFrontContent = () => {
    const title = frontMode === "definition" ? word.meaning : word.word;

    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
        <h2 className="text-[2.55rem] font-extrabold leading-[1.08] tracking-[-0.045em] text-slate-950 sm:text-[3.1rem] md:text-[3.35rem]">
          {title}
        </h2>
        <p className="text-[1.05rem] font-medium text-slate-500 sm:text-[1.1rem]">
          <span className="capitalize">{pos || " "}</span>
          {pos && word.ipa ? <span className="mx-2 text-slate-300">-</span> : null}
          {word.ipa ? <span className="font-mono text-slate-500">{word.ipa}</span> : null}
        </p>
      </div>
    );
  };

  const renderBackContent = () => {
    const answer = frontMode === "definition" ? word.word : word.meaning;

    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 items-center justify-center px-2 py-2">
        <div className="flex w-full flex-col items-center gap-5 text-center">
          <section className="space-y-2">
            <h2 className="text-[2.5rem] font-extrabold leading-[1.08] tracking-[-0.045em] text-slate-950 sm:text-[3rem] md:text-[3.25rem]">
              {answer}
            </h2>
            <p className="text-[1.02rem] font-medium text-slate-500 sm:text-[1.08rem]">
              <span className="capitalize">{pos || " "}</span>
              {pos && word.ipa ? <span className="mx-2 text-slate-300">-</span> : null}
              {word.ipa ? <span className="font-mono text-slate-500">{word.ipa}</span> : null}
            </p>
          </section>

          {word.example ? (
            <p className="max-w-2xl text-[1.05rem] italic leading-7 text-slate-600 sm:text-[1.1rem] sm:leading-8">
              {word.example}
            </p>
          ) : null}

          {synonyms.length ? (
            <div className="flex max-w-2xl flex-wrap justify-center gap-2 pt-1">
              {synonyms.slice(0, 6).map((synonym) => (
                <span key={synonym} className="rounded-full bg-slate-50 px-3 py-1 text-sm font-medium text-slate-500">
                  {synonym}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto w-full max-w-[62rem]">
      <div className="relative overflow-hidden rounded-[1.7rem] border border-slate-200/80 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
        <motion.div
          className="relative h-[31.5rem] min-h-[31.5rem] w-full overflow-hidden rounded-[1.7rem] touch-pan-y bg-white max-md:h-[29rem] max-md:min-h-[29rem] max-sm:h-[calc(100dvh-13rem)] max-sm:min-h-[28rem]"
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
            transition={{ type: "spring", stiffness: 132, damping: 20, mass: 0.95 }}
            onClick={onFlip}
          >
            <section
              className="absolute inset-0 flex h-full w-full flex-col rounded-[1.7rem] p-5 sm:p-6 md:p-7"
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: "translateZ(0)",
              }}
            >
              {renderTopBar()}
              <div className="flex flex-1 items-center justify-center px-5 text-center">{renderFrontContent()}</div>
              {renderAudioControl()}
            </section>

            <section
              className="absolute inset-0 flex h-full w-full flex-col rounded-[1.7rem] p-5 sm:p-6 md:p-7"
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: "rotateY(180deg) translateZ(0)",
              }}
            >
              {renderTopBar()}
              <div className="flex flex-1 overflow-hidden px-5 py-2">{renderBackContent()}</div>
              {renderAudioControl()}
            </section>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
