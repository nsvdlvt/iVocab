"use client";

import React from "react";
import { LucideIcon } from "lucide-react";
import { SectionCard } from "./SectionCard";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  iconClassName?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconClassName = "",
  trend,
}: StatCardProps) {
  return (
    <SectionCard className="flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        {Icon && (
          <div className={cn("rounded-xl p-2 bg-muted/50 text-muted-foreground", iconClassName)}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      <div className="mt-4 space-y-1">
        <div className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/90 bg-clip-text">
          {value}
        </div>
        {(description || trend) && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {trend && (
              <span
                className={cn(
                  "font-semibold",
                  trend.isPositive ? "text-emerald-500" : "text-rose-500"
                )}
              >
                {trend.value}
              </span>
            )}
            {description && <span>{description}</span>}
          </div>
        )}
      </div>
    </SectionCard>
  );
}
