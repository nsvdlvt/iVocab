"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Sparkles,
  BookOpen,
  Compass,
  Zap,
  Plus,
  X,
  Check,
  RefreshCw,
  Search,
  Rocket,
  Coffee,
  Smile,
  Wand2,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface VocabSetOption {
  id: string;
  title: string;
  description?: string | null;
  color?: string | null;
  wordCount: number;
  words: Array<{ id: string; word: string; meaning: string; pos?: string | null }>;
}

export interface PresetPackOption {
  id: string;
  title: string;
  description: string;
  words: Array<{ word: string; meaning: string; pos: string }>;
}

export interface DueWordOption {
  id: string;
  word: string;
  meaning: string;
  pos?: string | null;
}

interface StoryConfigDeckProps {
  vocabSets: VocabSetOption[];
  dueWords: DueWordOption[];
  presets: PresetPackOption[];
  isLoadingOptions?: boolean;
  onGenerate: (params: {
    words: Array<{ word: string; meaning?: string; pos?: string }>;
    genre: string;
    level: string;
    length: "short" | "medium";
  }) => void;
  isGenerating: boolean;
}

function GenreIcon({ id, className = "h-4 w-4" }: { id: string; className?: string }) {
  switch (id) {
    case "mystery":
      return <Search className={className} strokeWidth={1.85} />;
    case "sci-fi":
      return <Rocket className={className} strokeWidth={1.85} />;
    case "slice-of-life":
      return <Coffee className={className} strokeWidth={1.85} />;
    case "comedy":
      return <Smile className={className} strokeWidth={1.85} />;
    case "fantasy":
      return <Wand2 className={className} strokeWidth={1.85} />;
    case "business":
      return <Briefcase className={className} strokeWidth={1.85} />;
    default:
      return <Compass className={className} strokeWidth={1.85} />;
  }
}

const GENRES = [
  {
    id: "mystery",
    title: "Trinh thám gay cấn",
    subtitle: "Vụ án bí ẩn, đấu trí",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "hover:border-amber-500/50",
  },
  {
    id: "sci-fi",
    title: "Khoa học viễn tưởng",
    subtitle: "Cyberpunk, vũ trụ kì ảo",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
    border: "hover:border-cyan-500/50",
  },
  {
    id: "slice-of-life",
    title: "Đời thường ấm áp",
    subtitle: "Quán cafe, tình bạn, lắng đọng",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "hover:border-emerald-500/50",
  },
  {
    id: "comedy",
    title: "Hài hước trớ trêu",
    subtitle: "Tình huống dở khóc dở cười",
    color: "text-pink-500",
    bg: "bg-pink-500/10",
    border: "hover:border-pink-500/50",
  },
  {
    id: "fantasy",
    title: "Phiêu lưu kỳ ảo",
    subtitle: "Thế giới phép thuật, cổ tích",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    border: "hover:border-purple-500/50",
  },
  {
    id: "business",
    title: "Thương trường gay cấn",
    subtitle: "Khởi nghiệp, đàm phán triệu đô",
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
    border: "hover:border-indigo-500/50",
  },
];

const CEFR_LEVELS = [
  { id: "A2", label: "A2 (Cơ bản)" },
  { id: "B1", label: "B1 (Trung cấp)" },
  { id: "B2", label: "B2 (Nâng cao)" },
  { id: "C1", label: "C1 (Chuyên gia)" },
];

