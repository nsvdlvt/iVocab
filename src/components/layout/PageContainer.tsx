"use client";

import React from "react";
import { motion } from "framer-motion";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className = "" }: PageContainerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8 lg:px-8 ${className}`}
    >
      {children}
    </motion.div>
  );
}
