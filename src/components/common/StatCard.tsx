import React from "react";
import { LucideIcon } from "lucide-react";
import { SectionCard } from "./SectionCard";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  compactTitle?: string;
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
  compactTitle,
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
        compactOnMobile && "p-3.5 md:p-5",
        interactive &&
          "cursor-pointer hover:-translate-y-0.5 hover:shadow-md hover:border-primary/30",
        active && "border-primary/50 bg-primary/[0.04] ring-1 ring-primary/20 shadow-xs",
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
      {/* Mobile compact: vertical stack icon → label → value */}
      {compactOnMobile && compactTitle && (
        <div className="flex flex-col items-center gap-1.5 xl:hidden">
          {Icon && (
            <div
              className={cn(
                "rounded-lg p-2 bg-muted/60 text-muted-foreground",
                iconClassName
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
          )}
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {compactTitle}
          </span>
          <div className="text-xl font-bold tracking-tight tabular-nums text-foreground">
            {value}
          </div>
        </div>
      )}

      {/* Desktop / non-compact layout */}
      <div className={cn(compactOnMobile && compactTitle && "hidden xl:block")}>
        <div
          className={cn(
            "flex items-center justify-between gap-2",
            compactOnMobile && "justify-center md:justify-between"
          )}
        >
          <span
            className={cn(
              "text-xs font-medium text-muted-foreground",
              compactOnMobile && !compactTitle && "hidden xl:block"
            )}
          >
            {title}
          </span>
          {Icon && (
            <div
              className={cn(
                "rounded-lg p-2 bg-muted/60 text-muted-foreground shrink-0",
                compactOnMobile && "mx-auto xl:mx-0",
                iconClassName
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
          )}
        </div>
        <div
          className={cn(
            "mt-3 space-y-1",
            compactOnMobile && "mt-2 text-center xl:text-left"
          )}
        >
          <div
            className={cn(
              "text-2xl md:text-3xl font-bold tracking-tight tabular-nums text-foreground",
              compactOnMobile && "text-2xl xl:text-3xl"
            )}
          >
            {value}
          </div>
          {(description || trend) && (
            <div
              className={cn(
                "flex items-center gap-1.5 text-xs text-muted-foreground",
                compactOnMobile && "hidden xl:flex"
              )}
            >
              {trend && (
                <span
                  className={cn(
                    "font-semibold",
                    trend.isPositive
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  )}
                >
                  {trend.value}
                </span>
              )}
              {description && <span className="truncate">{description}</span>}
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