export function StoryConfigDeck({
  vocabSets,
  dueWords,
  presets,
  isLoadingOptions: _isLoadingOptions,
  onGenerate,
  isGenerating,
}: StoryConfigDeckProps) {
  const [selectedWords, setSelectedWords] = useState<
    Array<{ word: string; meaning?: string; pos?: string }>
  >([]);
  const [customWordInput, setCustomWordInput] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("slice-of-life");
  const [selectedLevel, setSelectedLevel] = useState("B2");
  const [storyLength, setStoryLength] = useState<"short" | "medium">("short");

  // Load preset on mount or initial click if empty
  const handleSelectPreset = (preset: PresetPackOption) => {
    setSelectedWords(preset.words);
  };

  const handleSelectDueWords = () => {
    if (dueWords.length === 0) return;
    setSelectedWords(
      dueWords.slice(0, 8).map((w) => ({
        word: w.word,
        meaning: w.meaning,
        pos: w.pos ?? undefined,
      }))
    );
  };

  const handleSelectSet = (setId: string) => {
    const found = vocabSets.find((s) => s.id === setId);
    if (!found || found.words.length === 0) return;
    setSelectedWords(
      found.words.slice(0, 8).map((w) => ({
        word: w.word,
        meaning: w.meaning,
        pos: w.pos ?? undefined,
      }))
    );
  };

  const handleAddCustomWord = () => {
    const trimmed = customWordInput.trim();
    if (!trimmed) return;
    if (selectedWords.some((w) => w.word.toLowerCase() === trimmed.toLowerCase())) {
      setCustomWordInput("");
      return;
    }
    setSelectedWords((prev) => [...prev, { word: trimmed }]);
    setCustomWordInput("");
  };

  const handleRemoveWord = (index: number) => {
    setSelectedWords((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTriggerGenerate = () => {
    if (selectedWords.length < 2) return;
    onGenerate({
      words: selectedWords,
      genre: selectedGenre,
      level: selectedLevel,
      length: storyLength,
    });
  };

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-background to-primary/5 p-6 md:p-8 backdrop-blur-xl">
        <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
              <Image src="/Vocabee.png" alt="Vocabee" width={16} height={16} className="h-4 w-4 object-contain" />
              <span>Vocabee Micro-Storyteller</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
              Dệt truyện ngẫu hồi từ vốn từ của bạn
            </h2>
            <p className="text-sm md:text-base text-muted-foreground max-w-xl">
              Đừng học từ vựng rời rạc. Hãy để AI xâu chuỗi các từ bạn cần nhớ vào một mẩu truyện cuốn hút,
              giúp não bộ ghi nhớ bối cảnh và cảm xúc tự nhiên gấp 5 lần.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectDueWords}
              disabled={dueWords.length === 0}
              className="gap-1.5 border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10"
            >
              <Zap className="h-4 w-4" />
              Lấy từ cần ôn hôm nay ({dueWords.length})
            </Button>
          </div>
        </div>
      </div>

      {/* Main Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Word Selection */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  Từ vựng muốn đưa vào câu chuyện ({selectedWords.length})
                </h3>
                <p className="text-xs text-muted-foreground">
                  Khuyên dùng từ 4 – 8 từ để câu chuyện mạch lạc và sâu sắc nhất.
                </p>
              </div>
              {selectedWords.length > 0 && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => setSelectedWords([])}
                  className="text-xs text-muted-foreground hover:text-destructive"
                >
                  Xóa tất cả
                </Button>
              )}
            </div>

            {/* Quick Word Packs & Source Selection */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground">Bộ từ mẫu có sẵn:</span>
              <div className="flex flex-wrap gap-2">
                {presets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-muted/30 px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" strokeWidth={1.85} />
                    <span>{preset.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* User Vocab Sets Dropdown/Selection if available */}
            {vocabSets.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border/50">
                <span className="text-xs font-medium text-muted-foreground">
                  Hoặc chọn từ Bộ từ của bạn:
                </span>
                <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto pr-1">
                  {vocabSets.map((set) => (
                    <button
                      key={set.id}
                      type="button"
                      onClick={() => handleSelectSet(set.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background px-2.5 py-1 text-xs text-foreground hover:border-primary/60 hover:bg-muted transition-all"
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: set.color || "var(--primary)" }}
                      />
                      <span className="truncate max-w-[140px]">{set.title}</span>
                      <span className="text-[10px] text-muted-foreground">({set.wordCount})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Word Chips */}
            <div className="min-h-[100px] rounded-xl border border-dashed border-border/80 bg-muted/20 p-3 space-y-3">
              {selectedWords.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                  <p className="text-xs">Chưa có từ nào được chọn.</p>
                  <p className="text-[11px] opacity-75 mt-0.5">
                    Hãy bấm chọn bộ từ mẫu ở trên hoặc gõ từ mới vào ô bên dưới.
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedWords.map((item, idx) => (
                    <div
                      key={`${item.word}-${idx}`}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-900 dark:text-amber-200 animate-in fade-in-50 zoom-in-95 duration-150"
                    >
                      <span className="font-semibold">{item.word}</span>
                      {item.meaning && (
                        <span className="text-[10px] opacity-70 border-l border-amber-500/30 pl-1.5">
                          {item.meaning}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveWord(idx)}
                        aria-label={`Xóa từ ${item.word}`}
                        className="ml-1 rounded-full p-0.5 hover:bg-amber-500/20 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" strokeWidth={2} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add custom word input */}
              <div className="flex items-center gap-2 pt-2">
                <Input
                  placeholder="Nhập từ vựng tiếng Anh (VD: resilient, serendipity...)"
                  value={customWordInput}
                  onChange={(e) => setCustomWordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCustomWord();
                    }
                  }}
                  className="h-9 text-xs rounded-xl bg-background"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={handleAddCustomWord}
                  disabled={!customWordInput.trim()}
                  className="h-9 rounded-xl text-xs gap-1 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={2} /> Thêm
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Genre & Mood Configuration */}
        <div className="lg:col-span-5 space-y-6">
          {/* Genre Selection */}
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-sm">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Compass className="h-4 w-4 text-primary" strokeWidth={2} />
              Chọn thể loại & Bối cảnh
            </h3>

            <div className="grid grid-cols-2 gap-2.5">
              {GENRES.map((genre) => {
                const isSelected = selectedGenre === genre.id;
                return (
                  <button
                    key={genre.id}
                    type="button"
                    onClick={() => setSelectedGenre(genre.id)}
                    className={`relative flex flex-col p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/20"
                        : "border-border/70 bg-background/80 hover:border-primary/40 hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`p-1.5 rounded-lg ${genre.bg} ${genre.color}`}>
                        <GenreIcon id={genre.id} className="h-4 w-4" />
                      </div>
                      {isSelected && (
                        <div className="h-4 w-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px]">
                          <Check className="h-2.5 w-2.5 stroke-[2.5]" />
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-bold text-foreground leading-tight">
                      {genre.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                      {genre.subtitle}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Level & Length Options */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/50">
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">Độ khó (CEFR):</span>
                <div className="grid grid-cols-2 gap-1">
                  {CEFR_LEVELS.map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setSelectedLevel(lvl.id)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-medium text-center transition-all ${
                        selectedLevel === lvl.id
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "bg-muted/50 text-foreground hover:bg-muted"
                      }`}
                    >
                      {lvl.id}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">Độ dài truyện:</span>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => setStoryLength("short")}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium text-center transition-all ${
                      storyLength === "short"
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "bg-muted/50 text-foreground hover:bg-muted"
                    }`}
                  >
                    Ngắn (3-4 đ)
                  </button>
                  <button
                    type="button"
                    onClick={() => setStoryLength("medium")}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium text-center transition-all ${
                      storyLength === "medium"
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "bg-muted/50 text-foreground hover:bg-muted"
                    }`}
                  >
                    Vừa (4-5 đ)
                  </button>
                </div>
              </div>
            </div>

            {/* Action CTA */}
            <Button
              type="button"
              onClick={handleTriggerGenerate}
              disabled={selectedWords.length < 2 || isGenerating}
              className="w-full h-12 rounded-xl text-sm font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md hover:shadow-lg transition-all gap-2"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Đang dệt câu chuyện bằng AI...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Dệt câu chuyện với {selectedWords.length} từ
                </>
              )}
            </Button>
            {selectedWords.length < 2 && (
              <p className="text-[11px] text-center text-muted-foreground">
                * Cần chọn ít nhất 2 từ vựng để bắt đầu dệt truyện.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
