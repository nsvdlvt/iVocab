"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { expandDOMSelection, isExcludedElement } from "@/lib/selection/smart-selection";
import { SelectionBubble } from "./SelectionBubble";
import { SelectionResultPopup } from "./SelectionResultPopup";

interface SelectionState {
  selectedText: string;
  isSingleWord: boolean;
  wordForLookup: string;
  contextSentence: string;
  bubblePosition: { top: number; left: number };
  isFlippedBelow: boolean;
  popupPosition: { top: number; left: number };
}

export function SmartTextSelectionTranslator() {
  const pathname = usePathname();

  const [selectionState, setSelectionState] = useState<SelectionState | null>(null);
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);

  // Keep a ref to avoid stale closures in event handlers
  const popupVisibleRef = useRef(popupVisible);
  popupVisibleRef.current = popupVisible;

  // Don't render or listen inside /admin routes
  const isAdmin = pathname?.startsWith("/admin");

  const clearSelectionUI = useCallback(() => {
    setBubbleVisible(false);
    setPopupVisible(false);
    setSelectionState(null);
  }, []);

  const handleSelection = useCallback(() => {
    if (isAdmin || typeof window === "undefined") return;

    // Don't interrupt if popup is already open
    if (popupVisibleRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      setBubbleVisible(false);
      return;
    }

    const expanded = expandDOMSelection(selection);
    if (!expanded) {
      setBubbleVisible(false);
      return;
    }

    const { range, selectedText, isSingleWord, wordForLookup, contextSentence } = expanded;
    const rect = range.getBoundingClientRect();

    if (rect.width === 0 && rect.height === 0) {
      setBubbleVisible(false);
      return;
    }

    // Detect if selection is near the top edge (< 48px from viewport top)
    const isNearTop = rect.top < 48;
    const bubbleTop = isNearTop ? rect.bottom + 8 : rect.top - 8;
    const bubbleLeft = Math.min(
      window.innerWidth - 30,
      Math.max(30, rect.left + rect.width / 2)
    );

    // Position popup below the selection (or above if too close to bottom)
    const popupTop = rect.bottom + 8;
    const popupLeft = Math.min(
      window.innerWidth - 60,
      Math.max(60, rect.left + rect.width / 2)
    );

    setSelectionState({
      selectedText,
      isSingleWord,
      wordForLookup,
      contextSentence,
      bubblePosition: { top: bubbleTop, left: bubbleLeft },
      isFlippedBelow: isNearTop,
      popupPosition: { top: popupTop, left: popupLeft },
    });

    setBubbleVisible(true);
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin || typeof window === "undefined") return;

    let timeoutId: NodeJS.Timeout;

    const onMouseUp = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (isExcludedElement(target)) return;

      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        handleSelection();
      }, 30);
    };

    const onTouchEnd = (e: TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (isExcludedElement(target)) return;

      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        handleSelection();
      }, 50);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      // Handle Shift+Arrow selection
      if (e.shiftKey && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          handleSelection();
        }, 80);
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      // If clicking inside smart selection UI, ignore
      if (target?.closest("[data-smart-selection-ui='true']")) {
        return;
      }
      // If clicking outside, hide the bubble
      if (!popupVisibleRef.current) {
        setBubbleVisible(false);
      }
    };

    // When scrolling, dismiss floating bubble so it doesn't detach from scrolled text
    const onScroll = () => {
      if (!popupVisibleRef.current) {
        setBubbleVisible(false);
      }
    };

    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("touchend", onTouchEnd);
    document.addEventListener("keyup", onKeyUp);
    document.addEventListener("mousedown", onMouseDown);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("keyup", onKeyUp);
      document.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("scroll", onScroll);
    };
  }, [isAdmin, handleSelection]);

  // Close on route change
  useEffect(() => {
    clearSelectionUI();
  }, [pathname, clearSelectionUI]);

  if (isAdmin || !selectionState) {
    return null;
  }

  return (
    <AnimatePresence>
      {bubbleVisible && !popupVisible && (
        <SelectionBubble
          key="selection-bubble"
          position={selectionState.bubblePosition}
          isSingleWord={selectionState.isSingleWord}
          isFlippedBelow={selectionState.isFlippedBelow}
          onTriggerLookup={() => {
            setBubbleVisible(false);
            setPopupVisible(true);
          }}
        />
      )}

      {popupVisible && (
        <SelectionResultPopup
          key="selection-popup"
          selectedText={selectionState.selectedText}
          isSingleWord={selectionState.isSingleWord}
          wordForLookup={selectionState.wordForLookup}
          contextSentence={selectionState.contextSentence}
          position={selectionState.popupPosition}
          onClose={() => {
            setPopupVisible(false);
            setSelectionState(null);
          }}
        />
      )}
    </AnimatePresence>
  );
}
