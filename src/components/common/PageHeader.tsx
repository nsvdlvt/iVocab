"use client";

import React from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-border pb-5 mb-6 md:mb-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl bg-gradient-to-br from-foreground to-foreground/80 bg-clip-text">
          {title}
        </h1>
        {description && (
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2 mt-2 md:mt-0">{action}</div>}
    </div>
  );
}
