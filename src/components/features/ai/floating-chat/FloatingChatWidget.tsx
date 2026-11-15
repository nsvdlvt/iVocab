// src/components/features/ai/floating-chat/FloatingChatWidget.tsx
"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { FloatingChatButton } from "./FloatingChatButton";
import { ChatWindow } from "./ChatWindow";
import { useAiAssistant } from "@/hooks/use-ai-assistant";
import { cn } from "@/lib/utils";

const HIDDEN_CHAT_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/auth",
];

const STUDY_MODE_PATTERNS = [
  "/flashcard",
  "/learn",
  "/dictation",
  "/sentence",
  "/ai-quiz",
  "/review/session/",
];

export function FloatingChatWidget() {
  const pathname = usePathname();
  const assistant = useAiAssistant();

  // Hide on auth pages
  const isAuthPage = HIDDEN_CHAT_ROUTES.some((route) => pathname.startsWith(route));
  if (isAuthPage) {
    return null;
  }

  // Check if current page is in study mode (where bottom nav is hidden)
  const isStudyMode = STUDY_MODE_PATTERNS.some((pattern) => pathname.includes(pattern));

  // Position button safely: on mobile with bottom nav, place at bottom-20 (above bottom nav)
  const buttonPositionClass = isStudyMode
    ? "bottom-6 right-4 md:bottom-6 md:right-6"
    : "bottom-20 right-4 md:bottom-6 md:right-6";

  return (
    <>
      <FloatingChatButton
        isOpen={assistant.isOpen && !assistant.isMinimized}
        unreadCount={assistant.unreadCount}
        onClick={assistant.openChat}
        className={buttonPositionClass}
      />

      <ChatWindow
        isOpen={assistant.isOpen}
        isMinimized={assistant.isMinimized}
        isExpanded={assistant.isExpanded}
        messages={assistant.messages}
        isLoading={assistant.isLoading}
        currentToolStatus={assistant.currentToolStatus}
        onSendMessage={assistant.sendMessage}
        onConfirmAction={assistant.confirmAction}
        onCancelAction={assistant.cancelAction}
        onClearConversation={assistant.clearConversation}
        onMinimize={assistant.minimizeChat}
        onToggleExpand={assistant.toggleExpand}
        onClose={assistant.closeChat}
      />
    </>
  );
}
