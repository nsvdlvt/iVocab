"use client";

import React from "react";
import { motion } from "framer-motion";

export function AnimatedBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.08),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(249,158,27,0.08),_transparent_28%),linear-gradient(to_bottom,_#f8fbff,_#f3f7fb_42%,_#eef3f8_100%)]" />
      <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(15,23,42,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.12)_1px,transparent_1px)] [background-size:72px_72px]" />
      <motion.div
        animate={{ x: [0, 18, 0], y: [0, -16, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-[-8rem] top-20 h-64 w-64 rounded-full bg-blue-400/12 blur-3xl"
      />
      <motion.div
        animate={{ x: [0, -16, 0], y: [0, 20, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="absolute right-[-6rem] top-40 h-72 w-72 rounded-full bg-amber-300/12 blur-3xl"
      />
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-7rem] left-1/3 h-64 w-64 rounded-full bg-sky-300/12 blur-3xl"
      />
    </div>
  );
}
