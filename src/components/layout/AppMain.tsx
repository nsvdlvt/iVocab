"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const HIDDEN_NAV_PATTERNS = [
  "/flashcard",
  "/learn",
  "/dictation",
  "/sentence",
  "/ai-quiz",
  "/review/session/",
];

interface AppMainProps {
  children: React.ReactNode;
}

export function AppMain({ children }: AppMainProps) {
  const pathname = usePathname();
  const isStudyMode = HIDDEN_NAV_PATTERNS.some((pattern) => pathname.includes(pattern));

  return (
    <main
      className={cn(
        "flex-1 min-w-0 overflow-y-auto overflow-x-hidden",
        !isStudyMode && "pb-20 md:pb-0"
      )}
    >
      {children}
    </main>
  );
}
