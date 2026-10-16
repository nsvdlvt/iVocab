"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { EASING, mascotInteractions } from "@/lib/motion";

export type MascotState =
  | "welcome"
  | "reading"
  | "celebrating"
  | "encouraging"
  | "thinking"
  | "graduating";

export interface BeeMascotProps {
  state?: MascotState;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | number;
  animated?: boolean;
  interactive?: boolean;
  bubble?: React.ReactNode;
  bubblePosition?: "top" | "right" | "bottom" | "left";
  showAura?: boolean;
  className?: string;
  imageClassName?: string;
  bubbleClassName?: string;
  onClick?: () => void;
}

const STATE_ASSETS: Record<MascotState, { src: string; alt: string }> = {
  welcome: {
    src: "/mascot/bee-welcome.png",
    alt: "Vocabee Bee Mascot - Welcoming",
  },
  reading: {
    src: "/mascot/bee-reading.png",
    alt: "Vocabee Bee Mascot - Reading",
  },
  celebrating: {
    src: "/mascot/bee-celebrating.png",
    alt: "Vocabee Bee Mascot - Celebrating Victory",
  },
  encouraging: {
    src: "/mascot/bee-encouraging.png",
    alt: "Vocabee Bee Mascot - Encouraging",
  },
  thinking: {
    src: "/mascot/bee-thinking.png",
    alt: "Vocabee Bee Mascot - Thinking",
  },
  graduating: {
    src: "/mascot/bee-graduating.png",
    alt: "Vocabee Bee Mascot - Graduation Milestone",
  },
};

const SIZE_PRESETS = {
  xs: { dim: 36, class: "w-9 h-9" },
  sm: { dim: 52, class: "w-13 h-13" },
  md: { dim: 80, class: "w-20 h-20" },
  lg: { dim: 120, class: "w-30 h-30" },
  xl: { dim: 160, class: "w-40 h-40" },
  "2xl": { dim: 220, class: "w-55 h-55" },
};

export function BeeMascot({
  state = "welcome",
  size = "md",
  animated = true,
  interactive = true,
  bubble,
  bubblePosition = "right",
  showAura = false,
  className,
  imageClassName,
  bubbleClassName,
  onClick,
}: BeeMascotProps) {
  const shouldReduceMotion = useReducedMotion();
  const [clicked, setClicked] = useState(false);

  const asset = STATE_ASSETS[state] || STATE_ASSETS.welcome;

  const dimension =
    typeof size === "number"
      ? size
      : SIZE_PRESETS[size]?.dim ?? SIZE_PRESETS.md.dim;

  const sizeClass =
    typeof size === "string" && SIZE_PRESETS[size]
      ? SIZE_PRESETS[size].class
      : "";

  const handleClick = () => {
    if (interactive) {
      setClicked(true);
      setTimeout(() => setClicked(false), 700);
    }
    onClick?.();
  };

  // Floating & breathing motion
  const floatAnimation =
    animated && !shouldReduceMotion
      ? {
          y: state === "celebrating" ? [0, -10, 0] : [0, -6, 0],
          rotate: state === "celebrating" ? [-2, 2, -2] : [-1, 1, -1],
          transition: {
            duration: state === "celebrating" ? 2.4 : 3.6,
            repeat: Infinity,
            repeatType: "reverse" as const,
            ease: "easeInOut" as const,
          },
        }
      : undefined;

  const MascotVisual = (
    <motion.div
      className={cn(
        "relative shrink-0 select-none flex items-center justify-center",
        sizeClass,
        interactive && "cursor-pointer",
        className
      )}
      style={
        typeof size === "number"
          ? { width: dimension, height: dimension }
          : undefined
      }
      animate={
        clicked
          ? {
              y: [0, -16, 2, 0],
              scale: [1, 1.15, 0.95, 1],
              rotate: [0, -8, 8, 0],
              transition: { duration: 0.6, ease: EASING.spring },
            }
          : floatAnimation
      }
      whileHover={interactive && !shouldReduceMotion ? mascotInteractions.hover : undefined}
      whileTap={interactive ? mascotInteractions.tap : undefined}
      onClick={handleClick}
    >
      {/* Soft warm aura background */}
      {showAura && (
        <div
          className="absolute inset-0 -m-3 rounded-full bg-gradient-to-tr from-amber-400/20 via-amber-300/15 to-blue-400/15 blur-xl pointer-events-none dark:from-amber-500/15 dark:to-blue-500/10"
          aria-hidden="true"
        />
      )}

      {/* Mascot Image */}
      <Image
        src={asset.src}
        alt={asset.alt}
        width={dimension * 2}
        height={dimension * 2}
        priority={size === "lg" || size === "xl" || size === "2xl"}
        className={cn(
          "h-full w-full object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.06)] dark:drop-shadow-[0_4px_14px_rgba(0,0,0,0.25)] transition-transform duration-200",
          imageClassName
        )}
      />

      {/* Decorative sparkle when celebrating */}
      {state === "celebrating" && (
        <motion.div
          animate={{ rotate: 360, scale: [0.9, 1.15, 0.9] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-amber-950 shadow-md ring-2 ring-background"
        >
          <Sparkles className="h-3 w-3 fill-amber-950" />
        </motion.div>
      )}
    </motion.div>
  );

  if (!bubble) {
    return MascotVisual;
  }

  // Bubble position orientations
  const isRow = bubblePosition === "left" || bubblePosition === "right";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-3",
        bubblePosition === "left" && "flex-row-reverse",
        bubblePosition === "top" && "flex-col-reverse items-center gap-2",
        bubblePosition === "bottom" && "flex-col items-center gap-2"
      )}
    >
      {MascotVisual}

      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.92, y: isRow ? 0 : 4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: EASING.spring }}
        className={cn(
          "relative rounded-2xl border border-border/80 bg-card/95 backdrop-blur-sm px-4 py-2.5 text-foreground shadow-sm max-w-sm",
          bubblePosition === "right" && "rounded-tl-xs",
          bubblePosition === "left" && "rounded-tr-xs",
          bubblePosition === "top" && "rounded-br-xs",
          bubblePosition === "bottom" && "rounded-tr-xs",
          bubbleClassName
        )}
      >
        {typeof bubble === "string" ? (
          <p className="text-xs sm:text-sm font-medium leading-relaxed text-foreground">
            {bubble}
          </p>
        ) : (
          bubble
        )}
      </motion.div>
    </div>
  );
}
