"use client";

import React, { useState, useEffect } from "react";
import {
  Languages,
  ArrowLeftRight,
  Sparkles,
  Copy,
  Volume2,
  X,
  Bookmark,
  RotateCcw,
  BookOpen,
  HelpCircle,
  Lightbulb,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { SaveWordModal } from "@/components/features/dictionary/SaveWordModal";
import type {
  TranslationResponseData,
  KeyVocabularyItem,
  IdiomOrPhraseItem,
} from "@/types/translation";
import { useSpeak } from "@/hooks/use-speak";

const SAMPLE_PHRASES = [
  "The dedicated team went the extra mile to finish the critical project ahead of schedule.",
  "Her innovative proposal was taken with a grain of salt by conservative stakeholders.",
  "Technology has fundamentally revolutionized the way modern organizations communicate.",
];

export function TranslationLearningPanel({ className }: { className?: string }) {
  const { speakText } = useSpeak();

  const [inputText, setInputText] = useState("");
  const [sourceLang, setSourceLang] = useState<"auto" | "en" | "vi">("auto");
  const [targetLang, setTargetLang] = useState<"en" | "vi">("vi");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TranslationResponseData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Save Word Modal
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [wordToSave, setWordToSave] = useState<{
    word: string;
    meaning?: string;
    ipa?: string;
    partOfSpeech?: string;
    example?: string;
  } | null>(null);

  const handleSwapLanguages = () => {
    if (sourceLang === "auto") {
      // If source was auto, swap based on target
      setSourceLang(targetLang);
      setTargetLang(targetLang === "vi" ? "en" : "vi");
    } else {
      const nextSource = targetLang;
      const nextTarget = sourceLang;
      setSourceLang(nextSource);
      setTargetLang(nextTarget);
    }
  };

  const handleTranslate = async (textToTranslate?: string) => {
    const text = (textToTranslate ?? inputText).trim();
    if (!text) {
      toast.error("Vui lòng nhập văn bản cần dịch.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/learning/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          sourceLang,
          targetLang,
          includeLearningAnalysis: true,
        }),
      });

      const payload = await res.json();
      if (!res.ok || !payload.success) {
        throw new Error(payload.error || "Không thể dịch văn bản lúc này.");
      }

      setResult(payload.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi kết nối dịch thuật.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      void handleTranslate();
    }
  };

  const handleCopy = (text: string) => {
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Đã sao chép vào bộ nhớ tạm");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenSaveWord = (item: {
    word: string;
    meaning?: string;
    ipa?: string;
    partOfSpeech?: string;
    example?: string;
  }) => {
    setWordToSave(item);
    setSaveModalOpen(true);
  };

  return (
    <div className={cn("mx-auto w-full max-w-4xl space-y-6 select-none", className)}>
      {/* Language Toolbar & Quick Swap */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card p-3 shadow-2xs">
        <div className="flex items-center gap-2">
          {/* Source Lang Select */}
          <select
            value={sourceLang}
            onChange={(e) => setSourceLang(e.target.value as "auto" | "en" | "vi")}
            aria-label="Chọn ngôn ngữ nguồn"
            className="h-9 rounded-xl border border-border/70 bg-background px-3 text-xs sm:text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          >
            <option value="auto">Tự động phát hiện</option>
            <option value="en">Tiếng Anh (EN)</option>
            <option value="vi">Tiếng Việt (VI)</option>
          </select>

          {/* Swap Button */}
          <button
            type="button"
            onClick={handleSwapLanguages}
            title="Đổi chiều ngôn ngữ"
            aria-label="Đổi chiều ngôn ngữ"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </button>

          {/* Target Lang Select */}
          <select
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value as "en" | "vi")}
            aria-label="Chọn ngôn ngữ đích"
            className="h-9 rounded-xl border border-border/70 bg-background px-3 text-xs sm:text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          >
            <option value="vi">Tiếng Việt (VI)</option>
            <option value="en">Tiếng Anh (EN)</option>
          </select>
        </div>

        {/* Clear and Translate Actions */}
        <div className="flex items-center gap-2 ml-auto">
          {inputText && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setInputText("");
                setResult(null);
                setError(null);
              }}
              className="h-9 gap-1.5 rounded-xl text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
              <span>Xóa</span>
            </Button>
          )}

          <Button
            type="button"
            onClick={() => handleTranslate()}
            disabled={loading || !inputText.trim()}
            className="h-9 gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm px-4 shadow-sm"
          >
            <Sparkles className={cn("h-4 w-4", loading && "animate-spin")} />
            <span>{loading ? "Đang dịch & phân tích..." : "Dịch"}</span>
          </Button>
        </div>
      </div>

      {/* Input Area */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="relative">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập từ, cụm từ, câu hoặc đoạn văn bản cần dịch (Ctrl + Enter để dịch)..."
            rows={4}
            maxLength={5000}
            className="w-full resize-y rounded-xl border border-transparent bg-transparent text-sm sm:text-base text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-between border-t border-border/60 pt-2 text-[11px] text-muted-foreground">
          <span className="italic">Nhấn Ctrl + Enter để dịch nhanh</span>
          <span className="tabular-nums">{inputText.length} / 5000 ký tự</span>
        </div>
      </div>

      {/* Translation Output Card */}
      {result && (
        <Card className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Bản dịch ({result.targetLang.toUpperCase()})
              </span>
              {result.detectedSourceLang && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                  Phát hiện: {result.detectedSourceLang.toUpperCase()}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => speakText(result.translatedText)}
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                title="Nghe phát âm bản dịch"
                aria-label="Phát âm bản dịch"
              >
                <Volume2 className="h-4 w-4" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => handleCopy(result.translatedText)}
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                title="Sao chép bản dịch"
                aria-label="Sao chép bản dịch"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  handleOpenSaveWord({
                    word: inputText.trim(),
                    meaning: result.translatedText,
                    example: inputText.trim(),
                  })
                }
                className="h-8 gap-1.5 rounded-lg text-xs font-semibold text-purple-600 dark:text-purple-400 border-purple-500/30 hover:bg-purple-500/10"
              >
                <Bookmark className="h-3.5 w-3.5" />
                <span>Lưu bản dịch</span>
              </Button>
            </div>
          </div>

          {/* Translated text */}
          <div className="text-base sm:text-lg font-medium text-foreground whitespace-pre-wrap leading-relaxed">
            {result.translatedText}
          </div>
        </Card>
      )}

      {/* Learning-Focused Insights: Key Vocabulary */}
      {result && result.keyVocabulary && result.keyVocabulary.length > 0 && (
        <Card className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-600/10 text-purple-600 dark:text-purple-400">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-foreground">
                Từ vựng & Cụm từ quan trọng trong đoạn
              </h3>
              <p className="text-xs text-muted-foreground">
                Được AI trích xuất để giúp bạn ôn luyện và lưu ngay vào bộ từ vựng.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {result.keyVocabulary.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col justify-between rounded-xl border border-border/80 bg-card p-3.5 space-y-2.5 shadow-2xs"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm sm:text-base text-foreground">
                        {item.word}
                      </span>
                      {item.partOfSpeech && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] uppercase font-semibold h-4 px-1"
                        >
                          {item.partOfSpeech}
                        </Badge>
                      )}
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => speakText(item.word)}
                      className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                      title="Phát âm"
                      aria-label="Phát âm từ"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {item.ipa && (
                    <span className="font-mono text-xs text-purple-600 dark:text-purple-400 block">
                      /{item.ipa}/
                    </span>
                  )}

                  <p className="text-xs sm:text-sm font-semibold text-foreground/90">
                    {item.meaning}
                  </p>

                  {item.note && (
                    <p className="text-xs text-muted-foreground leading-relaxed italic">
                      &bull; {item.note}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-border/60 flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleOpenSaveWord({
                        word: item.word,
                        meaning: item.meaning,
                        ipa: item.ipa,
                        partOfSpeech: item.partOfSpeech,
                        example: item.example || inputText,
                      })
                    }
                    className="h-7 gap-1 rounded-lg text-xs font-semibold text-purple-600 dark:text-purple-400 border-purple-500/30 hover:bg-purple-500/10"
                  >
                    <Bookmark className="h-3 w-3" />
                    <span>Lưu vào bộ từ</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Learning-Focused Insights: Idioms & Phrasal Verbs */}
      {result && result.idiomsAndPhrases && result.idiomsAndPhrases.length > 0 && (
        <Card className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 sm:p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Lightbulb className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-foreground">
                Thành ngữ & Cụm động từ phát hiện được
              </h3>
              <p className="text-xs text-muted-foreground">
                Các cụm từ cố định giúp câu văn tự nhiên và nâng cao điểm ngữ cảm.
              </p>
            </div>
          </div>

          <div className="space-y-2.5 pt-1">
            {result.idiomsAndPhrases.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between gap-3 rounded-xl border border-border/80 bg-card p-3 shadow-2xs"
              >
                <div className="space-y-1">
                  <span className="font-bold text-sm text-foreground">
                    &ldquo;{item.phrase}&rdquo;
                  </span>
                  <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-300 font-medium">
                    &rarr; {item.meaning}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.explanation}
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleOpenSaveWord({
                      word: item.phrase,
                      meaning: item.meaning,
                      example: inputText,
                    })
                  }
                  className="h-8 gap-1.5 rounded-lg text-xs font-semibold text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/10 shrink-0"
                >
                  <Bookmark className="h-3.5 w-3.5" />
                  <span>Lưu cụm từ</span>
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Alternative Nuances & Translations */}
      {result &&
        result.alternativeTranslations &&
        result.alternativeTranslations.length > 0 && (
          <Card className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                <HelpCircle className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-foreground">
                  Bản dịch thay thế & Phân biệt sắc thái nghĩa
                </h3>
                <p className="text-xs text-muted-foreground">
                  Các cách dịch khác nhau tùy thuộc vào ngữ cảnh trang trọng hoặc thân mật.
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              {result.alternativeTranslations.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-1 text-xs"
                >
                  <div className="font-bold text-foreground">
                    Cụm: &ldquo;{item.phrase}&rdquo;
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-muted-foreground">Có thể dịch là:</span>
                    {item.alternatives.map((alt, aIdx) => (
                      <Badge key={aIdx} variant="secondary" className="text-xs">
                        {alt}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-muted-foreground pt-0.5">{item.nuance}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

      {/* Empty State with Sample Phrases */}
      {!result && !loading && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/40 px-6 py-12 text-center shadow-2xs space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border/60 bg-purple-600/10 text-purple-600 dark:text-purple-400">
            <Languages className="h-6 w-6" />
          </div>

          <div className="max-w-md space-y-1.5">
            <h3 className="text-base font-bold text-foreground">
              Công cụ Dịch thuật tích hợp học từ vựng
            </h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Dịch câu, đoạn văn hoặc thành ngữ Anh - Việt. AI sẽ tự động phân tích các từ vựng cốt lõi, thành ngữ và cho phép bạn lưu ngay vào bộ từ để ôn luyện.
            </p>
          </div>

          {/* Quick Sample Prompts */}
          <div className="space-y-2 pt-2 text-left w-full max-w-lg">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block text-center">
              Thử nhanh các câu mẫu:
            </span>
            <div className="space-y-1.5">
              {SAMPLE_PHRASES.map((phrase, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setInputText(phrase);
                    void handleTranslate(phrase);
                  }}
                  className="w-full text-left rounded-xl border border-border/70 bg-card p-2.5 text-xs text-foreground/80 hover:border-purple-500/50 hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  &ldquo;{phrase}&rdquo;
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Save Word Modal */}
      {wordToSave && (
        <SaveWordModal
          open={saveModalOpen}
          onOpenChange={setSaveModalOpen}
          initialData={wordToSave}
        />
      )}
    </div>
  );
}
