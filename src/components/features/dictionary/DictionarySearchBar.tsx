"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, X, Loader2, History, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DictionarySuggestion } from "@/types/dictionary";

interface DictionarySearchBarProps {
  value: string;
  onChange: (val: string) => void;
  onSearch: (term: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

const STORAGE_KEY_HISTORY = "ivocab:dictionary:history";
const MAX_HISTORY = 8;

export function DictionarySearchBar({
  value,
  onChange,
  onSearch,
  isLoading = false,
  placeholder = "Tra cứu từ vựng, thành ngữ hoặc cụm động từ (e.g. eloquent, break the ice...)",
  autoFocus = false,
  className,
}: DictionarySearchBarProps) {
  const [suggestions, setSuggestions] = useState<DictionarySuggestion[]>([]);
  const [history, setHistory] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY_HISTORY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.slice(0, MAX_HISTORY);
        }
      }
    } catch {
      // Ignore
    }
    return [];
  });
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const saveToHistory = (term: string) => {
    const clean = term.trim();
    if (!clean) return;
    try {
      const nextHistory = [clean, ...history.filter((h) => h.toLowerCase() !== clean.toLowerCase())].slice(
        0,
        MAX_HISTORY
      );
      setHistory(nextHistory);
      window.localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(nextHistory));
    } catch {
      // Ignore
    }
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      window.localStorage.removeItem(STORAGE_KEY_HISTORY);
    } catch {
      // Ignore
    }
  };

  // Debounced suggestions fetching
  useEffect(() => {
    const trimmed = value.trim();
    if (!trimmed || trimmed.length < 2) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/dictionary/suggest?q=${encodeURIComponent(trimmed)}`, {
        signal: controller.signal,
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.suggestions)) {
            setSuggestions(data.suggestions);
          }
        })
        .catch(() => {
          // Ignore aborted
        });
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const triggerSearch = (term: string) => {
    const clean = term.trim();
    if (!clean) return;
    setIsOpen(false);
    saveToHistory(clean);
    onSearch(clean);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        const selected = suggestions[selectedIndex].word;
        onChange(selected);
        triggerSearch(selected);
      } else {
        triggerSearch(value);
      }
      return;
    }

    if (e.key === "Escape") {
      setIsOpen(false);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIsOpen(true);
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setIsOpen(true);
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
      return;
    }
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          triggerSearch(value);
        }}
        className="relative flex items-center"
      >
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />

        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="h-13 sm:h-14 w-full rounded-2xl sm:rounded-3xl border-2 border-border/80 bg-card pl-12 pr-28 text-base font-medium shadow-sm transition-all focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10"
        />

        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange("");
                inputRef.current?.focus();
              }}
              className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Xóa nội dung"
              aria-label="Xóa nội dung tìm kiếm"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          <Button
            type="submit"
            size="sm"
            disabled={isLoading || !value.trim()}
            className="h-9 sm:h-10 px-4 rounded-xl sm:rounded-2xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs gap-1.5"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <span>Tra từ</span>
            )}
          </Button>
        </div>
      </form>

      {/* Autocomplete & History Dropdown */}
      {isOpen && (suggestions.length > 0 || (history.length > 0 && !value.trim())) && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-2xl border border-border bg-popover text-popover-foreground shadow-xl backdrop-blur-md p-2 divide-y divide-border/40 animate-in fade-in-50 zoom-in-95 duration-150">
          {/* Autocomplete suggestions */}
          {suggestions.length > 0 && value.trim() && (
            <div className="space-y-0.5 pb-1">
              <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-amber-500" />
                <span>Gợi ý từ vựng</span>
              </div>
              {suggestions.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={`${item.word}-${idx}`}
                    type="button"
                    onClick={() => {
                      onChange(item.word);
                      triggerSearch(item.word);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors cursor-pointer",
                      isSelected ? "bg-primary/10 text-primary font-bold" : "hover:bg-muted text-foreground"
                    )}
                  >
                    <span>{item.word}</span>
                    <span className="text-xs text-muted-foreground opacity-60">Nhấn Enter</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Recent Search History (shown when input is empty) */}
          {!value.trim() && history.length > 0 && (
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <History className="h-3 w-3" />
                  <span>Đã tra gần đây</span>
                </div>
                <button
                  type="button"
                  onClick={clearHistory}
                  className="text-[10px] text-muted-foreground hover:text-rose-500 transition-colors"
                >
                  Xóa lịch sử
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 px-2 py-1">
                {history.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => {
                      onChange(term);
                      triggerSearch(term);
                    }}
                    className="rounded-lg border border-border/70 bg-muted/40 px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted hover:border-primary/40 transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
