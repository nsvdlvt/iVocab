// src/components/ui/spinner.tsx
"use client";

import { LoaderIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Simple spinner component used across the app for loading states.
 * It renders a rotating LoaderIcon with optional Tailwind classes.
 */
export function Spinner({ className }: { className?: string }) {
  return (
    <LoaderIcon
      className={cn("animate-spin", className)}
      aria-label="Loading"
    />
  );
}

export default Spinner;
