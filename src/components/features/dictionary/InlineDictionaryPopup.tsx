"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, X, AlertCircle, Bookmark, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { detectPartOfSpeech } from "@/lib/nlp/pos";
import type { DictionaryResult } from "@/types/dictionary";
import { SaveWordModal } from "./SaveWordModal";

interface InlineDictionaryPopupProps {
  word: string;
  sentence?: string;
  x: number;
  y: number;
  onClose: () => void;
}

export function InlineDictionaryPopup({
  word,
  sentence,
  x,
  y,
  onClose,
}: InlineDictionaryPopupProps) {
  const [data, setData] = useState<DictionaryResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const popupRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: y, left: x });

  const detectedPos = sentence ? detectPartOfSpeech(sentence, word) : null;

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    const cleanWord = word.trim();

    const resetTimer = setTimeout(() => {
      if (!isMounted) return;
      if (!cleanWord) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      setData(null);
    }, 0);

    if (!cleanWord) {
      return () => {
        isMounted = false;
        clearTimeout(resetTimer);
        controller.abort();
      };
    }

    const params = new URLSearchParams({ q: cleanWord });
    if (detectedPos) params.set("pos", detectedPos);
    if (sentence) params.set("sentence", sentence);

    fetch(`/api/dictionary/lookup?${params.toString()}`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Không tìm thấy từ trong từ điển.");
        }
        return res.json();
      })
      .then((payload) => {
        if (!isMounted) return;
        if (payload.success && payload.data) {
          setData(payload.data);
        } else {
          setError(payload.error || "Không tìm thấy dữ liệu từ điển.");
        }
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Lỗi tra cứu từ điển.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
      clearTimeout(resetTimer);
      controller.abort();
    };
  }, [word, sentence, detectedPos]);

  // Handle escape & outside clicks
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
    }, 20);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  // Adjust positioning within viewport bounds
  useEffect(() => {
    if (popupRef.current) {
      const rect = popupRef.current.getBoundingClientRect();
      let newLeft = x - rect.width / 2;
      let newTop = y + 10;

      const margin = 16;
      if (newLeft + rect.width + margin > window.innerWidth) {
        newLeft = window.innerWidth - rect.width - margin;
      }
      if (newLeft < margin) newLeft = margin;

      if (newTop + rect.height + margin > window.innerHeight) {
        newTop = y - rect.height - 36;
      }
      if (newTop < margin) newTop = margin;

      setPosition({ left: Math.round(newLeft), top: Math.round(newTop) });
    }
  }, [x, y, data, loading, error]);

  const playPronunciation = () => {
    if (!data) return;
    setIsPlayingAudio(true);

    const audioUrl = data.audioUs || data.audioUk;
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => speakBrowser(data.word);
      audio.play().catch(() => speakBrowser(data.word));
    } else {
      speakBrowser(data.word);
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

  // Find primary meaning
  const primaryMeaningGroup = data?.meanings[0];
  const primaryDefinition = primaryMeaningGroup?.definitions[0];

  return (
    <>
      <AnimatePresence>
        <motion.div
          ref={popupRef}
          data-inline-popup="true"
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
          style={{ top: position.top, left: position.left }}
          className="fixed z-50 w-[min(22rem,calc(100vw-2rem))] max-h-[420px] overflow-y-auto rounded-3xl border border-border/80 bg-popover text-popover-foreground shadow-2xl backdrop-blur-md"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/60 bg-popover/90 px-4 py-2.5 backdrop-blur-md">
            <div className="flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-primary" />
              <span className="font-bold text-xs text-foreground uppercase tracking-wider">
                Tra nhanh từ vựng
              </span>
            </div>
            <button
              onClick={onClose}
              aria-label="Đóng popup tra từ"
              className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-4 text-sm">
            {loading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-6 w-32 rounded-md bg-muted"></div>
                <div className="h-4 w-full rounded-md bg-muted"></div>
                <div className="h-4 w-3/4 rounded-md bg-muted"></div>
                <div className="h-4 w-1/2 rounded-md bg-muted"></div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                <AlertCircle className="mb-2 h-6 w-6 text-rose-500/80" />
                <p className="text-xs font-medium">{error}</p>
              </div>
            ) : data ? (
              <div className="space-y-3.5">
                {/* Word & IPA */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl font-black text-foreground">{data.word}</h3>
                    {data.ipa && (
                      <span className="font-mono text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-md font-medium">
                        {data.ipa}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={playPronunciation}
                      className="rounded-full text-primary hover:bg-primary/10 h-7 w-7"
                      title="Phát âm tiếng Anh"
                    >
                      <Volume2 className={`h-4 w-4 ${isPlayingAudio ? "animate-pulse" : ""}`} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => setSaveModalOpen(true)}
                      className="rounded-full text-amber-600 hover:bg-amber-500/10 h-7 w-7"
                      title="Lưu từ vào bộ từ"
                    >
                      <Bookmark className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Part of Speech */}
                <div className="flex items-center gap-2 flex-wrap">
                  {detectedPos ? (
                    <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary border-primary/40 bg-primary/5">
                      Từ loại trong câu: {detectedPos}
                    </Badge>
                  ) : primaryMeaningGroup?.partOfSpeech ? (
                    <Badge variant="secondary" className="text-[10px] uppercase font-bold">
                      {primaryMeaningGroup.partOfSpeech}
                    </Badge>
                  ) : null}
                </div>

                {/* Vietnamese Meaning Banner */}
                {(data.primaryVietnamese || primaryMeaningGroup?.vietnameseSummary) && (
                  <div className="rounded-2xl border border-primary/20 bg-primary/10 p-3 text-foreground">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary block mb-0.5">
                      Nghĩa tiếng Việt
                    </span>
                    <p className="font-bold text-sm text-foreground">
                      {data.primaryVietnamese || primaryMeaningGroup?.vietnameseSummary}
                    </p>
                  </div>
                )}

                {/* Definitions */}
                {primaryMeaningGroup?.definitions && primaryMeaningGroup.definitions.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Định nghĩa tiếng Anh
                    </span>
                    <ol className="list-decimal pl-4 space-y-2 text-xs text-foreground/90 leading-relaxed">
                      {primaryMeaningGroup.definitions.slice(0, 3).map((def, idx) => (
                        <li key={idx} className="pl-1">
                          <span className="font-medium">{def.definitionEn}</span>
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
                  </div>
                )}

                {/* Synonyms */}
                {primaryMeaningGroup?.synonyms && primaryMeaningGroup.synonyms.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Từ đồng nghĩa
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {primaryMeaningGroup.synonyms.slice(0, 4).map((syn) => (
                        <span
                          key={syn}
                          className="rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px] font-medium"
                        >
                          {syn}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bottom Quick Save Action */}
                <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">Muốn ôn tập từ này?</span>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setSaveModalOpen(true)}
                    className="h-7 px-3 rounded-xl font-bold text-xs gap-1.5 bg-amber-500 hover:bg-amber-600 text-white"
                  >
                    <Bookmark className="h-3 w-3" />
                    <span>Lưu vào bộ từ</span>
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </motion.div>
      </AnimatePresence>

      {data && (
        <SaveWordModal
          open={saveModalOpen}
          onOpenChange={setSaveModalOpen}
          initialData={{
            word: data.word,
            ipa: data.ipa,
            meaning: data.primaryVietnamese || primaryMeaningGroup?.vietnameseSummary || "",
            partOfSpeech: detectedPos || primaryMeaningGroup?.partOfSpeech || "noun",
            example: primaryDefinition?.exampleEn,
            exampleTranslation: primaryDefinition?.exampleVi,
            synonyms: primaryMeaningGroup?.synonyms,
          }}
        />
      )}
    </>
  );
}
