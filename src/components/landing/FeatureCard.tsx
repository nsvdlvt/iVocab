"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
  className?: string;
  accent?: string;
  children?: React.ReactNode;
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  badge = "Tính năng cốt lõi",
  className,
  accent = "from-primary/8 via-transparent to-transparent",
  children,
}: FeatureCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className={cn(
        "group relative overflow-hidden rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs transition-colors hover:border-primary/40",
        className
      )}
    >
      <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br opacity-80", accent)} />
      <div className="relative flex h-full flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-2xs">
            <Icon className="h-5 w-5" />
          </div>
          <Badge variant="outline" className="rounded-full bg-background/80 px-3 py-1 text-[11px] font-semibold">
            {badge}
          </Badge>
        </div>
        <div className="space-y-1.5">
          <h3 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">{title}</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>
        <div className="mt-auto pt-2">{children}</div>
      </div>
    </motion.div>
  );
}
