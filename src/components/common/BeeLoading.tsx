"use client";

import React from "react";
import Image from "next/image";
import { Fredoka } from "next/font/google";
import { motion, useReducedMotion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MascotState } from "@/components/mascot/BeeMascot";

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

export type LoadingContextKey =
  | "workspace"
  | "vocab"
  | "lesson"
  | "reading"
  | "profile"
  | "ai-quiz"
  | "review"
  | "sync"
  | "default";

export interface LoadingContextConfig {
  title: string;
  description: string;
  mascotState: MascotState;
  badgePills: string[];
}

export const LOADING_CONTEXTS: Record<LoadingContextKey, LoadingContextConfig> = {
  workspace: {
    title: "Đang chuẩn bị không gian học tập...",
    description: "Một chút nữa thôi, cùng bắt đầu hành trình học từ vựng nhé!",
    mascotState: "welcome",
    badgePills: ["A", "B", "C"],
  },
  vocab: {
    title: "Đang thu thập từ vựng...",
    description: "Những từ mới sắp sẵn sàng để bạn khám phá.",
    mascotState: "welcome",
    badgePills: ["Vocab", "Words", "Flashcard"],
  },
  lesson: {
    title: "Đang chuẩn bị bài học...",
    description: "Cùng học thêm những điều thú vị nhé!",
    mascotState: "reading",
    badgePills: ["Lesson", "Practice", "Level"],
  },
  reading: {
    title: "Đang mở trang đọc hiểu...",
    description: "Khám phá bài đọc và tích lũy từ vựng mới.",
    mascotState: "reading",
    badgePills: ["Reading", "Context", "Story"],
  },
  profile: {
    title: "Đang đồng bộ tiến trình học...",
    description: "Chuẩn bị tiếp tục từ nơi bạn đã dừng lại.",
    mascotState: "thinking",
    badgePills: ["Progress", "Streak", "XP"],
  },
  "ai-quiz": {
    title: "Đang chuẩn bị thử thách...",
    description: "Một bài quiz thú vị sắp bắt đầu.",
    mascotState: "thinking",
    badgePills: ["AI Quiz", "Challenge", "Score"],
  },
  review: {
    title: "Đang sắp xếp từ vựng ôn tập...",
    description: "Hệ thống ghi nhớ ngắt quãng (SRS) đang tối ưu cho bạn.",
    mascotState: "encouraging",
    badgePills: ["SRS", "Review", "Memory"],
  },
  sync: {
    title: "Đang đồng bộ dữ liệu...",
    description: "Hệ thống đang kết nối và xác thực an toàn.",
    mascotState: "thinking",
    badgePills: ["Sync", "Security", "Auth"],
  },
  default: {
    title: "Đang chuẩn bị không gian học tập...",
    description: "Vui lòng đợi trong giây lát, Vocabee sắp sẵn sàng!",
    mascotState: "welcome",
    badgePills: ["Vocabee", "English", "Learn"],
  },
};

const STATE_IMAGES: Record<MascotState, string> = {
  welcome: "/mascot/bee-welcome.png",
  reading: "/mascot/bee-reading.png",
  celebrating: "/mascot/bee-celebrating.png",
  encouraging: "/mascot/bee-encouraging.png",
  thinking: "/mascot/bee-thinking.png",
  graduating: "/mascot/bee-graduating.png",
};

/**
 * Custom Animated SVG Vector Bee Mascot
 * Accurately represents the Vocabee Bee character:
 * - Sunny honey-yellow round head and body (#f9971d, #ffc533)
 * - Two navy stripes (#030f31)
 * - Signature round navy glasses (#030f31) with lens gleams
 * - Expressive pupils with white specular sparkle highlights
 * - Rosy blushing cheeks (#ff7a8a)
 * - Happy smiling open mouth with pink tongue
 * - Two curved antennae with bobbing ball tips
 * - Dual translucent sky-blue wings with natural flapping animation
 */
