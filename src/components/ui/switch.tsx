"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps {
  id?: string;
  checked: boolean;
  disabled?: boolean;
  className?: string;
  title?: string;
  onChange?: (checked: boolean) => void;
  onCheckedChange?: (checked: boolean) => void;
  ariaLabel?: string;
}

export function Switch({ id, checked, disabled, className, title, onChange, onCheckedChange, ariaLabel = "Toggle Switch" }: SwitchProps) {
  const handleChange = onCheckedChange ?? onChange ?? (() => {});
  return (
    <button
      id={id}
      type="button"
      role="switch"
      disabled={disabled}
      title={title}
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => !disabled && handleChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-indigo-600" : "bg-muted-foreground/35",
        className
      )}
    >
      <span
        className={cn(
          "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ease-in-out",
          checked ? "translate-x-4.5" : "translate-x-0.5"
        )}
      />
    </button>
  );
}
