import React from "react";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className = "" }: PageContainerProps) {
  return (
    <div className={`mx-auto w-full max-w-7xl overflow-x-hidden px-4 py-6 md:px-6 md:py-8 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}
