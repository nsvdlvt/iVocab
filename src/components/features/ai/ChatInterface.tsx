"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { Bot, Loader2, MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const msgCounterRef = useRef(0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    msgCounterRef.current += 1;
    const userMsg: Message = {
      id: `user-msg-${msgCounterRef.current}`,
      role: "user",
      content: trimmed,
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = (await response.json().catch(() => null)) as {
        success?: boolean;
        reply?: string;
        error?: string;
      } | null;

      const replyContent =
        response.ok && data?.success && data.reply
          ? data.reply
          : `⚠️ ${data?.error || "Không thể nhận phản hồi từ Gemini AI. Vui lòng thử lại."}`;

      msgCounterRef.current += 1;
      const aiMsg: Message = {
        id: `ai-msg-${msgCounterRef.current}`,
        role: "assistant",
        content: replyContent,
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      msgCounterRef.current += 1;
      const errorMsg: Message = {
        id: `ai-err-${msgCounterRef.current}`,
        role: "assistant",
        content: "⚠️ Lỗi kết nối tới máy chủ AI. Vui lòng kiểm tra mạng và thử lại.",
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-12rem)] min-h-[480px] max-h-[680px] border border-border bg-card rounded-2xl overflow-hidden shadow-sm">
      {/* Chat header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-muted/20">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2 text-primary">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Trợ lý ảo AI</h3>
            <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              Đang hoạt động — Gemini AI
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isLoading}
            onClick={() => setMessages([])}
            className="text-xs text-muted-foreground hover:text-foreground h-8 px-2.5 gap-1.5 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Xóa hội thoại
          </Button>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-5 bg-muted/5 scrollbar-thin">
        {messages.length === 0 && !isLoading ? (
          /* Empty state */
          <div className="h-full flex flex-col items-center justify-center text-center gap-4 text-muted-foreground py-6">
            <div className="rounded-2xl bg-primary/10 p-4 text-primary">
              <MessageSquare className="h-7 w-7" />
            </div>
            <div className="space-y-1.5 max-w-sm">
              <p className="text-base font-bold text-foreground">Bắt đầu trò chuyện cùng AI Tutor</p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Hỏi về nghĩa từ vựng, cách phát âm, đặt câu ví dụ theo ngữ cảnh hoặc phân biệt các từ đồng nghĩa.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 max-w-md pt-1">
              {[
                "Phân biệt 'affect' và 'effect'",
                "Cho 3 câu ví dụ với từ 'resilient'",
                "Mẹo nhớ từ vựng IELTS lâu quên",
              ].map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleSendMessage(prompt)}
                  className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                role={msg.role}
                content={msg.content}
                timestamp={msg.timestamp}
              />
            ))}
            {isLoading && (
              <div className="flex gap-3 items-start">
                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 ring-1 ring-primary/5">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-2xl px-4 py-2.5 text-sm shadow-sm bg-card border border-border text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  <span>Gemini đang trả lời...</span>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-border bg-card">
        <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
      </div>
    </div>
  );
}
