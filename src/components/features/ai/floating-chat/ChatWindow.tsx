// src/components/features/ai/floating-chat/ChatWindow.tsx
"use client";

import React, { useRef, useEffect, useState } from "react";
import {
  Bot,
  Sparkles,
  Minus,
  Maximize2,
  Minimize2,
  X,
  Trash2,
  SendHorizontal,
  Loader2,
  MessageSquare,
  Activity,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChatMessageItem } from "@/hooks/use-ai-assistant";
import { ConfirmationCard } from "./ConfirmationCard";
import { MarkdownContent } from "./MarkdownContent";
import { ToolStatusPill } from "./ToolStatusPill";
import { PendingConfirmation, AgentToolEvent } from "@/lib/ai/agent/types";

interface ChatWindowProps {
  isOpen: boolean;
  isMinimized: boolean;
  isExpanded: boolean;
  messages: ChatMessageItem[];
  isLoading: boolean;
  currentToolStatus: string | null;
  onSendMessage: (text: string) => void;
  onConfirmAction: (conf: PendingConfirmation, messageId: string) => void;
  onCancelAction: (conf: PendingConfirmation, messageId: string) => void;
  onClearConversation: () => void;
  onMinimize: () => void;
  onToggleExpand: () => void;
  onClose: () => void;
  className?: string;
}

const QUICK_PROMPTS = [
  "Tôi có bao nhiêu từ chưa thuộc?",
  "Hôm nay tôi cần ôn bao nhiêu từ?",
  "Phân tích tiến độ học của tôi",
  "Bộ từ nào cần ưu tiên học?",
];

function renderToolEvents(events: AgentToolEvent[]) {
  const map = new Map<string, { displayName: string; count: number; status: string }>();
  for (const evt of events) {
    const cleanName = evt.displayName.replace(/\s*\(\d+\s*lần\)$/, "");
    const existing = map.get(cleanName);
    if (existing) {
      existing.count += 1;
      if (evt.status === "error") existing.status = "error";
    } else {
      map.set(cleanName, { displayName: cleanName, count: 1, status: evt.status });
    }
  }

  return Array.from(map.values()).map((item, idx) => (
    <span
      key={idx}
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium",
        item.status === "error"
          ? "bg-destructive/10 text-destructive"
          : "bg-muted text-muted-foreground"
      )}
    >
      <Activity className="h-3 w-3 text-primary" />
      {item.count > 1 ? `${item.displayName} (${item.count} lần)` : item.displayName}
    </span>
  ));
}

