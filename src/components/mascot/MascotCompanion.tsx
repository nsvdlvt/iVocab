"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BeeMascot, type MascotState } from "./BeeMascot";
import { X, Sparkles, MessageCircleHeart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EASING } from "@/lib/motion";

interface MascotCompanionProps {
  tips?: string[];
  initialState?: MascotState;
  storageKey?: string;
  defaultOpen?: boolean;
}

const DEFAULT_TIPS = [
  "Mẹo: Bạn có thể nhấp vào bất kỳ từ in đậm nào để xem phát âm và nghĩa nhanh chóng!",
  "Đọc to thành tiếng (Shadowing) giúp cải thiện cả ngữ điệu và khả năng phát âm của bạn.",
  "Chuyển đổi chế độ song ngữ / tiếng Anh ở thanh công cụ để thử thách phản xạ đọc hiểu.",
  "Hãy đọc lướt qua một lượt trước khi xem chi tiết nghĩa từng câu nhé!",
];

export function MascotCompanion({
  tips = DEFAULT_TIPS,
  initialState = "welcome",
  storageKey = "ivocab_companion_dismissed",
  defaultOpen = true,
}: MascotCompanionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [tipIndex, setTipIndex] = useState(0);
  const [mascotState, setMascotState] = useState<MascotState>(initialState);

  const currentTip = tips[tipIndex % tips.length];

  const handleNextTip = () => {
    setTipIndex((prev) => (prev + 1) % tips.length);
    setMascotState("thinking");
    setTimeout(() => setMascotState("reading"), 600);
  };

  const handleMascotClick = () => {
    if (!isOpen) {
      setIsOpen(true);
      setMascotState("celebrating");
      setTimeout(() => setMascotState("reading"), 1200);
    } else {
      handleNextTip();
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2 pointer-events-auto">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.9 }}
            transition={{ duration: 0.25, ease: EASING.spring }}
            className="relative w-72 sm:w-80 rounded-2xl border border-border/80 bg-card/95 backdrop-blur-md p-3.5 shadow-lg"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/60">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                <Sparkles className="h-3.5 w-3.5 fill-amber-500" />
                <span>Trợ lý Vocabee</span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground p-0.5 rounded-md transition-colors"
                title="Thu nhỏ trợ lý"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Tip text */}
            <p className="text-xs text-foreground/90 leading-relaxed mb-3">
              {currentTip}
            </p>

            {/* Footer action */}
            <div className="flex items-center justify-between text-[11px] pt-1">
              <span className="text-muted-foreground">
                Mẹo {tipIndex + 1}/{tips.length}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNextTip}
                className="h-6 px-2 text-[11px] text-primary hover:text-primary font-medium inline-flex items-center gap-1"
              >
                <span>Mẹo tiếp theo</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mascot bubble trigger */}
      <motion.div
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className="relative"
      >
        <button
          type="button"
          onClick={handleMascotClick}
          className="group relative flex items-center justify-center focus:outline-hidden"
          title={isOpen ? "Xem mẹo tiếp theo" : "Mở trợ lý học tập Vocabee"}
        >
          <BeeMascot
            state={mascotState}
            size="sm"
            showAura
            interactive={false}
            className="filter drop-shadow-md"
          />

          {!isOpen && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs animate-pulse">
              <MessageCircleHeart className="h-2.5 w-2.5" />
            </span>
          )}
        </button>
      </motion.div>
    </div>
  );
}
