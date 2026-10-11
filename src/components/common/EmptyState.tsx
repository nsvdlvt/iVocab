"use client";

import React from "react";
import { FolderOpen, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VocabeeMascot } from "./VocabeeMascot";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  useMascot?: boolean;
  actionText?: string;
  onAction?: () => void;
  actionHref?: string;
}

export function EmptyState({
  title,
  description,
  icon: Icon,
  useMascot = true,
  actionText,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-12 border border-dashed border-border/80 rounded-2xl bg-card/60 my-4 select-none">
      {useMascot && !Icon ? (
        <div className="mb-4">
          <VocabeeMascot mood="empty" size="md" speech="" />
        </div>
      ) : Icon ? (
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border/60 bg-muted/30 text-muted-foreground shadow-2xs mb-4">
          <Icon className="h-6 w-6 text-muted-foreground/80" />
        </div>
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border/60 bg-muted/30 text-muted-foreground shadow-2xs mb-4">
          <FolderOpen className="h-6 w-6 text-muted-foreground/80" />
        </div>
      )}

      <h4 className="text-base font-bold text-foreground mb-1.5">{title}</h4>
      <p className="text-sm text-muted-foreground max-w-md mb-5 leading-relaxed">
        {description}
      </p>

      {actionText && onAction && (
        <Button
          onClick={onAction}
          variant="default"
          size="sm"
          className="rounded-xl font-semibold shadow-xs"
        >
          {actionText}
        </Button>
      )}
    </div>
  );
}
