"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { Bot, MessageSquare } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export function ChatInterface() {
  // Start with an empty conversation — no fake/seeded messages
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (text: string) => {
    const userMsg: Message = {
      id: `user-msg-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);

    // TODO: Replace with real AI API call (Gemini / OpenAI)
    setTimeout(() => {
      const aiMsg: Message = {
        id: `ai-msg-${Date.now()}`,
        role: "assistant",
        content: `Trợ lý AI chưa được kết nối với API. Câu hỏi của bạn: "${text}"`,
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    }, 800);
  };

  return (
    <div className="flex flex-col h-[550px] border border-border bg-card rounded-2xl overflow-hidden shadow-sm">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-muted/20">
        <div className="rounded-xl bg-primary/10 p-2 text-primary">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">Trợ lý ảo AI</h3>
          <p className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
            Đang phát triển — Sẽ kết nối API sớm
          </p>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-muted/5 scrollbar-thin">
        {messages.length === 0 ? (
          /* Empty state */
          <div className="h-full flex flex-col items-center justify-center text-center gap-3 text-muted-foreground">
            <div className="rounded-full bg-muted/60 p-4">
              <MessageSquare className="h-8 w-8 opacity-50" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Cuộc trò chuyện mới</p>
              <p className="text-xs mt-1 max-w-[220px] leading-relaxed">
                Hỏi tôi về nghĩa từ vựng, cách phát âm, đặt câu ví dụ hoặc phân biệt từ đồng nghĩa.
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              role={msg.role}
              content={msg.content}
              timestamp={msg.timestamp}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-border bg-card">
        <ChatInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
}
