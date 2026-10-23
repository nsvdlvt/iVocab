"use client";

import React, { useState } from "react";
import { Volume2, Bookmark, Sparkles, BookOpen, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { DictionaryResult, DictionarySenseDefinition } from "@/types/dictionary";
import { SaveWordModal } from "./SaveWordModal";
import { HighlightedSentence } from "@/components/common/HighlightedExample";

interface DictionaryResultViewProps {
  data: DictionaryResult;
  onSelectWord?: (word: string) => void;
  className?: string;
}

export function DictionaryResultView({ data, onSelectWord, className }: DictionaryResultViewProps) {
  const [playingAudio, setPlayingAudio] = useState<"uk" | "us" | null>(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [selectedSenseForSave, setSelectedSenseForSave] = useState<{
    meaning?: string;
    partOfSpeech?: string;
    example?: string;
    exampleTranslation?: string;
  } | null>(null);

  const [activePosFilter, setActivePosFilter] = useState<string>("all");

  const playPronunciation = (region: "uk" | "us") => {
    const audioUrl = region === "uk" ? data.audioUk : data.audioUs;

    setPlayingAudio(region);

    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.onended = () => setPlayingAudio(null);
      audio.onerror = () => {
        // Fallback to Web Speech API
        speakWithBrowser(data.word, region);
      };
      audio.play().catch(() => {
        speakWithBrowser(data.word, region);
      });
    } else {
      speakWithBrowser(data.word, region);
    }
  };

  const speakWithBrowser = (word: string, region: "uk" | "us") => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setPlayingAudio(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = region === "uk" ? "en-GB" : "en-US";
    utterance.rate = 0.9;
    utterance.onend = () => setPlayingAudio(null);
    utterance.onerror = () => setPlayingAudio(null);
    window.speechSynthesis.speak(utterance);
  };

  const copyToClipboard = () => {
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(data.word);
      toast.success(`Đã sao chép "${data.word}"`);
    }
  };

  const handleOpenSaveGeneral = () => {
    const firstMeaning = data.meanings[0];
    const firstDef = firstMeaning?.definitions[0];
    setSelectedSenseForSave({
      meaning: data.primaryVietnamese || firstDef?.definitionVi || firstMeaning?.vietnameseSummary || "",
      partOfSpeech: firstMeaning?.partOfSpeech || "noun",
      example: firstDef?.exampleEn || "",
      exampleTranslation: firstDef?.exampleVi || "",
    });
    setSaveModalOpen(true);
  };

  const handleOpenSaveSense = (pos: string, def: DictionarySenseDefinition) => {
    setSelectedSenseForSave({
      meaning: def.definitionVi || def.definitionEn,
      partOfSpeech: pos,
      example: def.exampleEn || "",
      exampleTranslation: def.exampleVi || "",
    });
    setSaveModalOpen(true);
  };

  // Filter meanings by active part of speech
  const filteredMeanings =
    activePosFilter === "all"
      ? data.meanings
      : data.meanings.filter((m) => m.partOfSpeech.toLowerCase() === activePosFilter.toLowerCase());

  // Distinct POS tabs
  const posList = Array.from(new Set(data.meanings.map((m) => m.partOfSpeech.toLowerCase())));

  // Highlight word in sentence
  const renderHighlightedExample = (exampleText: string, targetWord: string) => {
    const parts = exampleText.split(new RegExp(`(${targetWord})`, "gi"));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === targetWord.toLowerCase() ? (
            <mark
              key={i}
              className="bg-amber-500/20 text-amber-900 dark:text-amber-200 font-bold px-1 py-0.5 rounded"
            >
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Word Header Card */}
      <Card className="overflow-hidden border-border/80 bg-card p-6 shadow-sm rounded-3xl relative">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                {data.word}
              </h1>
              <button
                type="button"
                onClick={copyToClipboard}
                title="Sao chép từ"
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Sao chép từ vựng"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>

            {/* Pronunciation & Phonetics */}
            <div className="flex items-center gap-2.5 flex-wrap pt-1">
              {data.ipa && (
                <span className="font-mono text-sm sm:text-base text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-lg font-medium">
                  {data.ipa}
                </span>
              )}

              {/* Audio UK */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => playPronunciation("uk")}
                className={cn(
                  "h-8 rounded-xl gap-1.5 text-xs font-semibold border-border/80",
                  playingAudio === "uk" && "border-primary bg-primary/10 text-primary"
                )}
                title="Phát âm Anh - Anh (UK)"
              >
                <Volume2 className={cn("h-3.5 w-3.5 text-primary", playingAudio === "uk" && "animate-pulse")} />
                <span>UK</span>
              </Button>

              {/* Audio US */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => playPronunciation("us")}
                className={cn(
                  "h-8 rounded-xl gap-1.5 text-xs font-semibold border-border/80",
                  playingAudio === "us" && "border-primary bg-primary/10 text-primary"
                )}
                title="Phát âm Anh - Mỹ (US)"
              >
                <Volume2 className={cn("h-3.5 w-3.5 text-primary", playingAudio === "us" && "animate-pulse")} />
                <span>US</span>
              </Button>
            </div>
          </div>

          {/* Quick Save to Vocabulary Set Button */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <Button
              type="button"
              onClick={handleOpenSaveGeneral}
              className="rounded-2xl font-bold gap-2 bg-amber-500 hover:bg-amber-600 text-white shadow-xs"
            >
              <Bookmark className="h-4 w-4" />
              <span>Lưu vào bộ từ</span>
            </Button>
          </div>
        </div>

        {/* Primary Vietnamese Meaning Banner */}
        {data.primaryVietnamese && (
          <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
            <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary block mb-0.5">
                Nghĩa tiếng Việt phổ biến
              </span>
              <p className="text-base sm:text-lg font-bold text-foreground">
                {data.primaryVietnamese}
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Part of Speech Filter Tabs (for Polysemy) */}
      {posList.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActivePosFilter("all")}
            className={cn(
              "rounded-xl px-3.5 py-1.5 text-xs font-bold transition-colors cursor-pointer",
              activePosFilter === "all"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            Tất cả ({data.meanings.length} loại từ)
          </button>
          {posList.map((pos) => (
            <button
              key={pos}
              type="button"
              onClick={() => setActivePosFilter(pos)}
              className={cn(
                "rounded-xl px-3.5 py-1.5 text-xs font-bold uppercase transition-colors cursor-pointer",
                activePosFilter === pos
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {pos}
            </button>
          ))}
        </div>
      )}

      {/* Polysemy & Senses Detailed View */}
      <div className="space-y-4">
        {filteredMeanings.map((group, gIdx) => (
          <Card
            key={`${group.partOfSpeech}-${gIdx}`}
            className="overflow-hidden border-border/80 bg-card p-5 sm:p-6 rounded-3xl shadow-xs"
          >
            {/* Header for this POS */}
            <div className="flex items-center justify-between pb-4 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <Badge className="capitalize font-bold text-xs px-3 py-1 bg-secondary text-secondary-foreground border-0">
                  {group.partOfSpeech}
                </Badge>
                {group.vietnameseSummary && (
                  <span className="text-sm font-semibold text-foreground/80">
                    — {group.vietnameseSummary}
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground font-medium">
                {group.definitions.length} định nghĩa
              </span>
            </div>

            {/* Senses List */}
            <div className="divide-y divide-border/40 pt-1">
              {group.definitions.map((def, dIdx) => (
                <div key={def.id || dIdx} className="py-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <span className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0 mt-0.5">
                        {dIdx + 1}
                      </span>
                      <div className="space-y-1">
                        {/* English Definition */}
                        <p className="text-sm sm:text-base font-semibold text-foreground leading-relaxed">
                          {def.definitionEn}
                        </p>

                        {/* Vietnamese Definition */}
                        {def.definitionVi && (
                          <p className="text-sm font-medium text-primary">
                            {def.definitionVi}
                          </p>
                        )}
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenSaveSense(group.partOfSpeech, def)}
                      className="rounded-xl text-xs text-muted-foreground hover:text-primary hover:bg-primary/10 shrink-0 h-8 gap-1.5"
                      title="Lưu nghĩa này vào bộ từ"
                    >
                      <Bookmark className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Lưu nghĩa này</span>
                    </Button>
                  </div>

                  {/* Contextual Example */}
                  {def.exampleEn && (
                    <div className="ml-8 rounded-2xl bg-muted/30 border border-border/50 p-3 space-y-1">
                      <p className="text-xs sm:text-sm text-foreground/90 italic leading-relaxed">
                        &ldquo;
                        <HighlightedSentence
                          sentence={def.exampleEn}
                          type="en"
                          targetWord={data.word}
                        />
                        &rdquo;
                      </p>
                      {def.exampleVi && (
                        <p className="text-xs text-muted-foreground">
                          <HighlightedSentence
                            sentence={def.exampleVi}
                            type="vi"
                            meaning={def.definitionVi}
                          />
                        </p>
                      )}
                    </div>
                  )}

                  {/* Synonyms for this sense */}
                  {def.synonyms && def.synonyms.length > 0 && (
                    <div className="ml-8 flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase">
                        Đồng nghĩa:
                      </span>
                      {def.synonyms.map((syn) => (
                        <button
                          key={syn}
                          type="button"
                          onClick={() => onSelectWord?.(syn)}
                          className="rounded-lg border border-border/60 bg-muted/40 px-2 py-0.5 text-xs text-foreground hover:border-primary/50 hover:text-primary transition-colors cursor-pointer"
                        >
                          {syn}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* Collocations & Related Expressions */}
      {data.collocations && data.collocations.length > 0 && (
        <Card className="border-border/80 bg-card p-5 rounded-3xl shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Cụm từ thường gặp & Collocations
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.collocations.map((colloc) => (
              <button
                key={colloc}
                type="button"
                onClick={() => onSelectWord?.(colloc)}
                className="rounded-xl border border-border/70 bg-muted/40 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted hover:border-primary/50 hover:text-primary transition-colors cursor-pointer"
              >
                {colloc}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Save Modal */}
      {selectedSenseForSave && (
        <SaveWordModal
          open={saveModalOpen}
          onOpenChange={setSaveModalOpen}
          initialData={{
            word: data.word,
            ipa: data.ipa,
            meaning: selectedSenseForSave.meaning,
            partOfSpeech: selectedSenseForSave.partOfSpeech,
            example: selectedSenseForSave.example,
            exampleTranslation: selectedSenseForSave.exampleTranslation,
          }}
        />
      )}
    </div>
  );
}
