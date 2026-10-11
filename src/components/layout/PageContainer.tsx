import React from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className = "" }: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-7xl overflow-x-hidden px-3.5 py-4 sm:px-6 sm:py-6 md:py-8 lg:px-8",
        className
      )}
    >
      {children}
    </div>
  );
}
