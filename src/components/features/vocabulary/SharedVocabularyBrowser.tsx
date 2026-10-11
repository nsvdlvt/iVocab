"use client";

import React from "react";
import Link from "next/link";
import {
  BookOpen,
  CalendarDays,
  Volume2,
  Search,
  Globe,
  User,
  BookmarkPlus,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { saveSharedVocabularySet } from "@/actions/vocab-sets/save-shared";
import { BrandLogo } from "@/components/common/BrandLogo";
import { StudyModes } from "./StudyModes";
import { useSpeak } from "@/hooks/use-speak";
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
  const { speakText } = useSpeak();
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
    <div className="space-y-6 pb-10">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 -mx-4 border-b border-border/80 bg-background/90 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => router.push(ROUTES.LANDING)}
            className="flex items-center gap-2.5 rounded-lg px-1.5 py-1 text-left transition-opacity hover:opacity-90 cursor-pointer"
          >
            <BrandLogo
              imageClassName="h-8 w-8 sm:h-9 sm:w-9"
              textClassName="scale-[0.76] origin-left"
            />
          </button>

          <Button
            onClick={onSave}
            className="h-9 gap-1.5 rounded-lg px-4 text-xs sm:text-sm font-semibold shadow-xs"
            disabled={pending}
          >
            <BookmarkPlus className="h-4 w-4" />
            <span>{pending ? "Đang lưu..." : "Lưu vào bộ của tôi"}</span>
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-6">
        {/* Shared Set Header Card */}
        <section className="rounded-xl border border-border/80 bg-card p-6 sm:p-8 shadow-2xs">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3 min-w-0 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="default" className="gap-1">
                  <Globe className="h-3 w-3" />
                  Bộ từ vựng chia sẻ
                </Badge>
                <Badge variant="outline" className="gap-1 tabular-nums">
                  <BookOpen className="h-3 w-3" />
                  {words.length} từ vựng
                </Badge>
                {createdAt && (
                  <Badge variant="secondary" className="gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {new Intl.DateTimeFormat("vi-VN", {
                      dateStyle: "medium",
                    }).format(new Date(createdAt))}
                  </Badge>
                )}
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {title}
              </h1>

              {description && (
                <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {description}
                </p>
              )}
            </div>

            {/* Author Card */}
            <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/30 px-4 py-3 shrink-0 self-start">
              <Avatar className="h-9 w-9 border border-border/80">
                <AvatarImage src={authorAvatarUrl ?? ""} alt={authorName} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Tác giả
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {authorName}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Shared Study Modes */}
        {words.length > 0 && <StudyModes setId={setId} basePath="/share" />}

        {/* Search & Words Section */}
        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Danh sách từ vựng ({filteredWords.length}/{words.length})
            </h2>

            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm từ hoặc nghĩa trong bộ từ..."
                className="h-9 rounded-lg pl-9 pr-8 text-xs sm:text-sm"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Xóa tìm kiếm"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {filteredWords.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/80 bg-card/50 py-14 text-center text-xs text-muted-foreground">
              Không tìm thấy từ vựng phù hợp.
            </div>
          ) : (
            <div className="grid gap-3.5 md:grid-cols-2">
              {filteredWords.map((word, index) => (
                <article
                  key={word.id}
                  className="group flex flex-col justify-between rounded-xl border border-border/80 bg-card p-4 sm:p-5 shadow-2xs transition-all duration-150 hover:border-primary/30 hover:shadow-sm"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[11px] font-semibold text-muted-foreground tabular-nums">
                            #{String(index + 1).padStart(2, "0")}
                          </span>
                          <h3 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
                            {word.word}
                          </h3>
                          {word.part_of_speech && (
                            <Badge variant="secondary" className="text-[11px]">
                              {PART_OF_SPEECH_LABELS[
                                word.part_of_speech.toLowerCase()
                              ] ?? word.part_of_speech}
                            </Badge>
                          )}
                        </div>
                        {word.ipa && (
                          <p className="font-mono text-xs text-muted-foreground">
                            {word.ipa.startsWith("/")
                              ? word.ipa
                              : `/${word.ipa}/`}
                          </p>
                        )}
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() =>
                          speakText(word.word, {
                            audioUrl: word.audio_url ?? undefined,
                          })
                        }
                        aria-label={`Phát âm ${word.word}`}
                        title={`Phát âm ${word.word}`}
                        className="h-8 w-8 shrink-0 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary"
                      >
                        <Volume2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <p className="text-sm font-medium text-foreground">
                      {word.meaning}
                    </p>

                    {word.example && (
                      <div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-1">
                        <p className="text-xs italic leading-relaxed text-foreground/90">
                          &ldquo;{word.example}&rdquo;
                        </p>
                        {word.example_translation && (
                          <p className="text-[11px] leading-relaxed text-muted-foreground">
                            {word.example_translation}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <footer className="mx-auto max-w-6xl pt-4 text-center text-xs text-muted-foreground">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card px-4 py-1.5 shadow-2xs">
          <span>Được chia sẻ qua</span>
          <span className="font-semibold text-foreground">Vocabee</span>
          <span>• Học từ vựng thông minh với AI & SRS</span>
        </div>
      </footer>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md w-[95%] rounded-xl border-border/80 p-6">
          <DialogHeader className="space-y-1.5">
            <DialogTitle className="text-base font-semibold">
              Đăng nhập để lưu bộ từ
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Bạn cần đăng nhập tài khoản Vocabee để sao chép bộ từ vựng này vào thư viện cá nhân và theo dõi tiến độ SRS.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 pt-2 sm:justify-end">
            <Link
              href={ROUTES.REGISTER}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "rounded-lg"
              )}
            >
              Đăng ký
            </Link>
            <Link
              href={ROUTES.LOGIN}
              className={cn(buttonVariants(), "rounded-lg")}
            >
              Đăng nhập
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
