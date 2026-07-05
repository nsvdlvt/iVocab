"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  BookOpen,
  TriangleAlert,
  ChevronDown,
  ChevronUp,
  Brain,
  MessageSquareCode,
  Languages,
  PenTool,
  Copy,
  RotateCcw
} from "lucide-react";
import { SentenceFeedback } from "@/lib/ai/schemas/sentence-feedback";
import { toast } from "sonner";

export interface SentenceResultProps {
  feedback: SentenceFeedback;
  explainMore: string | null;
  generateMore: string[] | null;
  explainMoreLoading: boolean;
  generateMoreLoading: boolean;
  onExplainMore: () => void;
  onGenerateMore: () => void;
  onRetry?: () => void;
}

interface CategoryDetail {
  name: string;
  score: string;
  comment: string;
  correction: string;
  reason: string;
}

interface ParsedMistake {
  errorType: string;
  originalText: string;
  correctVersion: string;
  whyWrong: string;
  howToAvoid: string;
  correctUsage: string;
  confidence: number;
}

// Parses structured markdown from the "explanation" field for each category
function parseExplanation(explanation: string | undefined): CategoryDetail[] {
  if (!explanation) return [];
  
  const categories: CategoryDetail[] = [];
  const sections = explanation.split(/###\s+/);
  
  for (const section of sections) {
    if (!section.trim()) continue;
    
    const lines = section.split("\n");
    const name = lines[0].trim();
    
    let score = "10/10";
    let comment = "";
    let correction = "";
    let reason = "";
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("- Điểm:")) {
        score = trimmed.replace("- Điểm:", "").trim();
      } else if (trimmed.startsWith("- Nhận xét:")) {
        comment = trimmed.replace("- Nhận xét:", "").trim();
      } else if (trimmed.startsWith("- Sửa lỗi:")) {
        correction = trimmed.replace("- Sửa lỗi:", "").trim();
      } else if (trimmed.startsWith("- Lý do:")) {
        reason = trimmed.replace("- Lý do:", "").trim();
      }
    }
    
    if (name) {
      categories.push({ name, score, comment, correction, reason });
    }
  }
  
  return categories;
}

// Parses pipe-delimited mistake types into structured cards
function parseMistakeType(typeStr: string, confidence: number): ParsedMistake {
  const parts = typeStr.split("|").map((p) => p.trim());
  return {
    errorType: parts[0] || "Lỗi viết câu",
    originalText: parts[1] || "",
    correctVersion: parts[2] || "",
    whyWrong: parts[3] || "",
    howToAvoid: parts[4] || "",
    correctUsage: parts[5] || "",
    confidence,
  };
}

