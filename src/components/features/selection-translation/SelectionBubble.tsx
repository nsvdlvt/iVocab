"use client";

import React from "react";
import { motion } from "framer-motion";
import { Languages, BookOpen } from "lucide-react";

export interface SelectionBubbleProps {
  position: { top: number; left: number };
  isSingleWord: boolean;
  isFlippedBelow?: boolean;
  onTriggerLookup: () => void;
  disabled?: boolean;
}

export function SelectionBubble({
  position,
  isSingleWord,
  isFlippedBelow = false,
  onTriggerLookup,
  disabled = false,
}: SelectionBubbleProps) {
  return (
    <motion.div
      data-smart-selection-ui="true"
      initial={{ opacity: 0, scale: 0.85, y: isFlippedBelow ? -4 : 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, y: isFlippedBelow ? -4 : 4 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      style={{
        top: position.top,
        left: position.left,
      }}
      className={`fixed z-[999] -translate-x-1/2 pointer-events-auto ${
        isFlippedBelow ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <button
        type="button"
        disabled={disabled}
        onMouseDown={(e) => {
          // Prevent clearing the active text selection when clicking the bubble
          e.preventDefault();
          e.stopPropagation();
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!disabled) {
            onTriggerLookup();
          }
        }}
        aria-label={isSingleWord ? "Tra từ điển nhanh" : "Dịch toàn bộ đoạn văn"}
        title={isSingleWord ? "Bấm để tra từ điển" : "Bấm để dịch sang tiếng Việt"}
        className="group inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-lg shadow-primary/30 dark:shadow-black/60 border border-primary-foreground/30 dark:border-white/30 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background transition-all duration-150 cursor-pointer select-none disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed"
      >
        {isSingleWord ? (
          <>
            <BookOpen className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:rotate-6 text-primary-foreground" />
            <span className="font-bold tracking-wide">Tra từ</span>
          </>
        ) : (
          <>
            <Languages className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-110 text-primary-foreground" />
            <span className="font-bold tracking-wide">Dịch nhanh</span>
          </>
        )}
      </button>
    </motion.div>
  );
}
