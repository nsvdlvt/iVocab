"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { Bot } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg-1",
      role: "assistant",
      content: "Xin chào! Tôi là Trợ lý AI học từ vựng IVocab. Bạn cần tôi hỗ trợ giải thích ý nghĩa từ vựng, đặt câu ví dụ học thuật hay phân biệt các từ đồng nghĩa không?",
      timestamp: "10:30 AM",
    },
    {
      id: "msg-2",
      role: "user",
      content: "Phân biệt giúp tôi 'Consistent' và 'Persistent' nhé.",
      timestamp: "10:31 AM",
    },
    {
      id: "msg-3",
      role: "assistant",
      content: `Dưới đây là cách phân biệt đơn giản:

1. **Consistent** (Nhất quán, kiên định): Chỉ hành động không thay đổi, nhất quán với tiêu chuẩn hoặc với quá khứ.
   * *Ví dụ:* His work is consistent. (Công việc của anh ấy luôn ổn định, chất lượng không thay đổi).

2. **Persistent** (Bền bỉ, dai dẳng): Chỉ sự kiên trì làm gì đó bất chấp khó khăn, cản trở, hoặc chỉ một hiện tượng kéo dài (thường mang nét tiêu cực như bệnh tật dai dẳng).
   * *Ví dụ:* She was persistent in her search for the truth. (Cô ấy bền bỉ tìm kiếm sự thật).`,
      timestamp: "10:32 AM",
    },
  ]);

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

    setTimeout(() => {
      const aiResponseText = `Cảm ơn câu hỏi của bạn! Đây là câu trả lời mô phỏng cho yêu cầu: "${text}". 

Trợ lý AI sẽ được kết nối với API (Gemini/OpenAI) để sinh nội dung thực tế ở các phiên bản phát triển tiếp theo.`;

      const aiMsg: Message = {
        id: `ai-msg-${Date.now()}`,
        role: "assistant",
        content: aiResponseText,
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
          <p className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
            Trực tuyến (Minh họa giao diện)
          </p>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-muted/5 scrollbar-thin">
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            role={msg.role}
            content={msg.content}
            timestamp={msg.timestamp}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Inputs area */}
      <div className="p-4 border-t border-border bg-card">
        <ChatInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
}
