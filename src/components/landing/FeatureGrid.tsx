"use client";

import React, { useState } from "react";
import { Check, Sparkles, Volume2, ArrowRight, FileCheck2 } from "lucide-react";
import { FeatureCard } from "./FeatureCard";
import { landingFeatureCards } from "./landing-data";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function SrsSchedulePreview() {
  const [selectedInterval, setSelectedInterval] = useState<number>(2);
  const intervals = [
    { label: "Quên", time: "10 phút", stability: "38%", tone: "text-destructive border-destructive/30 bg-destructive/10" },
    { label: "Khó", time: "1 ngày", stability: "64%", tone: "text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10" },
    { label: "Tốt", time: "4 ngày", stability: "92%", tone: "text-primary border-primary/30 bg-primary/10" },
    { label: "Dễ", time: "12 ngày", stability: "98%", tone: "text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
  ];

  return (
    <div className="rounded-2xl border border-border/80 bg-muted/30 p-4 space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-foreground">Từ đang ôn: <strong className="text-primary">ubiquitous</strong></span>
        <span className="font-mono text-[11px] text-muted-foreground">
          Độ nhớ: <strong className="text-emerald-600 dark:text-emerald-400">{intervals[selectedInterval].stability}</strong>
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {intervals.map((item, idx) => {
          const active = selectedInterval === idx;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => setSelectedInterval(idx)}
              className={cn(
                "flex flex-col items-center rounded-xl border p-2 text-center transition-all cursor-pointer",
                active
                  ? item.tone + " ring-2 ring-primary/20 font-bold"
                  : "border-border/80 bg-card text-muted-foreground hover:bg-muted/60"
              )}
            >
              <span className="text-xs font-bold">{item.label}</span>
              <span className="mt-0.5 text-[10px] opacity-85">{item.time}</span>
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card px-3 py-2 text-[11px] text-muted-foreground">
        <span>Lần nhắc tiếp theo: <strong className="text-foreground">{intervals[selectedInterval].time} tới</strong></span>
        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Đã tối ưu lịch</span>
      </div>
    </div>
  );
}

function AiClozePreview() {
  const [chosen, setChosen] = useState<string>("peculiar");
  const options = [
    { word: "peculiar", correct: true, note: "Chính xác! 'Peculiar charm' = nét cuốn hút riêng biệt." },
    { word: "fragile", correct: false, note: "Chưa đúng. 'Fragile' nghĩa là mỏng manh, dễ vỡ." },
    { word: "mundane", correct: false, note: "Chưa đúng. 'Mundane' nghĩa là bình thường, tẻ nhạt." },
  ];
  const current = options.find((o) => o.word === chosen) ?? options[0];

  return (
    <div className="rounded-2xl border border-border/80 bg-muted/30 p-4 space-y-3">
      <div className="text-xs leading-relaxed text-foreground bg-card rounded-xl border border-border/70 p-3">
        &ldquo;The old town retains a{" "}
        <span className="inline-flex items-center rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 font-bold text-primary">
          {chosen}
        </span>{" "}
        charm that attracts artists from around the world.&rdquo;
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.word}
            type="button"
            onClick={() => setChosen(opt.word)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
              chosen === opt.word
                ? opt.correct
                  ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                  : "border-destructive/40 bg-destructive/15 text-destructive"
                : "border-border/80 bg-card text-foreground hover:bg-muted"
            )}
          >
            {opt.word}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" />
        <span>{current.note}</span>
      </div>
    </div>
  );
}

function BilingualReadingPreview() {
  const [selectedWord, setSelectedWord] = useState<"resilient" | "paradigm">("resilient");
  const dict = {
    resilient: {
      ipa: "/rɪˈzɪliənt/",
      pos: "adj",
      meaning: "kiên cường, có khả năng phục hồi nhanh",
    },
    paradigm: {
      ipa: "/ˈpærədaɪm/",
      pos: "noun",
      meaning: "mô hình, hệ tư tưởng chuẩn mực",
    },
  };

  return (
    <div className="rounded-2xl border border-border/80 bg-muted/30 p-4 space-y-3">
      <div className="rounded-xl border border-border/70 bg-card p-3 space-y-1.5">
        <div className="flex items-center justify-between">
          <Badge variant="info" className="text-[10px]">CEFR C1 • Khoa học</Badge>
          <span className="text-[10px] text-muted-foreground">Chạm từ để tra nhanh</span>
        </div>
        <p className="text-xs leading-relaxed text-foreground">
          Modern ecosystems must remain{" "}
          <button
            type="button"
            onClick={() => setSelectedWord("resilient")}
            className={cn(
              "rounded px-1 font-bold underline decoration-dotted underline-offset-4 cursor-pointer transition-colors",
              selectedWord === "resilient" ? "bg-primary/15 text-primary" : "text-foreground hover:bg-muted"
            )}
          >
            resilient
          </button>{" "}
          amid shifting climate{" "}
          <button
            type="button"
            onClick={() => setSelectedWord("paradigm")}
            className={cn(
              "rounded px-1 font-bold underline decoration-dotted underline-offset-4 cursor-pointer transition-colors",
              selectedWord === "paradigm" ? "bg-primary/15 text-primary" : "text-foreground hover:bg-muted"
            )}
          >
            paradigms
          </button>
          .
        </p>
      </div>
      <div className="flex items-center justify-between rounded-xl border border-primary/25 bg-card px-3 py-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-foreground">{selectedWord}</span>
            <span className="font-mono text-[11px] text-muted-foreground">{dict[selectedWord].ipa}</span>
            <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">{dict[selectedWord].pos}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{dict[selectedWord].meaning}</p>
        </div>
        <Volume2 className="h-4 w-4 text-primary shrink-0" />
      </div>
    </div>
  );
}

function SmartImportPreview() {
  const rows = [
    { word: "ephemeral", ipa: "/ɪˈfemərəl/", pos: "adj", meaning: "ngắn ngủi, chóng tàn" },
    { word: "meticulous", ipa: "/məˈtɪkjələs/", pos: "adj", meaning: "tỉ mỉ, kỹ lưỡng" },
  ];

  return (
    <div className="rounded-2xl border border-border/80 bg-muted/30 p-4 space-y-2.5">
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
          <FileCheck2 className="h-3.5 w-3.5 text-emerald-500" />
          Nhập từ CSV / Văn bản thô
        </span>
        <span className="inline-flex items-center gap-1 text-primary font-semibold">
          Tự động điền IPA & Nghĩa <ArrowRight className="h-3 w-3" />
        </span>
      </div>
      <div className="space-y-2">
        {rows.map((item) => (
          <div
            key={item.word}
            className="flex items-center justify-between rounded-xl border border-border/70 bg-card px-3 py-2 text-xs"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <Check className="h-3 w-3" />
              </span>
              <span className="font-bold text-foreground">{item.word}</span>
              <span className="font-mono text-[11px] text-muted-foreground">{item.ipa}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px]">{item.pos}</Badge>
              <span className="font-medium text-muted-foreground">{item.meaning}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FeatureGrid() {
  const renderPreview = (id: string) => {
    switch (id) {
      case "srs":
        return <SrsSchedulePreview />;
      case "ai-cloze":
        return <AiClozePreview />;
      case "reading":
        return <BilingualReadingPreview />;
      case "smart-import":
      default:
        return <SmartImportPreview />;
    }
  };

  return (
    <section id="features" className="bg-background border-b border-border/60">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 lg:px-8 lg:py-20">
        <div className="max-w-3xl space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-primary">
            Hệ sinh thái học từ toàn diện
          </p>
          <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            Mọi công cụ bạn cần để biến từ mới thành phản xạ tự nhiên
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Từ lúc nhập từ vựng đến khi thực hành chuyên sâu và ôn tập định kỳ, mỗi tính năng đều được thiết kế để rút ngắn thời gian học và tối đa hóa khả năng ghi nhớ.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {landingFeatureCards.map((item) => (
            <FeatureCard
              key={item.id}
              icon={item.icon}
              badge={item.badge}
              title={item.title}
              description={item.description}
            >
              {renderPreview(item.id)}
            </FeatureCard>
          ))}
        </div>
      </div>
    </section>
  );
}
