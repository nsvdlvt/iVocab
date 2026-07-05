// src/components/features/sentence/SentenceViewer.tsx
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { SentenceInput } from "@/components/features/sentence/SentenceInput";
import { SentenceResult } from "@/components/features/sentence/SentenceResult";
import { SentenceSettings } from "@/components/features/sentence/SentenceSettings";
import { useSpeak } from "@/hooks/use-speak";
import type { SentenceFeedback } from "@/lib/ai/schemas/sentence-feedback";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Volume2,
  Settings2,
  ArrowLeft,
  ArrowRight,
  Star,
  HelpCircle,
  BookOpen,
  Info,
  Lightbulb,
  AlertCircle,
  List,
  PenTool,
  History
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface SentenceViewerProps {
  initialWords: Array<{
    id: string;
    word: string;
    meaning?: string;
    partOfSpeech?: string;
    ipa?: string;
    isStarred?: boolean;
    latestScore?: number;
    highestScore?: number;
    attemptCount?: number;
  }>;
  setInfo: { id: string; title: string };
  onBack: () => void;
}

interface SentenceHistoryItem {
  id: string;
  attempt_number: number;
  created_at: string;
  used_correctly: boolean;
  overall_score: number;
  grammar_score: number;
  vocabulary_score: number;
  naturalness_score: number;
  context_score: number;
  richness_score: number;
  user_sentence: string;
  corrected_sentence: string | null;
  feedback_json: {
    feedback?: string;
    explanation?: string;
    alternativeSentences?: string[];
  };
}

