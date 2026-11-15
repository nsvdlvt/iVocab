// src/components/features/ai/ChatInterface.tsx
"use client";

import React, { useRef, useEffect, useState } from "react";
import {
  Bot,
  Trash2,
  SendHorizontal,
  Loader2,
  MessageSquare,
  Sparkles,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAiAssistant } from "@/hooks/use-ai-assistant";
import { ConfirmationCard } from "./floating-chat/ConfirmationCard";
import { MarkdownContent } from "./floating-chat/MarkdownContent";
import { ToolStatusPill } from "./floating-chat/ToolStatusPill";
import { cn } from "@/lib/utils";

const QUICK_PROMPTS = [
  "Tôi có bao nhiêu từ chưa thuộc?",
  "Hôm nay tôi cần ôn bao nhiêu từ?",
  "Phân tích tiến độ học của tôi",
  "Bộ từ nào có nhiều từ chưa học nhất?",
];

function renderToolEvents(events: Array<{ displayName: string; status?: string }>) {
  const map = new Map<string, { displayName: string; count: number; status: string }>();
  for (const evt of events) {
    const cleanName = evt.displayName.replace(/\s*\(\d+\s*lần\)$/, "");
    const existing = map.get(cleanName);
    if (existing) {
      existing.count += 1;
      if (evt.status === "error") existing.status = "error";
    } else {
      map.set(cleanName, { displayName: cleanName, count: 1, status: evt.status || "completed" });
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

export function ChatInterface() {
  const {
    messages,
    isLoading,
    currentToolStatus,
    sendMessage,
    confirmAction,
    cancelAction,
    clearConversation,
  } = useAiAssistant();

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, currentToolStatus]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    sendMessage(trimmed);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const target = e.target;
    target.style.height = "auto";
    target.style.height = `${Math.min(target.scrollHeight, 140)}px`;
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-12rem)] min-h-[500px] max-h-[720px] border border-border bg-card rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-muted/20">
        <div className="flex items-center gap-3">
          <div className="relative rounded-xl bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20">
            <Bot className="h-5 w-5" />
            <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-amber-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground">Vocabee AI Assistant</h3>
              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                Personal AI Agent
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5 mt-0.5">
              <span
                className={cn(
                  "inline-block h-2 w-2 rounded-full",
                  isLoading ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
                )}
              />
              {isLoading ? "Đang xử lý dữ liệu..." : "Đang hoạt động — Kết nối Supabase Database"}
            </p>
          </div>
        </div>

        {messages.length > 1 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isLoading}
            onClick={clearConversation}
            className="text-xs text-muted-foreground hover:text-destructive h-8 px-2.5 gap-1.5 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Xóa hội thoại
          </Button>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-5 bg-muted/5 scrollbar-thin">
        {messages.length <= 1 && (
          <div className="h-full flex flex-col items-center justify-center text-center gap-4 text-muted-foreground py-6">
            <div className="rounded-2xl bg-amber-500/10 p-4 text-amber-500 ring-1 ring-amber-500/20">
              <MessageSquare className="h-7 w-7" />
            </div>
            <div className="space-y-1.5 max-w-sm">
              <p className="text-base font-bold text-foreground">
                Trợ lý học tập cá nhân Vocabee
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Tra cứu tiến trình học tập, quản lý bộ từ vựng, kiểm tra các từ chưa thuộc hoặc lịch ôn tập hôm nay trực tiếp từ cơ sở dữ liệu.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 max-w-md pt-1">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  disabled={isLoading}
                  className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:border-amber-400/50 hover:bg-amber-500/5 transition-colors cursor-pointer text-left active:scale-95 disabled:opacity-50"
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
              className={cn("flex gap-3 items-start", !isAI && "flex-row-reverse")}
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ring-1",
                  isAI
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20"
                    : "bg-primary text-primary-foreground ring-primary/20"
                )}
              >
                {isAI ? <Bot className="h-4 w-4" /> : "Bạn"}
              </div>

              <div className="space-y-1.5 max-w-[80%]">
                <div
                  className={cn(
                    "rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-xs",
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

                  {msg.confirmation && (
                    <ConfirmationCard
                      confirmation={msg.confirmation}
                      onConfirm={() => confirmAction(msg.confirmation!, msg.id)}
                      onCancel={() => cancelAction(msg.confirmation!, msg.id)}
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
                    "text-[9px] text-muted-foreground block px-1",
                    !isAI && "text-right"
                  )}
                >
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {isLoading && currentToolStatus && (
          <div className="flex items-center gap-2 pl-11 pt-1">
            <ToolStatusPill status={currentToolStatus} />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-border bg-card">
        <form
          onSubmit={handleSubmit}
          className="flex items-end gap-2 rounded-2xl border border-input bg-background/60 p-2 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/20 transition-all shadow-xs"
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            rows={1}
            placeholder={
              isLoading
                ? "AI đang xử lý yêu cầu..."
                : "Hỏi về từ vựng, tiến độ học, hoặc yêu cầu quản lý bộ từ..."
            }
            className="flex-1 max-h-36 min-h-[40px] resize-none bg-transparent px-3 py-2 text-base md:text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden leading-relaxed"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
            className="h-9 w-9 shrink-0 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-900 shadow-sm cursor-pointer disabled:opacity-40 transition-transform active:scale-95"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-slate-900" />
            ) : (
              <SendHorizontal className="h-4 w-4 text-slate-900" />
            )}
          </Button>
        </form>
        <div className="mt-2 flex items-center justify-between px-1 text-[11px] text-muted-foreground">
          <span>Nhấn Enter để gửi, Shift + Enter để xuống dòng</span>
          <span>Dữ liệu được bảo mật theo tài khoản Supabase</span>
        </div>
      </div>
    </div>
  );
}
