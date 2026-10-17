"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Volume2,
  Play,
  Pause,
  Languages,
  CheckCircle2,
  HelpCircle,
  ArrowLeft,
  Check,
  Award,
  Lightbulb,
  X,
  Circle,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StoryResponsePayload } from "@/app/api/ai/story/route";
import { toast } from "sonner";

interface StoryReaderProps {
  story: StoryResponsePayload;
  onBackToConfig: () => void;
}

export function StoryReader({ story, onBackToConfig }: StoryReaderProps) {
  const [showBilingual, setShowBilingual] = useState(false);
  const [activeWordModal, setActiveWordModal] = useState<
    StoryResponsePayload["targetWords"][0] | null
  >(null);
  const [discoveredWords, setDiscoveredWords] = useState<Set<string>>(new Set());

  // Audio / Web Speech API states
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioSpeed, setAudioSpeed] = useState<number>(1);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Quiz states
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [submittedQuiz, setSubmittedQuiz] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Pronounce word
  const speakWord = (word: string) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    synthRef.current.speak(utterance);
  };

  // Play / Pause full story audio
  const handleToggleStoryAudio = () => {
    if (!synthRef.current) {
      toast.error("Trình duyệt không hỗ trợ phát âm thanh Web Speech.");
      return;
    }

    if (isPlayingAudio) {
      synthRef.current.cancel();
      setIsPlayingAudio(false);
      return;
    }

    const fullEnglishText = story.paragraphs.map((p) => p.english).join(". ");
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(fullEnglishText);
    utterance.lang = "en-US";
    utterance.rate = audioSpeed;

    utterance.onend = () => {
      setIsPlayingAudio(false);
    };

    utterance.onerror = () => {
      setIsPlayingAudio(false);
    };

    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
    setIsPlayingAudio(true);
  };

  const handleChangeSpeed = () => {
    const speeds = [0.8, 1.0, 1.2];
    const currentIndex = speeds.indexOf(audioSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setAudioSpeed(nextSpeed);

    if (isPlayingAudio && synthRef.current) {
      synthRef.current.cancel();
      setIsPlayingAudio(false);
      toast.info(`Tốc độ đọc: ${nextSpeed}x. Bấm Phát để nghe với tốc độ mới.`);
    }
  };

  const handleWordClick = (wordText: string) => {
    // Find matching target word info
    const cleanWord = wordText.toLowerCase().replace(/[^a-z]/g, "");
    const found = story.targetWords.find((tw) => {
      const targetClean = tw.word.toLowerCase();
      return cleanWord.startsWith(targetClean) || targetClean.startsWith(cleanWord);
    });

    if (found) {
      setActiveWordModal(found);
      setDiscoveredWords((prev) => new Set([...prev, found.word.toLowerCase()]));
      speakWord(found.word);
    }
  };

  const handleSelectQuizAnswer = (qIndex: number, optionIndex: number) => {
    if (submittedQuiz) return;
    setSelectedAnswers((prev) => ({ ...prev, [qIndex]: optionIndex }));
  };

  const handleSubmitQuiz = () => {
    setSubmittedQuiz(true);
    const correctCount = story.quiz.reduce((acc, q, idx) => {
      return acc + (selectedAnswers[idx] === q.answerIndex ? 1 : 0);
    }, 0);
    if (correctCount === story.quiz.length) {
      toast.success("Xuất sắc! Bạn đã trả lời đúng 100% câu hỏi đọc hiểu 🐝");
    } else {
      toast.info(`Bạn trả lời đúng ${correctCount}/${story.quiz.length} câu.`);
    }
  };

  // Helper to render paragraph with highlighted target words
  const renderParagraphWithHighlights = (text: string) => {
    const targetWordPatterns = story.targetWords.map((tw) => tw.word.toLowerCase());
    if (targetWordPatterns.length === 0) return text;

    // Split words by space and punctuation while keeping tokens
    const tokens = text.split(/(\s+|[.,!?;:()"])/);

    return tokens.map((token, index) => {
      const cleanToken = token.toLowerCase().replace(/[^a-z]/g, "");
      const isTarget = targetWordPatterns.some(
        (target) => cleanToken === target || (cleanToken.length >= 4 && cleanToken.startsWith(target.slice(0, 4)))
      );

      if (isTarget) {
        return (
          <span
            key={index}
            onClick={() => handleWordClick(token)}
            className="inline-block cursor-pointer px-1.5 py-0.5 mx-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30 font-semibold text-amber-900 dark:text-amber-300 hover:bg-amber-500/25 hover:border-amber-500/60 transition-all hover:scale-105 active:scale-95 shadow-xs"
            title="Bấm để xem phát âm và nghĩa"
          >
            {token}
          </span>
        );
      }

      return <span key={index}>{token}</span>;
    });
  };

  const discoveredPercentage = Math.round(
    (discoveredWords.size / Math.max(1, story.targetWords.length)) * 100
  );

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200">
      {/* Top Floating Control Bar */}
      <div className="sticky top-16 z-30 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/80 bg-background/90 p-3 shadow-md backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToConfig}
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Dệt truyện khác
          </Button>
          <div className="hidden sm:block h-4 w-px bg-border" />
          <Badge variant="outline" className="border-amber-500/40 text-amber-600 dark:text-amber-400 text-[11px] gap-1">
            <Sparkles className="h-3 w-3" />
            <span>{story.level}</span>
          </Badge>
          <span className="hidden md:inline-block text-xs text-muted-foreground">
            {story.readTimeMinutes} phút đọc
          </span>
        </div>

        {/* Action Controls: Audio + Bilingual */}
        <div className="flex items-center gap-2">
          {/* TTS Audio Controls */}
          <div className="flex items-center rounded-xl border border-border bg-muted/40 p-0.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleStoryAudio}
              className={`h-7 px-2.5 text-xs gap-1.5 rounded-lg font-medium transition-all ${
                isPlayingAudio ? "bg-primary text-primary-foreground" : "hover:bg-background"
              }`}
            >
              {isPlayingAudio ? (
                <>
                  <Pause className="h-3.5 w-3.5" /> Đang đọc
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" /> Nghe toàn bài
                </>
              )}
            </Button>
            <button
              type="button"
              onClick={handleChangeSpeed}
              className="px-2 text-[11px] font-mono font-bold text-muted-foreground hover:text-foreground"
              title="Đổi tốc độ đọc"
            >
              {audioSpeed}x
            </button>
          </div>

          {/* Bilingual Toggle */}
          <Button
            variant={showBilingual ? "default" : "outline"}
            size="sm"
            onClick={() => setShowBilingual(!showBilingual)}
            className={`h-8 text-xs gap-1.5 rounded-xl transition-all ${
              showBilingual ? "bg-amber-600 hover:bg-amber-700 text-white border-transparent" : ""
            }`}
          >
            <Languages className="h-3.5 w-3.5" />
            {showBilingual ? "Tắt song ngữ" : "Bật song ngữ"}
          </Button>
        </div>
      </div>

      {/* Main Story Canvas */}
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Story Title & Meta Card */}
        <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-b from-card via-card to-muted/20 p-8 shadow-sm text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3.5 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {story.genre}
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground font-serif">
            {story.title}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto italic">
            &ldquo;{story.summary}&rdquo;
          </p>

          {/* Word Discovery Progress */}
          <div className="pt-2 flex items-center justify-center gap-4 text-xs font-medium">
            <span className="text-muted-foreground">
              Đã khám phá:{" "}
              <strong className="text-foreground">
                {discoveredWords.size}/{story.targetWords.length} từ
              </strong>
            </span>
            <div className="w-28 h-2 rounded-full bg-muted overflow-hidden border border-border/50">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-300"
                style={{ width: `${discoveredPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Narrative Paragraphs */}
        <div className="space-y-6">
          {story.paragraphs.map((para, index) => (
            <div
              key={index}
              className="group relative rounded-2xl border border-border/80 bg-card p-6 md:p-7 shadow-xs hover:border-border transition-all"
            >
              {/* Paragraph number indicator */}
              <span className="absolute top-4 right-4 text-[11px] font-mono text-muted-foreground/60 select-none">
                #0{index + 1}
              </span>

              {/* English text with highlights */}
              <p className="text-base md:text-lg leading-relaxed text-foreground font-serif tracking-wide">
                {renderParagraphWithHighlights(para.english)}
              </p>

              {/* Bilingual translation if active */}
              {showBilingual && (
                <div className="mt-4 pt-4 border-t border-border/50 animate-in fade-in-50 duration-200">
                  <p className="text-sm text-muted-foreground leading-relaxed italic">
                    {para.vietnamese}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Target Words Bank Panel */}
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-amber-500" />
              <span>Bảng từ vựng mục tiêu trong bài ({story.targetWords.length})</span>
            </h3>
            <span className="text-xs text-muted-foreground">Bấm vào từ để xem chi tiết & phát âm</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {story.targetWords.map((tw) => {
              const isDiscovered = discoveredWords.has(tw.word.toLowerCase());
              return (
                <button
                  key={tw.word}
                  type="button"
                  onClick={() => {
                    setActiveWordModal(tw);
                    setDiscoveredWords((prev) => new Set([...prev, tw.word.toLowerCase()]));
                    speakWord(tw.word);
                  }}
                  className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                    isDiscovered
                      ? "border-amber-500/40 bg-amber-500/10 shadow-xs"
                      : "border-border/70 bg-card hover:border-amber-500/30"
                  }`}
                >
                  <div
                    className={`mt-0.5 h-5 w-5 rounded-full flex items-center justify-center text-xs shrink-0 ${
                      isDiscovered
                        ? "bg-amber-500 text-white"
                        : "border border-border text-muted-foreground"
                    }`}
                  >
                    {isDiscovered ? (
                      <Check className="h-3 w-3 stroke-[2.5]" />
                    ) : (
                      <Circle className="h-1.5 w-1.5 fill-muted-foreground/40 text-transparent" />
                    )}
                  </div>
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-sm text-foreground truncate">{tw.word}</span>
                      <span className="text-[10px] font-mono text-muted-foreground">{tw.pos}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{tw.meaning}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Comprehension Quiz Deck */}
        {story.quiz && story.quiz.length > 0 && (
          <div className="rounded-3xl border border-border bg-card p-6 md:p-8 space-y-6 shadow-sm">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                <HelpCircle className="h-4 w-4" strokeWidth={2} /> Thử thách đọc hiểu
              </div>
              <h3 className="text-lg font-bold text-foreground">
                Khóa chặt kiến thức qua câu đố ngữ cảnh
              </h3>
              <p className="text-xs text-muted-foreground">
                Trả lời nhanh các câu hỏi dưới đây để kiểm tra mức độ nắm bắt nội dung câu chuyện.
              </p>
            </div>

            <div className="space-y-6">
              {story.quiz.map((q, qIndex) => {
                const selectedOpt = selectedAnswers[qIndex];

                return (
                  <div key={qIndex} className="space-y-3 p-4 rounded-2xl bg-muted/20 border border-border/60">
                    <p className="text-sm font-semibold text-foreground">
                      Câu {qIndex + 1}: {q.question}
                    </p>

                    <div className="grid grid-cols-1 gap-2">
                      {q.options.map((opt, optIndex) => {
                        let btnStyle = "border-border/70 bg-card hover:bg-muted/50 text-foreground cursor-pointer";
                        if (submittedQuiz) {
                          if (optIndex === q.answerIndex) {
                            btnStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-semibold ring-1 ring-emerald-500/30";
                          } else if (selectedOpt === optIndex) {
                            btnStyle = "border-destructive bg-destructive/10 text-destructive";
                          }
                        } else if (selectedOpt === optIndex) {
                          btnStyle = "border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary/30";
                        }

                        return (
                          <button
                            key={optIndex}
                            type="button"
                            onClick={() => handleSelectQuizAnswer(qIndex, optIndex)}
                            className={`flex items-center gap-3 p-3 rounded-xl border text-left text-xs transition-all ${btnStyle}`}
                          >
                            <span className="h-5 w-5 rounded-full border border-current flex items-center justify-center text-[10px] font-bold shrink-0">
                              {String.fromCharCode(65 + optIndex)}
                            </span>
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>

                    {submittedQuiz && (
                      <div className="mt-2 p-3 rounded-xl bg-muted/40 border border-border/50 text-xs text-muted-foreground animate-in fade-in-50 flex items-start gap-1.5">
                        <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" strokeWidth={2} />
                        <div>
                          <strong className="text-foreground">Giải thích:</strong> {q.explanation}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {!submittedQuiz ? (
              <Button
                type="button"
                onClick={handleSubmitQuiz}
                disabled={Object.keys(selectedAnswers).length < story.quiz.length}
                className="w-full h-11 rounded-xl font-bold bg-primary text-primary-foreground gap-2 cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" strokeWidth={2} /> Kiểm tra đáp án
              </Button>
            ) : (
              <div className="flex items-center justify-between p-4 rounded-2xl bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" strokeWidth={2} />
                  <span className="text-xs font-bold text-foreground">
                    Đã hoàn thành thử thách đọc hiểu!
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onBackToConfig}
                  className="text-xs rounded-xl cursor-pointer"
                >
                  Dệt truyện tiếp theo
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Lexicon Glassmorphic Modal / Card */}
      {activeWordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-xs animate-in fade-in-50 duration-150">
          <div
            className="w-full max-w-md rounded-3xl border border-amber-500/30 bg-card/95 p-6 shadow-2xl backdrop-blur-xl space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-black text-foreground tracking-tight">
                    {activeWordModal.word}
                  </h3>
                  <button
                    type="button"
                    onClick={() => speakWord(activeWordModal.word)}
                    aria-label="Phát âm từ"
                    className="p-1.5 rounded-full hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 transition-colors cursor-pointer"
                    title="Phát âm"
                  >
                    <Volume2 className="h-4 w-4" strokeWidth={2} />
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-mono text-muted-foreground">{activeWordModal.ipa}</span>
                  <Badge variant="outline" className="text-[10px] uppercase font-bold py-0 h-4">
                    {activeWordModal.pos}
                  </Badge>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveWordModal(null)}
                aria-label="Đóng"
                className="h-8 w-8 p-0 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </Button>
            </div>

            <div className="space-y-3 pt-2 border-t border-border/60">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Định nghĩa tiếng Việt:
                </span>
                <p className="text-base font-semibold text-foreground mt-0.5">
                  {activeWordModal.meaning}
                </p>
              </div>

              {activeWordModal.contextUsage && (
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 space-y-1">
                  <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                    <Lightbulb className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" strokeWidth={2} />
                    Bối cảnh trong câu chuyện:
                  </span>
                  <p className="text-xs text-amber-950 dark:text-amber-100/90 leading-relaxed">
                    {activeWordModal.contextUsage}
                  </p>
                </div>
              )}
            </div>

            <Button
              type="button"
              onClick={() => setActiveWordModal(null)}
              className="w-full h-10 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs gap-1.5 cursor-pointer"
            >
              <Check className="h-3.5 w-3.5" strokeWidth={2} />
              Đã hiểu từ này
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
