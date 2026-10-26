/**
 * Smart Text Selection & Translation Helpers
 * Provides word boundary expansion, selection classification, punctuation handling,
 * and exclusion checking for LearnVocab.
 */

// Matches Unicode letters (English, Vietnamese, accented characters) and digits
const UNICODE_LETTER_OR_DIGIT_REGEX = /^[\p{L}\p{N}]$/u;

/**
 * Checks if a single character is a letter or digit (Unicode-aware).
 */
export function isWordChar(char?: string): boolean {
  if (!char || char.length !== 1) return false;
  return UNICODE_LETTER_OR_DIGIT_REGEX.test(char);
}

/**
 * Checks if a character at index is a connector within a word (e.g. apostrophe in "don't" or hyphen in "well-known").
 */
export function isWordConnector(text: string, index: number): boolean {
  if (index <= 0 || index >= text.length - 1) return false;
  const char = text[index];
  if (char === "'" || char === "’" || char === "-") {
    return isWordChar(text[index - 1]) && isWordChar(text[index + 1]);
  }
  return false;
}

/**
 * Checks if a character at index is part of a word (either a word character or an internal connector).
 */
export function isPartOfWord(text: string, index: number): boolean {
  if (index < 0 || index >= text.length) return false;
  return isWordChar(text[index]) || isWordConnector(text, index);
}

/**
 * Expands character indices [start, end) to word boundaries within a single string.
 * - Expands start backward to the start of the first word if cutting inside a word.
 * - Expands end forward to the end of the last word if cutting inside a word.
 * - Does NOT expand across sentence-ending punctuation (. ? ! \n).
 */
export function expandIndicesToWordBoundaries(
  text: string,
  start: number,
  end: number
): { start: number; end: number } {
  if (start < 0) start = 0;
  if (end > text.length) end = text.length;
  if (start >= end || !text) return { start, end };

  let newStart = start;
  let newEnd = end;

  // 1. Expand start backward if cutting inside a word
  // Only expand backward if the character before start is part of the word
  // AND the character at or after start is part of the word
  if (newStart > 0 && isPartOfWord(text, newStart - 1) && isPartOfWord(text, newStart)) {
    while (newStart > 0 && isPartOfWord(text, newStart - 1)) {
      // Don't expand past sentence delimiters
      const prevChar = text[newStart - 1];
      if (prevChar === "." || prevChar === "?" || prevChar === "!" || prevChar === "\n") {
        break;
      }
      newStart--;
    }
  }

  // 2. Expand end forward if cutting inside a word
  // Only expand forward if character at end is part of the word
  // AND character before end is part of the word
  if (newEnd < text.length && isPartOfWord(text, newEnd) && isPartOfWord(text, newEnd - 1)) {
    while (newEnd < text.length && isPartOfWord(text, newEnd)) {
      // Don't expand past sentence delimiters
      const nextChar = text[newEnd];
      if (nextChar === "." || nextChar === "?" || nextChar === "!" || nextChar === "\n") {
        break;
      }
      newEnd++;
    }
  }

  return { start: newStart, end: newEnd };
}

/**
 * Strips outer punctuation, quotes, and whitespace from a selection.
 */