export function SentenceViewer({ initialWords, setInfo, onBack }: SentenceViewerProps) {
  const [words, setWords] = useState(initialWords);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [evaluating, setEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<SentenceFeedback | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [navigatorOpen, setNavigatorOpen] = useState(false);

  // Practice history state variables
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<SentenceHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Helper response states
  const [hint, setHint] = useState<string | null>(null);
  const [example, setExample] = useState<string | null>(null);
  const [explainMore, setExplainMore] = useState<string | null>(null);
  const [generateMore, setGenerateMore] = useState<string[] | null>(null);
  const [helperLoading, setHelperLoading] = useState<Record<string, boolean>>({});

  // Limits tracking
  const [exampleCount, setExampleCount] = useState<number>(0);
  const [hintUsed, setHintUsed] = useState<boolean>(false);

  // Bookmarking lists on client side
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>(() => {
    const initialMap: Record<string, boolean> = {};
    initialWords.forEach((w) => {
      if (w.isStarred) {
        initialMap[w.id] = true;
      }
    });
    return initialMap;
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const { speakText } = useSpeak();

  const currentWord = words[currentIdx];

  // Cleanup abort controller on unmount or when moving to next word
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleHelper = async (type: "hint" | "example" | "another-example" | "explain" | "generate-more") => {
    if (!currentWord) return;
    setHelperLoading((prev) => ({ ...prev, [type]: true }));
    try {
      const response = await fetch("/api/ai/writing-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: type === "another-example" ? "another-example" : type,
          targetWord: currentWord.word,
          language: "en",
          writingType: "sentence",
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to fetch response");
      }

      const res = await response.json();

      if (type === "hint") {
        setHint(res as string);
        toast.success("Đã cập nhật Gợi ý nhanh ở sidebar!");
      } else if (type === "example") {
        setExample(res as string);
        toast.success("Đã cập nhật Câu ví dụ ở sidebar!");
      } else if (type === "another-example") {
        setExample(res as string);
        toast.success("Đã cập nhật Câu ví dụ mẫu mới!");
      } else if (type === "explain") {
        setExplainMore(res as string);
      } else if (type === "generate-more") {
        setGenerateMore(res as string[]);
      }
    } catch (err: unknown) {
      console.error(err);
      toast.error(`Không thể tải trợ lý. Vui lòng thử lại.`);
    } finally {
      setHelperLoading((prev) => ({ ...prev, [type]: false }));
    }
  };

  const handleSubmit = useCallback(
    async (sentence: string) => {
      if (!currentWord) return;
      setEvaluating(true);
      setError(null);
      setFeedback(null);
      setExplainMore(null);
      setGenerateMore(null);

      // Abort previous request
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch("/api/ai/sentence", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            word: currentWord.word,
            sentence,
            options: {
              meaning: currentWord.meaning,
              partOfSpeech: currentWord.partOfSpeech,
            },
            setId: setInfo.id,
            vocabId: currentWord.id,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Lỗi máy chủ khi đánh giá câu.");
        }

        const data = await response.json();
        if (data && typeof data.usedTargetWord === "boolean") {
          setFeedback(data);

          // Update word stats in client state immediately!
          if (data.usedTargetWord) {
            const mistakesCount = data.mistakes ? data.mistakes.length : 0;
            const overallScore = mistakesCount === 0 ? 100 : Math.max(0, 100 - mistakesCount * 12);
            
            setWords((prev) => {
              const nextWords = [...prev];
              const w = nextWords[currentIdx];
              if (w) {
                w.attemptCount = (w.attemptCount || 0) + 1;
                w.latestScore = overallScore;
                if (overallScore > (w.highestScore || 0)) {
                  w.highestScore = overallScore;
                }
              }
              return nextWords;
            });
          }
        } else {
          throw new Error(data?.error || "Đánh giá không thành công.");
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        console.error("Submit error:", err);
        setError(err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định.");
      } finally {
        setEvaluating(false);
      }
    },
    [currentWord, currentIdx, setInfo.id]
  );

  const jumpToWord = useCallback(
    (index: number) => {
      const prevWord = currentWord?.word;
      setFeedback(null);
      setHint(null);
      setExample(null);
      setExplainMore(null);
      setGenerateMore(null);
      setError(null);
      setExampleCount(0);
      setHintUsed(false);
      setRetryCount(0);

      setCurrentIdx(index);

      if (prevWord) {
        fetch("/api/ai/writing-assistant", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "clear",
            targetWord: prevWord,
            language: "en",
          }),
        }).catch(console.error);
      }
    },
    [currentWord?.word]
  );

  const handlePrevious = useCallback(() => {
    jumpToWord((currentIdx - 1 + words.length) % words.length);
  }, [currentIdx, words.length, jumpToWord]);

  const handleContinue = useCallback(() => {
    jumpToWord((currentIdx + 1) % words.length);
  }, [currentIdx, words.length, jumpToWord]);

  // Keyboard shortcuts at viewer level (Esc to exit, etc.)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onBack();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onBack]);

  const handleReplay = () => {
    if (currentWord) {
      speakText(currentWord.word);
    }
  };

  const toggleBookmark = () => {
    if (!currentWord) return;
    const isBookmarked = !!bookmarks[currentWord.id];
    const newStatus = !isBookmarked;
    const newBookmarks = { ...bookmarks, [currentWord.id]: newStatus };
    setBookmarks(newBookmarks);

    // Call API to persist in remote database
    fetch("/api/vocabulary/star", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        vocabularyId: currentWord.id,
        isStarred: newStatus,
      }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to save star status to database");
        }
      })
      .catch((err) => {
        console.error("Persistence error:", err);
      });

    if (newStatus) {
      toast.success(`Đã đánh dấu từ "${currentWord.word}"!`);
    } else {
      toast.info(`Đã bỏ đánh dấu từ "${currentWord.word}"!`);
    }
  };

  const handleRetry = () => {
    setFeedback(null);
    setExplainMore(null);
    setGenerateMore(null);
    setError(null);
    setRetryCount((prev) => prev + 1);
  };

  const fetchHistory = useCallback(() => {
    if (!currentWord) return;
    setHistoryLoading(true);
    fetch(`/api/vocabulary/history?vocabId=${currentWord.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setHistoryItems(data.history || []);
        }
      })
      .catch((err) => console.error("Error loading history:", err))
      .finally(() => setHistoryLoading(false));
  }, [currentWord]);

  if (!currentWord) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-muted-foreground">Không có từ vựng nào để luyện đặt câu.</p>
        <Button onClick={onBack}>Quay lại</Button>
      </div>
    );
  }

  // Derived word tips based on part of speech
  const getWordTips = () => {
    const pos = currentWord.partOfSpeech?.toLowerCase() || "";
    if (pos.includes("verb") || pos.includes("động từ")) {
      return "Động từ này cần lưu ý chia thì chính xác với ngôi của chủ ngữ (Subject-Verb agreement). Nếu là ngoại động từ, hãy đảm bảo có tân ngữ đi kèm.";
    }
    if (pos.includes("noun") || pos.includes("danh từ")) {
      return "Đảm bảo danh từ được dùng đúng số ít (có mạo từ a/an/the) hoặc số nhiều (thêm s/es) tương ứng với văn cảnh câu.";
    }
    if (pos.includes("adj") || pos.includes("tính từ")) {
      return "Đặt tính từ đứng trước danh từ để bổ nghĩa, hoặc sau động từ liên kết (linking verbs) như be, seem, feel.";
    }
    return "Hãy thử áp dụng cấu trúc câu phức (Complex Sentence) với các liên từ để câu văn trở nên sinh động và tự nhiên hơn.";
  };

  // Helper properties calculations
  let hintLabel = "Hint";
  let hintDisabled = false;
  if (hintUsed) {
    hintLabel = "Hint already used.";
    hintDisabled = true;
  }

  const handleHintClick = () => {
    if (hintUsed) return;
    setHintUsed(true);
    handleHelper("hint");
  };

  let exampleLabel = "Example";
  let exampleDisabled = false;
  if (exampleCount === 1) {
    exampleLabel = "Another Example";
  } else if (exampleCount >= 2) {
    exampleLabel = "Example limit reached.";
    exampleDisabled = true;
  }

  const handleExampleClick = () => {
    if (exampleCount >= 2) return;
    const nextCount = exampleCount + 1;
    setExampleCount(nextCount);
    handleHelper(nextCount === 1 ? "example" : "another-example");
  };

  // Filter vocabulary sets in drawer
  const filteredWords = words.filter(
    (w) =>
      w.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.meaning && w.meaning.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 select-none">
      {/* Dynamic Top Progress Bar */}
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-md py-3 border-b flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full hover:bg-muted/80">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600 dark:text-blue-400">
              Sentence Practice Mode
            </span>
            <h2 className="text-sm font-bold text-foreground truncate max-w-xs sm:max-w-md">
              Bộ từ vựng: {setInfo.title}
            </h2>
          </div>
        </div>

        {/* Floating progress number and navigator */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-muted-foreground">
            Từ {currentIdx + 1} / {words.length}
          </span>
          <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden hidden sm:block">
            <div
              style={{ width: `${((currentIdx + 1) / words.length) * 100}%` }}
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300"
            />
          </div>

          {/* Word Navigator Popup Sheet */}
          <Sheet open={navigatorOpen} onOpenChange={setNavigatorOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-xl h-10 w-10 hover:bg-muted/60"
                  title="Danh sách từ vựng"
                />
              }
            >
              <List className="h-4 w-4" />
            </SheetTrigger>
            <SheetContent side="right" className="w-[360px] sm:w-[420px] p-6 flex flex-col gap-4">
              <SheetHeader>
                <SheetTitle className="text-lg font-bold text-foreground">Danh sách từ vựng ({words.length})</SheetTitle>
              </SheetHeader>
              
              <div className="relative my-2 select-text">
                <Input
                  placeholder="Tìm kiếm từ vựng..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-xl pr-8"
                />
              </div>

              {/* Scrollable List */}
              <div className="flex-1 overflow-y-auto max-h-[70vh] space-y-2 pr-1 select-none">
                {filteredWords.map((w) => {
                  const originalIndex = words.findIndex((item) => item.id === w.id);
                  const isCurrent = originalIndex === currentIdx;
                  const isStarred = !!bookmarks[w.id];

                  return (
                    <button
                      key={w.id}
                      onClick={() => {
                        jumpToWord(originalIndex);
                        setNavigatorOpen(false);
                      }}
                      className={`w-full text-left p-3.5 rounded-xl border flex items-center justify-between transition-all duration-150 ${
                        isCurrent
                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-extrabold border-blue-500 pl-4 shadow-xs"
                          : "border-border/60 hover:bg-muted/30 text-foreground/80 font-medium"
                      }`}
                    >
                      <div className="flex flex-col gap-0.5 max-w-[200px]">
                        <span className="text-sm font-bold truncate leading-relaxed">{w.word}</span>
                        {w.meaning && (
                          <span className="text-[11px] text-muted-foreground truncate leading-normal">
                            {w.meaning}
                          </span>
                        )}
                        {w.attemptCount && w.attemptCount > 0 ? (
                          <div className="text-[10px] text-muted-foreground/90 mt-1 flex flex-wrap gap-x-2 gap-y-0.5 font-medium select-none">
                            <span className="bg-blue-500/10 text-blue-700 dark:text-blue-300 px-1.5 py-0.25 rounded-md font-bold">
                              {w.latestScore}/100
                            </span>
                            <span>Highest: {w.highestScore}</span>
                            <span>Attempts: {w.attemptCount}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-foreground/50 mt-1 italic">Chưa luyện tập</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isStarred && (
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-500 shrink-0" />
                        )}
                        <span className="text-[10px] font-mono font-bold text-muted-foreground/80 bg-muted/60 px-1.5 py-0.5 rounded-md">
                          {originalIndex + 1}
                        </span>
                      </div>
                    </button>
                  );
                })}

                {filteredWords.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-8">Không tìm thấy từ vựng nào.</p>
                )}
              </div>
            </SheetContent>
          </Sheet>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setSettingsOpen(true)}
            className="rounded-xl h-10 w-10 hover:bg-muted/60"
          >
            <Settings2 className="h-4.5 w-4.5" />
          </Button>
        </div>
      </div>

      {/* 3-Column layout grid on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Writing Card & Results (col-span-8) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Top Hero Card */}
          <motion.div
            key={`hero-${currentWord.id}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative bg-card border border-border/80 rounded-3xl p-6 md:p-8 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-6"
          >
            {/* Soft decorative gradient illustration on the right */}
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-blue-500/10 via-indigo-500/5 to-transparent pointer-events-none rounded-r-3xl hidden md:block" />
            <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-gradient-to-br from-blue-600/10 to-indigo-600/10 blur-xl pointer-events-none hidden md:block" />

            <div className="space-y-3 z-10 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground select-text">
                  {currentWord.word}
                </h1>
                {currentWord.partOfSpeech && (
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                    {currentWord.partOfSpeech}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm">
                {currentWord.ipa && (
                  <span className="font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md">
                    {currentWord.ipa}
                  </span>
                )}
                {currentWord.meaning && (
                  <span className="font-medium text-foreground/80 select-text text-base">
                    {currentWord.meaning}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 md:gap-3 z-10 shrink-0">
              <Button
                variant="outline"
                onClick={handleReplay}
                className="h-10 px-4 rounded-xl gap-2 font-bold hover:bg-muted/80 shadow-xs border-border/80 text-sm select-none"
              >
                <Volume2 className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
                <span className="hidden sm:inline">Phát âm</span>
                <span className="inline sm:hidden">Nghe</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  setHistoryOpen(true);
                  fetchHistory();
                }}
                className="h-10 px-4 rounded-xl gap-2 font-bold hover:bg-muted/80 shadow-xs border-border/80 text-sm select-none"
              >
                <History className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
                <span className="hidden sm:inline">Lịch sử chấm điểm</span>
                <span className="inline sm:hidden">Lịch sử</span>
              </Button>
            </div>
          </motion.div>

          {/* Interactive Writing Area / Evaluating loader / Results */}
          <div className="relative min-h-[300px]">
            <AnimatePresence mode="wait">
              {evaluating ? (
                /* Skeleton Loading State */
                <motion.div
                  key="skeleton-loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-card border border-border/80 rounded-3xl p-8 shadow-sm space-y-6 flex flex-col items-center justify-center min-h-[350px] text-center"
                >
                  {/* Premium Spinner Animation */}
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-blue-500/10" />
                    <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 border-r-blue-600 animate-spin" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-extrabold text-lg text-foreground">AI Đang phân tích câu viết của bạn...</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      Hệ thống đang kiểm tra từ vựng, ngữ pháp, độ tự nhiên và phân tích lỗi chi tiết thông qua Responses API.
                    </p>
                  </div>
                </motion.div>
              ) : error ? (
                /* Beautiful Error Alert Box */
                <motion.div
                  key="error-box"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-rose-500/5 border border-rose-500/20 text-rose-700 dark:text-rose-400 p-6 rounded-3xl space-y-3 flex items-start gap-3"
                >
                  <AlertCircle className="h-6 w-6 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm">Gặp lỗi trong quá trình đánh giá</h4>
                    <p className="text-sm opacity-90 leading-relaxed">{error}</p>
                    <Button variant="outline" onClick={() => setError(null)} className="mt-3 rounded-xl border-rose-500/20 hover:bg-rose-500/10 text-rose-700 dark:text-rose-400">
                      Thử lại câu khác
                    </Button>
                  </div>
                </motion.div>
              ) : feedback && !feedback.usedTargetWord ? (
                /* Warning card when target word is not used */
                <motion.div
                  key="target-word-warning"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-amber-500/5 border border-amber-500/20 text-amber-700 dark:text-amber-400 p-6 rounded-3xl space-y-3 flex items-start gap-3"
                >
                  <AlertCircle className="h-6 w-6 shrink-0 mt-0.5 text-amber-500" />
                  <div>
                    <h4 className="font-bold text-sm">Chưa sử dụng từ mục tiêu</h4>
                    <p className="text-sm opacity-90 leading-relaxed">
                      {feedback.message || `Bạn chưa sử dụng từ "${currentWord.word}" trong câu của mình. Hãy thử đặt lại câu có chứa từ này.`}
                    </p>
                    <Button
                      variant="outline"
                      onClick={handleRetry}
                      className="mt-3 rounded-xl border-amber-500/20 hover:bg-amber-500/10 text-amber-700 dark:text-amber-400"
                    >
                      Viết lại câu
                    </Button>
                  </div>
                </motion.div>
              ) : feedback ? (
                /* Evaluated Feedback Results Panel */
                <SentenceResult
                  key="feedback-results"
                  feedback={feedback}
                  explainMore={explainMore}
                  generateMore={generateMore}
                  explainMoreLoading={!!helperLoading["explain"]}
                  generateMoreLoading={!!helperLoading["generate-more"]}
                  onExplainMore={() => handleHelper("explain")}
                  onGenerateMore={() => handleHelper("generate-more")}
                  onRetry={handleRetry}
                />
              ) : (
                /* Writing Input Module */
                <motion.div
                  key="writing-input"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <SentenceInput
                    key={`${currentWord.id}-${retryCount}`}
                    word={currentWord.word}
                    disabled={evaluating}
                    loading={evaluating}
                    onSubmit={handleSubmit}
                    onHint={handleHintClick}
                    onExample={handleExampleClick}
                    hintDisabled={hintDisabled}
                    hintLabel={hintLabel}
                    exampleDisabled={exampleDisabled}
                    exampleLabel={exampleLabel}
                  />

                  {/* Empty state visual illustration before first evaluate */}
                  <div className="flex flex-col items-center justify-center p-8 mt-6 text-center select-none text-muted-foreground/60 border border-dashed rounded-3xl bg-muted/[0.05]">
                    <PenTool className="h-10 w-10 text-muted-foreground/40 mb-3" />
                    <span className="text-sm font-semibold">
                      Bắt đầu nhập câu viết của bạn ở trên để nhận phân tích chuyên sâu từ AI
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Side: Informative Dynamic Sidebar (col-span-4) */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground/80 flex items-center gap-1.5">
              <Info className="h-4 w-4 text-blue-500" />
              <span>Trợ lý &amp; Ghi chú từ vựng</span>
            </h3>

            {/* Quick Hint Card */}
            <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 uppercase">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                <span>Gợi ý nhanh</span>
              </div>
              <div className="text-sm text-foreground/80 leading-relaxed min-h-[40px] flex items-center">
                {helperLoading["hint"] ? (
                  <span className="text-muted-foreground animate-pulse">Đang tải gợi ý từ AI...</span>
                ) : hint ? (
                  <span>{hint}</span>
                ) : (
                  <span className="text-muted-foreground/60 italic text-xs">
                    {"Bấm chip \"💡 Hint\" bên cạnh để xem gợi ý."}
                  </span>
                )}
              </div>
            </div>

            {/* Example Card */}
            <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase">
                <BookOpen className="h-4 w-4 text-indigo-500" />
                <span>Câu ví dụ</span>
              </div>
              <div className="text-sm text-foreground/80 leading-relaxed min-h-[40px] flex items-center">
                {helperLoading["example"] || helperLoading["another-example"] ? (
                  <span className="text-muted-foreground animate-pulse">Đang tải câu ví dụ...</span>
                ) : example ? (
                  <span>{example}</span>
                ) : (
                  <span className="text-muted-foreground/60 italic text-xs">
                    {"Câu ví dụ sẽ hiển thị ở đây..."}
                  </span>
                )}
              </div>
            </div>

            {/* Usage Notes / Tips Card */}
            <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-teal-700 dark:text-teal-300 uppercase">
                <HelpCircle className="h-4 w-4 text-teal-500" />
                <span>Cẩm nang đặt câu</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{getWordTips()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom navigation controls bar */}
      <div className="sticky bottom-0 left-0 right-0 z-50 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3.5 bg-background/90 dark:bg-zinc-950/90 backdrop-blur-md border-t border-border/80 shadow-lg select-none pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex justify-center md:justify-between items-center gap-6 md:gap-4">
        {/* Previous navigation button */}
        <Button
          variant="outline"
          onClick={handlePrevious}
          aria-label="Previous"
          className="h-11 w-11 md:h-11 md:w-auto md:px-6 rounded-full md:rounded-xl hover:bg-muted/80 gap-2 border-border/80 text-sm font-semibold flex justify-center items-center select-none"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
          <span className="hidden md:inline">Previous</span>
        </Button>

        {/* Bookmark utility button (Center) */}
        <div className="flex justify-center">
          <motion.div whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
            <Button
              variant="outline"
              onClick={toggleBookmark}
              aria-label="Star vocabulary"
              className={`h-11 w-11 md:h-11 md:w-auto md:px-6 rounded-full md:rounded-xl gap-2 font-semibold transition-all duration-200 select-none flex justify-center items-center ${
                bookmarks[currentWord.id]
                  ? "border-yellow-400 text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-500/10"
                  : "border-gray-200 dark:border-border/80 text-foreground/80 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10"
              }`}
            >
              <Star
                className={`h-4.5 w-4.5 transition-transform duration-200 ${
                  bookmarks[currentWord.id] ? "fill-yellow-400 text-yellow-500 scale-110" : ""
                }`}
              />
              <span className="hidden md:inline">Đánh dấu sao</span>
            </Button>
          </motion.div>
        </div>

        {/* Continue / Next navigation button */}
        <Button
          onClick={handleContinue}
          aria-label="Continue"
          className="h-11 w-11 md:h-11 md:w-auto md:px-7 rounded-full md:rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border-none font-bold text-white shadow-md shadow-blue-500/25 cursor-pointer gap-2 flex justify-center items-center select-none"
        >
          <span className="hidden md:inline">Continue</span>
          <ArrowRight className="h-4.5 w-4.5" />
        </Button>
      </div>

      {/* Settings modal */}
      <SentenceSettings open={settingsOpen} onOpenChange={setSettingsOpen} />

      {/* History modal */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-2xl max-h-[85vh] flex flex-col p-6 rounded-3xl gap-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <History className="h-5 w-5 text-indigo-500" />
              Lịch sử chấm điểm cho từ &quot;{currentWord.word}&quot;
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-1 space-y-4 max-h-[60vh]">
            {historyLoading ? (
              <div className="py-12 text-center text-muted-foreground animate-pulse">
                Đang tải lịch sử từ cơ sở dữ liệu...
              </div>
            ) : historyItems.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground italic">
                Chưa có lịch sử chấm điểm cho từ này.
              </div>
            ) : (
              historyItems.map((item) => {
                const isExpanded = expandedHistoryId === item.id;
                const formattedDate = new Date(item.created_at).toLocaleString("vi-VN", {
                  dateStyle: "short",
                  timeStyle: "short",
                });
                return (
                  <div
                    key={item.id}
                    className="border border-border/80 rounded-2xl p-4 bg-muted/[0.02] hover:bg-muted/[0.08] transition-all duration-200"
                  >
                    <div
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 cursor-pointer select-none"
                      onClick={() => setExpandedHistoryId(isExpanded ? null : item.id)}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                            Attempt #{item.attempt_number}
                          </span>
                          <span className="text-xs text-muted-foreground">{formattedDate}</span>
                        </div>
                        <p className="text-sm font-semibold text-foreground line-clamp-1 italic">
                          &quot;{item.user_sentence}&quot;
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.used_correctly ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                            Hợp lệ
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                            Chưa dùng từ
                          </span>
                        )}

                        <span className="text-sm font-black bg-blue-500/10 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-xl">
                          {item.overall_score}/100
                        </span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-border/80 space-y-3.5 text-xs sm:text-sm">
                        <div className="grid grid-cols-5 gap-2 text-center text-[10px] sm:text-xs">
                          <div className="bg-muted/40 p-2 rounded-xl">
                            <span className="text-muted-foreground block mb-0.5">Grammar</span>
                            <span className="font-bold text-foreground">{item.grammar_score}/10</span>
                          </div>
                          <div className="bg-muted/40 p-2 rounded-xl">
                            <span className="text-muted-foreground block mb-0.5">Vocabulary</span>
                            <span className="font-bold text-foreground">{item.vocabulary_score}/10</span>
                          </div>
                          <div className="bg-muted/40 p-2 rounded-xl">
                            <span className="text-muted-foreground block mb-0.5">Naturalness</span>
                            <span className="font-bold text-foreground">{item.naturalness_score}/10</span>
                          </div>
                          <div className="bg-muted/40 p-2 rounded-xl">
                            <span className="text-muted-foreground block mb-0.5">Context</span>
                            <span className="font-bold text-foreground">{item.context_score}/10</span>
                          </div>
                          <div className="bg-muted/40 p-2 rounded-xl">
                            <span className="text-muted-foreground block mb-0.5">Richness</span>
                            <span className="font-bold text-foreground">{item.richness_score}/10</span>
                          </div>
                        </div>

                        <div>
                          <span className="font-bold text-muted-foreground block mb-1">Câu viết gốc:</span>
                          <p className="font-mono bg-muted/40 p-2 rounded-lg text-foreground select-text">{item.user_sentence}</p>
                        </div>
                        {item.corrected_sentence && (
                          <div>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 block mb-1">Câu sửa đổi đề xuất:</span>
                            <p className="font-mono bg-emerald-500/5 border border-emerald-500/20 p-2 rounded-lg text-foreground select-text">{item.corrected_sentence}</p>
                          </div>
                        )}
                        {item.feedback_json.alternativeSentences && item.feedback_json.alternativeSentences.length > 0 && (
                          <div>
                            <span className="font-bold text-blue-600 dark:text-blue-400 block mb-1">Các phương án viết khác:</span>
                            <ul className="list-disc pl-4 space-y-1 font-mono text-muted-foreground select-text">
                              {item.feedback_json.alternativeSentences.map((alt: string, i: number) => (
                                <li key={i}>{alt}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {item.feedback_json.feedback && (
                          <div>
                            <span className="font-bold text-foreground block mb-1">Nhận xét chung của AI:</span>
                            <p className="text-muted-foreground leading-relaxed select-text">{item.feedback_json.feedback}</p>
                          </div>
                        )}
                        {item.feedback_json.explanation && (
                          <div>
                            <span className="font-bold text-foreground block mb-1">Giải thích chi tiết:</span>
                            <div className="text-muted-foreground whitespace-pre-line leading-relaxed select-text border border-border/60 bg-muted/20 p-3 rounded-2xl">
                              {item.feedback_json.explanation}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
