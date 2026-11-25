// src/components/features/ai/floating-chat/FloatingChatWidget.tsx
"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { FloatingChatButton } from "./FloatingChatButton";
import { ChatWindow } from "./ChatWindow";
import { useAiChat } from "@/hooks/use-ai-chat";

const HIDDEN_CHAT_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-otp",
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
  const chat = useAiChat();

  const isAuthPage = HIDDEN_CHAT_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  if (isAuthPage) {
    return null;
  }

  const isStudyMode = STUDY_MODE_PATTERNS.some((pattern) =>
    pathname.includes(pattern)
  );

  const buttonPositionClass = isStudyMode
    ? "bottom-6 right-4 md:bottom-6 md:right-6"
    : "bottom-20 right-4 md:bottom-6 md:right-6";

  return (
    <>
      <FloatingChatButton
        isOpen={chat.isOpen && !chat.isMinimized}
        unreadCount={chat.unreadCount}
        onClick={chat.openChat}
        className={buttonPositionClass}
      />

      <ChatWindow
        isOpen={chat.isOpen}
        isMinimized={chat.isMinimized}
        isExpanded={chat.isExpanded}
        messages={chat.messages}
        isStreaming={chat.isStreaming}
        currentStatus={chat.currentStatus}
        isConfirming={chat.isConfirming}
        error={chat.error}
        onSendMessage={chat.sendMessage}
        onConfirmAction={chat.confirmAction}
        onCancelAction={chat.cancelAction}
        onRetry={chat.retryLastMessage}
        onRestoreFailedMessage={chat.restoreLastFailedMessage}
        onStop={chat.stopGenerating}
        onNewChat={chat.newChat}
        onMinimize={chat.minimizeChat}
        onToggleExpand={chat.toggleExpand}
        onClose={chat.closeChat}
      />
    </>
  );
}
