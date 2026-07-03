/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function SearchBar() {
  const [osShortcut, setOsShortcut] = useState("Ctrl + K");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isMac = navigator.userAgent.toUpperCase().indexOf("MAC") >= 0;
      setOsShortcut(isMac ? "⌘ K" : "Ctrl + K");
    }
  }, []);

  return (
    <div className="relative w-full max-w-sm md:max-w-md">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Tìm kiếm từ vựng, bộ học..."
        className="w-full pl-9 pr-16 bg-muted/30 border-border rounded-xl focus-visible:ring-1 text-sm h-9 transition-all hover:bg-muted/50"
        readOnly
      />
      <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground shadow-sm flex h-5">
        {osShortcut}
      </kbd>
    </div>
  );
}
