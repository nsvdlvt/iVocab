"use client";

import React from "react";
import Link from "next/link";
import { BookOpen, CalendarDays, Headphones, Search, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { saveSharedVocabularySet } from "@/actions/vocab-sets/save-shared";
import { BrandLogo } from "@/components/common/BrandLogo";
import { Database } from "@/types/database";

type VocabularyRow = Database["public"]["Tables"]["vocabularies"]["Row"];

interface SharedVocabularyBrowserProps {
  setId: string;
  isAuthenticated: boolean;
  words: VocabularyRow[];
  title: string;
  description?: string | null;
  authorName: string;
  authorAvatarUrl?: string | null;
  createdAt?: string | null;
}

const PART_OF_SPEECH_LABELS: Record<string, string> = {
  noun: "Danh từ",
  verb: "Động từ",
  adjective: "Tính từ",
  adverb: "Trạng từ",
  preposition: "Giới từ",
  conjunction: "Liên từ",
  pronoun: "Đại từ",
  interjection: "Thán từ",
};

export function SharedVocabularyBrowser({
  setId,
  isAuthenticated,
  words,
  title,
  description,
  authorName,
  authorAvatarUrl,
  createdAt,
}: SharedVocabularyBrowserProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  const filteredWords = React.useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return words;
    return words.filter((word) => {
      const haystack = [
        word.word,
        word.ipa,
        word.part_of_speech,
        word.meaning,
        word.example,
        word.example_translation,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(search);
    });
  }, [query, words]);

  const onSave = () => {
    if (!isAuthenticated) {
      setOpen(true);
      return;
    }

    startTransition(async () => {
      await saveSharedVocabularySet(setId);
    });
  };

  return (
    <div className="space-y-8 pb-10">
      <header className="sticky top-0 z-30 -mx-4 border-b border-border/70 bg-background/90 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => router.push(ROUTES.LANDING)}
            className="group flex items-center gap-3 rounded-2xl px-2 py-1 text-left transition-transform duration-200 hover:-translate-y-0.5"
          >
            <BrandLogo imageClassName="h-10 w-10 sm:h-11 sm:w-11" textClassName="scale-[0.78] origin-left" />
          </button>

          <Button onClick={onSave} className="rounded-full px-5 shadow-sm transition-transform duration-200 hover:-translate-y-0.5" disabled={pending}>
            {pending ? "Đang lưu..." : "Lưu vào bộ của tôi"}
          </Button>
        </div>
      </header>

      <section className="relative overflow-hidden rounded-[2rem] border border-border bg-card px-6 py-10 shadow-sm sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(249,151,29,0.12),transparent_30%)]" />
        <div className="relative mx-auto flex max-w-4xl flex-col items-center text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300">
            <Sparkles className="h-4 w-4" />
            Bộ từ vựng chia sẻ
          </div>

          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {title}
          </h1>

          {description && (
            <p className="mt-5 max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg">
              {description}
            </p>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-3 rounded-full border border-border bg-background/70 px-4 py-2 shadow-sm backdrop-blur">
              <Avatar className="h-9 w-9">
                <AvatarImage src={authorAvatarUrl ?? ""} alt={authorName} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {authorName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Tác giả</p>
                <p className="font-semibold text-foreground">{authorName}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-border bg-background/70 px-4 py-2 shadow-sm backdrop-blur">
              <BookOpen className="h-4 w-4 text-blue-600" />
              <span>{words.length} từ</span>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-border bg-background/70 px-4 py-2 shadow-sm backdrop-blur">
              <CalendarDays className="h-4 w-4 text-orange-500" />
              <span>
                {createdAt ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(new Date(createdAt)) : "Không rõ ngày tạo"}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="sticky top-[5.5rem] z-20 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="mx-auto max-w-6xl rounded-2xl border border-border bg-background/90 px-4 py-3 shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm trong bộ từ vựng..."
              className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl">
        {filteredWords.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card py-16 text-center text-sm text-muted-foreground shadow-sm">
            Không tìm thấy từ phù hợp.
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {filteredWords.map((word, index) => (
              <article
                key={word.id}
                className="group rounded-[1.75rem] border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-semibold tracking-tight text-foreground">{word.word}</h2>
                      {word.part_of_speech && (
                        <Badge variant="outline" className="rounded-full border-blue-500/20 bg-blue-500/10 text-[11px] font-semibold text-blue-700 dark:text-blue-300">
                          {PART_OF_SPEECH_LABELS[word.part_of_speech] ?? word.part_of_speech}
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      {word.ipa && <span className="font-mono text-base text-foreground/80">/{word.ipa}/</span>}
                      <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide">
                        #{String(index + 1).padStart(2, "0")}
                      </span>
                    </div>
                  </div>

                  {word.audio_url && (
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500/30 hover:bg-blue-500/5"
                      aria-label={`Phát âm ${word.word}`}
                    >
                      <Headphones className="h-3.5 w-3.5 text-orange-500" />
                      Audio
                    </button>
                  )}
                </div>

                <div className="mt-5 space-y-4">
                  <p className="text-lg font-semibold text-foreground">{word.meaning}</p>

                  {word.example && (
                    <div className="rounded-2xl bg-muted/40 p-4">
                      <p className="text-sm leading-7 text-foreground/90">&ldquo;{word.example}&rdquo;</p>
                      {word.example_translation && (
                        <p className="mt-2 text-xs leading-6 text-muted-foreground">{word.example_translation}</p>
                      )}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="mx-auto max-w-6xl pb-2 pt-4 text-center text-sm text-muted-foreground">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 shadow-sm">
          <span>Powered by</span>
          <span className="font-semibold text-foreground">🐝 Vocabee</span>
          <span>• Learn smarter with AI</span>
        </div>
      </footer>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>🔒 Bạn cần đăng nhập</DialogTitle>
            <DialogDescription>
              Bạn cần đăng nhập để lưu bộ từ này vào thư viện của mình.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 sm:justify-end">
            <Link
              href={ROUTES.LOGIN}
              className={cn(buttonVariants({ className: "rounded-xl" }))}
            >
              Đăng nhập
            </Link>
            <Link
              href={ROUTES.REGISTER}
              className={cn(buttonVariants({ variant: "outline", className: "rounded-xl" }))}
            >
              Đăng ký
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
