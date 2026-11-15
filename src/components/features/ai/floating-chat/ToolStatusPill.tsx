// src/components/features/ai/floating-chat/ToolStatusPill.tsx
"use client";

import React from "react";
import { Loader2, Database } from "lucide-react";

interface ToolStatusPillProps {
  status: string;
}

export function ToolStatusPill({ status }: ToolStatusPillProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs text-primary shadow-xs animate-in fade-in slide-in-from-bottom-1">
      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
      <span className="font-medium">{status}</span>
    </div>
  );
}