export function BeeVectorAnimated({
  size = 110,
  reducedMotion = false,
  className,
}: {
  size?: number;
  reducedMotion?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn("relative flex items-center justify-center select-none", className)}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full overflow-visible drop-shadow-[0_8px_16px_rgba(249,151,29,0.18)] dark:drop-shadow-[0_8px_20px_rgba(0,0,0,0.45)]"
      >
        <defs>
          {/* Honey yellow body gradient */}
          <linearGradient id="vocabee-body-grad" x1="40" y1="35" x2="120" y2="135" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFE066" />
            <stop offset="35%" stopColor="#FFC526" />
            <stop offset="85%" stopColor="#F9971D" />
            <stop offset="100%" stopColor="#EA820B" />
          </linearGradient>

          {/* Wing gradient */}
          <linearGradient id="vocabee-wing-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#EBF6FF" stopOpacity="0.88" />
            <stop offset="100%" stopColor="#BAE2FE" stopOpacity="0.65" />
          </linearGradient>

          {/* Wing vein stroke */}
          <linearGradient id="vocabee-wing-border" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#9FD2FA" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#67B1E8" stopOpacity="0.7" />
          </linearGradient>

          {/* Lens reflection gradient */}
          <linearGradient id="vocabee-lens-shine" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.05" />
          </linearGradient>

          {/* Clip path for abdomen stripes */}
          <clipPath id="vocabee-body-clip">
            <ellipse cx="80" cy="98" rx="36" ry="34" />
          </clipPath>
        </defs>

        {/* --- WINGS LAYER (BEHIND BODY) --- */}
        {/* Left Wing Group */}
        <motion.g
          style={{ originX: "62px", originY: "78px" }}
          animate={
            reducedMotion
              ? undefined
              : {
                  rotate: [-8, 22, -8],
                  scaleY: [0.92, 1.08, 0.92],
                  scaleX: [0.95, 1.05, 0.95],
                }
          }
          transition={{
            duration: 0.22,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {/* Main Left Wing */}
          <ellipse
            cx="32"
            cy="68"
            rx="26"
            ry="17"
            transform="rotate(-28 32 68)"
            fill="url(#vocabee-wing-grad)"
            stroke="url(#vocabee-wing-border)"
            strokeWidth="2"
          />
          {/* Wing Vein Accent */}
          <path
            d="M 50,74 C 36,70 26,67 15,64 M 34,70 C 27,62 25,58 24,56"
            stroke="#81C2F3"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeOpacity="0.75"
          />
          {/* Lower Secondary Left Wing */}
          <ellipse
            cx="38"
            cy="88"
            rx="18"
            ry="11"
            transform="rotate(-15 38 88)"
            fill="url(#vocabee-wing-grad)"
            stroke="url(#vocabee-wing-border)"
            strokeWidth="1.75"
          />
        </motion.g>

        {/* Right Wing Group */}
        <motion.g
          style={{ originX: "98px", originY: "78px" }}
          animate={
            reducedMotion
              ? undefined
              : {
                  rotate: [8, -22, 8],
                  scaleY: [0.92, 1.08, 0.92],
                  scaleX: [0.95, 1.05, 0.95],
                }
          }
          transition={{
            duration: 0.22,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {/* Main Right Wing */}
          <ellipse
            cx="128"
            cy="68"
            rx="26"
            ry="17"
            transform="rotate(28 128 68)"
            fill="url(#vocabee-wing-grad)"
            stroke="url(#vocabee-wing-border)"
            strokeWidth="2"
          />
          {/* Wing Vein Accent */}
          <path
            d="M 110,74 C 124,70 134,67 145,64 M 126,70 C 133,62 135,58 136,56"
            stroke="#81C2F3"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeOpacity="0.75"
          />
          {/* Lower Secondary Right Wing */}
          <ellipse
            cx="122"
            cy="88"
            rx="18"
            ry="11"
            transform="rotate(15 122 88)"
            fill="url(#vocabee-wing-grad)"
            stroke="url(#vocabee-wing-border)"
            strokeWidth="1.75"
          />
        </motion.g>

        {/* --- STINGER & FEET --- */}
        {/* Tail stinger in dark navy */}
        <path d="M 77,130 Q 80,138 80,140 Q 80,138 83,130 Z" fill="#030F31" />

        {/* Little chubby feet */}
        <ellipse cx="66" cy="129" rx="8" ry="6" fill="#F9971D" stroke="#EA820B" strokeWidth="1.5" />
        <ellipse cx="94" cy="129" rx="8" ry="6" fill="#F9971D" stroke="#EA820B" strokeWidth="1.5" />

        {/* --- ABDOMEN & STRIPES --- */}
        <g clipPath="url(#vocabee-body-clip)">
          {/* Abdomen Base */}
          <ellipse cx="80" cy="98" rx="36" ry="34" fill="url(#vocabee-body-grad)" />

          {/* Navy Stripe 1 */}
          <path
            d="M 38,88 Q 80,102 122,88 L 123,99 Q 80,113 37,99 Z"
            fill="#030F31"
          />

          {/* Navy Stripe 2 */}
          <path
            d="M 42,109 Q 80,123 118,109 L 118,120 Q 80,133 42,120 Z"
            fill="#030F31"
          />
        </g>

        {/* Abdomen subtle border outline */}
        <ellipse
          cx="80"
          cy="98"
          rx="36"
          ry="34"
          fill="none"
          stroke="#EA820B"
          strokeWidth="1.5"
          strokeOpacity="0.4"
        />

        {/* --- ANTENNAE ON TOP OF HEAD --- */}
        <motion.g
          animate={
            reducedMotion
              ? undefined
              : {
                  rotate: [-2, 2, -2],
                }
          }
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ originX: "80px", originY: "46px" }}
        >
          {/* Left Antenna */}
          <path
            d="M 72,46 Q 66,32 58,26"
            stroke="#030F31"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="56" cy="24" r="5" fill="#030F31" />
          <circle cx="55" cy="23" r="1.5" fill="#FFFFFF" fillOpacity="0.8" />

          {/* Right Antenna */}
          <path
            d="M 88,46 Q 94,32 102,26"
            stroke="#030F31"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="104" cy="24" r="5" fill="#030F31" />
          <circle cx="103" cy="23" r="1.5" fill="#FFFFFF" fillOpacity="0.8" />
        </motion.g>

        {/* --- HEAD LAYER --- */}
        {/* Round Head */}
        <circle cx="80" cy="58" r="33" fill="url(#vocabee-body-grad)" />

        {/* Little tuft of hair on top of head */}
        <path
          d="M 76,27 Q 80,22 81,21 Q 83,23 84,27 Z"
          fill="#F9971D"
        />

        {/* Top Head Highlight Glow */}
        <ellipse
          cx="69"
          cy="40"
          rx="14"
          ry="7"
          transform="rotate(-20 69 40)"
          fill="#FFFFFF"
          fillOpacity="0.35"
        />

        {/* Cute Rosy Blushing Cheeks */}
        <ellipse cx="50" cy="68" rx="6.5" ry="4.5" fill="#FF7A8A" fillOpacity="0.6" />
        <ellipse cx="110" cy="68" rx="6.5" ry="4.5" fill="#FF7A8A" fillOpacity="0.6" />

        {/* Happy Smiling Open Mouth */}
        <path
          d="M 71,67 Q 80,78 89,67 C 88,71 85,77 80,77 C 75,77 72,71 71,67 Z"
          fill="#4A0F1D"
        />
        {/* Cute Pink Tongue */}
        <path
          d="M 75,72 Q 80,78 85,72 C 84,75 82,77 80,77 C 78,77 76,75 75,72 Z"
          fill="#FF6584"
        />

        {/* --- SIGNATURE ROUND GLASSES --- */}
        {/* Bridge */}
        <path
          d="M 77,57 Q 80,54 83,57"
          stroke="#030F31"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Left Glasses Rim */}
        <circle
          cx="63"
          cy="57"
          r="15"
          fill="#FFFFFF"
          fillOpacity="0.12"
          stroke="#030F31"
          strokeWidth="3.5"
        />
        {/* Left Lens Glare */}
        <path
          d="M 53,50 A 13 13 0 0 1 73,50"
          stroke="url(#vocabee-lens-shine)"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Right Glasses Rim */}
        <circle
          cx="97"
          cy="57"
          r="15"
          fill="#FFFFFF"
          fillOpacity="0.12"
          stroke="#030F31"
          strokeWidth="3.5"
        />
        {/* Right Lens Glare */}
        <path
          d="M 87,50 A 13 13 0 0 1 107,50"
          stroke="url(#vocabee-lens-shine)"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* --- EYES WITH BLINK ANIMATION --- */}
        {/* Left Eye */}
        <motion.g
          style={{ originX: "63px", originY: "57px" }}
          animate={
            reducedMotion
              ? undefined
              : {
                  scaleY: [1, 1, 1, 0.08, 1, 1],
                }
          }
          transition={{
            duration: 4.2,
            repeat: Infinity,
            times: [0, 0.9, 0.94, 0.96, 0.98, 1],
            ease: "easeInOut",
          }}
        >
          {/* Pupil */}
          <circle cx="63" cy="57" r="8.5" fill="#0A1638" />
          <circle cx="63" cy="57" r="7.5" fill="#1C1815" />
          {/* Main sparkle light */}
          <circle cx="60.5" cy="54" r="3.2" fill="#FFFFFF" />
          {/* Secondary sparkle reflection */}
          <circle cx="65.5" cy="60" r="1.5" fill="#FFFFFF" fillOpacity="0.85" />
        </motion.g>

        {/* Right Eye */}
        <motion.g
          style={{ originX: "97px", originY: "57px" }}
          animate={
            reducedMotion
              ? undefined
              : {
                  scaleY: [1, 1, 1, 0.08, 1, 1],
                }
          }
          transition={{
            duration: 4.2,
            repeat: Infinity,
            times: [0, 0.9, 0.94, 0.96, 0.98, 1],
            ease: "easeInOut",
          }}
        >
          {/* Pupil */}
          <circle cx="97" cy="57" r="8.5" fill="#0A1638" />
          <circle cx="97" cy="57" r="7.5" fill="#1C1815" />
          {/* Main sparkle light */}
          <circle cx="94.5" cy="54" r="3.2" fill="#FFFFFF" />
          {/* Secondary sparkle reflection */}
          <circle cx="99.5" cy="60" r="1.5" fill="#FFFFFF" fillOpacity="0.85" />
        </motion.g>

        {/* --- ARMS / PAWS (WELCOMING / CHEERFUL) --- */}
        {/* Left Hand */}
        <ellipse
          cx="48"
          cy="94"
          rx="8"
          ry="6"
          transform="rotate(25 48 94)"
          fill="#F9971D"
          stroke="#030F31"
          strokeWidth="2.5"
        />

        {/* Right Hand */}
        <ellipse
          cx="112"
          cy="94"
          rx="8"
          ry="6"
          transform="rotate(-25 112 94)"
          fill="#F9971D"
          stroke="#030F31"
          strokeWidth="2.5"
        />
      </svg>
    </div>
  );
}

