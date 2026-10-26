"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Volume2,
  X,
  Copy,
  Check,
  Bookmark,
  ExternalLink,
  BookOpen,
  Languages,
  RotateCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { DictionaryResult } from "@/types/dictionary";
import { SaveWordModal } from "@/components/features/dictionary/SaveWordModal";
import Link from "next/link";

export interface SelectionResultPopupProps {
  selectedText: string;
  isSingleWord: boolean;
  wordForLookup: string;
  contextSentence?: string;
  position: { top: number; left: number };
  onClose: () => void;
}

export function SelectionResultPopup({
  selectedText,
  isSingleWord: initialIsSingleWord,
  wordForLookup,
  contextSentence,
  position,
  onClose,
}: SelectionResultPopupProps) {
  const [mode, setMode] = useState<"dictionary" | "translate">(
    initialIsSingleWord ? "dictionary" : "translate"
  );
  const [currentWord, setCurrentWord] = useState(wordForLookup);

  // Dictionary state
  const [dictData, setDictData] = useState<DictionaryResult | null>(null);
  const [dictLoading, setDictLoading] = useState(false);
  const [dictError, setDictError] = useState<string | null>(null);
  const [dictSuggestions, setDictSuggestions] = useState<Array<{ word: string }>>([]);

  // Translation state
  const [translation, setTranslation] = useState<string | null>(null);
  const [transLoading, setTransLoading] = useState(false);
  const [transError, setTransError] = useState<string | null>(null);

  // Audio & Save modal states
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const popupRef = useRef<HTMLDivElement>(null);
  const [computedStyle, setComputedStyle] = useState<{ top: number; left: number }>({
    top: position.top,
    left: position.left,
  });

  // Fetch dictionary data when in dictionary mode
  useEffect(() => {
    if (mode !== "dictionary" || !currentWord) return;

    let isMounted = true;
    const controller = new AbortController();

    queueMicrotask(() => {
      if (!isMounted) return;
      setDictLoading(true);
      setDictError(null);
      setDictSuggestions([]);
    });

    const params = new URLSearchParams({ q: currentWord.trim() });
    if (contextSentence) {
      params.set("sentence", contextSentence.trim());
    }

    fetch(`/api/dictionary/lookup?${params.toString()}`, {
      signal: controller.signal,
    })
      .then(async (res) => {
        const payload = await res.json().catch(() => null);
        if (!isMounted) return;

        if (res.ok && payload?.success && payload?.data) {
          setDictData(payload.data);
        } else {
          setDictError(payload?.error || `Không tìm thấy từ "${currentWord}" trong từ điển.`);
          if (Array.isArray(payload?.suggestions)) {
            setDictSuggestions(payload.suggestions);
          }
        }
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        setDictError("Lỗi kết nối khi tra cứu từ điển.");
      })
      .finally(() => {
        if (isMounted) setDictLoading(false);
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [mode, currentWord, contextSentence]);

  // Fetch translation data when in translate mode
  useEffect(() => {
    if (mode !== "translate" || !selectedText) return;

    let isMounted = true;
    const controller = new AbortController();

    queueMicrotask(() => {
      if (!isMounted) return;
      setTransLoading(true);
      setTransError(null);
    });

    fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: selectedText.trim() }),
      signal: controller.signal,
    })
      .then(async (res) => {
        const payload = await res.json().catch(() => null);
        if (!isMounted) return;

        if (res.ok && payload?.success && payload?.translation) {
          setTranslation(payload.translation);
        } else {
          setTransError(payload?.error || "Không thể dịch đoạn văn lúc này qua Google Translate.");
        }
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        setTransError("Lỗi kết nối khi dịch văn bản.");
      })
      .finally(() => {
        if (isMounted) setTransLoading(false);
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [mode, selectedText]);

  // Position adjustment to prevent screen overflow
  useEffect(() => {
    if (popupRef.current && typeof window !== "undefined") {
      const rect = popupRef.current.getBoundingClientRect();
      const margin = 16;
      let left = position.left - rect.width / 2;
      let top = position.top + 8;

      // Clamp horizontal
      if (left + rect.width + margin > window.innerWidth) {
        left = window.innerWidth - rect.width - margin;
      }
      if (left < margin) {
        left = margin;
      }

      // If overflowing bottom, position above selection
      if (top + rect.height + margin > window.innerHeight) {
        top = Math.max(margin, position.top - rect.height - 40);
      }

      setComputedStyle({
        left: Math.round(left),
        top: Math.round(top),
      });
    }
  }, [position, dictData, translation, dictLoading, transLoading, mode]);

  // Handle escape key and outside click
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (saveModalOpen) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("[role='dialog'], [data-save-word-modal]")) return;
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleClickOutside);
    }, 50);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose, saveModalOpen]);

  const copyText = (text: string, label: string) => {
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(`Đã sao chép ${label}`);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const playPronunciation = (audioUrl?: string, textToSpeak?: string) => {
    setIsPlayingAudio(true);
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => speakBrowser(textToSpeak || wordForLookup);
      audio.play().catch(() => speakBrowser(textToSpeak || wordForLookup));
    } else {
      speakBrowser(textToSpeak || wordForLookup || selectedText);
    }
  };

  const speakBrowser = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setIsPlayingAudio(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);
    window.speechSynthesis.speak(utterance);
  };

  const primaryMeaningGroup = dictData?.meanings?.[0];
  const primaryDefinition = primaryMeaningGroup?.definitions?.[0];

  return (
    <>
      <motion.div
        ref={popupRef}
        data-smart-selection-ui="true"
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.96 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          style={{ top: computedStyle.top, left: computedStyle.left }}
          className="fixed z-[1000] w-[min(26rem,calc(100vw-24px))] max-h-[82vh] overflow-y-auto rounded-2xl border border-border/80 bg-popover text-popover-foreground shadow-2xl backdrop-blur-xl flex flex-col font-sans"
        >
          {/* Header Bar */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/60 bg-popover/95 px-4 py-2.5 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold text-xs">
                {mode === "dictionary" ? (
                  <>
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Từ điển</span>
                  </>
                ) : (
                  <>
                    <Languages className="w-3.5 h-3.5" />
                    <span>Dịch câu / đoạn</span>
                  </>
                )}
              </div>

              {/* Mode switch button */}
              <button
                type="button"
                onClick={() => setMode((m) => (m === "dictionary" ? "translate" : "dictionary"))}
                className="text-[11px] text-muted-foreground hover:text-foreground font-medium underline underline-offset-2 transition-colors cursor-pointer"
                title={
                  mode === "dictionary"
                    ? "Chuyển sang chế độ dịch toàn bộ"
                    : "Chuyển sang tra từ điển"
                }
              >
                {mode === "dictionary" ? "Dịch câu" : "Tra từ điển"}
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  copyText(
                    mode === "dictionary"
                      ? dictData?.primaryVietnamese || dictData?.word || wordForLookup
                      : translation || selectedText,
                    mode === "dictionary" ? "kết quả" : "bản dịch"
                  )
                }
                aria-label="Sao chép kết quả"
                title="Sao chép"
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Đóng popup tra từ"
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-4 flex-1 text-sm overflow-y-auto space-y-3.5">
            {mode === "dictionary" ? (
              // DICTIONARY MODE (Case A)
              dictLoading ? (
                <div className="space-y-3 py-2 animate-pulse">
                  <div className="h-7 w-36 rounded-md bg-muted"></div>
                  <div className="h-4 w-24 rounded-md bg-muted"></div>
                  <div className="h-14 w-full rounded-xl bg-muted"></div>
                  <div className="h-4 w-full rounded-md bg-muted"></div>
                  <div className="h-4 w-4/5 rounded-md bg-muted"></div>
                </div>
              ) : dictError ? (
                <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground space-y-3">
                  <p className="text-xs font-medium text-foreground">{dictError}</p>
                  {dictSuggestions.length > 0 && (
                    <div className="w-full text-left pt-2 border-t border-border/50">
                      <span className="text-[11px] font-semibold text-muted-foreground block mb-1.5">
                        Gợi ý từ liên quan:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {dictSuggestions.slice(0, 5).map((item) => (
                          <button
                            type="button"
                            key={item.word}
                            onClick={() => setCurrentWord(item.word)}
                            className="text-xs px-2 py-0.5 rounded-md bg-muted hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer border border-border/40"
                          >
                            {item.word}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setMode("translate")}
                    className="gap-1.5 text-xs rounded-xl"
                  >
                    <Languages className="w-3.5 h-3.5" />
                    <span>Dịch bằng Google Translate</span>
                  </Button>
                </div>
              ) : dictData ? (
                <div className="space-y-3.5">
                  {/* Word title, Phonetics & Pronunciation audio */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-xl font-black text-foreground tracking-tight">
                          {dictData.word}
                        </h3>
                        {dictData.ipa && (
                          <span className="font-mono text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-md font-medium">
                            {dictData.ipa}
                          </span>
                        )}
                      </div>
                      {dictData.ipaUk && dictData.ipaUs && dictData.ipaUk !== dictData.ipaUs && (
                        <div className="text-[11px] text-muted-foreground flex gap-2 font-mono">
                          <span>UK: {dictData.ipaUk}</span>
                          <span>US: {dictData.ipaUs}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          playPronunciation(dictData.audioUs || dictData.audioUk, dictData.word)
                        }
                        className="rounded-full text-primary hover:bg-primary/10 h-8 w-8"
                        title="Nghe phát âm"
                        aria-label="Phát âm từ vựng"
                      >
                        <Volume2 className={`h-4 w-4 ${isPlayingAudio ? "animate-pulse" : ""}`} />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setSaveModalOpen(true)}
                        className="rounded-full text-amber-600 hover:bg-amber-500/10 h-8 w-8"
                        title="Lưu từ vào bộ từ cá nhân"
                        aria-label="Lưu từ"
                      >
                        <Bookmark className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Primary Vietnamese Meaning Card */}
                  {(dictData.primaryVietnamese || primaryMeaningGroup?.vietnameseSummary) && (
                    <div className="rounded-xl border border-primary/20 bg-primary/10 p-3 text-foreground">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary block mb-0.5">
                        Nghĩa tiếng Việt
                      </span>
                      <p className="font-bold text-sm text-foreground">
                        {dictData.primaryVietnamese || primaryMeaningGroup?.vietnameseSummary}
                      </p>
                    </div>
                  )}

                  {/* Meanings by Part of Speech */}
                  <div className="space-y-3">
                    {dictData.meanings.slice(0, 3).map((group, gIdx) => (
                      <div key={gIdx} className="space-y-1.5 border-t border-border/40 pt-2.5">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className="text-[10px] uppercase font-bold tracking-wider"
                          >
                            {group.partOfSpeech}
                          </Badge>
                          {group.vietnameseSummary &&
                            group.vietnameseSummary !== dictData.primaryVietnamese && (
                              <span className="text-xs font-semibold text-foreground/80">
                                {group.vietnameseSummary}
                              </span>
                            )}
                        </div>

                        {/* Definitions */}
                        {group.definitions.length > 0 && (
                          <ol className="list-decimal pl-4 space-y-1.5 text-xs text-foreground/90 leading-relaxed">
                            {group.definitions.slice(0, 2).map((def, dIdx) => (
                              <li key={dIdx} className="pl-1">
                                <span className="font-medium text-foreground">{def.definitionEn}</span>
                                {def.definitionVi && (
                                  <span className="block text-primary font-medium mt-0.5">
                                    {def.definitionVi}
                                  </span>
                                )}
                                {def.exampleEn && (
                                  <span className="block text-muted-foreground italic mt-0.5">
                                    &ldquo;{def.exampleEn}&rdquo;
                                  </span>
                                )}
                              </li>
                            ))}
                          </ol>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Collocations & Synonyms */}
                  {dictData.collocations.length > 0 && (
                    <div className="space-y-1 pt-1 border-t border-border/40">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                        Cụm từ hay gặp (Collocations)
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {dictData.collocations.slice(0, 4).map((col) => (
                          <span
                            key={col}
                            className="rounded-md border border-border/60 bg-muted/50 px-2 py-0.5 text-[11px] font-medium"
                          >
                            {col}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bottom Actions */}
                  <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
                    <Link
                      href={`/u/dictionary?q=${encodeURIComponent(dictData.word)}`}
                      className="text-xs text-muted-foreground hover:text-primary font-medium inline-flex items-center gap-1 transition-colors"
                      target="_blank"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Xem toàn bộ từ điển</span>
                    </Link>

                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setSaveModalOpen(true)}
                      className="h-7 px-3 rounded-xl font-bold text-xs gap-1.5 bg-amber-500 hover:bg-amber-600 text-white"
                    >
                      <Bookmark className="h-3 w-3" />
                      <span>Lưu từ</span>
                    </Button>
                  </div>
                </div>
              ) : null
            ) : (
              // TRANSLATE MODE (Case B)
              <div className="space-y-3.5">
                {/* Original Text Section */}
                <div className="space-y-1.5 rounded-xl border border-border/70 bg-muted/30 p-3">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground font-semibold">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>Văn bản gốc</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => playPronunciation(undefined, selectedText)}
                      className="hover:text-foreground transition-colors p-0.5 cursor-pointer"
                      title="Nghe đọc tiếng Anh"
                      aria-label="Phát âm đoạn văn"
                    >
                      <Volume2 className={`w-3.5 h-3.5 ${isPlayingAudio ? "animate-pulse" : ""}`} />
                    </button>
                  </div>
                  <p className="text-xs text-foreground/90 leading-relaxed max-h-32 overflow-y-auto">
                    {selectedText}
                  </p>
                </div>

                {/* Translation Section */}
                <div className="space-y-1.5 rounded-xl border border-primary/20 bg-primary/5 p-3">
                  <div className="flex items-center justify-between text-[11px] text-primary font-bold">
                    <div className="flex items-center gap-1.5">
                      <Languages className="w-3.5 h-3.5" />
                      <span>Bản dịch tiếng Việt (Google Translate)</span>
                    </div>
                  </div>

                  {transLoading ? (
                    <div className="space-y-2 py-1 animate-pulse">
                      <div className="h-4 w-full rounded bg-primary/10"></div>
                      <div className="h-4 w-3/4 rounded bg-primary/10"></div>
                    </div>
                  ) : transError ? (
                    <div className="space-y-2 py-1">
                      <p className="text-xs text-destructive font-medium">{transError}</p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setMode("translate");
                          setTransError(null);
                        }}
                        className="h-6 text-xs gap-1 rounded-lg"
                      >
                        <RotateCw className="w-3 h-3" />
                        <span>Thử lại</span>
                      </Button>
                    </div>
                  ) : translation ? (
                    <p className="text-sm font-medium text-foreground leading-relaxed whitespace-pre-wrap">
                      {translation}
                    </p>
                  ) : null}
                </div>

                {/* Copy button */}
                {translation && (
                  <div className="pt-1 flex items-center justify-end">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => copyText(translation, "bản dịch")}
                      className="h-7 px-3 text-xs rounded-xl gap-1.5 font-semibold"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3 h-3 text-white" />
                          <span>Đã sao chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Sao chép bản dịch</span>
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>

      {/* Save Word Modal */}
      {dictData && (
        <SaveWordModal
          open={saveModalOpen}
          onOpenChange={setSaveModalOpen}
          initialData={{
            word: dictData.word,
            ipa: dictData.ipa,
            meaning:
              dictData.primaryVietnamese || primaryMeaningGroup?.vietnameseSummary || "",
            partOfSpeech: primaryMeaningGroup?.partOfSpeech || "noun",
            example: primaryDefinition?.exampleEn,
            exampleTranslation: primaryDefinition?.exampleVi,
            synonyms: primaryMeaningGroup?.synonyms,
          }}
        />
      )}
    </>
  );
}
