"use client";

import React, { useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatInputProps {
  onSendMessage: (text: string) => void;
}

export function ChatInput({ onSendMessage }: ChatInputProps) {
  const [inputText, setInputText] = useState("");

  const quickPrompts = [
    "Giải thích từ 'Consistent'",
    "Đoạn văn ví dụ cho 'Implement'",
    "Phân biệt 'Affect' và 'Effect'",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText("");
  };

  return (
    <div className="space-y-3">
      {/* Quick suggestions */}
      <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSendMessage(prompt)}
            className="flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-full border border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground hover:border-border/80 cursor-pointer transition-all shadow-sm active:scale-95 shrink-0"
          >
            <Sparkles className="h-3 w-3 text-primary animate-pulse" />
            {prompt}
          </button>
        ))}
      </div>

      {/* Message input form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Hỏi trợ lý ảo về ngữ pháp, phát âm hoặc cách dùng từ..."
          className="flex-1 rounded-xl bg-card border-border h-11 text-sm shadow-sm focus-visible:ring-1"
        />
        <Button type="submit" size="icon" className="h-11 w-11 rounded-xl cursor-pointer shadow-sm shrink-0">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