export function SentenceResult({
  feedback,
  explainMore,
  generateMore,
  explainMoreLoading,
  generateMoreLoading,
  onExplainMore,
  onGenerateMore,
  onRetry,
}: SentenceResultProps) {
  const mistakesCount = feedback.mistakes.length;
  const overallScore = mistakesCount === 0 ? 100 : Math.max(0, 100 - mistakesCount * 12);

  const [animatedScore, setAnimatedScore] = useState(0);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    mistakes: true,
    categories: true,
    alternativeSentences: false,
    aiInteractive: true,
  });

  // Count-up animation for the score
  useEffect(() => {
    let start = 0;
    const end = overallScore;
    if (end <= 0) {
      const handle = setTimeout(() => setAnimatedScore(0), 0);
      return () => clearTimeout(handle);
    }
    const duration = 800;
    const stepTime = Math.max(Math.floor(duration / end), 8);
    const timer = setInterval(() => {
      start += 1;
      setAnimatedScore(start);
      if (start >= end) {
        clearInterval(timer);
      }
    }, stepTime);
    return () => clearInterval(timer);
  }, [overallScore]);

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Đã sao chép vào bộ nhớ tạm!");
  };

  const getConfidenceBadgeColor = (conf: number) => {
    if (conf >= 0.8) return "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20";
    if (conf >= 0.5) return "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20";
    return "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20";
  };

  const getCategoryIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("grammar") || n.includes("ngữ pháp")) return <BookOpen className="h-4 w-4 text-purple-500" />;
    if (n.includes("vocab") || n.includes("từ vựng")) return <Languages className="h-4 w-4 text-violet-500" />;
    if (n.includes("natural") || n.includes("tự nhiên")) return <Sparkles className="h-4 w-4 text-indigo-500" />;
    if (n.includes("context") || n.includes("ngữ cảnh")) return <Brain className="h-4 w-4 text-blue-500" />;
    return <PenTool className="h-4 w-4 text-teal-500" />;
  };

  const parsedCategories = parseExplanation(feedback.explanation);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* 1. Score Overview Card */}
      <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-md relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-indigo-500 to-sky-500 opacity-80" />
        
        {/* Large Circular Score */}
        <div className="flex flex-col items-center justify-center shrink-0 w-full md:w-fit border-b md:border-b-0 md:border-r border-border/60 pb-6 md:pb-0 md:pr-10">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Overall Score</span>
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
              <path
                className="text-muted/30"
                fill="none"
                strokeWidth="2.5"
                stroke="currentColor"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831"
              />
              <motion.path
                className="text-blue-600 dark:text-blue-400"
                fill="none"
                strokeWidth="2.5"
                strokeDasharray={`${animatedScore}, 100`}
                strokeLinecap="round"
                stroke="currentColor"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831"
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-4xl font-extrabold tracking-tight text-foreground">{animatedScore}</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Points</span>
            </div>
          </div>
        </div>

        {/* General Assessment Feedback */}
        <div className="flex-1 space-y-3 w-full">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-pulse" />
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Đánh giá tổng quát</h4>
            </div>
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="rounded-xl px-3 py-1 h-7 text-[11px] hover:bg-muted/80 gap-1 border-border/80 font-bold shrink-0"
              >
                <RotateCcw className="h-3.5 w-3.5 text-indigo-500 animate-spin-hover" />
                <span>Làm lại</span>
              </Button>
            )}
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed font-medium">
            {feedback.feedback}
          </p>

          {feedback.correctedSentence && (
            <div className="bg-blue-500/[0.03] border border-blue-500/10 rounded-2xl p-4 space-y-2 mt-2 select-text relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  Câu đề xuất cải tiến
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleCopy(feedback.correctedSentence!)}
                  className="h-6 w-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-sm font-semibold text-foreground/90 leading-relaxed pr-6">
                {feedback.correctedSentence}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 2. Detailed Category Analysis (Notion style) */}
      {parsedCategories.length > 0 && (
        <div className="border border-border/80 bg-card rounded-3xl shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("categories")}
            className="w-full px-6 py-4 flex items-center justify-between font-bold text-foreground hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Brain className="h-5 w-5 text-blue-500" />
              <span>Phân tích chi tiết từng khía cạnh ({parsedCategories.length})</span>
            </div>
            {openSections.categories ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          <AnimatePresence>
            {openSections.categories && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-border/60 overflow-hidden"
              >
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {parsedCategories.map((cat, idx) => (
                    <div
                      key={idx}
                      className="bg-muted/10 border border-border/50 rounded-2xl p-4 space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 font-bold text-sm text-foreground/90">
                            {getCategoryIcon(cat.name)}
                            <span>{cat.name}</span>
                          </div>
                          <span className="text-xs font-mono font-extrabold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md">
                            {cat.score}
                          </span>
                        </div>
                        {cat.comment && (
                          <p className="text-xs text-foreground/80 leading-relaxed font-medium">
                            {cat.comment}
                          </p>
                        )}
                      </div>

                      {(cat.correction || cat.reason) && (
                        <div className="border-t border-border/40 pt-2.5 mt-2 space-y-1.5 text-[11px] leading-relaxed">
                          {cat.correction && cat.correction !== "Không" && (
                            <div>
                              <span className="font-bold text-rose-500">Sửa đổi: </span>
                              <span className="font-mono bg-rose-500/[0.02] text-foreground/90 border border-rose-500/10 px-1 py-0.5 rounded-md">
                                {cat.correction}
                              </span>
                            </div>
                          )}
                          {cat.reason && (
                            <p className="text-muted-foreground font-medium">
                              <span className="font-bold text-foreground/80">Lý do: </span>
                              {cat.reason}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* 3. Mistakes List (Collapsible Card) */}
      {feedback.mistakes.length > 0 && (
        <div className="border border-border/80 bg-card rounded-3xl shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("mistakes")}
            className="w-full px-6 py-4 flex items-center justify-between font-bold text-foreground hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <TriangleAlert className="h-5 w-5 text-blue-500" />
              <span>Phát hiện lỗi sai và hướng cải thiện ({feedback.mistakes.length})</span>
            </div>
            {openSections.mistakes ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          <AnimatePresence>
            {openSections.mistakes && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-border/60 overflow-hidden"
              >
                <div className="p-6 space-y-4">
                  {feedback.mistakes.map((m, idx) => {
                    const parsed = parseMistakeType(m.type, m.confidence);
                    return (
                      <div
                        key={idx}
                        className="bg-muted/10 border border-border/60 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row justify-between gap-5 relative overflow-hidden"
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-blue-500" />
                        
                        <div className="space-y-3.5 flex-1 pl-2">
                          <div className="flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center bg-blue-500/10 text-blue-600 rounded-full font-mono text-xs font-bold">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-extrabold text-foreground uppercase tracking-wide">
                              {parsed.errorType}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {parsed.originalText && (
                              <div>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Cụm từ gốc</span>
                                <span className="text-sm font-semibold line-through text-rose-500/80 bg-rose-500/5 px-2.5 py-1.5 rounded-xl block border border-rose-500/10 font-mono">
                                  {parsed.originalText}
                                </span>
                              </div>
                            )}
                            {parsed.correctVersion && (
                              <div>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Cụm từ đúng</span>
                                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 px-2.5 py-1.5 rounded-xl block border border-emerald-500/10 font-mono">
                                  {parsed.correctVersion}
                                </span>
                              </div>
                            )}
                          </div>

                          {parsed.whyWrong && (
                            <div className="text-xs leading-relaxed text-foreground/80 bg-muted/40 p-3 rounded-xl border border-border/30">
                              <span className="font-bold text-foreground/90 block mb-0.5">Tại sao sai?</span>
                              {parsed.whyWrong}
                            </div>
                          )}

                          {parsed.howToAvoid && (
                            <div className="text-xs leading-relaxed text-foreground/80 bg-muted/40 p-3 rounded-xl border border-border/30">
                              <span className="font-bold text-foreground/90 block mb-0.5">Cách phòng tránh</span>
                              {parsed.howToAvoid}
                            </div>
                          )}

                          {parsed.correctUsage && (
                            <div className="text-xs leading-relaxed text-foreground/80 bg-blue-500/[0.01] p-3 rounded-xl border border-blue-500/10">
                              <span className="font-bold text-blue-600 dark:text-blue-400 block mb-0.5">Ví dụ sử dụng đúng</span>
                              <span className="font-medium italic select-text">{parsed.correctUsage}</span>
                            </div>
                          )}
                        </div>

                        <span className={`inline-flex items-center text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border shrink-0 h-fit w-fit ${getConfidenceBadgeColor(parsed.confidence)}`}>
                          {(parsed.confidence * 100).toFixed(0)}% Confidence
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* 4. Alternative Sentences (Collapsible Card) */}
      {feedback.alternativeSentences && feedback.alternativeSentences.length > 0 && (
        <div className="border border-border/80 bg-card rounded-3xl shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("alternativeSentences")}
            className="w-full px-6 py-4 flex items-center justify-between font-bold text-foreground hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <BookOpen className="h-5 w-5 text-blue-500" />
              <span>Các câu viết thay thế khác ({feedback.alternativeSentences.length})</span>
            </div>
            {openSections.alternativeSentences ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          <AnimatePresence>
            {openSections.alternativeSentences && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-border/60 overflow-hidden"
              >
                <div className="p-6 space-y-2 select-text">
                  {feedback.alternativeSentences.map((s, i) => (
                    <div
                      key={i}
                      className="text-sm font-medium text-foreground/80 bg-muted/20 border border-border/40 p-3.5 rounded-xl hover:bg-muted/40 transition-colors flex items-center justify-between gap-4"
                    >
                      <span className="flex-1">{s}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopy(s)}
                        className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground shrink-0"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* 5. AI Trợ Lý Chuyên Sâu */}
      <div className="border border-border/80 bg-card rounded-3xl p-6 shadow-sm space-y-4">
        <button
          type="button"
          onClick={() => toggleSection("aiInteractive")}
          className="w-full flex items-center justify-between font-bold text-foreground"
        >
          <div className="flex items-center gap-2.5">
            <MessageSquareCode className="h-5 w-5 text-blue-500" />
            <h4 className="font-extrabold text-sm uppercase tracking-wider">AI Trợ Lý Chuyên Sâu</h4>
          </div>
          {openSections.aiInteractive ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        
        <AnimatePresence>
          {openSections.aiInteractive && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-4 overflow-hidden pt-2"
            >
              <div className="flex flex-wrap gap-2.5 select-none">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onExplainMore}
                  disabled={explainMoreLoading}
                  className="rounded-xl px-4 py-2.5 text-xs font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 hover:bg-blue-500/20 transition-all duration-200 cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  🔍 Giải thích lỗi chi tiết
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onGenerateMore}
                  disabled={generateMoreLoading}
                  className="rounded-xl px-4 py-2.5 text-xs font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all duration-200 cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  💡 Tạo thêm câu mẫu phân cấp
                </motion.button>
              </div>

              {/* Explain More display */}
              {explainMore && (
                <div className="bg-blue-500/[0.02] border border-blue-500/10 rounded-2xl p-4 text-xs space-y-2 mt-2 leading-relaxed select-text font-medium">
                  <h5 className="font-bold text-blue-700 dark:text-blue-300 text-sm">Giải thích chi tiết:</h5>
                  <p className="text-foreground/80 whitespace-pre-wrap leading-relaxed">{explainMore}</p>
                </div>
              )}

              {/* Generate More display */}
              {generateMore && generateMore.length > 0 && (
                <div className="bg-indigo-500/[0.02] border border-indigo-500/10 rounded-2xl p-4 text-xs space-y-3 mt-2 leading-relaxed select-text">
                  <h5 className="font-bold text-indigo-700 dark:text-indigo-300 text-sm">3 Câu mẫu phân cấp nâng cao:</h5>
                  <ol className="list-decimal pl-4 space-y-2">
                    {generateMore.map((s, idx) => (
                      <li key={idx} className="text-foreground/80">
                        <span className="font-bold text-[10px] text-indigo-600 dark:text-indigo-400 mr-2 uppercase">
                          {idx === 0 ? "(Dễ)" : idx === 1 ? "(Trung bình)" : "(Khó)"}
                        </span>
                        {s}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