export function cleanSelectedWord(raw: string): string {
  if (!raw) return "";
  // Strip surrounding quotes, punctuation, brackets, parentheses, whitespaces
  return raw
    .trim()
    .replace(/^["'“”‘’«»(\[\{<]+/, "")
    .replace(/["'“”‘’»\)\]\}>.,!?:;]+$/, "")
    .trim();
}

/**
 * Classifies selected text into single-word lookup (Case A) or sentence/paragraph translation (Case B).
 */
export function classifySelection(rawText: string): {
  isSingleWord: boolean;
  cleanText: string;
  wordForLookup: string;
} {
  const cleanText = rawText.trim().replace(/\s+/g, " ");
  if (!cleanText) {
    return { isSingleWord: false, cleanText: "", wordForLookup: "" };
  }

  const cleanedWord = cleanSelectedWord(cleanText);

  // If after stripping exterior punctuation there is no internal whitespace,
  // and length is between 1 and 60 characters, treat as a single word / token (e.g. "resilient", "well-known", "don't").
  const hasInternalWhitespace = /\s/.test(cleanedWord);
  const isSingleWord = !hasInternalWhitespace && cleanedWord.length > 0 && cleanedWord.length <= 60;

  return {
    isSingleWord,
    cleanText,
    wordForLookup: isSingleWord ? cleanedWord : cleanText,
  };
}

/**
 * Checks whether an element or its ancestors should be excluded from smart selection.
 * Excludes inputs, textareas, contenteditable elements, and marked UI containers.
 */
export function isExcludedElement(element: Element | null): boolean {
  if (!element) return false;

  const tagName = element.tagName.toUpperCase();
  if (tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT") {
    return true;
  }

  if (element.getAttribute("contenteditable") === "true") {
    return true;
  }

  // Check parent hierarchy
  if (element.closest("input, textarea, select, [contenteditable='true']")) {
    return true;
  }

  // Explicit opt-out for specific components or editors
  if (element.closest("[data-no-smart-selection='true']")) {
    return true;
  }

  // Selection UI components themselves (bubble, popup, modal)
  if (element.closest("[data-smart-selection-ui='true']")) {
    return true;
  }

  return false;
}

/**
 * Extracts the surrounding sentence from an element's text given the selected word.
 */
export function findSurroundingSentence(container: Node | null, selectedWord: string): string {
  if (!container || !selectedWord) return "";

  // Walk up to a block-level container (<p>, <div>, <li>, <section>, <article>, etc.)
  let blockEl = container instanceof Element ? container : container.parentElement;
  while (blockEl && blockEl !== document.body) {
    const display = window.getComputedStyle(blockEl).display;
    if (
      display === "block" ||
      display === "flex" ||
      display === "grid" ||
      ["P", "LI", "DIV", "ARTICLE", "SECTION", "H1", "H2", "H3", "H4", "H5", "H6"].includes(
        blockEl.tagName
      )
    ) {
      break;
    }
    blockEl = blockEl.parentElement;
  }

  const fullText = blockEl?.textContent?.replace(/\s+/g, " ").trim() || "";
  if (!fullText) return "";

  // Find sentences split by . ! ?
  const sentenceRegex = /[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g;
  const sentences = fullText.match(sentenceRegex) || [fullText];

  const escaped = selectedWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const wordBoundaryRegex = new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}([^\\p{L}\\p{N}]|$)`, "ui");

  for (const s of sentences) {
    const cleanSentence = s.trim();
    if (wordBoundaryRegex.test(cleanSentence)) {
      return cleanSentence;
    }
  }

  return fullText.slice(0, 300);
}

/**
 * Smartly expands a DOM Selection object to word boundaries.
 * Returns the expanded text, updated Range, and whether it represents a single word.
 */
export function expandDOMSelection(selection: Selection | null): {
  range: Range;
  selectedText: string;
  isSingleWord: boolean;
  wordForLookup: string;
  contextSentence: string;
} | null {
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const commonAncestor = range.commonAncestorContainer;
  const ancestorElement =
    commonAncestor instanceof Element ? commonAncestor : commonAncestor.parentElement;

  if (isExcludedElement(ancestorElement)) {
    return null;
  }

  // Check active element
  if (typeof document !== "undefined" && isExcludedElement(document.activeElement)) {
    return null;
  }

  // Work on startContainer and endContainer
  let { startContainer, startOffset, endContainer, endOffset } = range;

  // 1. Expand startContainer if it's a Text node
  if (startContainer.nodeType === Node.TEXT_NODE) {
    const text = startContainer.textContent || "";
    if (startOffset > 0 && isPartOfWord(text, startOffset - 1) && isPartOfWord(text, startOffset)) {
      let s = startOffset;
      while (s > 0 && isPartOfWord(text, s - 1)) {
        const prev = text[s - 1];
        if (prev === "." || prev === "?" || prev === "!" || prev === "\n") break;
        s--;
      }
      startOffset = s;
    }
  }

  // 2. Expand endContainer if it's a Text node
  if (endContainer.nodeType === Node.TEXT_NODE) {
    const text = endContainer.textContent || "";
    if (endOffset < text.length && isPartOfWord(text, endOffset) && isPartOfWord(text, endOffset - 1)) {
      let e = endOffset;
      while (e < text.length && isPartOfWord(text, e)) {
        const next = text[e];
        if (next === "." || next === "?" || next === "!" || next === "\n") break;
        e++;
      }
      endOffset = e;
    }
  }

  // Update range and selection in DOM if changed
  try {
    range.setStart(startContainer, startOffset);
    range.setEnd(endContainer, endOffset);
    selection.removeAllRanges();
    selection.addRange(range);
  } catch {
    // Range setting might fail on some complex cross-shadow-DOM boundaries; ignore gracefully
  }

  const rawSelectedText = selection.toString();
  const classified = classifySelection(rawSelectedText);

  if (!classified.cleanText) {
    return null;
  }

  const contextSentence = classified.isSingleWord
    ? findSurroundingSentence(ancestorElement, classified.wordForLookup)
    : "";

  return {
    range,
    selectedText: classified.cleanText,
    isSingleWord: classified.isSingleWord,
    wordForLookup: classified.wordForLookup,
    contextSentence,
  };
}
