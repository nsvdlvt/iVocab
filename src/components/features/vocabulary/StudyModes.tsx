"use client";

import React from "react";
import Link from "next/link";
import {
  Layers,
  BookOpen,
  Headphones,
  PenSquare,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StudyMode {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  iconStyle: string;
  badge?: string;
}

interface StudyModesProps {
  setId: string;
  basePath?: string;
}

export function StudyModes({ setId, basePath = "/vocabulary" }: StudyModesProps) {
  const modes: StudyMode[] = [
    {
      id: "flashcard",
      title: "Flashcard",
      description: "Lật thẻ ghi nhớ nghĩa và phiên âm nhanh.",
      icon: Layers,
      href: `${basePath}/${setId}/flashcard`,
      iconStyle: "bg-primary/10 text-primary border-primary/20",
    },
    {
      id: "learn",
      title: "Learn",
      description: "Luyện tập thích ứng trắc nghiệm và gõ từ.",
      icon: BookOpen,
      href: `${basePath}/${setId}/learn`,
      iconStyle:
        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    },
    {
      id: "dictation",
      title: "Dictation",
      description: "Nghe phát âm chuẩn và chép chính tả.",
      icon: Headphones,
      href: `${basePath}/${setId}/dictation`,
      iconStyle:
        "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
    },
    {
      id: "sentence",
      title: "Sentence Practice",
      description: "Đặt câu ngữ cảnh và chấm điểm AI.",
      icon: PenSquare,
      href: `${basePath}/${setId}/sentence`,
      iconStyle:
        "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      badge: "AI",
    },
  ];

  if (basePath === "/vocabulary") {
    modes.push({
      id: "ai-quiz",
      title: "AI Quiz",
      description: "Bài tập điền từ Cloze Test theo ngữ cảnh.",
      icon: Sparkles,
      href: `${basePath}/${setId}/ai-quiz`,
      iconStyle:
        "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
      badge: "AI",
    });
  }

  return (
    <section className="space-y-3 select-none">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Chế độ luyện tập
        </h2>
      </div>
      <div
        className={cn(
          "grid grid-cols-1 gap-3 sm:grid-cols-2",
          modes.length === 5 ? "lg:grid-cols-5" : "lg:grid-cols-4"
        )}
      >
        {modes.map((mode) => {
          const Icon = mode.icon;
          return (
            <Link
              key={mode.id}
              href={mode.href}
              className="group relative flex flex-col justify-between rounded-xl border border-border/80 bg-card p-4 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
                      mode.iconStyle
                    )}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </div>

                  <div className="flex items-center gap-1.5">
                    {mode.badge && (
                      <Badge
                        variant="secondary"
                        className="h-5 rounded-md px-1.5 text-[10px] font-semibold"
                      >
                        {mode.badge}
                      </Badge>
                    )}
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground/50 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
                    {mode.title}
                  </h3>
                  <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {mode.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
