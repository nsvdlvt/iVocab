import React from "react";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

export function SectionCard({
  children,
  className = "",
  hoverable = false,
  ...props
}: SectionCardProps & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn(
        "rounded-xl border border-border/80 bg-card p-5 md:p-6 text-card-foreground shadow-xs transition-all duration-200",
        hoverable &&
          "hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}
