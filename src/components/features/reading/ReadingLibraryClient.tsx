"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, Clock3, Search, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
      [article.title, article.topic].some((value) => value.toLowerCase().includes(query.toLowerCase()));
    const matchesLevel = level === "All" || article.level === level;
    const matchesStatus = status === "All" || article.statusLabel === status;
    return matchesQuery && matchesLevel && matchesStatus;
  });

  return (
    <div className="space-y-8">
      <section className="space-y-4 rounded-[32px] border border-border/60 bg-card px-6 py-7 shadow-sm">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
            <Sparkles className="h-3.5 w-3.5" />
            Reading Library
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">Reading</h1>
          <p className="max-w-xl text-base leading-7 text-muted-foreground">
            Đọc, hiểu và mở rộng vốn từ qua những bài viết được chọn lọc.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_11rem_11rem]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm bài đọc..."
              className="h-12 rounded-2xl pl-10"
            />
          </label>
          <select value={level} onChange={(event) => setLevel(event.target.value as typeof level)} className="h-12 rounded-2xl border border-input bg-background px-4 text-sm">
            {levelOptions.map((option) => (
              <option key={option} value={option}>{option === "All" ? "Tất cả chủ đề" : option}</option>
            ))}
          </select>
          <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="h-12 rounded-2xl border border-input bg-background px-4 text-sm">
            {statusOptions.map((option) => (
              <option key={option} value={option}>{option === "All" ? "Tất cả" : option}</option>
            ))}
          </select>
        </div>
      </section>

      {filtered.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-border bg-card px-6 py-16 text-center text-muted-foreground">
          Không tìm thấy bài đọc phù hợp.
        </div>
      ) : (
        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((article) => (
            <Link
              key={article.slug}
              href={`/reading/${article.slug}`}
              className="group overflow-hidden rounded-[28px] border border-border/60 bg-card shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-slate-900 via-slate-700 to-slate-500">
                {article.coverImageUrl ? (
                  <Image
                    src={article.coverImageUrl}
                    alt={article.title}
                    fill
                    sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    unoptimized
                  />
                ) : (
                  <div className={cn("flex h-full w-full items-end p-5", "bg-gradient-to-br from-slate-900 via-slate-700 to-slate-500")}>
                    <div className="max-w-[80%] text-left text-white/90">
                      <div className="text-xs font-semibold uppercase tracking-[0.26em] text-white/70">{article.topic}</div>
                      <div className="mt-2 text-2xl font-semibold leading-tight">{article.level}</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge variant="secondary" className="rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em]">
                    {article.topic}
                  </Badge>
                  <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
                    {article.level}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <h2 className="line-clamp-2 min-h-[3.5rem] text-xl font-semibold tracking-tight text-foreground transition-colors group-hover:text-sky-700">
                    {article.title}
                  </h2>
                  <p className="line-clamp-2 min-h-[3rem] text-sm leading-6 text-muted-foreground">
                    {article.description ?? "Bài đọc được chọn lọc cho luyện kỹ năng reading và từ vựng."}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5"><Clock3 className="h-4 w-4" /> {article.estimatedReadingMinutes} phút đọc</span>
                  <span className="inline-flex items-center gap-1.5"><BookOpen className="h-4 w-4" /> {article.vocabularyCount} từ</span>
                </div>

                {article.statusLabel ? (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-foreground">{article.statusLabel}</div>
                    {typeof article.progress === "number" ? (
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-sky-500 transition-all" style={{ width: `${article.progress}%` }} />
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
