// src/components/features/ai/floating-chat/FloatingChatButton.tsx
"use client";

import React from "react";
import { Bot, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface FloatingChatButtonProps {
  onClick: () => void;
  unreadCount?: number;
  isOpen?: boolean;
  className?: string;
}

export function FloatingChatButton({
  onClick,
  unreadCount = 0,
  isOpen = false,
  className,
}: FloatingChatButtonProps) {
  if (isOpen) {
    return null;
  }

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className={cn("fixed z-50", className)}
    >
      <button
        type="button"
        onClick={onClick}
        aria-label="Mở Vocabee AI Assistant"
        className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-900 shadow-lg shadow-amber-500/25 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-amber-500/35 active:scale-95 focus:outline-hidden focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 dark:focus:ring-offset-background cursor-pointer"
      >
        {/* Subtle breathing glow */}
        <span className="absolute -inset-1 rounded-full bg-amber-400/30 blur-xs transition-opacity duration-300 group-hover:opacity-100 animate-pulse" />

        {/* Main Icon */}
        <div className="relative flex items-center justify-center">
          <Bot className="h-7 w-7 text-slate-900 transition-transform duration-300 group-hover:scale-110" />
          <Sparkles className="absolute -top-1 -right-1 h-3.5 w-3.5 text-amber-900" />
        </div>

        {/* Unread badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[11px] font-bold text-destructive-foreground ring-2 ring-background shadow-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Hover pill label on desktop */}
        <span className="pointer-events-none absolute right-16 hidden whitespace-nowrap rounded-lg bg-popover px-3 py-1.5 text-xs font-semibold text-popover-foreground shadow-md ring-1 ring-border opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:right-16 md:block">
          Vocabee AI Assistant
        </span>
      </button>
    </motion.div>
  );
}
