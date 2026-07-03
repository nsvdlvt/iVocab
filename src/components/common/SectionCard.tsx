"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

export function SectionCard({ children, className = "", hoverable = false }: SectionCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-sm transition-all duration-300",
        hoverable && "hover:shadow-md hover:border-border/80 hover:-translate-y-[2px] cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}
