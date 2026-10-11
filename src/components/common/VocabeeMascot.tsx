"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export type MascotMood = "welcome" | "encourage" | "celebrate" | "empty" | "focus";

interface VocabeeMascotProps {
  mood?: MascotMood;
  speech?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  speechPosition?: "top" | "right" | "bottom";
  animate?: boolean;
}

const MOOD_DEFAULTS: Record<MascotMood, { title: string; defaultSpeech: string }> = {
  welcome: {
    title: "Vocabee sẵn sàng!",
    defaultSpeech: "Chào mừng bạn! Hãy tiếp tục thói quen học tập hôm nay nhé! 🐝",
  },
  encourage: {
    title: "Cố lên nào!",
    defaultSpeech: "Chỉ cần 5 phút ôn tập mỗi ngày để ghi nhớ từ vựng bền vững!",
  },
  celebrate: {
    title: "Xuất sắc!",
    defaultSpeech: "Tuyệt vời! Bạn vừa tiến thêm một bước lớn trong hành trình mở rộng vốn từ!",
  },
  empty: {
    title: "Tổ ong đang chờ bạn",
    defaultSpeech: "Chưa có dữ liệu ở đây. Hãy bắt đầu thêm những từ vựng đầu tiên nào!",
  },
  focus: {
    title: "Tập trung học",
    defaultSpeech: "Tập trung tuyệt đối vào ngữ cảnh và phát âm nhé!",
  },
};

const SIZE_MAP = {
  sm: { img: 40, width: "w-10 h-10", text: "text-xs" },
  md: { img: 64, width: "w-16 h-16", text: "text-xs sm:text-sm" },
  lg: { img: 96, width: "w-24 h-24", text: "text-sm" },
  xl: { img: 128, width: "w-32 h-32", text: "text-base" },
};

export function VocabeeMascot({
  mood = "encourage",
  speech,
  size = "md",
  className,
  speechPosition = "right",
  animate = true,
}: VocabeeMascotProps) {
  const currentSpeech = speech ?? MOOD_DEFAULTS[mood]?.defaultSpeech;
  const sizeConfig = SIZE_MAP[size];

  const MascotImage = (
    <motion.div
      className={cn("relative shrink-0 select-none", sizeConfig.width)}
      animate={
        animate
          ? {
              y: [0, -4, 0],
              rotate: [0, 1.5, -1.5, 0],
            }
          : undefined
      }
      transition={{
        duration: 3.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <Image
        src="/Vocabee.png"
        alt="Vocabee Mascot"
        width={sizeConfig.img}
        height={sizeConfig.img}
        priority
        className="h-full w-full object-contain drop-shadow-sm"
      />
      {mood === "celebrate" && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-amber-950 shadow-xs">
          <Sparkles className="h-2.5 w-2.5" />
        </span>
      )}
    </motion.div>
  );

  if (!currentSpeech) {
    return <div className={cn("inline-flex items-center", className)}>{MascotImage}</div>;
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-3",
        speechPosition === "top" && "flex-col-reverse items-center gap-2",
        speechPosition === "bottom" && "flex-col items-center gap-2",
        className
      )}
    >
      {MascotImage}

      <div
        className={cn(
          "relative rounded-2xl border border-border/80 bg-card px-3.5 py-2 text-foreground shadow-2xs",
          sizeConfig.text,
          speechPosition === "right" && "rounded-tl-xs",
          speechPosition === "top" && "rounded-br-xs",
          speechPosition === "bottom" && "rounded-tr-xs"
        )}
      >
        <p className="font-medium leading-relaxed">{currentSpeech}</p>
      </div>
    </div>
  );
}
