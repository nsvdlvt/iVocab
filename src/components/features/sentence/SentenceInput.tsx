"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Lightbulb, FileText, RefreshCw, Sparkles } from "lucide-react";

interface SentenceInputProps {
  word: string;
  disabled: boolean;
  loading: boolean;
  onSubmit: (sentence: string) => void;
  onHint: () => void;
  onExample: () => void;
  hintDisabled: boolean;
  hintLabel: string;
  exampleDisabled: boolean;
  exampleLabel: string;
}

export function SentenceInput({
  word,
  disabled,
  loading,
  onSubmit,
  onHint,
  onExample,
  hintDisabled,
  hintLabel,
  exampleDisabled,
  exampleLabel,
}: SentenceInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus when word changes or resets
  useEffect(() => {
    if (!disabled && !loading) {
      textareaRef.current?.focus();
    }
  }, [disabled, loading, word]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading && value.trim().length > 0) {
        onSubmit(value.trim());
      }
    }
  };

  const handleClear = () => {
    setValue("");
    textareaRef.current?.focus();
  };

  const isAnotherExample = exampleLabel.toLowerCase().includes("another");

  return (
    <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-md hover:shadow-lg transition-all duration-300 relative overflow-hidden">
      {/* Premium glow line at top */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-indigo-500 to-sky-500 opacity-80" />

      <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
        Write a sentence using this word
      </h3>

      <div className="relative">
        <textarea
          ref={textareaRef}
          disabled={disabled || loading}
          className="w-full min-h-[140px] p-4 text-base bg-muted/30 border border-border/60 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/80 transition-all duration-200 placeholder:text-muted-foreground/60 text-foreground"
          placeholder={`Write a natural English sentence using '${word}'...`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={500}
        />
        {/* Character counter */}
        <div className="absolute bottom-3 right-4 text-xs font-mono text-muted-foreground/80 bg-background/50 px-2 py-0.5 rounded-md backdrop-blur-xs select-none">
          {value.length}/500
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4 select-none">
        {/* Helper chips */}
        <div className="flex flex-wrap gap-2">
          <motion.button
            whileHover={hintDisabled ? {} : { scale: 1.05 }}
            whileTap={hintDisabled ? {} : { scale: 0.95 }}
            type="button"
            onClick={onHint}
            disabled={disabled || loading || hintDisabled}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
              hintDisabled
                ? "bg-muted/50 text-muted-foreground/80 border-border"
                : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20 hover:bg-amber-500/20"
            }`}
          >
            <Lightbulb className="h-3.5 w-3.5" />
            {hintLabel}
          </motion.button>

          <motion.button
            whileHover={exampleDisabled ? {} : { scale: 1.05 }}
            whileTap={exampleDisabled ? {} : { scale: 0.95 }}
            type="button"
            onClick={onExample}
            disabled={disabled || loading || exampleDisabled}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
              exampleDisabled
                ? "bg-muted/50 text-muted-foreground/80 border-border"
                : isAnotherExample
                ? "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20 hover:bg-blue-500/20"
                : "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20 hover:bg-indigo-500/20"
            }`}
          >
            {isAnotherExample ? <RefreshCw className="h-3.5 w-3.5 animate-spin-hover" /> : <FileText className="h-3.5 w-3.5" />}
            {exampleLabel}
          </motion.button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            type="button"
            onClick={handleClear}
            disabled={disabled || loading || value.length === 0}
            className="rounded-xl px-4 py-2 hover:bg-muted/60"
          >
            Clear
          </Button>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              type="button"
              onClick={() => onSubmit(value.trim())}
              disabled={disabled || loading || value.trim().length === 0}
              className="rounded-xl px-5 py-2 font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-500/25 border-none cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="h-4 w-4" />
              {loading ? "Evaluating..." : "Evaluate"}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
