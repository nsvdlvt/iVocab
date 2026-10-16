"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { BeeMascot, type MascotState } from "./BeeMascot";
import { MascotCelebration } from "./MascotCelebration";
import { cn } from "@/lib/utils";
import { EASING } from "@/lib/motion";

interface MascotBannerProps {
  state?: MascotState;
  title: string;
  description?: string;
  action?: React.ReactNode;
  badge?: React.ReactNode;
  celebrate?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function MascotBanner({
  state = "welcome",
  title,
  description,
  action,
  badge,
  celebrate = false,
  className,
  size = "md",
}: MascotBannerProps) {
  const shouldReduceMotion = useReducedMotion();

  const mascotSizes = {
    sm: "sm" as const,
    md: "md" as const,
    lg: "lg" as const,
  };

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: EASING.smooth }}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-r from-card via-card to-amber-500/5 p-4 sm:p-5 shadow-xs",
        className
      )}
    >
      {/* Confetti if celebrate is active */}
      <MascotCelebration active={celebrate} />

      {/* Background ambient lighting */}
      <div
        className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-amber-400/10 blur-3xl dark:bg-amber-500/10"
        aria-hidden="true"
      />

      <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-4">
        {/* Mascot */}
        <div className="shrink-0 pt-0.5">
          <BeeMascot
            state={state}
            size={mascotSizes[size]}
            showAura
            interactive
          />
        </div>

        {/* Content */}
        <div className="flex-1 text-center sm:text-left space-y-1.5 min-w-0">
          {badge && <div className="inline-block mb-1">{badge}</div>}
          <h3 className="text-base sm:text-lg font-bold tracking-tight text-foreground leading-snug">
            {title}
          </h3>
          {description && (
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          )}

          {action && <div className="pt-2 flex flex-wrap gap-2 justify-center sm:justify-start">{action}</div>}
        </div>
      </div>
    </motion.div>
  );
}
