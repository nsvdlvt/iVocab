"use client";

import React, { useEffect, useMemo, useState } from "react";
import { BookOpen, Loader2, RefreshCw, Sparkles, CheckCircle2, XCircle, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { AiQuizPayload } from "@/lib/ai/schemas/ai-quiz";
import { ROUTES } from "@/constants/routes";
import { InlineDictionaryPopup } from "@/components/features/dictionary/InlineDictionaryPopup";
import { extractSentence } from "@/lib/nlp/pos";
import { notifyStudyActivityUpdated } from "@/lib/events/study-events";

type QuizAnswerState = Record<string, string>;

interface AiQuizClientProps {
  setId: string;
  setTitle: string;
  initialQuiz?: AiQuizPayload | null;
}

export function AiQuizClient({ setId, setTitle, initialQuiz = null }: AiQuizClientProps) {
  const [quiz, setQuiz] = useState<AiQuizPayload | null>(initialQuiz);
  const [loading, setLoading] = useState(!initialQuiz);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<QuizAnswerState>({});
  const [submitted, setSubmitted] = useState(false);
  const [updatingSrs, setUpdatingSrs] = useState(false);
  const [generationNonce, setGenerationNonce] = useState(0);
  const [isTranslationOn, setIsTranslationOn] = useState(false);
  const [activeWord, setActiveWord] = useState<{word: string, x: number, y: number, id?: string, sentence?: string} | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setHydrated(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated || quiz) return;

    const timer = setTimeout(() => {
      const controller = new AbortController();
      fetch("/api/ai/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setId, cacheBuster: generationNonce, ts: Date.now() }),
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok) {
            const body = await response.json().catch(() => ({}));
            throw new Error(body.error || "Không thể tạo AI Quiz.");
          }
          return response.json() as Promise<{ success: boolean; data: AiQuizPayload }>;
        })
        .then((data) => {
          console.info("[AI Quiz] client:loaded", {
            setId,
            source: data.data.source ?? "unknown",
            questionCount: data.data.questions.length,
            generationNonce,
          });
          setQuiz(data.data);
        })
        .catch((err: unknown) => {
          if (err instanceof DOMException && err.name === "AbortError") return;
          setError(err instanceof Error ? err.message : "Không thể tạo AI Quiz.");
        })
        .finally(() => setLoading(false));

      return () => controller.abort();
    }, 0);

    return () => clearTimeout(timer);
  }, [generationNonce, hydrated, quiz, setId]);

  const total = quiz?.questions.length ?? 0;
  const answeredCount = Object.keys(answers).length;
  const progress = total > 0 ? Math.round((answeredCount / total) * 100) : 0;
  const alphabet = ["A", "B", "C", "D"];

  const score = useMemo(() => {
    if (!quiz) return { correct: 0, wrong: 0, total: 0, accuracy: 0 };
    const correct = quiz.questions.filter((question) => {
      const selected = answers[question.blank];
      return selected && selected === question.options[question.correctAnswer];
    }).length;
    const wrong = submitted ? quiz.questions.length - correct : 0;
    return {
      correct,
      wrong,
      total: quiz.questions.length,
      accuracy: quiz.questions.length > 0 ? Math.round((correct / quiz.questions.length) * 100) : 0,
    };
  }, [answers, quiz, submitted]);

  const { parsedParts, cleanPassage } = useMemo(() => {
    if (!quiz) return { parsedParts: [], cleanPassage: "" };
    
    let offset = 0;
    let cleanStr = "";
    const parts = quiz.passage.split(/(__\d+__)/g).map((part, index) => {
      const isBlank = /^__\d+__$/.test(part);
      const cleanPart = isBlank ? "_____" : part;
      const chunk = {
        text: part,
        isBlank,
        globalOffset: offset,
        index
      };
      offset += cleanPart.length;
      cleanStr += cleanPart;
      return chunk;
    });
    return { parsedParts: parts, cleanPassage: cleanStr };
  }, [quiz]);

  const handleChange = (blank: string, value: string) => {
    if (submitted) return;
    setAnswers((current) => ({ ...current, [blank]: value }));
  };

  const handleSubmit = async () => {
    if (!quiz || submitted) return;
    setSubmitted(true);
    setUpdatingSrs(true);

    try {
      await Promise.all(
        quiz.questions.map((question) =>
          fetch("/api/srs/result", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              vocabularyId: question.id,
              mode: "ai-quiz",
              answerResult: answers[question.blank] === question.options[question.correctAnswer] ? "correct" : "wrong",
            }),
          }).then(async (response) => {
            if (!response.ok) {
              console.error("SRS save failed (ai-quiz)", await response.text());
            }
          })
        )
      );
      notifyStudyActivityUpdated();
      toast.success("Đã cập nhật SRS cho bài AI Quiz.");
    } catch (error) {
      console.error("SRS save request failed (ai-quiz)", error);
      toast.error("Không thể cập nhật SRS. Vui lòng thử lại.");
    } finally {
      setUpdatingSrs(false);
    }
  };

  const handleRetry = () => {
    setQuiz(null);
    setAnswers({});
    setSubmitted(false);
    setError(null);
    setLoading(true);
    setGenerationNonce((n) => n + 1);
  };

  const renderPassageText = (text: string, partIndex: number, globalOffset: number) => {
    if (!isTranslationOn) return text;
    // Regex to match words with optional hyphens/apostrophes inside
    const regex = /\b([a-zA-Z]+(?:[''-][a-zA-Z]+)*)\b/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      const word = match[0];
      const matchIndex = match.index; // Capture in block scope
      const wordId = `${partIndex}-${matchIndex}`;
      const isActive = activeWord?.id === wordId;

      parts.push(
        <span
          key={wordId}
          className={cn(
            "cursor-pointer transition-colors",
            isActive 
              ? "bg-primary text-primary-foreground rounded-md px-1 mx-0.5 font-semibold" 
              : "hover:underline underline-offset-4 decoration-primary/50 text-foreground"
          )}
          onClick={(e) => {
            e.stopPropagation();
            const rect = (e.target as HTMLElement).getBoundingClientRect();
            const wordGlobalIndex = globalOffset + matchIndex;
            
            let sentence;
            try {
              sentence = extractSentence(cleanPassage, wordGlobalIndex) || cleanPassage;
            } catch (err) {
              console.error("Sentence extraction failed:", err);
              sentence = cleanPassage; // fallback
            }

            setActiveWord({ 
              word, 
              x: rect.left, 
              y: Math.min(rect.bottom, window.innerHeight - 10), 
              id: wordId,
              sentence 
            });
          }}
        >
          {word}
        </span>
      );
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    
    return <>{parts.map((p, i) => <React.Fragment key={i}>{p}</React.Fragment>)}</>;
  };

  if (!hydrated || loading) {
    return (
      <SectionCard className="max-w-3xl mx-auto space-y-5 p-8">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-3 text-primary">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
          <div>
            <h2 className="text-xl font-black text-foreground">Đang tạo AI Quiz</h2>
            <p className="text-sm text-muted-foreground">AI đang ghép một bài đọc phù hợp với bộ từ vựng của bạn.</p>
          </div>
        </div>
        <Progress value={65} className="h-1.5 rounded-full" />
      </SectionCard>
    );
  }

  if (error) {
    return (
      <SectionCard className="max-w-2xl mx-auto text-center space-y-4 p-8">
        <div className="mx-auto rounded-full bg-rose-500/10 p-4 w-fit text-rose-600 dark:text-rose-400">
          <XCircle className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-foreground">Không thể tạo AI Quiz</h2>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
        <div className="flex justify-center gap-3">
          <Button onClick={handleRetry} className="rounded-xl gap-2">
            <RefreshCw className="h-4 w-4" />
            Thử lại
          </Button>
          <Button variant="outline" onClick={() => (window.location.href = ROUTES.VOCABULARY)} className="rounded-xl">
            Quay lại từ vựng
          </Button>
        </div>
      </SectionCard>
    );
  }

  if (!quiz) return null;

  return (
    <div className="space-y-6 pb-8">
      {activeWord && isTranslationOn && (
        <InlineDictionaryPopup
          word={activeWord.word}
          sentence={activeWord.sentence}
          x={activeWord.x}
          y={activeWord.y}
          onClose={() => setActiveWord(null)}
        />
      )}

      <PageHeader
        title={quiz.title}
        description={`Bài đọc cloze test theo phong cách TOEIC/IELTS cho bộ "${setTitle}".`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full px-3 py-1 gap-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
              <Sparkles className="h-3.5 w-3.5" />
              AI Quiz #{generationNonce + 1}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="rounded-xl gap-1.5 h-8 text-xs font-semibold"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Đổi bài đọc
            </Button>
          </div>
        }
      />

      {submitted && (
        <SectionCard className="grid gap-3 sm:grid-cols-3 p-4 md:p-5">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <CheckCircle2 className="h-4 w-4" />
              Đúng
            </div>
            <p className="mt-1.5 text-2xl font-black text-foreground tabular-nums">{score.correct}</p>
          </div>
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-bold uppercase tracking-wider">
              <XCircle className="h-4 w-4" />
              Sai
            </div>
            <p className="mt-1.5 text-2xl font-black text-foreground tabular-nums">{score.wrong}</p>
          </div>
          <div className="rounded-xl border border-primary/20 bg-primary/10 p-4">
            <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider">
              <Sparkles className="h-4 w-4" />
              Độ chính xác
            </div>
            <p className="mt-1.5 text-2xl font-black text-foreground tabular-nums">{score.accuracy}%</p>
          </div>
        </SectionCard>
      )}

      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: Sticky Passage Card */}
        <div className="lg:col-span-7 lg:sticky lg:top-20 space-y-4">
          <SectionCard className="space-y-4 p-5 md:p-6">
            {/* Passage Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/70">
              <div className="flex items-center gap-3 min-w-[160px] flex-1">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  Tiến độ ({answeredCount}/{total})
                </span>
                <Progress value={progress} className="h-2 max-w-[160px] rounded-full" />
              </div>

              <Button
                variant={isTranslationOn ? "default" : "outline"}
                size="sm"
                className={cn(
                  "rounded-xl gap-2 h-8 text-xs font-semibold transition-all",
                  isTranslationOn
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-background hover:bg-muted text-foreground"
                )}
                onClick={() => {
                  setIsTranslationOn(!isTranslationOn);
                  setActiveWord(null);
                }}
              >
                <Globe className="h-3.5 w-3.5" />
                Tra từ trực tiếp: {isTranslationOn ? "BẬT" : "TẮT"}
              </Button>
            </div>

            {isTranslationOn && (
              <p className="text-xs text-muted-foreground bg-primary/5 border border-primary/15 rounded-lg px-3 py-1.5">
                Nhấn vào bất kỳ từ tiếng Anh nào trong đoạn văn để xem nghĩa và phiên âm theo ngữ cảnh.
              </p>
            )}

            <div className="rounded-xl border border-border/80 bg-muted/20 p-5 md:p-6 leading-8 text-[15px] md:text-[16px] text-foreground">
              {parsedParts.map((chunk) => {
                const questionIndex = quiz.questions.findIndex((item) => item.blank === chunk.text);
                const question = questionIndex >= 0 ? quiz.questions[questionIndex] : undefined;
                if (!question) {
                  return (
                    <React.Fragment key={`${chunk.text}-${chunk.index}`}>
                      {renderPassageText(chunk.text, chunk.index, chunk.globalOffset)}
                    </React.Fragment>
                  );
                }

                const selected = answers[question.blank];
                const correctText = question.options[question.correctAnswer];
                const isCorrect = submitted && selected === correctText;
                const isWrong = submitted && selected && selected !== correctText;

                return (
                  <span
                    key={question.blank}
                    className={cn(
                      "inline-flex items-center gap-1.5 align-baseline mx-1 px-2.5 py-0.5 rounded-lg border font-bold text-sm transition-colors",
                      submitted
                        ? isCorrect
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          : isWrong
                            ? "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300"
                            : "border-border bg-background text-foreground"
                        : selected
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-dashed border-primary/40 bg-background text-muted-foreground"
                    )}
                  >
                    <span className="text-[11px] font-mono opacity-75">({questionIndex + 1})</span>
                    <span>{selected || "_____"}</span>
                  </span>
                );
              })}
            </div>
          </SectionCard>
        </div>

        {/* Right Column: Questions List */}
        <div className="lg:col-span-5 space-y-4">
          {quiz.questions.map((question, questionIndex) => {
            const selected = answers[question.blank];
            const correctText = question.options[question.correctAnswer];
            const isCorrect = submitted && selected === correctText;

            return (
              <SectionCard key={question.blank} className="space-y-3.5 p-4 md:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-xs font-black text-primary tabular-nums">
                      {questionIndex + 1}
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground">
                      Chỗ trống ({questionIndex + 1})
                    </span>
                  </div>
                  {submitted && (
                    <Badge
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs",
                        isCorrect
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                      )}
                    >
                      {isCorrect ? "Chính xác" : "Chưa đúng"}
                    </Badge>
                  )}
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  {question.options.map((option, optionIndex) => {
                    const active = selected === option;
                    const revealedCorrect = submitted && option === correctText;
                    const isWrong = submitted && active && option !== correctText;

                    return (
                      <button
                        key={option}
                        type="button"
                        disabled={submitted}
                        onClick={() => handleChange(question.blank, option)}
                        className={cn(
                          "group flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left transition-all duration-150",
                          !submitted && "hover:border-primary/40 hover:bg-primary/5 cursor-pointer",
                          active && !submitted && "border-primary bg-primary/10 ring-1 ring-primary/20",
                          submitted && revealedCorrect && "border-emerald-500/40 bg-emerald-500/10",
                          submitted && isWrong && "border-rose-500/40 bg-rose-500/10",
                          submitted && !revealedCorrect && !isWrong && "border-border bg-background/60 opacity-70"
                        )}
                      >
                        <kbd
                          className={cn(
                            "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold border",
                            submitted && revealedCorrect
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : submitted && isWrong
                                ? "border-rose-500 bg-rose-500 text-white"
                                : active && !submitted
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border bg-muted/60 text-muted-foreground"
                          )}
                        >
                          {alphabet[optionIndex]}
                        </kbd>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-foreground truncate">{option}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>

                {submitted && (
                  <div className="space-y-1.5 rounded-xl border border-border/70 bg-muted/20 p-3.5 text-xs">
                    <p className="text-muted-foreground">
                      <span className="font-semibold text-foreground">Đáp án đúng:</span> {correctText}
                    </p>
                    <p className="text-muted-foreground">
                      <span className="font-semibold text-foreground"> Nghĩa:</span> {question.meaning}
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      <span className="font-semibold text-foreground">Giải thích:</span> {question.explanation}
                    </p>
                  </div>
                )}
              </SectionCard>
            );
          })}

          <div className="pt-2">
            {!submitted ? (
              <Button
                onClick={handleSubmit}
                disabled={updatingSrs || answeredCount !== total}
                className="w-full rounded-xl gap-2 h-11 font-bold"
              >
                <BookOpen className="h-4 w-4" />
                Nộp bài ({answeredCount}/{total})
              </Button>
            ) : (
              <Button
                onClick={handleRetry}
                variant="outline"
                className="w-full rounded-xl gap-2 h-11 font-bold"
              >
                <RefreshCw className="h-4 w-4" />
                Tạo bài AI Quiz mới
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
