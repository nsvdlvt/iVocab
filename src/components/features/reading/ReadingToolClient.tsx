"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, EyeOff, Highlighter, Languages, Loader2, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type HighlightColor = "yellow" | "green" | "blue" | "pink" | "purple";

type TextHighlight = {
  id: string;
  userId: string;
  documentId: string;
  paragraphId: string;
  startOffset: number;
  endOffset: number;
  color: HighlightColor;
  createdAt: string;
};

type Paragraph = {
  id: string;
  en: string;
  vi?: string | null;
};

type Article = {
  id: string;
  badge: string;
  title: string;
  description: string;
  meta: Array<{ label: string; value: string }>;
  paragraphs: Paragraph[];
  words: Array<{ word: string; meaning: string }>;
};

type TranslationState = Record<string, { text: string | null; status: "idle" | "loading" | "ready" | "error" }>;

type PopoverState =
  {
    highlightId: string;
    x: number;
    y: number;
  };

const HIGHLIGHT_COLORS: Array<{ value: HighlightColor; label: string; className: string }> = [
  { value: "yellow", label: "Vàng", className: "bg-yellow-200" },
  { value: "green", label: "Xanh lá", className: "bg-emerald-200" },
  { value: "blue", label: "Xanh dương", className: "bg-sky-200" },
  { value: "pink", label: "Hồng", className: "bg-pink-200" },
  { value: "purple", label: "Tím", className: "bg-violet-200" },
];

const highlightClass: Record<HighlightColor, string> = {
  yellow: "bg-yellow-200/90 decoration-yellow-500",
  green: "bg-emerald-200/90 decoration-emerald-500",
  blue: "bg-sky-200/90 decoration-sky-500",
  pink: "bg-pink-200/90 decoration-pink-500",
  purple: "bg-violet-200/90 decoration-violet-500",
};

function getNodeOffset(container: HTMLElement, node: Node, nodeOffset: number) {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let offset = 0;
  let current = walker.nextNode();

  while (current) {
    if (current === node) return offset + nodeOffset;
    offset += current.textContent?.length ?? 0;
    current = walker.nextNode();
  }

  return null;
}

function getStorageKey(kind: "highlights" | "translations", userId: string, documentId: string) {
  return `ivocab:reading:${kind}:${userId}:${documentId}`;
}

function createId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

