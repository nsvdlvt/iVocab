"use client";

import React from "react";
import { FolderOpen, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionText?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  description,
  icon: Icon = FolderOpen,
  actionText,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-12 border border-dashed border-border rounded-xl bg-muted/15 my-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border/60 bg-background text-muted-foreground shadow-2xs mb-4">
        <Icon className="h-6 w-6 text-muted-foreground/80" />
      </div>
      <h4 className="text-base font-semibold text-foreground mb-1">{title}</h4>
      <p className="text-sm text-muted-foreground max-w-md mb-5 leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <Button onClick={onAction} variant="outline" size="sm">
          {actionText}
        </Button>
      )}
    </div>
  );
}
