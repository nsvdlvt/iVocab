"use client";

import React from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FavoriteToggleButtonProps {
  isFavorite: boolean;
  onToggle: () => void | Promise<void>;
  className?: string;
  label?: string;
  size?: "sm" | "md";
  disabled?: boolean;
}

export function FavoriteToggleButton({
  isFavorite,
  onToggle,
  className,
  label,
  size = "sm",
  disabled = false,
}: FavoriteToggleButtonProps) {
  const sizeClass = size === "md" ? "h-9 w-9" : "h-8 w-8";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      disabled={disabled}
      onPointerDown={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onMouseDown={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void onToggle();
      }}
      aria-label={label ?? (isFavorite ? "Bỏ đánh dấu yêu thích" : "Đánh dấu yêu thích")}
      title={label ?? (isFavorite ? "Bỏ đánh dấu yêu thích" : "Đánh dấu yêu thích")}
      className={cn(
        sizeClass,
        "rounded-lg bg-transparent text-slate-500 transition-all hover:bg-slate-100 hover:text-amber-500",
        isFavorite && "text-amber-500",
        disabled && "opacity-60",
        className
      )}
    >
      <Star className={cn("h-4 w-4 transition-transform duration-200", isFavorite && "fill-amber-400 text-amber-500 scale-110")} />
    </Button>
  );
}
