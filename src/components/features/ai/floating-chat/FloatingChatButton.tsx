// src/components/features/ai/floating-chat/FloatingChatButton.tsx
"use client";

import React from "react";
import { MessageSquare, Sparkles } from "lucide-react";
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
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className={cn("fixed z-50", className)}
    >
      <button
        type="button"
        onClick={onClick}
        aria-label="Mở Vocabee AI"
        title="Mở Vocabee AI"
        className="group relative flex h-13 w-13 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 ring-1 ring-primary/20 transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-95 focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 dark:focus:ring-offset-background cursor-pointer"
      >
        <div className="relative flex items-center justify-center">
          <MessageSquare className="h-6 w-6 transition-transform duration-200 group-hover:scale-105" />
          <Sparkles className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 text-amber-300" />
        </div>

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

        <span className="pointer-events-none absolute right-15 hidden whitespace-nowrap rounded-lg bg-popover px-3 py-1.5 text-xs font-medium text-popover-foreground shadow-md ring-1 ring-border opacity-0 transition-opacity duration-150 group-hover:opacity-100 md:block">
          Vocabee AI
        </span>
      </button>
    </motion.div>
  );
}