function isWordCharacter(character: string) {
  return /[\p{L}\p{N}'-]/u.test(character);
}

function normalizeHighlightRange(text: string, rawStartOffset: number, rawEndOffset: number) {
  let startOffset = Math.max(0, Math.min(rawStartOffset, rawEndOffset));
  let endOffset = Math.min(text.length, Math.max(rawStartOffset, rawEndOffset));

  while (startOffset < endOffset && !isWordCharacter(text[startOffset])) startOffset += 1;
  while (endOffset > startOffset && !isWordCharacter(text[endOffset - 1])) endOffset -= 1;

  if (startOffset >= endOffset) return null;

  while (startOffset > 0 && isWordCharacter(text[startOffset - 1])) startOffset -= 1;
  while (endOffset < text.length && isWordCharacter(text[endOffset])) endOffset += 1;

  return startOffset < endOffset ? { startOffset, endOffset } : null;
}

export function ReadingToolClient({ article, userId }: { article: Article; userId: string }) {
  const highlightsKey = getStorageKey("highlights", userId, article.id);
  const translationsKey = getStorageKey("translations", userId, article.id);
  const [highlightModeEnabled, setHighlightModeEnabled] = useState(false);
  const [selectedHighlightColor, setSelectedHighlightColor] = useState<HighlightColor>("yellow");
  const [translationVisible, setTranslationVisible] = useState(false);
  const [highlights, setHighlights] = useState<TextHighlight[]>(() => {
    if (typeof window === "undefined") return [];

    try {
      return JSON.parse(window.localStorage.getItem(highlightsKey) ?? "[]") as TextHighlight[];
    } catch {
      return [];
    }
  });
  const [translations, setTranslations] = useState<TranslationState>(() =>
    {
      const initial = Object.fromEntries(
        article.paragraphs.map((paragraph) => [
          paragraph.id,
          { text: paragraph.vi ?? null, status: paragraph.vi ? "ready" : "idle" },
        ])
      ) as TranslationState;

      if (typeof window === "undefined") return initial;

      try {
        const cached = JSON.parse(window.localStorage.getItem(translationsKey) ?? "{}") as Record<string, string>;
        for (const [paragraphId, text] of Object.entries(cached)) {
          initial[paragraphId] = { text, status: "ready" };
        }
      } catch {
        return initial;
      }

      return initial;
    }
  );
  const [popover, setPopover] = useState<PopoverState | null>(null);
  const paragraphRefs = useRef<Record<string, HTMLParagraphElement | null>>({});

  const shouldShowTranslation = translationVisible;

  useEffect(() => {
    window.localStorage.setItem(highlightsKey, JSON.stringify(highlights));
  }, [highlights, highlightsKey]);

  useEffect(() => {
    const readyTranslations = Object.fromEntries(
      Object.entries(translations)
        .filter(([, value]) => value.status === "ready" && value.text)
        .map(([paragraphId, value]) => [paragraphId, value.text])
    );
    window.localStorage.setItem(translationsKey, JSON.stringify(readyTranslations));
  }, [translations, translationsKey]);

  useEffect(() => {
    if (!translationVisible) return;

    article.paragraphs.forEach((paragraph) => {
      const current = translations[paragraph.id];
      if (current?.status === "ready" || current?.status === "loading") return;

      setTranslations((state) => ({
        ...state,
        [paragraph.id]: { text: state[paragraph.id]?.text ?? null, status: "loading" },
      }));

      fetch("/api/reading/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: paragraph.en }),
      })
        .then(async (response) => {
          if (!response.ok) throw new Error("Translate failed");
          return response.json() as Promise<{ translation: string }>;
        })
        .then((data) => {
          setTranslations((state) => ({
            ...state,
            [paragraph.id]: { text: data.translation, status: "ready" },
          }));
        })
        .catch(() => {
          setTranslations((state) => ({
            ...state,
            [paragraph.id]: { text: state[paragraph.id]?.text ?? null, status: "error" },
          }));
        });
    });
  }, [article.paragraphs, translationVisible, translations]);

  const highlightsByParagraph = useMemo(() => {
    return highlights.reduce<Record<string, TextHighlight[]>>((acc, highlight) => {
      acc[highlight.paragraphId] ??= [];
      acc[highlight.paragraphId].push(highlight);
      return acc;
    }, {});
  }, [highlights]);

  const handleSelection = (paragraphId: string) => {
    if (!highlightModeEnabled) return;

    const selection = window.getSelection();
    const paragraphNode = paragraphRefs.current[paragraphId];
    if (!selection || !paragraphNode || selection.isCollapsed || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (!paragraphNode.contains(range.commonAncestorContainer)) return;

    const startOffset = getNodeOffset(paragraphNode, range.startContainer, range.startOffset);
    const endOffset = getNodeOffset(paragraphNode, range.endContainer, range.endOffset);
    if (startOffset === null || endOffset === null || startOffset === endOffset) return;

    const paragraph = article.paragraphs.find((item) => item.id === paragraphId);
    const normalizedRange = paragraph ? normalizeHighlightRange(paragraph.en, startOffset, endOffset) : null;
    if (!normalizedRange) return;

    const nextHighlight: TextHighlight = {
      id: createId(),
      userId,
      documentId: article.id,
      paragraphId,
      startOffset: normalizedRange.startOffset,
      endOffset: normalizedRange.endOffset,
      color: selectedHighlightColor,
      createdAt: new Date().toISOString(),
    };

    setHighlights((current) => [
      ...current.filter(
        (item) =>
          item.paragraphId !== nextHighlight.paragraphId ||
          item.endOffset <= nextHighlight.startOffset ||
          item.startOffset >= nextHighlight.endOffset
      ),
      nextHighlight,
    ]);
    window.getSelection()?.removeAllRanges();
    setPopover(null);
  };

  const updateHighlightColor = (color: HighlightColor) => {
    if (!popover) return;
    setHighlights((current) => current.map((item) => (item.id === popover.highlightId ? { ...item, color } : item)));
    setPopover(null);
  };

  const deleteHighlight = () => {
    if (!popover) return;
    setHighlights((current) => current.filter((item) => item.id !== popover.highlightId));
    setPopover(null);
  };

  const renderText = (paragraph: Paragraph) => {
    const paragraphHighlights = [...(highlightsByParagraph[paragraph.id] ?? [])].sort((a, b) => a.startOffset - b.startOffset);
    const parts = [];
    let cursor = 0;

    paragraphHighlights.forEach((highlight) => {
      if (highlight.startOffset > cursor) {
        parts.push(paragraph.en.slice(cursor, highlight.startOffset));
      }

      parts.push(
        <mark
          key={highlight.id}
          className={cn("cursor-pointer rounded-sm px-0.5 underline decoration-2 underline-offset-2", highlightClass[highlight.color])}
          onClick={(event) => {
            if (!highlightModeEnabled) return;
            event.stopPropagation();
            const rect = event.currentTarget.getBoundingClientRect();
            setPopover({ highlightId: highlight.id, x: rect.left + rect.width / 2, y: rect.top });
          }}
        >
          {paragraph.en.slice(highlight.startOffset, highlight.endOffset)}
        </mark>
      );
      cursor = highlight.endOffset;
    });

    if (cursor < paragraph.en.length) {
      parts.push(paragraph.en.slice(cursor));
    }

    return parts.map((part, index) => (typeof part === "string" ? <span key={index}>{part}</span> : part));
  };

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-slate-950">
      <div className={cn("mx-auto w-full px-4 py-5 md:px-6 md:py-7", shouldShowTranslation ? "max-w-[1320px]" : "max-w-[940px]")}>
        <header className="mb-5 border-b border-slate-200 pb-4">
          <Link href="/dashboard" className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-950">
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Link>

          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">{article.title}</h1>
                <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                  Bản nháp
                </span>
              </div>
              <p className="mt-2 text-sm font-medium text-slate-500">
                Technology · B1-B2 · 6 phút đọc · 24 từ
              </p>
            </div>

            <button type="button" aria-label="Đánh dấu yêu thích" className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition-colors hover:text-amber-500">
              <Star className="h-4 w-4" />
            </button>
          </div>
        </header>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="sticky top-0 z-30 flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:px-5">
            <Button
              type="button"
              variant={highlightModeEnabled ? "default" : "outline"}
              size="sm"
              className="rounded-full"
              onClick={() => {
                setHighlightModeEnabled((value) => !value);
                setPopover(null);
              }}
            >
              <Highlighter className="h-4 w-4" />
              Highlight {highlightModeEnabled ? "✓" : ""}
            </Button>

            {highlightModeEnabled ? (
              <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1.5">
                {HIGHLIGHT_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    aria-label={color.label}
                    aria-pressed={selectedHighlightColor === color.value}
                    className={cn(
                      "relative h-7 w-7 rounded-full border transition-all",
                      color.className,
                      selectedHighlightColor === color.value
                        ? "border-slate-950 ring-2 ring-slate-950/15"
                        : "border-slate-300 hover:scale-105"
                    )}
                    onClick={() => setSelectedHighlightColor(color.value)}
                  >
                    {selectedHighlightColor === color.value ? (
                      <span className="absolute inset-0 flex items-center justify-center text-[13px] font-black text-slate-950">
                        ✓
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            ) : null}

            <Button
              type="button"
              variant={translationVisible ? "default" : "outline"}
              size="sm"
              className="rounded-full"
              onClick={() => setTranslationVisible((value) => !value)}
            >
              {translationVisible ? <EyeOff className="h-4 w-4" /> : <Languages className="h-4 w-4" />}
              {translationVisible ? "Ẩn nghĩa" : "Hiện nghĩa"}
            </Button>
          </div>

          <div className="block md:hidden">
            <div className="px-5 py-5">
              <div className="space-y-4">
                {article.paragraphs.map((paragraph, index) => (
                  <MobileParagraph
                    key={paragraph.id}
                    number={index + 1}
                    paragraph={paragraph}
                    translation={translations[paragraph.id]}
                    showTranslation={shouldShowTranslation}
                    renderText={renderText}
                    onSelection={handleSelection}
                    setRef={(node) => {
                      paragraphRefs.current[paragraph.id] = node;
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div
            className={cn(
              "relative hidden gap-x-10 gap-y-7 px-5 py-6 md:grid md:px-7 md:py-8",
              shouldShowTranslation ? "md:grid-cols-2" : "md:grid-cols-1"
            )}
            style={{ gridTemplateRows: shouldShowTranslation ? `auto repeat(${article.paragraphs.length}, auto)` : undefined }}
          >
            {shouldShowTranslation ? (
              <div className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-px -translate-x-1/2 bg-slate-200 md:block" />
            ) : null}
            <ColumnHeader title="English" />
            {shouldShowTranslation ? (
              <ColumnHeader title="Tiếng Việt" />
            ) : null}

            {article.paragraphs.map((paragraph, index) => (
              <ArticleBlock
                key={`en-${paragraph.id}`}
                number={index + 1}
                className={shouldShowTranslation ? "md:[grid-column:1]" : ""}
                style={shouldShowTranslation ? { gridRow: index + 2 } : undefined}
              >
                <p
                  ref={(node) => {
                    paragraphRefs.current[paragraph.id] = node;
                  }}
                  data-paragraph-id={paragraph.id}
                  className="text-[15px] leading-8 text-slate-700"
                  onMouseUp={() => handleSelection(paragraph.id)}
                  onKeyUp={() => handleSelection(paragraph.id)}
                >
                  {renderText(paragraph)}
                </p>
              </ArticleBlock>
            ))}

            {shouldShowTranslation
              ? article.paragraphs.map((paragraph, index) => (
                  <ArticleBlock
                    key={`vi-${paragraph.id}`}
                    number={index + 1}
                    className="md:[grid-column:2]"
                    style={{ gridRow: index + 2 }}
                  >
                    <TranslationText state={translations[paragraph.id]} />
                  </ArticleBlock>
                ))
              : null}
          </div>

          <footer className="border-t border-slate-200 bg-slate-50/70 px-5 py-4 md:px-7">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700">Từ vựng trong bài</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {article.words.map((item) => (
                  <span key={item.word} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                    <strong className="font-semibold text-slate-950">{item.word}</strong>
                    <span className="text-slate-500">{item.meaning}</span>
                  </span>
                ))}
              </div>
            </div>
          </footer>
        </section>
      </div>

      {popover ? (
        <HighlightPopover
          popover={popover}
          onPick={updateHighlightColor}
          onDelete={deleteHighlight}
        />
      ) : null}
    </main>
  );
}

function ColumnHeader({ title }: { title: string }) {
  return (
    <div className="border-b border-slate-200 pb-3">
      <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">{title}</h2>
    </div>
  );
}

function ArticleBlock({
  number,
  className,
  style,
  children,
}: {
  number: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <article className={cn("h-full min-w-0 border-b border-slate-200/70 pb-7", className)} style={style}>
      <span className="sr-only">Paragraph {number}</span>
      {children}
    </article>
  );
}

function MobileParagraph({
  number,
  paragraph,
  translation,
  showTranslation,
  renderText,
  onSelection,
  setRef,
}: {
  number: number;
  paragraph: Paragraph;
  translation?: TranslationState[string];
  showTranslation: boolean;
  renderText: (paragraph: Paragraph) => React.ReactNode;
  onSelection: (paragraphId: string) => void;
  setRef: (node: HTMLParagraphElement | null) => void;
}) {
  return (
    <article className="border-b border-slate-200/70 pb-5">
      <span className="sr-only">Paragraph {number}</span>
      <div className="space-y-4">
        <div>
          <p ref={setRef} className="text-[15px] leading-7 text-slate-700" onMouseUp={() => onSelection(paragraph.id)} onKeyUp={() => onSelection(paragraph.id)}>
            {renderText(paragraph)}
          </p>
        </div>
        {showTranslation ? (
          <div className="border-l-2 border-emerald-200 pl-4">
            <TranslationText state={translation} />
          </div>
        ) : null}
      </div>
    </article>
  );
}

function TranslationText({ state }: { state?: TranslationState[string] }) {
  if (!state || state.status === "idle" || state.status === "loading") {
    return (
      <p className="inline-flex items-center gap-2 text-[15px] leading-8 text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Đang dịch đoạn này...
      </p>
    );
  }

  if (state.status === "error") {
    return <p className="text-[15px] leading-8 text-rose-600">Không dịch được đoạn này. Hãy tắt/bật dịch để thử lại.</p>;
  }

  return <p className="text-[15px] leading-8 text-slate-700">{state.text}</p>;
}

function HighlightPopover({
  popover,
  onPick,
  onDelete,
}: {
  popover: PopoverState;
  onPick: (color: HighlightColor) => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="fixed z-50 flex -translate-x-1/2 -translate-y-full items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl"
      style={{ left: popover.x, top: popover.y - 10 }}
    >
      {HIGHLIGHT_COLORS.map((color) => (
        <button
          key={color.value}
          type="button"
          aria-label={color.label}
          className={cn("h-7 w-7 rounded-full border border-slate-300", color.className)}
          onClick={() => onPick(color.value)}
        />
      ))}
      <button type="button" aria-label="Xóa highlight" className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 text-slate-600 hover:bg-slate-100" onClick={onDelete}>
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
