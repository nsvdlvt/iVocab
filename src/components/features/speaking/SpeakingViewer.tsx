"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Mic,
  MicOff,
  Volume2,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Award,
  Activity,
  Flame,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BeeMascot, MascotState } from "@/components/mascot/BeeMascot";
import { AudioRecorder } from "@/lib/speech/audio-recorder";
import type { PronunciationAssessmentResult, WordScore } from "@/lib/speech/azure-speech";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { HighlightedSentence } from "@/components/common/HighlightedExample";

export interface SpeakingWord {
  id: string;
  word: string;
  meaning: string;
  ipa?: string;
  partOfSpeech?: string;
  example?: string;
  exampleTranslation?: string;
  isStarred?: boolean;
}

interface SpeakingViewerProps {
  words: SpeakingWord[];
  setInfo: {
    id: string;
    title: string;
  };
}

export function SpeakingViewer({ words, setInfo }: SpeakingViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [practiceMode, setPracticeMode] = useState<"word" | "sentence">("word");
  const [isRecording, setIsRecording] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [result, setResult] = useState<PronunciationAssessmentResult | null>(null);
  const [selectedWordScore, setSelectedWordScore] = useState<WordScore | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const recorderRef = useRef<AudioRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const currentWord = words[currentIndex] || null;

  // Reference text depends on practice mode (single word or full sentence)
  const referenceText =
    practiceMode === "sentence" && currentWord?.example
      ? currentWord.example
      : currentWord?.word || "";

  // Reset state when changing word or mode
  useEffect(() => {
    setResult(null);
    setSelectedWordScore(null);
    setIsRecording(false);
    setIsEvaluating(false);
    if (recorderRef.current?.isRecording()) {
      recorderRef.current.stop().catch(() => {});
    }
  }, [currentIndex, practiceMode]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recorderRef.current?.isRecording()) {
        recorderRef.current.stop().catch(() => {});
      }
    };
  }, []);

  // Text to speech playback using Web Speech API
  const handlePlayAudio = useCallback((textToSpeak: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast.error("Trình duyệt không hỗ trợ phát âm thanh");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = "en-US";
    utterance.rate = 0.85; // Slightly slower for better learner listening
    utterance.onstart = () => setIsPlayingAudio(true);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);
    window.speechSynthesis.speak(utterance);
  }, []);

  // Start recording
  const startRecording = async () => {
    try {
      if (!recorderRef.current) {
        recorderRef.current = new AudioRecorder();
      }

      await recorderRef.current.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      setResult(null);
      setSelectedWordScore(null);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 15) {
            // Auto stop after 15s to prevent runaway audio
            stopAndEvaluate();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: unknown) {
      console.error("Microphone access error:", err);
      toast.error(
        "Không thể truy cập Microphone. Vui lòng cấp quyền micro trên trình duyệt của bạn!"
      );
    }
  };

  // Stop recording and send audio to Azure Speech assessment API
  const stopAndEvaluate = async () => {
    if (!recorderRef.current || !isRecording) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsRecording(false);
    setIsEvaluating(true);

    try {
      const audioBlob = await recorderRef.current.stop();

      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.wav");
      formData.append("referenceText", referenceText);

      const response = await fetch("/api/speech/assess", {
        method: "POST",
        body: formData,
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || "Chấm điểm thất bại");
      }

      setResult(json.data);
      if (json.data.words && json.data.words.length > 0) {
        setSelectedWordScore(json.data.words[0]);
      }
    } catch (err) {
      console.error("Assessment error:", err);
      toast.error(err instanceof Error ? err.message : "Đã có lỗi khi chấm điểm");
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleToggleRecord = () => {
    if (isRecording) {
      stopAndEvaluate();
    } else {
      startRecording();
    }
  };

  const handleNext = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  if (!currentWord) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-muted-foreground">Bộ từ vựng này chưa có từ nào.</p>
        <Link href={`/vocabulary/${setInfo.id}`} className="mt-4 text-primary underline">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  // Mascot state based on overall score
  const mascotState: MascotState = !result
    ? isRecording
      ? "thinking"
      : "welcome"
    : result.overallScore >= 85
    ? "celebrating"
    : result.overallScore >= 65
    ? "encouraging"
    : "thinking";

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-16">
      {/* Top Navigation & Progress */}
      <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <Link
            href={`/vocabulary/${setInfo.id}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 hover:bg-muted text-muted-foreground transition"
            title="Quay lại bộ từ"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-sm font-bold text-foreground line-clamp-1">
              Luyện phát âm: {setInfo.title}
            </h1>
            <p className="text-xs text-muted-foreground">
              Từ {currentIndex + 1} / {words.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="hidden sm:inline-flex gap-1 border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/10 text-xs font-semibold"
          >
            <Sparkles className="h-3 w-3" />
            Azure AI Speech
          </Badge>
          <div className="flex items-center gap-1">
            <Button
              size="icon-sm"
              variant="outline"
              disabled={currentIndex === 0}
              onClick={handlePrev}
              title="Từ trước"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="icon-sm"
              variant="outline"
              disabled={currentIndex === words.length - 1}
              onClick={handleNext}
              title="Từ sau"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Progress value={((currentIndex + 1) / words.length) * 100} className="h-1.5" />

      {/* Mode Switcher: Word vs Sentence */}
      {currentWord.example && (
        <div className="flex justify-center">
          <div className="inline-flex rounded-xl bg-muted/60 p-1 border border-border/60">
            <button
              onClick={() => setPracticeMode("word")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                practiceMode === "word"
                  ? "bg-card text-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Luyện từ đơn
            </button>
            <button
              onClick={() => setPracticeMode("sentence")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                practiceMode === "sentence"
                  ? "bg-card text-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Luyện cả câu ví dụ
            </button>
          </div>
        </div>
      )}

      {/* Word / Sentence Card */}
      <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card p-6 shadow-xs text-center space-y-4">
        {practiceMode === "word" ? (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                {currentWord.word}
              </h2>
              <button
                onClick={() => handlePlayAudio(currentWord.word)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition"
                title="Nghe phát âm chuẩn"
              >
                <Volume2 className={cn("h-4 w-4", isPlayingAudio && "animate-pulse text-amber-600")} />
              </button>
            </div>

            {currentWord.ipa && (
              <p className="font-mono text-sm text-primary font-medium tracking-wide">
                {currentWord.ipa}
              </p>
            )}

            <div className="pt-1">
              {currentWord.partOfSpeech && (
                <span className="italic text-xs text-muted-foreground mr-1.5 font-medium">
                  ({currentWord.partOfSpeech})
                </span>
              )}
              <span className="text-sm text-foreground/90 font-medium">
                {currentWord.meaning}
              </span>
            </div>

            {(currentWord.example || currentWord.exampleTranslation) && (
              <div className="mt-4 pt-3 border-t border-border/40 text-xs text-muted-foreground">
                {currentWord.example && (
                  <p className="italic">
                    &ldquo;
                    <HighlightedSentence
                      sentence={currentWord.example}
                      type="en"
                      targetWord={currentWord.word}
                    />
                    &rdquo;
                  </p>
                )}
                {currentWord.exampleTranslation && (
                  <p className="mt-1 text-[11px] not-italic text-muted-foreground/80">
                    <HighlightedSentence
                      sentence={currentWord.exampleTranslation}
                      type="vi"
                      meaning={currentWord.meaning}
                    />
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start justify-center gap-2">
              <p className="text-lg sm:text-xl font-semibold text-foreground leading-relaxed">
                <HighlightedSentence
                  sentence={currentWord.example || ""}
                  type="en"
                  targetWord={currentWord.word}
                />
              </p>
              <button
                onClick={() => handlePlayAudio(currentWord.example || "")}
                className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition"
                title="Nghe câu mẫu"
              >
                <Volume2 className={cn("h-4 w-4", isPlayingAudio && "animate-pulse")} />
              </button>
            </div>
            {currentWord.exampleTranslation && (
              <p className="text-xs text-muted-foreground">
                <HighlightedSentence
                  sentence={currentWord.exampleTranslation}
                  type="vi"
                  meaning={currentWord.meaning}
                />
              </p>
            )}
            <div className="text-xs text-muted-foreground pt-1">
              Từ trọng tâm: <span className="font-bold text-primary">{currentWord.word}</span>
            </div>
          </div>
        )}
      </div>

      {/* Microphone Interaction Zone */}
      <div className="flex flex-col items-center justify-center space-y-3 py-2">
        <div className="relative">
          {/* Ripple animation when recording */}
          {isRecording && (
            <>
              <span className="absolute -inset-3 rounded-full bg-rose-500/20 animate-ping opacity-75" />
              <span className="absolute -inset-1.5 rounded-full bg-rose-500/40 animate-pulse" />
            </>
          )}

          <button
            onClick={handleToggleRecord}
            disabled={isEvaluating}
            className={cn(
              "relative flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full shadow-lg transition transform active:scale-95 cursor-pointer",
              isRecording
                ? "bg-rose-500 text-white ring-4 ring-rose-400/50 hover:bg-rose-600"
                : isEvaluating
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-linear-to-tr from-amber-500 to-amber-400 text-amber-950 ring-4 ring-amber-400/30 hover:scale-105"
            )}
          >
            {isRecording ? (
              <MicOff className="h-8 w-8 sm:h-10 sm:w-10 animate-pulse" />
            ) : isEvaluating ? (
              <div className="h-8 w-8 rounded-full border-3 border-amber-600 border-t-transparent animate-spin" />
            ) : (
              <Mic className="h-8 w-8 sm:h-10 sm:w-10" />
            )}
          </button>
        </div>

        <div className="text-center">
          {isRecording ? (
            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 animate-pulse">
              Đang lắng nghe... ({recordingSeconds}s) - Bấm lại để dừng
            </p>
          ) : isEvaluating ? (
            <p className="text-xs font-medium text-muted-foreground animate-pulse">
              Vocabee & Azure đang chấm điểm phát âm...
            </p>
          ) : (
            <p className="text-xs text-muted-foreground font-medium">
              Bấm vào micro để đọc: <span className="font-semibold text-foreground">&quot;{referenceText}&quot;</span>
            </p>
          )}
        </div>
      </div>

      {/* Assessment Results Section */}
      {result && (
        <div className="space-y-5 rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition animate-in fade-in-50 duration-300">
          {/* Mascot reaction & feedback speech bubble */}
          <div className="flex flex-col sm:flex-row items-center gap-4 border-b border-border/60 pb-5">
            <BeeMascot
              state={mascotState}
              size="md"
              interactive={true}
              className="shrink-0"
            />
            <div className="space-y-1.5 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  Nhận xét từ Vocabee
                </span>
                {result.isDemo && (
                  <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-amber-500/40 text-amber-600 dark:text-amber-400">
                    Chế độ Demo
                  </Badge>
                )}
              </div>
              <p className="text-sm font-medium text-foreground leading-relaxed">
                {result.feedback}
              </p>
            </div>
          </div>

          {/* Scores Overview: Overall Score + 4 Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-center">
            {/* Overall Score Circle */}
            <div className="sm:col-span-2 flex flex-col items-center justify-center rounded-xl bg-muted/30 p-4 border border-border/60">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Tổng điểm phát âm
              </span>
              <div
                className={cn(
                  "flex h-20 w-20 items-center justify-center rounded-full border-4 font-extrabold text-2xl shadow-inner",
                  result.overallScore >= 85
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : result.overallScore >= 65
                    ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : "border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                )}
              >
                {result.overallScore}
              </div>
              <span className="text-[11px] font-medium text-muted-foreground mt-2 inline-flex items-center gap-1">
                {result.overallScore >= 85 ? (
                  <>
                    <Award className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Xuất sắc</span>
                  </>
                ) : result.overallScore >= 65 ? (
                  <>
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    <span>Đạt chuẩn</span>
                  </>
                ) : (
                  <>
                    <Activity className="h-3.5 w-3.5 text-rose-500" />
                    <span>Cần cải thiện</span>
                  </>
                )}
              </span>
            </div>

            {/* 4 Detail Metrics */}
            <div className="sm:col-span-3 grid grid-cols-2 gap-3">
              <ScoreMetricCard
                label="Độ chuẩn xác"
                sublabel="Accuracy"
                score={result.accuracyScore}
              />
              <ScoreMetricCard
                label="Độ trôi chảy"
                sublabel="Fluency"
                score={result.fluencyScore}
              />
              <ScoreMetricCard
                label="Ngữ điệu"
                sublabel="Prosody"
                score={result.prosodyScore ?? result.accuracyScore}
              />
              <ScoreMetricCard
                label="Độ đầy đủ"
                sublabel="Completeness"
                score={result.completenessScore}
              />
            </div>
          </div>

          {/* Word-by-word Breakdown */}
          {result.words && result.words.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-border/60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Phân tích từng từ (Bấm vào từ để xem âm vị)
                </span>
                <span className="text-[11px] text-muted-foreground">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">●</span> Tốt &nbsp;
                  <span className="text-amber-500 font-bold">●</span> Khá &nbsp;
                  <span className="text-rose-500 font-bold">●</span> Cần sửa
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {result.words.map((w, index) => {
                  const isSelected = selectedWordScore?.word === w.word;
                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedWordScore(w)}
                      className={cn(
                        "inline-flex flex-col items-center rounded-xl px-3 py-1.5 border text-xs font-semibold transition cursor-pointer",
                        w.accuracyScore >= 80
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20"
                          : w.accuracyScore >= 60
                          ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20"
                          : "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30 hover:bg-rose-500/20",
                        isSelected && "ring-2 ring-primary ring-offset-1"
                      )}
                    >
                      <span>{w.word}</span>
                      <span className="text-[10px] font-mono opacity-80">{w.accuracyScore}</span>
                    </button>
                  );
                })}
              </div>

              {/* Selected Word Phoneme breakdown */}
              {selectedWordScore && selectedWordScore.phonemes && selectedWordScore.phonemes.length > 0 && (
                <div className="mt-3 rounded-xl bg-muted/40 p-3 border border-border/60 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">
                      Chi tiết âm vị của từ: <span className="text-primary font-bold">{selectedWordScore.word}</span>
                    </span>
                    <span className="text-muted-foreground text-[11px]">
                      Điểm: {selectedWordScore.accuracyScore}/100
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedWordScore.phonemes.map((p, pIdx) => (
                      <div
                        key={pIdx}
                        className={cn(
                          "flex flex-col items-center justify-center rounded-lg px-2.5 py-1 border text-xs font-mono",
                          p.accuracyScore >= 80
                            ? "bg-card text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                            : p.accuracyScore >= 60
                            ? "bg-card text-amber-600 dark:text-amber-400 border-amber-500/30"
                            : "bg-card text-rose-600 dark:text-rose-400 border-rose-500/30 font-bold"
                        )}
                      >
                        <span className="font-semibold">/{p.phoneme}/</span>
                        <span className="text-[10px] opacity-75">{p.accuracyScore}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-border/60">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleRecord}
              className="gap-1.5 rounded-xl cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Nói lại</span>
            </Button>

            <Button
              size="sm"
              onClick={handleNext}
              disabled={currentIndex >= words.length - 1}
              className="gap-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
            >
              <span>Từ tiếp theo</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreMetricCard({
  label,
  sublabel,
  score,
}: {
  label: string;
  sublabel: string;
  score: number;
}) {
  return (
    <div className="flex flex-col rounded-xl bg-muted/20 p-3 border border-border/60">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span
          className={cn(
            "font-bold font-mono",
            score >= 80
              ? "text-emerald-600 dark:text-emerald-400"
              : score >= 60
              ? "text-amber-600 dark:text-amber-400"
              : "text-rose-600 dark:text-rose-400"
          )}
        >
          {score}
        </span>
      </div>
      <span className="text-[10px] text-muted-foreground uppercase">{sublabel}</span>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            score >= 80
              ? "bg-emerald-500"
              : score >= 60
              ? "bg-amber-500"
              : "bg-rose-500"
          )}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
    </div>
  );
}