export function ChatWindow({
  isOpen,
  isMinimized,
  isExpanded,
  messages,
  isLoading,
  currentToolStatus,
  onSendMessage,
  onConfirmAction,
  onCancelAction,
  onClearConversation,
  onMinimize,
  onToggleExpand,
  onClose,
  className,
}: ChatWindowProps) {
  const [inputText, setInputText] = useState("");
  const [viewportBottomOffset, setViewportBottomOffset] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Detect mobile viewport
  useEffect(() => {
    if (typeof window === "undefined") return;
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Track iOS Visual Viewport & virtual keyboard offset
  useEffect(() => {
    if (!isOpen || isMinimized) return;
    if (typeof window === "undefined") return;

    const vv = window.visualViewport;
    if (!vv) return;

    const handleViewportChange = () => {
      if (window.innerWidth >= 768) {
        setViewportBottomOffset(0);
        setIsKeyboardVisible(false);
        return;
      }

      const currentHeight = vv.height;
      const currentOffsetTop = vv.offsetTop;
      const layoutHeight = window.innerHeight;

      // Distance from visual viewport bottom to layout viewport bottom
      const bottomCovered = Math.max(0, layoutHeight - (currentOffsetTop + currentHeight));
      const keyboardOpen = bottomCovered > 100;
      setIsKeyboardVisible(keyboardOpen);
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

  // Auto-scroll on new messages or loading changes
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, currentToolStatus, isOpen, isMinimized]);

  // Keep latest messages visible when virtual keyboard opens
  useEffect(() => {
    if (isKeyboardVisible) {
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [isKeyboardVisible]);

  // Focus textarea when window opens (desktop only to prevent sudden keyboard popup on mobile)
  useEffect(() => {
    if (isOpen && !isMinimized) {
      if (typeof window !== "undefined" && window.innerWidth >= 768) {
        const timer = setTimeout(() => {
          textareaRef.current?.focus();
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, isMinimized]);

  if (!isOpen || isMinimized) {
    return null;
  }

  const handleMinimize = () => {
    textareaRef.current?.blur();
    onMinimize();
  };

  const handleClose = () => {
    textareaRef.current?.blur();
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const trimmed = inputText.trim();
    if (!trimmed || isLoading) return;
    onSendMessage(trimmed);
    setInputText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    const target = e.target;
    target.style.height = "auto";
    target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
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
          // Responsive sizing
          // Mobile: fixed near full-screen drawer
          "inset-x-2 md:inset-x-auto md:top-auto md:bottom-6 md:right-6",
          // Desktop sizes
          isExpanded
            ? "md:w-[740px] md:h-[750px] md:max-h-[85vh] md:transition-[width,height] md:duration-300 rounded-3xl"
            : "md:w-[420px] md:h-[620px] md:max-h-[82vh] md:transition-[width,height] md:duration-300 rounded-2xl",
          className
        )}
      >
        {/* ================= Header ================= */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40 backdrop-blur-md select-none">
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20">
              <Bot className="h-5 w-5" />
              <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-amber-500" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-foreground leading-tight">
                  Vocabee AI Assistant
                </h3>
                <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
                  Personal Agent
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5 mt-0.5">
                <span
                  className={cn(
                    "inline-block h-2 w-2 rounded-full",
                    isLoading ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
                  )}
                />
                {isLoading ? "Đang xử lý yêu cầu..." : "Sẵn sàng hỗ trợ học tập"}
              </p>
            </div>
          </div>

          {/* Window control buttons */}
          <div className="flex items-center gap-0.5">
            {messages.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={isLoading}
                onClick={onClearConversation}
                className="h-8 w-8 text-muted-foreground hover:text-destructive cursor-pointer"
                title="Xóa hội thoại"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onToggleExpand}
              className="hidden md:inline-flex h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
              title={isExpanded ? "Thu nhỏ kích thước" : "Mở rộng cửa sổ"}
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleMinimize}
              className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
              title="Thu nhỏ về nút chatbot"
            >
              <Minus className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
              title="Đóng cửa sổ"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* ================= Chat Area ================= */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/5 scrollbar-thin overscroll-contain touch-pan-y">
          {/* Welcome view & Quick questions if conversation is empty */}
          {messages.length <= 1 && (
            <div className="flex flex-col items-center justify-center text-center py-6 px-2 space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 ring-1 ring-amber-500/20">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div className="space-y-1 max-w-xs">
                <h4 className="text-sm font-bold text-foreground">
                  Gợi ý câu hỏi thường dùng
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Bấm vào câu hỏi gợi ý bên dưới hoặc hỏi bất kỳ điều gì về từ vựng và tiến độ học:
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-2 max-w-sm pt-1">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => onSendMessage(prompt)}
                    disabled={isLoading}
                    className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:border-amber-400/50 hover:bg-amber-500/5 transition-all text-left cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages list */}
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
                {/* Avatar */}
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs font-bold ring-1",
                    isAI
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20"
                      : "bg-primary text-primary-foreground ring-primary/20"
                  )}
                >
                  {isAI ? <Bot className="h-4 w-4" /> : "Bạn"}
                </div>

                {/* Message Bubble */}
                <div
                  className={cn(
                    "space-y-1.5 max-w-[85%]",
                    isExpanded && "max-w-[88%]"
                  )}
                >
                  <div
                    className={cn(
                      "rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-xs",
                      isAI
                        ? "bg-card border border-border text-foreground"
                        : "bg-primary text-primary-foreground font-medium"
                    )}
                  >
                    {isAI ? (
                      <MarkdownContent content={msg.content} />
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}

                    {/* Interactive Confirmation Card if action needs confirmation */}
                    {msg.confirmation && (
                      <ConfirmationCard
                        confirmation={msg.confirmation}
                        onConfirm={() => onConfirmAction(msg.confirmation!, msg.id)}
                        onCancel={() => onCancelAction(msg.confirmation!, msg.id)}
                        isLoading={isLoading}
                      />
                    )}
                  </div>

                  {/* Tool events summary badge if executed (deduplicated) */}
                  {isAI && msg.toolEvents && msg.toolEvents.length > 0 && (
                    <div className="flex flex-wrap gap-1 px-1">
                      {renderToolEvents(msg.toolEvents)}
                    </div>
                  )}

                  <span
                    className={cn(
                      "text-[9px] text-muted-foreground/80 block px-1",
                      !isAI && "text-right"
                    )}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Running Tool Status Pill */}
          {isLoading && currentToolStatus && (
            <div className="flex items-center gap-2 pl-9 pt-1">
              <ToolStatusPill status={currentToolStatus} />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ================= Input Area ================= */}
        <div className="border-t border-border bg-card p-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="flex items-end gap-2 rounded-2xl border border-input bg-background/60 p-1.5 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/20 transition-all shadow-xs"
          >
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              rows={1}
              placeholder={
                isLoading
                  ? "AI đang xử lý yêu cầu của bạn..."
                  : "Hỏi về từ vựng, tiến độ hoặc yêu cầu quản lý bộ từ..."
              }
              className="flex-1 max-h-32 min-h-[38px] resize-none bg-transparent px-3 py-2 text-base md:text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden leading-relaxed"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!inputText.trim() || isLoading}
              className="h-8 w-8 shrink-0 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-900 shadow-sm cursor-pointer disabled:opacity-40 transition-transform active:scale-95"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-slate-900" />
              ) : (
                <SendHorizontal className="h-4 w-4 text-slate-900" />
              )}
            </Button>
          </form>
          <div className="mt-1.5 hidden sm:flex items-center justify-between px-1 text-[10px] text-muted-foreground">
            <span>Nhấn Enter để gửi, Shift + Enter để xuống dòng</span>
            <span className="hidden sm:inline">Dữ liệu cá nhân được bảo vệ</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
