// src/components/features/ai/floating-chat/ChatWindow.tsx
"use client";

import React, { useRef, useEffect, useState } from "react";
import {
  AlertCircle,
  Bot,
  Loader2,
  Maximize2,
  MessageSquare,
  Minimize2,
  Minus,
  Pencil,
  RotateCcw,
  SendHorizontal,
  Sparkles,
  Square,
  SquarePen,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ChatMessageItem } from "@/hooks/use-ai-chat";
import type { PendingConfirmation } from "@/lib/ai/agent/types";
import { MarkdownContent } from "./MarkdownContent";
import { ConfirmationCard } from "./ConfirmationCard";
import { AgentResultCards } from "./AgentResultCards";

interface ChatWindowProps {
  isOpen: boolean;
  isMinimized: boolean;
  isExpanded: boolean;
  messages: ChatMessageItem[];
  isStreaming: boolean;
  currentStatus: string | null;
  isConfirming: boolean;
  error: string | null;
  onSendMessage: (text: string) => Promise<boolean> | boolean;
  onConfirmAction: (conf: PendingConfirmation, messageId: string) => void;
  onCancelAction: (conf: PendingConfirmation, messageId: string) => void;
  onRetry: () => void;
  onRestoreFailedMessage: () => string | null;
  onStop: () => void;
  onNewChat: () => void;
  onMinimize: () => void;
  onToggleExpand: () => void;
  onClose: () => void;
  className?: string;
}

const STARTER_PROMPTS = [
  "Phân tích tiến độ học từ vựng của tôi",
  "Hôm nay tôi cần ôn những từ nào?",
  "Tìm các từ tôi hay làm sai nhất",
  "Giải thích cách phân biệt affect và effect",
];

