"use client";

import React from "react";
import { BeeMascot, type MascotState } from "@/components/mascot/BeeMascot";

export type MascotMood = "welcome" | "encourage" | "celebrate" | "empty" | "focus";

interface VocabeeMascotProps {
  mood?: MascotMood;
  speech?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  speechPosition?: "top" | "right" | "bottom";
  animate?: boolean;
}

const MOOD_TO_STATE: Record<MascotMood, MascotState> = {
  welcome: "welcome",
  encourage: "encouraging",
  celebrate: "celebrating",
  empty: "thinking",
  focus: "reading",
};

const MOOD_DEFAULTS: Record<MascotMood, string> = {
  welcome: "Chào mừng bạn! Hãy tiếp tục thói quen học tập hôm nay nhé! 🐝",
  encourage: "Chỉ cần 5 phút ôn tập mỗi ngày để ghi nhớ từ vựng bền vững!",
  celebrate: "Tuyệt vời! Bạn vừa tiến thêm một bước lớn trong hành trình mở rộng vốn từ!",
  empty: "Chưa có dữ liệu ở đây. Hãy bắt đầu thêm những từ vựng đầu tiên nào!",
  focus: "Tập trung tuyệt đối vào ngữ cảnh và phát âm nhé!",
};

export function VocabeeMascot({
  mood = "encourage",
  speech,
  size = "md",
  className,
  speechPosition = "right",
  animate = true,
}: VocabeeMascotProps) {
  const currentSpeech = speech ?? MOOD_DEFAULTS[mood];
  const mascotState = MOOD_TO_STATE[mood] || "welcome";

  return (
    <BeeMascot
      state={mascotState}
      size={size}
      animated={animate}
      bubble={currentSpeech}
      bubblePosition={speechPosition}
      className={className}
      showAura
    />
  );
}
