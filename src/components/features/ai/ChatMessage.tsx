"use client";

import React from "react";
import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { mockUserProfile } from "@/mock/user";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

export function ChatMessage({ role, content, timestamp = "Vừa xong" }: ChatMessageProps) {
  const isAI = role === "assistant";

  return (
    <div className={cn("flex gap-3 items-start", !isAI && "flex-row-reverse")}>
      {/* Sender Avatar */}
      <Avatar className="h-8 w-8 shrink-0 ring-1 ring-primary/5">
        {isAI ? (
          <AvatarFallback className="bg-primary/10 text-primary">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        ) : (
          <>
            <AvatarImage src={mockUserProfile.avatar} alt={mockUserProfile.name} />
            <AvatarFallback>{mockUserProfile.name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </>
        )}
      </Avatar>

      {/* Bubble Message */}
      <div className="space-y-1 max-w-[75%]">
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm shadow-sm leading-relaxed whitespace-pre-wrap",
            isAI
              ? "bg-card border border-border text-foreground"
              : "bg-primary text-primary-foreground"
          )}
        >
          {content}
        </div>
        <span className={cn("text-[9px] text-muted-foreground block px-1", !isAI && "text-right")}>
          {timestamp}
        </span>
      </div>
    </div>
  );
}
