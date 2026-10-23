"use client";

import React from "react";
import { Volume2, BookA, Search, X, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { HighlightedWord } from "./reading-types";
import { HighlightedSentence } from "@/components/common/HighlightedExample";

interface ReadingVocabularyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  words: HighlightedWord[];
  articleTitle: string;
}

export function ReadingVocabularyModal({
  open,
  onOpenChange,
  words,
  articleTitle,
}: ReadingVocabularyModalProps) {
  const [search, setSearch] = React.useState("");

  const filteredWords = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return words;
    return words.filter(
      (w) =>
        w.text.toLowerCase().includes(q) ||
        (w.meaning && w.meaning.toLowerCase().includes(q))
    );
  }, [words, search]);

  const playAudio = (word: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = "en-US";
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden rounded-3xl border-border/80">
        <DialogHeader className="p-5 sm:p-6 border-b border-border/60 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <BookA className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">
                  Từ vựng bài đọc
                </DialogTitle>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {articleTitle}
                </p>
              </div>
            </div>
          </div>

          <div className="relative mt-4">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm từ vựng hoặc nghĩa..."
              className="pl-9 h-10 rounded-xl"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto p-4 sm:p-5 space-y-3 divide-y divide-border/40">
          {filteredWords.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {words.length === 0
                ? "Bài đọc này chưa có danh sách từ vựng trọng tâm được ghim."
                : "Không tìm thấy từ vựng khớp với tìm kiếm."}
            </div>
          ) : (
            filteredWords.map((item, idx) => (
              <div key={`${item.text}-${idx}`} className={idx > 0 ? "pt-3" : ""}>
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-bold text-foreground">
                        {item.text}
                      </span>
                      {item.ipa ? (
                        <span className="text-xs font-mono text-muted-foreground">
                          /{item.ipa}/
                        </span>
                      ) : null}
                      {item.partOfSpeech ? (
                        <Badge variant="outline" className="text-[10px] px-2 py-0 uppercase">
                          {item.partOfSpeech}
                        </Badge>
                      ) : null}
                    </div>

                    {item.meaning ? (
                      <p className="text-sm text-foreground/90 font-medium">
                        {item.meaning}
                      </p>
                    ) : null}

                    {(item.example || item.exampleTranslation || item.example_translation) ? (
                      <div className="mt-1 space-y-0.5">
                        {item.example && (
                          <p className="text-xs italic text-muted-foreground">
                            &ldquo;
                            <HighlightedSentence
                              sentence={item.example}
                              type="en"
                              targetWord={item.text}
                            />
                            &rdquo;
                          </p>
                        )}
                        {(item.exampleTranslation || item.example_translation) && (
                          <p className="text-[11px] text-muted-foreground/80">
                            <HighlightedSentence
                              sentence={(item.exampleTranslation || item.example_translation)!}
                              type="vi"
                              meaning={item.meaning}
                            />
                          </p>
                        )}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => playAudio(item.text)}
                      title="Phát âm tiếng Anh"
                      className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10"
                    >
                      <Volume2 className="h-4 w-4" />
                    </Button>
                    <a
                      href={`/dictionary?q=${encodeURIComponent(item.text)}`}
                      target="_blank"
                      rel="noreferrer"
                      title="Tra từ điển chi tiết"
                      className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
