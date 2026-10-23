"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { BookOpen, Sparkles, MessageSquareQuote, Search, AlertCircle, Compass, Star, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DictionarySearchBar } from "./DictionarySearchBar";
import { DictionaryResultView } from "./DictionaryResultView";
import { ContextualTranslationCard } from "./ContextualTranslationCard";
import type { DictionaryResult, DictionarySuggestion } from "@/types/dictionary";

const FEATURED_WORDS = [
  { word: "eloquent", ipa: "/ˈɛləkwənt/", vi: "hùng biện, lưu loát, truyền cảm", pos: "adjective" },
  { word: "diligent", ipa: "/ˈdɪlɪdʒənt/", vi: "chăm chỉ, siêng năng, cần cù", pos: "adjective" },
  { word: "resilient", ipa: "/rɪˈzɪliənt/", vi: "kiên cường, nhanh phục hồi", pos: "adjective" },
  { word: "ubiquitous", ipa: "/juːˈbɪkwɪtəs/", vi: "có mặt ở khắp nơi, phổ biến", pos: "adjective" },
  { word: "break the ice", ipa: "/breɪk ðiː aɪs/", vi: "phá vỡ bầu không khí ngượng ngùng", pos: "phrase" },
  { word: "look forward to", ipa: "/lʊk ˈfɔːrwərd tuː/", vi: "trông chờ, mong đợi một điều gì", pos: "phrase" },
];

