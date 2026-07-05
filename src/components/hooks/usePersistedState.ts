"use client";

import { useState, useEffect } from "react";

/**
 * Generic hook that syncs a state value with localStorage.
 * It reads the stored value on mount, falls back to the provided default,
 * and writes back to localStorage whenever the state changes.
 * Unknown fields are ignored – forward‑compatible.
 */
export function usePersistedState<T>(key: string, defaultValue: T): [T, (v: T) => void] {
  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") return defaultValue;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<T>;
        // Merge stored fields onto default, ignoring unknown keys
        return { ...defaultValue, ...parsed } as T;
      }
    } catch (e) {
      console.warn("Failed to read persisted state for", key, e);
    }
    return defaultValue;
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (e) {
      console.warn("Failed to persist state for", key, e);
    }
  }, [key, state]);

  return [state, setState];
}
