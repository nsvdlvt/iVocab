"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { BookOpen, Clock3, Search, Sparkles, FilterX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BeeMascot } from "@/components/mascot/BeeMascot";
import { staggerContainer, fadeInUp, cardHoverProps } from "@/lib/motion";
import { cn } from "@/lib/utils";

type ReadingCard = {
  slug: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  topic: string;
  level: string;
  estimatedReadingMinutes: number;
  vocabularyCount: number;
  progress?: number | null;
  statusLabel?: string | null;
};

const levelOptions = ["All", "A1-A2", "B1", "B2", "C1", "C2"] as const;
const statusOptions = ["All", "Unread", "Reading", "Read"] as const;

export function ReadingLibraryClient({ articles }: { articles: ReadingCard[] }) {
  const [query, setQuery] = React.useState("");
  const [level, setLevel] = React.useState<(typeof levelOptions)[number]>("All");
  const [status, setStatus] = React.useState<(typeof statusOptions)[number]>("All");

  const filtered = articles.filter((article) => {
    const matchesQuery =
      query.trim().length === 0 ||
      [article.title, article.topic].some((value) =>
        value.toLowerCase().includes(query.toLowerCase())
      );
    const matchesLevel = level === "All" || article.level === level;
    const matchesStatus = status === "All" || article.statusLabel === status;
    return matchesQuery && matchesLevel && matchesStatus;
  });

  const clearFilters = () => {
    setQuery("");
    setLevel("All");
    setStatus("All");
  };

  return (
    <div className="space-y-8">
      {/* Hero Header with Reading Mascot */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-card via-card to-amber-500/5 px-6 py-7 sm:px-8 sm:py-8 shadow-sm"
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-2xl space-y-3 text-center md:text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400">
              <Sparkles className="h-3.5 w-3.5 fill-current" />
              Thư viện Đọc hiểu Song ngữ
            </div>
            <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">
              Bilingual Reading Room
            </h1>
            <p className="max-w-xl text-sm sm:text-base leading-relaxed text-muted-foreground">
              Trau dồi phản xạ ngôn ngữ tự nhiên qua các bài viết chủ đề thực tế, tra cứu từ vựng 1 chạm và kiểm tra độ hiểu sâu với câu hỏi trắc nghiệm.
            </p>
          </div>

          <div className="shrink-0">
            <BeeMascot
              state="reading"
              size="lg"
              showAura
              interactive
              bubble="Mỗi ngày đọc 1 bài để mở rộng 15-20 từ vựng mới cùng Vocabee nhé! 📖"
              bubblePosition="left"
              bubbleClassName="hidden lg:block max-w-xs"
            />
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="mt-6 grid gap-3 pt-6 border-t border-border/60 md:grid-cols-[minmax(0,1fr)_11rem_11rem]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm kiếm bài đọc theo tiêu đề hoặc chủ đề..."
              className="h-11 rounded-xl pl-10 bg-background/80"
            />
          </label>

          <select
            value={level}
            onChange={(event) => setLevel(event.target.value as typeof level)}
            className="h-11 rounded-xl border border-input bg-background/80 px-4 text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-ring"
          >
            {levelOptions.map((option) => (
              <option key={option} value={option}>
                {option === "All" ? "Tất cả trình độ" : `Trình độ ${option}`}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as typeof status)}
            className="h-11 rounded-xl border border-input bg-background/80 px-4 text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-ring"
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option === "All" ? "Tất cả trạng thái" : option}
              </option>
            ))}
          </select>
        </div>
      </motion.section>

      {/* Articles Grid or Empty State */}
      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="rounded-3xl border border-dashed border-border/80 bg-card px-6 py-14 text-center flex flex-col items-center justify-center space-y-4 shadow-2xs"
        >
          <BeeMascot state="thinking" size="md" showAura interactive />
          <div className="space-y-1.5 max-w-md">
            <h3 className="text-lg font-bold text-foreground">
              Không tìm thấy bài đọc phù hợp
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Vocabee chưa tìm thấy bài viết nào khớp với từ khóa hoặc bộ lọc của bạn. Hãy thử tìm từ khóa khác nhé!
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="rounded-full gap-2 text-xs"
          >
            <FilterX className="h-3.5 w-3.5" />
            Xóa bộ lọc
          </Button>
        </motion.div>
      ) : (
        <motion.section
          variants={staggerContainer(0.06, 0.1)}
          initial="hidden"
          animate="visible"
          className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
        >
          {filtered.map((article) => (
            <motion.div
              key={article.slug}
              variants={fadeInUp}
              {...cardHoverProps}
            >
              <Link
                href={`/reading/${article.slug}`}
                className="group flex flex-col h-full overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs transition-colors duration-200 hover:border-primary/50"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700">
                  {article.coverImageUrl ? (
                    <Image
                      src={article.coverImageUrl}
                      alt={article.title}
                      fill
                      sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted/40">
                      <BookOpen className="h-10 w-10 text-muted-foreground/40" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-75 transition-opacity" />

                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                    <Badge className="bg-background/90 text-foreground backdrop-blur-xs font-semibold text-[11px] shadow-xs">
                      {article.topic}
                    </Badge>
                    <span className="text-[11px] font-medium bg-black/50 px-2 py-0.5 rounded-md backdrop-blur-xs">
                      {article.level}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col flex-1 p-5 space-y-3 justify-between">
                  <div className="space-y-1.5">
                    <h3 className="text-base sm:text-lg font-bold tracking-tight text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                      {article.title}
                    </h3>
                    {article.description && (
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {article.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                    <div className="inline-flex items-center gap-1.5">
                      <Clock3 className="h-3.5 w-3.5 text-amber-500" />
                      <span>{article.estimatedReadingMinutes} phút đọc</span>
                    </div>

                    <div className="inline-flex items-center gap-1 font-semibold text-foreground">
                      <span className="text-primary">{article.vocabularyCount}</span> từ vựng
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.section>
      )}
    </div>
  );
}
