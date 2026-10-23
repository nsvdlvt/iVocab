"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Search,
  Sparkles,
  RotateCcw,
  AlertCircle,
  Compass,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DictionarySearchBar } from "./DictionarySearchBar";
import { DictionaryResultView } from "./DictionaryResultView";
import type { DictionaryResult, DictionarySuggestion } from "@/types/dictionary";
import { cn } from "@/lib/utils";

const FEATURED_WORDS = [
  { word: "eloquent", ipa: "/ˈɛləkwənt/", vi: "hùng biện, lưu loát", pos: "adj" },
  { word: "diligent", ipa: "/ˈdɪlɪdʒənt/", vi: "chăm chỉ, cần cù", pos: "adj" },
  { word: "resilient", ipa: "/rɪˈzɪliənt/", vi: "kiên cường, nhanh phục hồi", pos: "adj" },
  { word: "ubiquitous", ipa: "/juːˈbɪkwɪtəs/", vi: "có mặt ở khắp nơi", pos: "adj" },
  { word: "break the ice", ipa: "/breɪk ðiː aɪs/", vi: "phá vỡ sự ngại ngùng", pos: "phrase" },
  { word: "look forward to", ipa: "/lʊk ˈfɔːrwərd tuː/", vi: "trông chờ, mong đợi", pos: "phrase" },
];

export function DictionaryLearningPanel({ className }: { className?: string }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DictionaryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<DictionarySuggestion[]>([]);

  const handlePerformSearch = async (term: string) => {
    const clean = term.trim();
    if (!clean) return;

    setSearchTerm(clean);
    setLoading(true);
    setError(null);
    setResult(null);
    setSuggestions([]);

    try {
      const res = await fetch(`/api/dictionary/lookup?q=${encodeURIComponent(clean)}`);
      const payload = await res.json();

      if (!res.ok) {
        setError(payload.error || `Không tìm thấy từ "${clean}".`);
        if (Array.isArray(payload.suggestions)) {
          setSuggestions(payload.suggestions);
        }
        return;
      }

      if (payload.success && payload.data) {
        setResult(payload.data);
      } else {
        setError(payload.error || "Không thể tải thông tin từ điển.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi kết nối tra cứu từ điển.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("mx-auto w-full max-w-4xl space-y-6 select-none", className)}>
      {/* Search Bar with Debounce Suggestions and History */}
      <DictionarySearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        onSearch={handlePerformSearch}
        isLoading={loading}
        placeholder="Nhập từ vựng tiếng Anh, thành ngữ hoặc cụm từ (e.g. resilient, break the ice...)"
        autoFocus={false}
      />

      {/* Quick Suggestion Chips */}
      {!result && !loading && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <Compass className="h-3.5 w-3.5" />
            <span>Từ vựng phổ biến nên biết:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {FEATURED_WORDS.map((item) => (
              <button
                key={item.word}
                type="button"
                onClick={() => {
                  setSearchTerm(item.word);
                  void handlePerformSearch(item.word);
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-card px-3 py-1.5 text-xs hover:border-purple-500/50 hover:bg-purple-500/5 transition-all cursor-pointer shadow-2xs group"
              >
                <span className="font-bold text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400">
                  {item.word}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {item.ipa}
                </span>
                <span className="text-[11px] text-muted-foreground hidden sm:inline">
                  — {item.vi}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <Card className="rounded-3xl border border-border/80 bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-44 rounded-xl" />
              <Skeleton className="h-4 w-28 rounded-md" />
            </div>
            <Skeleton className="h-9 w-28 rounded-xl" />
          </div>
          <Skeleton className="h-16 w-full rounded-2xl" />
          <div className="space-y-3 pt-4">
            <Skeleton className="h-5 w-32 rounded-md" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </Card>
      )}

      {/* Error / Not Found State with Suggestions */}
      {error && !loading && (
        <Card className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-6 text-center space-y-3">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-foreground">{error}</h3>
            <p className="text-xs text-muted-foreground">
              Vui lòng kiểm tra lại chính tả hoặc thử các từ gợi ý tương tự bên dưới.
            </p>
          </div>

          {suggestions.length > 0 && (
            <div className="pt-2 space-y-2">
              <span className="text-xs font-semibold text-muted-foreground block">
                Có phải bạn muốn tìm:
              </span>
              <div className="flex flex-wrap justify-center gap-1.5">
                {suggestions.map((s) => (
                  <Button
                    key={s.word}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchTerm(s.word);
                      void handlePerformSearch(s.word);
                    }}
                    className="h-8 rounded-lg text-xs font-medium"
                  >
                    {s.word}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Dictionary Result View */}
      {result && !loading && (
        <DictionaryResultView
          data={result}
          onSelectWord={(newWord) => {
            setSearchTerm(newWord);
            void handlePerformSearch(newWord);
          }}
        />
      )}
    </div>
  );
}
