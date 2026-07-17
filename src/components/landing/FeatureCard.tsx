"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
  accent?: string;
  children?: React.ReactNode;
}

export function FeatureCard({ icon: Icon, title, description, className, accent = "from-blue-500/20 to-cyan-500/10", children }: FeatureCardProps) {
  return (
      <motion.div
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className={cn(
        "group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.07)]",
        className
      )}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-60", accent)} />
      <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.8),transparent_36%)]" />
      <div className="relative flex h-full flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 shadow-sm">
            <Icon className="h-5 w-5" />
          </div>
          <span className="rounded-full border border-slate-200 bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-600 shadow-sm">
            Live preview
          </span>
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-black tracking-tight text-slate-950">{title}</h3>
          <p className="text-sm leading-relaxed text-slate-600">{description}</p>
        </div>
        <div className="mt-auto">{children}</div>
      </div>
    </motion.div>
  );
}
