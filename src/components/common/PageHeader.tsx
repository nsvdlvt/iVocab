"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/80 pb-5 mb-6",
        className
      )}
    >
      <div className="space-y-1 min-w-0">
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl md:text-[1.65rem]">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 mt-1 sm:mt-0">
          {action}
        </div>
      )}
    </div>
  );
}
