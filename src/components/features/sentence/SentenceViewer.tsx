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
  readOnly?: boolean;
  reviewSessionId?: string;
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

export function SentenceViewer({ initialWords, setInfo, onBack, readOnly = false, reviewSessionId }: SentenceViewerProps) {
  const [words, setWords] = useState(initialWords);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [evaluating, setEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<SentenceFeedback | null>(null);
  const [submittedSentence, setSubmittedSentence] = useState<string>("");
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
      setSubmittedSentence(sentence);
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
            reviewSessionId,
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
          if (reviewSessionId && data.completed) {
            onBack();
          }

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
    [currentWord, currentIdx, setInfo.id, reviewSessionId, onBack]
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
    if (readOnly) return;
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
    <div className="mx-auto w-full max-w-6xl space-y-6 select-none">
      {/* Clean Top Studio HUD Bar */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md py-3.5 border-b border-border/80 flex items-center justify-between gap-3 select-none">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="outline"
            size="icon"
            onClick={onBack}
            className="h-9 w-9 shrink-0 rounded-xl hover:bg-muted/80 cursor-pointer"
            title="Quay lại (Esc)"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </Button>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-foreground truncate max-w-xs sm:max-w-md">
              {setInfo.title}
            </h2>
            <p className="text-xs text-muted-foreground font-medium">
              Luyện viết câu AI • Từ {currentIdx + 1} / {words.length}
            </p>
          </div>
        </div>

        {/* Progress bar and controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="hidden sm:flex items-center gap-2.5 mr-1">
            <span className="text-xs font-semibold text-muted-foreground tabular-nums">
              {currentIdx + 1} / {words.length}
            </span>
            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
              <div
                style={{ width: `${((currentIdx + 1) / words.length) * 100}%` }}
                className="h-full bg-primary rounded-full transition-all duration-300"
              />
            </div>
          </div>

          {/* Word Navigator Popup Sheet */}
          <Sheet open={navigatorOpen} onOpenChange={setNavigatorOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-xl h-9 w-9 hover:bg-muted/60 cursor-pointer"
                  title="Danh sách từ vựng"
                />
              }
            >
              <List className="h-4 w-4" />
            </SheetTrigger>
            <SheetContent side="right" className="w-[340px] sm:w-[400px] p-6 flex flex-col gap-4">
              <SheetHeader>
                <SheetTitle className="text-lg font-bold text-foreground">Danh sách từ vựng ({words.length})</SheetTitle>
              </SheetHeader>
              
              <div className="relative my-1 select-text">
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
                      className={`w-full text-left p-3.5 rounded-xl border flex items-center justify-between transition-all duration-150 cursor-pointer ${
                        isCurrent
                          ? "bg-primary/10 text-primary font-bold border-primary/50 shadow-xs"
                          : "border-border/60 hover:bg-muted/40 text-foreground font-medium"
                      }`}
                    >
                      <div className="flex flex-col gap-0.5 max-w-[210px]">
                        <span className="text-sm font-bold truncate leading-relaxed">{w.word}</span>
                        {w.meaning && (
                          <span className="text-xs text-muted-foreground truncate leading-normal">
                            {w.meaning}
                          </span>
                        )}
                        {w.attemptCount && w.attemptCount > 0 ? (
                          <div className="text-[11px] text-muted-foreground mt-1 flex flex-wrap gap-x-2 gap-y-0.5 font-medium select-none tabular-nums">
                            <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-md font-semibold">
                              {w.latestScore}/100
                            </span>
                            <span>Cao nhất: {w.highestScore}</span>
                            <span>Lần thử: {w.attemptCount}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground/60 mt-1 italic">Chưa luyện tập</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isStarred && (
                          <Star className="h-4 w-4 fill-amber-400 text-amber-500 shrink-0" />
                        )}
                        <span className="text-xs font-mono font-semibold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
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
            className="rounded-xl h-9 w-9 hover:bg-muted/60 cursor-pointer"
            title="Cài đặt"
          >
            <Settings2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 2-Column Writing Studio Layout on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Word Prompt Card, Writing Textarea & Evaluation Results (col-span-8) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Clean Word Prompt Card */}
          <motion.div
            key={`hero-${currentWord.id}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border/80 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground select-text">
                  {currentWord.word}
                </h1>
                {currentWord.partOfSpeech && (
                  <span className="text-xs font-semibold capitalize px-2.5 py-0.5 rounded-md bg-primary/10 text-primary">
                    {currentWord.partOfSpeech}
                  </span>
                )}
                {currentWord.ipa && (
                  <span className="font-mono text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                    {currentWord.ipa}
                  </span>
                )}
              </div>

              {currentWord.meaning && (
                <p className="font-medium text-foreground/90 select-text text-base leading-snug">
                  {currentWord.meaning}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReplay}
                className="h-9 px-3.5 rounded-xl gap-1.5 font-semibold hover:bg-muted/80 border-border/80 text-xs select-none cursor-pointer"
              >
                <Volume2 className="h-4 w-4 text-primary" />
                <span>Phát âm</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setHistoryOpen(true);
                  fetchHistory();
                }}
                className="h-9 px-3.5 rounded-xl gap-1.5 font-semibold hover:bg-muted/80 border-border/80 text-xs select-none cursor-pointer"
              >
                <History className="h-4 w-4 text-muted-foreground" />
                <span>Lịch sử</span>
              </Button>
            </div>
          </motion.div>

          {/* Interactive Writing Area / Evaluating loader / Results */}
          <div className="relative">
            <AnimatePresence mode="wait">
              {evaluating ? (
                /* Clean Loading State */
                <motion.div
                  key="skeleton-loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-card border border-border/80 rounded-2xl p-8 shadow-xs space-y-4 flex flex-col items-center justify-center min-h-[280px] text-center"
                >
                  <div className="relative w-12 h-12">
                    <div className="absolute inset-0 rounded-full border-3 border-primary/15" />
                    <div className="absolute inset-0 rounded-full border-3 border-t-primary border-r-primary animate-spin" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-base text-foreground">AI đang phân tích câu viết của bạn...</h3>
                    <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
                      Hệ thống đang kiểm tra từ vựng, ngữ pháp, độ tự nhiên và phân tích lỗi chi tiết.
                    </p>
                  </div>
                </motion.div>
              ) : error ? (
                /* Error Alert Box */
                <motion.div
                  key="error-box"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-rose-500/5 border border-rose-500/20 text-rose-700 dark:text-rose-300 p-5 rounded-2xl space-y-2 flex items-start gap-3"
                >
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm">Gặp lỗi trong quá trình đánh giá</h4>
                    <p className="text-xs opacity-90 leading-relaxed mt-0.5">{error}</p>
                    <Button variant="outline" size="sm" onClick={() => setError(null)} className="mt-3 rounded-xl border-rose-500/20 hover:bg-rose-500/10 text-rose-700 dark:text-rose-300">
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
                  className="bg-amber-500/5 border border-amber-500/20 text-amber-700 dark:text-amber-300 p-5 rounded-2xl space-y-2 flex items-start gap-3"
                >
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-amber-500" />
                  <div>
                    <h4 className="font-bold text-sm">Chưa sử dụng từ mục tiêu</h4>
                    <p className="text-xs opacity-90 leading-relaxed mt-0.5">
                      {feedback.message || `Bạn chưa sử dụng từ "${currentWord.word}" trong câu của mình. Hãy thử đặt lại câu có chứa từ này.`}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRetry}
                      className="mt-3 rounded-xl border-amber-500/20 hover:bg-amber-500/10 text-amber-700 dark:text-amber-300"
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
                  userSentence={submittedSentence}
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

                  {/* Subtle helper prompt before first evaluate */}
                  <div className="flex items-center gap-3 p-4 mt-4 rounded-2xl border border-dashed border-border/80 bg-muted/20 text-muted-foreground">
                    <PenTool className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-xs font-medium leading-relaxed">
                      Nhập câu tiếng Anh có chứa từ <strong>&ldquo;{currentWord.word}&rdquo;</strong> để nhận chấm điểm ngữ pháp, từ vựng, ngữ cảnh và gợi ý diễn đạt tự nhiên từ AI.
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Side: Informative Dynamic Sidebar (col-span-4) */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-20">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 px-1">
            <Info className="h-3.5 w-3.5 text-primary" />
            <span>Trợ lý &amp; Ghi chú từ vựng</span>
          </h3>

          {/* Quick Hint Card */}
          <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-xs space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              <span>Gợi ý nhanh</span>
            </div>
            <div className="text-sm text-foreground/90 leading-relaxed min-h-[36px] flex items-center">
              {helperLoading["hint"] ? (
                <span className="text-xs text-muted-foreground animate-pulse">Đang tải gợi ý từ AI...</span>
              ) : hint ? (
                <span className="text-xs leading-relaxed">{hint}</span>
              ) : (
                <span className="text-muted-foreground/70 italic text-xs">
                  Bấm nút &ldquo;Hint&rdquo; trong khung viết để xem gợi ý.
                </span>
              )}
            </div>
          </div>

          {/* Example Card */}
          <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-xs space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wide">
              <BookOpen className="h-4 w-4 text-primary" />
              <span>Câu ví dụ mẫu</span>
            </div>
            <div className="text-sm text-foreground/90 leading-relaxed min-h-[36px] flex items-center">
              {helperLoading["example"] || helperLoading["another-example"] ? (
                <span className="text-xs text-muted-foreground animate-pulse">Đang tải câu ví dụ...</span>
              ) : example ? (
                <span className="text-xs leading-relaxed select-text">{example}</span>
              ) : (
                <span className="text-muted-foreground/70 italic text-xs">
                  Bấm nút &ldquo;Example&rdquo; để tham khảo câu mẫu.
                </span>
              )}
            </div>
          </div>

          {/* Usage Notes / Tips Card */}
          <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-xs space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
              <HelpCircle className="h-4 w-4 text-emerald-500" />
              <span>Cẩm nang đặt câu</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{getWordTips()}</p>
          </div>
        </div>
      </div>

      {/* Sticky Bottom navigation controls bar */}
      <div className="sticky bottom-0 left-0 right-0 z-40 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-background/95 backdrop-blur-md border-t border-border/80 select-none pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex justify-between items-center gap-4">
        {/* Previous navigation button */}
        <Button
          variant="outline"
          onClick={handlePrevious}
          aria-label="Previous"
          className="h-10 px-4 rounded-xl hover:bg-muted/80 gap-2 border-border/80 text-xs sm:text-sm font-semibold cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Từ trước</span>
        </Button>

        {/* Bookmark utility button (Center) */}
        <div className="flex justify-center">
          {!readOnly && (
            <Button
              variant="outline"
              onClick={toggleBookmark}
              aria-label="Star vocabulary"
              className={`h-10 px-4 rounded-xl gap-2 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                bookmarks[currentWord.id]
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/15"
                  : "border-border/80 text-foreground hover:bg-muted/80"
              }`}
            >
              <Star
                className={`h-4 w-4 ${
                  bookmarks[currentWord.id] ? "fill-amber-400 text-amber-500" : ""
                }`}
              />
              <span className="hidden sm:inline">Đánh dấu sao</span>
            </Button>
          )}
        </div>

        {/* Continue / Next navigation button */}
        <Button
          onClick={handleContinue}
          aria-label="Continue"
          className="h-10 px-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs sm:text-sm shadow-xs cursor-pointer gap-2"
        >
          <span className="hidden sm:inline">Từ tiếp theo</span>
          <ArrowRight className="h-4 w-4" />
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