/**
 * Intelligent Progress Bar
 * - Smooth indeterminate sliding gradient pill or determinate percentage
 * - Rounded pill caps
 * - Subtle traveling shimmer gleam
 */
export function BeeProgressBar({
  progress,
  reducedMotion = false,
  className,
}: {
  progress?: number;
  reducedMotion?: boolean;
  className?: string;
}) {
  const isDeterminate = typeof progress === "number" && !isNaN(progress);
  const clampedProgress = isDeterminate ? Math.min(100, Math.max(0, progress)) : 0;

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={isDeterminate ? Math.round(clampedProgress) : undefined}
      className={cn(
        "relative h-2 sm:h-2.5 w-full max-w-[240px] sm:max-w-[280px] overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800/80 p-0.5",
        "border border-amber-500/15 dark:border-amber-400/10 shadow-inner",
        className
      )}
    >
      {isDeterminate ? (
        // Determinate progress bar
        <div
          className="relative h-full rounded-full bg-gradient-to-r from-amber-500 via-[#f9971d] to-yellow-400 transition-[width] duration-300 ease-out overflow-hidden"
          style={{ width: `${clampedProgress}%` }}
        >
          {/* Shimmer light reflection */}
          {!reducedMotion && (
            <motion.div
              aria-hidden="true"
              className="absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-white/50 to-transparent"
              animate={{ x: ["-100%", "300%"] }}
              transition={{
                duration: 1.6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )}
        </div>
      ) : (
        // Indeterminate flowing gradient pill
        <div className="relative h-full w-full overflow-hidden rounded-full">
          {reducedMotion ? (
            <div className="h-full w-full rounded-full bg-gradient-to-r from-amber-500 via-[#f9971d] to-yellow-400 opacity-80" />
          ) : (
            <motion.div
              aria-hidden="true"
              className="absolute inset-y-0 w-2/5 rounded-full bg-gradient-to-r from-amber-500 via-[#f9971d] to-yellow-400 shadow-[0_0_12px_rgba(249,151,29,0.5)]"
              animate={{
                left: ["-40%", "100%"],
                scaleX: [0.7, 1.25, 0.7],
              }}
              transition={{
                duration: 1.7,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1],
              }}
            >
              {/* Internal gleam */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-full" />
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}

export interface BeeLoadingProps {
  /** Visual presentation mode */
  variant?: "fullscreen" | "compact" | "inline";
  /** Context-based predefined text and styling */
  context?: LoadingContextKey;
  /** Explicit title override */
  title?: string;
  /** Explicit description override */
  description?: string;
  /** Determinate progress (0-100). If omitted, displays indeterminate animation */
  progress?: number;
  /** Whether to show the progress bar (default true) */
  showProgress?: boolean;
  /** Mascot rendering style: vector (SVG animation) or image (official PNG asset) */
  mascotType?: "vector" | "image";
  /** State when mascotType="image" */
  mascotState?: MascotState;
  /** Mascot size preset */
  mascotSize?: "sm" | "md" | "lg";
  /** Additional container CSS classes */
  className?: string;
  /** Additional card container CSS classes */
  cardClassName?: string;
}

/**
 * Vocabee Bee Loading 2.0 — Premium Animated Loading Experience
 *
 * Centerpiece loading component featuring:
 * - Animated Vocabee Bee mascot (flight hover, natural wing fluttering, blinking eyes)
 * - Brand-aligned warm glowing aura & golden flight accents
 * - Fredoka + Be Vietnam Pro typography
 * - Context-aware loading messaging
 * - Intelligent indeterminate / determinate progress bar with shimmer
 * - Full prefers-reduced-motion accessibility support
 */
export function BeeLoading({
  variant = "fullscreen",
  context = "workspace",
  title,
  description,
  progress,
  showProgress = true,
  mascotType = "vector",
  mascotState,
  mascotSize = "md",
  className,
  cardClassName,
}: BeeLoadingProps) {
  const shouldReduceMotion = Boolean(useReducedMotion());
  const config = LOADING_CONTEXTS[context] ?? LOADING_CONTEXTS.workspace;

  const resolvedTitle = title ?? config.title;
  const resolvedDescription = description ?? config.description;
  const resolvedMascotState = mascotState ?? config.mascotState;

  // Mascot dimensions based on preset and variant
  const dimension =
    variant === "inline"
      ? 42
      : mascotSize === "sm"
      ? 84
      : mascotSize === "lg"
      ? 144
      : 116;

  // Flight hover animation
  const flightAnimation = shouldReduceMotion
    ? undefined
    : {
        y: [0, -8, 0],
        rotate: [-1.5, 1.5, -1.5],
        transition: {
          duration: 2.8,
          repeat: Infinity,
          ease: "easeInOut" as const,
        },
      };

  // Inline Variant (compact horizontal row)
  if (variant === "inline") {
    return (
      <div
        role="status"
        aria-live="polite"
        className={cn(
          "inline-flex items-center gap-3 rounded-2xl border border-border/70 bg-card/90 px-4 py-2.5 shadow-xs select-none",
          className
        )}
      >
        <div className="relative shrink-0">
          {mascotType === "image" ? (
            <Image
              src={STATE_IMAGES[resolvedMascotState] || "/Vocabee.png"}
              alt="Vocabee Bee"
              width={38}
              height={38}
              className="h-9 w-9 object-contain"
              priority
            />
          ) : (
            <BeeVectorAnimated size={38} reducedMotion={shouldReduceMotion} />
          )}
        </div>
        <div className="flex flex-col text-left">
          <p className="text-xs font-semibold text-foreground leading-tight">
            {resolvedTitle}
          </p>
          {showProgress && (
            <div className="mt-1.5 w-32">
              <BeeProgressBar
                progress={progress}
                reducedMotion={shouldReduceMotion}
                className="h-1.5 max-w-full"
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Card Content (used by both 'fullscreen' and 'compact')
  const CardContent = (
    <div
      className={cn(
        "relative flex flex-col items-center text-center select-none overflow-hidden",
        variant === "fullscreen"
          ? "w-full max-w-sm sm:max-w-md rounded-[32px] border border-border/80 bg-card/95 backdrop-blur-md p-8 sm:p-10 shadow-xl shadow-amber-500/[0.05] dark:shadow-black/40"
          : "w-full max-w-sm sm:max-w-md rounded-3xl border border-border/70 bg-card/90 p-6 sm:p-8 shadow-md shadow-amber-500/[0.03]",
        cardClassName
      )}
    >
      {/* Soft warm ambient aura behind mascot */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-12 inset-x-0 h-48 bg-gradient-to-b from-amber-400/20 via-orange-400/10 to-transparent blur-3xl rounded-full dark:from-amber-500/15 dark:via-orange-500/5"
      />

      {/* Decorative Golden Flight Trail Arc */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute top-6 inset-x-0 w-full h-28 stroke-amber-400/35 dark:stroke-amber-400/25 overflow-visible"
        viewBox="0 0 300 100"
        fill="none"
      >
        <path
          d="M 40,80 Q 90,20 150,55 T 260,35"
          strokeDasharray="4 6"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>

      {/* Floating Sparkles Accents */}
      {!shouldReduceMotion && (
        <>
          <motion.div
            aria-hidden="true"
            animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            className="pointer-events-none absolute top-7 right-8 sm:right-12 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400/20 text-amber-500 dark:text-amber-400"
          >
            <Sparkles className="h-3 w-3" />
          </motion.div>
          <motion.div
            aria-hidden="true"
            animate={{ scale: [1.1, 0.7, 1.1], opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
            className="pointer-events-none absolute top-14 left-7 sm:left-10 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400/15 text-amber-500 dark:text-amber-400"
          >
            <Sparkles className="h-2.5 w-2.5" />
          </motion.div>
        </>
      )}

      {/* Floating Letters / Badges in Bee Flight Wake */}
      {!shouldReduceMotion && config.badgePills && (
        <div aria-hidden="true" className="pointer-events-none absolute top-8 inset-x-0 flex justify-center gap-16">
          {config.badgePills.slice(0, 2).map((pill, idx) => (
            <motion.span
              key={pill}
              animate={{
                y: [0, -12, 0],
                opacity: [0.35, 0.85, 0.35],
              }}
              transition={{
                duration: 3,
                delay: idx * 1.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="text-[10px] font-bold tracking-wider uppercase text-amber-600/70 dark:text-amber-400/60 bg-amber-500/10 dark:bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-500/20 shadow-2xs"
            >
              {pill}
            </motion.span>
          ))}
        </div>
      )}

      {/* Mascot Container with Floating Animation */}
      <motion.div
        animate={flightAnimation}
        className="relative z-10 mb-4 flex items-center justify-center"
      >
        {mascotType === "image" ? (
          <div
            className="relative flex items-center justify-center"
            style={{ width: dimension, height: dimension }}
          >
            <Image
              src={STATE_IMAGES[resolvedMascotState] || "/Vocabee.png"}
              alt="Vocabee Mascot"
              width={dimension * 2}
              height={dimension * 2}
              priority
              className="h-full w-full object-contain filter drop-shadow-[0_8px_16px_rgba(249,151,29,0.2)] dark:drop-shadow-[0_8px_20px_rgba(0,0,0,0.5)]"
            />
          </div>
        ) : (
          <BeeVectorAnimated
            size={dimension}
            reducedMotion={shouldReduceMotion}
          />
        )}
      </motion.div>

      {/* Text Container */}
      <div className="relative z-10 space-y-1.5 max-w-sm px-2">
        <h3
          className={cn(
            "text-lg sm:text-xl font-bold tracking-tight text-[#030f31] dark:text-slate-100",
            fredoka.className
          )}
        >
          {resolvedTitle}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {resolvedDescription}
        </p>
      </div>

      {/* Intelligent Progress Bar */}
      {showProgress && (
        <div className="relative z-10 mt-6 flex flex-col items-center w-full">
          <BeeProgressBar
            progress={progress}
            reducedMotion={shouldReduceMotion}
          />
          {typeof progress === "number" && !isNaN(progress) && (
            <span className="mt-1.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
              {Math.round(progress)}%
            </span>
          )}
        </div>
      )}
    </div>
  );

  // Fullscreen Container
  if (variant === "fullscreen") {
    return (
      <div
        role="status"
        aria-live="polite"
        className={cn(
          "flex min-h-[100dvh] w-full items-center justify-center bg-background px-4 py-8 text-foreground transition-colors duration-200",
          className
        )}
      >
        {CardContent}
      </div>
    );
  }

  // Compact Variant (inside cards or containers)
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("flex w-full items-center justify-center p-2", className)}
    >
      {CardContent}
    </div>
  );
}

export default BeeLoading;
