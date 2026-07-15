"use client";

import React from "react";
import Link from "next/link";
import { Layers, BookOpen, Headphones, PenSquare, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StudyMode {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

interface StudyModesProps {
  setId: string;
  basePath?: string;
}

export function StudyModes({ setId, basePath = "/vocabulary" }: StudyModesProps) {
  const modes: StudyMode[] = [
    { id: "flashcard", title: "Flashcard", description: "Học bằng thẻ ghi nhớ.", icon: Layers, href: `${basePath}/${setId}/flashcard` },
    { id: "learn", title: "Learn", description: "Học theo tiến độ.", icon: BookOpen, href: `${basePath}/${setId}/learn` },
    { id: "dictation", title: "Dictation", description: "Luyện nghe chính tả.", icon: Headphones, href: `${basePath}/${setId}/dictation` },
    { id: "sentence", title: "Sentence Practice", description: "Luyện đặt câu với từ vựng.", icon: PenSquare, href: `${basePath}/${setId}/sentence` },
  ];

  if (basePath === "/vocabulary") {
    modes.push({
      id: "ai-quiz",
      title: "AI Quiz",
      description: "Cloze test premium theo ngữ cảnh.",
      icon: Sparkles,
      href: `${basePath}/${setId}/ai-quiz`,
    });
  }

  return (
    <div className="space-y-4 select-none">
      <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Chế độ học</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isAiQuiz = mode.id === "ai-quiz";
          const CardContent = (
            <div className="flex flex-col justify-between h-full p-4 sm:p-5 relative">
              {isAiQuiz && (
                <div className="absolute top-3 right-3">
                  <Badge variant="secondary" className="bg-amber-500/10 text-[9px] sm:text-[10px] font-bold text-amber-600 dark:text-amber-400 tracking-wide border-none px-1.5 py-0.5 rounded-md select-none shrink-0">
                    Premium
                  </Badge>
                </div>
              )}

              <div className="space-y-3">
                <div
                  className={cn(
                    "p-2 sm:p-2.5 rounded-xl w-fit shrink-0",
                    isAiQuiz
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                  )}
                >
                  <Icon className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-xs sm:text-sm font-extrabold text-foreground tracking-tight">{mode.title}</h3>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate line-clamp-1">{mode.description}</p>
                </div>
              </div>
            </div>
          );

          const cardClass = cn(
            "rounded-xl sm:rounded-2xl border min-h-[110px] sm:min-h-[130px] flex flex-col justify-between transition-all duration-200",
            isAiQuiz
              ? "border-amber-500/20 bg-card shadow-xs hover:shadow-md hover:border-amber-500/30 hover:bg-amber-500/[0.01] cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
              : "border-border/90 bg-card shadow-xs hover:shadow-md hover:border-indigo-500/20 hover:bg-indigo-500/[0.01] cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
          );

          return (
            <Link key={mode.id} href={mode.href} className={cardClass}>
              {CardContent}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
