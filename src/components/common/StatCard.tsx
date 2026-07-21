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
  className?: string;
  compactOnMobile?: boolean;
  onClick?: () => void;
  active?: boolean;
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
  className,
  compactOnMobile = false,
  onClick,
  active = false,
  trend,
}: StatCardProps) {
  const interactive = typeof onClick === "function";

  return (
    <SectionCard
      className={cn(
        "flex flex-col justify-between transition-all duration-200",
        compactOnMobile && "rounded-xl p-3 md:rounded-2xl md:p-6",
        interactive && "cursor-pointer hover:-translate-y-0.5 hover:shadow-md",
        active && "border-primary/40 bg-primary/5 shadow-sm",
        className
      )}
      onClick={onClick}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      <div className={cn("flex items-center justify-between", compactOnMobile && "justify-center md:justify-between")}>
        <span className={cn("text-sm font-medium text-muted-foreground", compactOnMobile && "hidden xl:block")}>{title}</span>
        {Icon && (
          <div
            className={cn(
              "rounded-xl p-2 bg-muted/50 text-muted-foreground",
              compactOnMobile && "mx-auto xl:mx-0",
              iconClassName
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      <div className={cn("mt-4 space-y-1", compactOnMobile && "mt-2 text-center xl:text-left")}>
        <div className={cn("text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/90 bg-clip-text", compactOnMobile && "text-2xl xl:text-3xl")}>
          {value}
        </div>
        {(description || trend) && (
          <div className={cn("flex items-center gap-1.5 text-xs text-muted-foreground", compactOnMobile && "hidden xl:flex")}>
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