export function DictionaryPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const queryFromUrl = searchParams.get("q") || "";
  const [searchTerm, setSearchTerm] = useState(queryFromUrl);
  const [activeTab, setActiveTab] = useState<"lookup" | "context">("lookup");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DictionaryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<DictionarySuggestion[]>([]);

  const lastSearchedRef = React.useRef<string>("");

  // Search when URL has query or when user submits
  const handlePerformSearch = React.useCallback(
    async (term: string) => {
      const clean = term.trim();
      if (!clean) return;

      lastSearchedRef.current = clean.toLowerCase();
      setSearchTerm(clean);
      setLoading(true);
      setError(null);
      setResult(null);
      setSuggestions([]);

      // Update URL without full refresh
      router.replace(`/dictionary?q=${encodeURIComponent(clean)}`, { scroll: false });

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
    },
    [router]
  );

  useEffect(() => {
    const cleanUrlQuery = queryFromUrl.trim();
    if (cleanUrlQuery && cleanUrlQuery.toLowerCase() !== lastSearchedRef.current.toLowerCase()) {
      lastSearchedRef.current = cleanUrlQuery.toLowerCase();
      setSearchTerm(cleanUrlQuery);
      void handlePerformSearch(cleanUrlQuery);
    }
  }, [queryFromUrl, handlePerformSearch]);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 pb-12">
      {/* Header Banner */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <BookOpen className="h-5 w-5" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Từ điển Anh - Việt Vocabee
          </h1>
        </div>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Tra cứu từ vựng tiếng Anh chuyên sâu, phát âm chuẩn Anh-Anh / Anh-Mỹ, phân biệt các nghĩa đa ngữ cảnh và lưu từ trực tiếp vào kho từ ôn tập SRS.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("lookup")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
            activeTab === "lookup"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Search className="h-4 w-4" />
          <span>Tra từ tổng quát</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("context")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
            activeTab === "context"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <MessageSquareQuote className="h-4 w-4" />
          <span>Dịch theo ngữ cảnh câu</span>
        </button>
      </div>

      {activeTab === "lookup" && (
        <div className="space-y-8">
          {/* Main Search Bar */}
          <DictionarySearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            onSearch={handlePerformSearch}
            isLoading={loading}
            autoFocus={!queryFromUrl}
          />

          {/* Loading State Skeleton */}
          {loading && (
            <div className="space-y-4 animate-pulse">
              <Card className="p-6 rounded-3xl border-border/80 space-y-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-8 w-44 rounded-xl" />
                  <Skeleton className="h-8 w-28 rounded-xl" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-24 rounded-lg" />
                  <Skeleton className="h-6 w-16 rounded-lg" />
                  <Skeleton className="h-6 w-16 rounded-lg" />
                </div>
                <Skeleton className="h-16 w-full rounded-2xl" />
              </Card>

              <Card className="p-6 rounded-3xl border-border/80 space-y-3">
                <Skeleton className="h-6 w-32 rounded-lg" />
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-3/4 rounded-md" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </Card>
            </div>
          )}

          {/* Not Found Error State with Suggestions */}
          {!loading && error && (
            <Card className="p-6 sm:p-8 rounded-3xl border-border/80 bg-card text-center space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-rose-500/10 text-rose-500 mx-auto flex items-center justify-center">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-foreground">Không tìm thấy từ</h3>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>

              <div className="flex items-center justify-center gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePerformSearch(searchTerm)}
                  className="rounded-xl gap-2 cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Thử lại</span>
                </Button>
              </div>

              {suggestions.length > 0 && (
                <div className="pt-3 space-y-2 border-t border-border/60">
                  <span className="text-xs font-semibold text-muted-foreground block">
                    Có phải bạn muốn tìm một trong các từ sau?
                  </span>
                  <div className="flex flex-wrap justify-center gap-2">
                    {suggestions.map((sug) => (
                      <button
                        key={sug.word}
                        type="button"
                        onClick={() => {
                          setSearchTerm(sug.word);
                          handlePerformSearch(sug.word);
                        }}
                        className="rounded-xl border border-border bg-muted/40 px-3 py-1.5 text-xs font-semibold text-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer"
                      >
                        {sug.word}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Successful Result View */}
          {!loading && result && (
            <DictionaryResultView
              data={result}
              onSelectWord={(newWord) => {
                setSearchTerm(newWord);
                handlePerformSearch(newWord);
              }}
            />
          )}

          {/* Empty / Idle State */}
          {!loading && !result && !error && (
            <div className="space-y-8">
              {/* Featured / Recommended Words */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" />
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                    Từ vựng & Cụm từ nổi bật hôm nay
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {FEATURED_WORDS.map((item) => (
                    <Card
                      key={item.word}
                      onClick={() => {
                        setSearchTerm(item.word);
                        handlePerformSearch(item.word);
                      }}
                      className="p-4 rounded-2xl border-border/70 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-extrabold text-base text-foreground group-hover:text-primary transition-colors">
                            {item.word}
                          </p>
                          <p className="font-mono text-xs text-muted-foreground">
                            {item.ipa}
                          </p>
                        </div>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground">
                          {item.pos}
                        </span>
                      </div>
                      <p className="text-xs text-foreground/80 font-medium mt-2 line-clamp-1">
                        {item.vi}
                      </p>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Guide Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 rounded-2xl border-border/70 bg-card space-y-2">
                  <div className="h-8 w-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                    <Compass className="h-4 w-4" />
                  </div>
                  <h4 className="text-sm font-bold text-foreground">Phân biệt từ đa nghĩa</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Hệ thống tự động nhóm các nghĩa theo từng loại từ (danh từ, động từ, tính từ) và kèm câu ví dụ tương ứng.
                  </p>
                </Card>

                <Card className="p-4 rounded-2xl border-border/70 bg-card space-y-2">
                  <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <h4 className="text-sm font-bold text-foreground">Phát âm chuẩn UK & US</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Lắng nghe phát âm bản ngữ Anh-Anh và Anh-Mỹ với âm thanh chất lượng cao và cơ chế dự phòng thông minh.
                  </p>
                </Card>

                <Card className="p-4 rounded-2xl border-border/70 bg-card space-y-2">
                  <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <h4 className="text-sm font-bold text-foreground">Lưu vào bộ từ 1-chạm</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Lưu từ và nghĩa bạn chọn trực tiếp vào kho từ cá nhân, tự động cảnh báo nếu từ đã có trong bộ từ.
                  </p>
                </Card>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "context" && (
        <ContextualTranslationCard
          initialWord={searchTerm}
          className="mt-4"
        />
      )}
    </div>
  );
}
