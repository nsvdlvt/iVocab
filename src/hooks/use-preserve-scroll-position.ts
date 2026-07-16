"use client";

import { useLayoutEffect, useRef } from "react";

export function usePreserveScrollPosition(dependency: unknown) {
  const previousDependencyRef = useRef<unknown>(dependency);
  const restoreScrollRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;

    const previousDependency = previousDependencyRef.current;
    previousDependencyRef.current = dependency;

    if (previousDependency === dependency) return;

    const targetScrollY = restoreScrollRef.current ?? window.scrollY;

    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({ top: targetScrollY, behavior: "auto" });
    });

    return () => {
      restoreScrollRef.current = window.scrollY;
      window.cancelAnimationFrame(frame);
    };
  }, [dependency]);
}