export function ChatWindow({
  isOpen,
  isMinimized,
  isExpanded,
  messages,
  isStreaming,
  currentStatus,
  isConfirming,
  error,
  onSendMessage,
  onConfirmAction,
  onCancelAction,
  onRetry,
  onRestoreFailedMessage,
  onStop,
  onNewChat,
  onMinimize,
  onToggleExpand,
  onClose,
  className,
}: ChatWindowProps) {
  const [inputText, setInputText] = useState("");
  const [viewportBottomOffset, setViewportBottomOffset] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!isOpen || isMinimized || typeof window === "undefined") return;
    const vv = window.visualViewport;
    if (!vv) return;

    const handleViewportChange = () => {
      if (window.innerWidth >= 768) {
        setViewportBottomOffset(0);
        setIsKeyboardVisible(false);
        return;
      }
      const bottomCovered = Math.max(
        0,
        window.innerHeight - (vv.offsetTop + vv.height)
      );
      setIsKeyboardVisible(bottomCovered > 100);
      setViewportBottomOffset(bottomCovered);
    };

    vv.addEventListener("resize", handleViewportChange);
    vv.addEventListener("scroll", handleViewportChange);
    handleViewportChange();

    return () => {
      vv.removeEventListener("resize", handleViewportChange);
      vv.removeEventListener("scroll", handleViewportChange);
      setViewportBottomOffset(0);
      setIsKeyboardVisible(false);
    };
  }, [isOpen, isMinimized]);

  useEffect(() => {
    if (isOpen && !isMinimized && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, isStreaming, currentStatus, error, isOpen, isMinimized]);

  useEffect(() => {
    if (isKeyboardVisible) {
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [isKeyboardVisible]);

  useEffect(() => {
    if (
      isOpen &&
      !isMinimized &&
      typeof window !== "undefined" &&
      window.innerWidth >= 768
    ) {
      const timer = setTimeout(() => textareaRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isMinimized]);

  if (!isOpen || isMinimized) {
    return null;
  }

  const resizeTextarea = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
  };

  const handleSubmit = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || isStreaming) return;
    setInputText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    await onSendMessage(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    resizeTextarea(e.target);
  };

  const handleNewChat = () => {
    onNewChat();
    if (typeof window !== "undefined" && window.innerWidth >= 768) {
      textareaRef.current?.focus();
    }
  };

  const handleEditFailedMessage = () => {
    const restored = onRestoreFailedMessage();
    if (!restored) return;
    setInputText(restored);
    setTimeout(() => {
      resizeTextarea(textareaRef.current);
      textareaRef.current?.focus();
    }, 0);
  };

  const handleMinimize = () => {
    textareaRef.current?.blur();
    onMinimize();
  };

  const handleClose = () => {
    textareaRef.current?.blur();
    setInputText("");
    onClose();
  };

  const lastMessage = messages[messages.length - 1];
  const isWaitingText =
    isStreaming &&
    (!lastMessage ||
      lastMessage.role === "user" ||
      (!lastMessage.content.trim() && (lastMessage.confirmations?.length ?? 0) === 0));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        style={
          isMobile
            ? {
                top: isKeyboardVisible
                  ? "max(8px, env(safe-area-inset-top, 8px))"
                  : "4rem",
                bottom:
                  viewportBottomOffset > 0
                    ? `${viewportBottomOffset + 8}px`
                    : "calc(0.5rem + env(safe-area-inset-bottom, 0px))",
                transition:
                  "bottom 0.25s cubic-bezier(0.16, 1, 0.3, 1), top 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
              }
            : undefined
        }
        className={cn(
          "fixed z-50 flex flex-col overflow-hidden bg-card text-card-foreground shadow-2xl border border-border/80 overscroll-contain",
          "inset-x-2 md:inset-x-auto md:top-auto md:bottom-6 md:right-6",
          isExpanded
            ? "md:w-[740px] md:h-[750px] md:max-h-[86vh] md:transition-[width,height] md:duration-200 rounded-2xl"
            : "md:w-[430px] md:h-[620px] md:max-h-[82vh] md:transition-[width,height] md:duration-200 rounded-2xl",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/95 backdrop-blur-md select-none">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground leading-tight truncate">
                Vocabee AI
              </h3>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <span
                  className={cn(
                    "inline-block h-1.5 w-1.5 rounded-full shrink-0",
                    isStreaming || isConfirming
                      ? "bg-amber-500 animate-pulse"
                      : "bg-emerald-500"
                  )}
                />
                <span className="truncate">
                  {currentStatus ||
                    (isStreaming
                      ? "Đang xử lý..."
                      : "Trợ lý học tập thông minh")}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleNewChat}
              disabled={messages.length === 0 && !isStreaming && !error}
              aria-label="Cuộc trò chuyện mới"
              title="Cuộc trò chuyện mới (New Chat)"
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground gap-1.5 cursor-pointer"
            >
              <SquarePen className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Mới</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onToggleExpand}
              aria-label={isExpanded ? "Thu gọn kích thước" : "Mở rộng cửa sổ"}
              title={isExpanded ? "Thu gọn kích thước" : "Mở rộng cửa sổ"}
              className="hidden md:inline-flex h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {isExpanded ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleMinimize}
              aria-label="Thu nhỏ cửa sổ"
              title="Thu nhỏ"
              className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <Minus className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleClose}
              aria-label="Đóng trò chuyện"
              title="Đóng"
              className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-muted/10 overscroll-contain touch-pan-y"
        >
          {messages.length === 0 && !isStreaming && (
            <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-center px-3 py-6 space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div className="space-y-1 max-w-xs">
                <h4 className="text-sm font-semibold text-foreground">
                  Vocabee AI sẵn sàng hỗ trợ bạn
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Hỏi về tiến độ học, lịch ôn tập SRS, quản lý bộ từ, tạo bài luyện tập hoặc giải thích từ vựng.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 max-w-sm pt-1">
                {STARTER_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void onSendMessage(prompt)}
                    className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground/90 hover:border-primary/40 hover:bg-accent/60 transition-colors text-left cursor-pointer active:scale-[0.99]"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => {
            const isAI = msg.role === "assistant";
            return (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-2.5 items-start",
                  !isAI && "flex-row-reverse"
                )}
              >
                {isAI && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15 mt-0.5">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={cn(
                    "min-w-0",
                    isAI ? "flex-1 max-w-[calc(100%-2.5rem)]" : "max-w-[85%]"
                  )}
                >
                  <div
                    className={cn(
                      "rounded-2xl px-3.5 py-2.5 shadow-xs",
                      isAI
                        ? "bg-card border border-border/80 text-foreground"
                        : "bg-primary text-primary-foreground text-[13px] leading-relaxed"
                    )}
                  >
                    {isAI ? (
                      <>
                        {msg.content && <MarkdownContent content={msg.content} />}
                        {msg.cards && msg.cards.length > 0 && (
                          <AgentResultCards cards={msg.cards} />
                        )}
                        {msg.confirmations &&
                          msg.confirmations.map((conf) => (
                            <ConfirmationCard
                              key={conf.actionId}
                              confirmation={conf}
                              onConfirm={() => onConfirmAction(conf, msg.id)}
                              onCancel={() => onCancelAction(conf, msg.id)}
                              isBusy={isConfirming || isStreaming}
                            />
                          ))}
                      </>
                    ) : (
                      <p className="whitespace-pre-wrap break-words">
                        {msg.content}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {isWaitingText && (
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
                <Bot className="h-4 w-4" />
              </div>
              <div className="inline-flex items-center gap-2 rounded-2xl border border-border/80 bg-card px-3.5 py-2 text-xs text-muted-foreground shadow-xs">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                <span>{currentStatus || "Đang suy nghĩ..."}</span>
              </div>
            </div>
          )}

          {error && !isStreaming && (
            <div
              role="alert"
              className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive space-y-2.5"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p className="leading-relaxed font-medium break-words">{error}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 pl-6">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={onRetry}
                  className="h-7 px-2.5 text-xs gap-1.5 border-destructive/30 bg-background text-foreground hover:bg-accent cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" />
                  Thử lại
                </Button>
                {messages.some((m) => m.role === "user") && !inputText.trim() && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={handleEditFailedMessage}
                    className="h-7 px-2.5 text-xs gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <Pencil className="h-3 w-3" />
                    Đưa lại vào ô nhập
                  </Button>
                )}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-border bg-card p-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSubmit();
            }}
            className="flex items-end gap-2 rounded-2xl border border-input bg-background/70 p-1.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 transition-all"
          >
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder={
                isStreaming
                  ? "Vocabee AI đang trả lời..."
                  : "Hỏi về từ vựng, tiến độ học hoặc yêu cầu tạo bài tập..."
              }
              className="flex-1 max-h-32 min-h-[38px] resize-none bg-transparent px-3 py-2 text-base md:text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden leading-relaxed"
            />
            {isStreaming ? (
              <Button
                type="button"
                size="icon"
                variant="secondary"
                onClick={onStop}
                aria-label="Dừng tạo câu trả lời"
                title="Dừng tạo câu trả lời"
                className="h-8 w-8 shrink-0 rounded-xl cursor-pointer transition-transform active:scale-95"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
              </Button>
            ) : (
              <Button
                type="submit"
                size="icon"
                disabled={!inputText.trim()}
                aria-label="Gửi tin nhắn"
                title="Gửi tin nhắn"
                className="h-8 w-8 shrink-0 rounded-xl cursor-pointer disabled:opacity-40 transition-transform active:scale-95"
              >
                <SendHorizontal className="h-4 w-4" />
              </Button>
            )}
          </form>
          <div className="mt-1.5 hidden sm:flex items-center justify-between px-1 text-[10px] text-muted-foreground">
            <span>Nhấn Enter để gửi, Shift + Enter để xuống dòng</span>
            <span>Không lưu lịch sử hội thoại sau khi tải lại trang</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
