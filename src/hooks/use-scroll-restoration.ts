"use client";

import { useEffect } from "react";

function getStorageKey(key: string) {
  return `scroll-restoration:${key}`;
}

function getTopAnchorId() {
  const anchors = Array.from(document.querySelectorAll<HTMLElement>("[data-scroll-anchor]"));
  const viewportTop = window.scrollY;
  let best: { id: string; distance: number } | null = null;

  for (const anchor of anchors) {
    const id = anchor.dataset.scrollAnchor;
    if (!id) continue;

    const rect = anchor.getBoundingClientRect();
    const absoluteTop = rect.top + window.scrollY;
    const distance = Math.abs(absoluteTop - viewportTop);

    if (!best || distance < best.distance) {
      best = { id, distance };
    }
  }

  return best?.id ?? null;
}

export function useScrollRestoration(key: string) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const storageKey = getStorageKey(key);
    const originalScrollRestoration = window.history.scrollRestoration;

    try {
      window.history.scrollRestoration = "manual";
    } catch {
      // Some browsers do not allow overriding this value.
    }

    const restore = () => {
      const raw = window.sessionStorage.getItem(storageKey);
      if (!raw) return;

      try {
        const parsed = JSON.parse(raw) as { anchorId?: string; scrollY?: number } | number;
        const anchorId = typeof parsed === "number" ? null : parsed?.anchorId ?? null;
        const scrollY = typeof parsed === "number" ? parsed : parsed?.scrollY ?? null;

        window.requestAnimationFrame(() => {
          if (anchorId) {
            const anchor = document.querySelector<HTMLElement>(`[data-scroll-anchor="${CSS.escape(anchorId)}"]`);
            if (anchor) {
              anchor.scrollIntoView({ block: "start", behavior: "auto" });
              return;
            }
          }

          if (typeof scrollY === "number" && Number.isFinite(scrollY)) {
            window.scrollTo({ top: scrollY, behavior: "auto" });
          }
        });
      } catch {
        const scrollY = Number(raw);
        if (!Number.isFinite(scrollY)) return;
        window.requestAnimationFrame(() => {
          window.scrollTo({ top: scrollY, behavior: "auto" });
        });
      }
    };

    const save = () => {
      window.sessionStorage.setItem(
        storageKey,
        JSON.stringify({
          anchorId: getTopAnchorId(),
          scrollY: window.scrollY,
        })
      );
    };

    restore();
    window.addEventListener("scroll", save, { passive: true });
    window.addEventListener("beforeunload", save);
    window.addEventListener("pagehide", save);

    return () => {
      window.removeEventListener("scroll", save);
      window.removeEventListener("beforeunload", save);
      window.removeEventListener("pagehide", save);

      try {
        window.history.scrollRestoration = originalScrollRestoration;
      } catch {
        // Ignore if the browser disallows restoring it.
      }
    };
  }, [key]);
}
