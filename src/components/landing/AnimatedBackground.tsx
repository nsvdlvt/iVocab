"use client";

import React from "react";
import { motion } from "framer-motion";

export function AnimatedBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,var(--color-primary)_0%,transparent_32%),radial-gradient(circle_at_top_right,var(--color-chart-4)_0%,transparent_28%)] opacity-[0.07] dark:opacity-[0.12]" />
      <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.07] [background-image:linear-gradient(var(--color-foreground)_1px,transparent_1px),linear-gradient(90deg,var(--color-foreground)_1px,transparent_1px)] [background-size:72px_72px]" />
      <motion.div
        animate={{ x: [0, 18, 0], y: [0, -16, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-[-8rem] top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl"
      />
      <motion.div
        animate={{ x: [0, -16, 0], y: [0, 20, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="absolute right-[-6rem] top-40 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl"
      />
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-7rem] left-1/3 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl"
      />
    </div>
  );
}
