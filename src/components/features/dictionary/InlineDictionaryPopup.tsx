"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, X, AlertCircle } from "lucide-react";
import { fetchDictionaryData, DictionaryResult } from "@/lib/dictionary/api";
import { detectPartOfSpeech } from "@/lib/nlp/pos";

interface InlineDictionaryPopupProps {
  word: string;
  sentence?: string;
  x: number;
  y: number;
  onClose: () => void;
}

export function InlineDictionaryPopup({ word, sentence, x, y, onClose }: InlineDictionaryPopupProps) {
  const [data, setData] = useState<DictionaryResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: y, left: x });

  const [prevWord, setPrevWord] = useState(word);
  
  const detectedPos = sentence ? detectPartOfSpeech(sentence, word) : null;

  if (word !== prevWord) {
    setPrevWord(word);
    setLoading(true);
    setError(false);
    setData(null);
  }

  useEffect(() => {
    let isMounted = true;

    fetchDictionaryData(word, detectedPos).then((res) => {
      if (!isMounted) return;
      if (res) {
        setData(res);
      } else {
        setError(true);
      }
      setLoading(false);
    }).catch(() => {
      if (!isMounted) return;
      setError(true);
      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [word, sentence, detectedPos]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    
    // Slight delay to prevent immediate close if the click to open also triggers this
    const timer = setTimeout(() => {
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleClickOutside);
    }, 10);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  useEffect(() => {
    if (popupRef.current) {
      const rect = popupRef.current.getBoundingClientRect();
      let newLeft = x;
      let newTop = y + 24; // slightly below the word

      const margin = 16;
      if (newLeft + rect.width + margin > window.innerWidth) {
        newLeft = window.innerWidth - rect.width - margin;
      }
      if (newLeft < margin) newLeft = margin;

      if (newTop + rect.height + margin > window.innerHeight) {
        // Show above the word instead
        newTop = y - rect.height - 8;
      }
      if (newTop < margin) newTop = margin;

      setPosition({ left: newLeft, top: newTop });
    }
  }, [x, y, data, loading, error]);

  const playAudio = () => {
    if (data?.audio) {
      const audio = new Audio(data.audio);
      audio.play().catch(console.error);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={popupRef}
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        style={{ top: position.top, left: position.left }}
        className="fixed z-50 w-80 max-h-[400px] overflow-y-auto rounded-xl border border-border bg-popover text-popover-foreground shadow-xl shadow-black/5"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/50 bg-popover/80 px-4 py-2 backdrop-blur-sm">
          <span className="font-semibold">{word}</span>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-muted text-muted-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 text-sm">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-5 w-24 rounded-md bg-muted"></div>
              <div className="h-4 w-full rounded-md bg-muted"></div>
              <div className="h-4 w-3/4 rounded-md bg-muted"></div>
              <div className="h-4 w-1/2 rounded-md bg-muted"></div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-4 text-muted-foreground">
              <AlertCircle className="mb-2 h-6 w-6 text-rose-500/50" />
              <p>Dictionary info not found</p>
            </div>
          ) : data ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-black text-primary">{data.word}</h3>
                {data.ipa && <span className="text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded text-xs">{data.ipa}</span>}
                {data.audio && (
                  <button onClick={playAudio} className="rounded-full p-1.5 text-blue-500 hover:bg-blue-500/10 transition-colors">
                    <Volume2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              {detectedPos ? (
                <div className="inline-flex rounded-full border border-primary/50 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold italic text-primary">
                  Detected Part of Speech: {detectedPos}
                </div>
              ) : data.partOfSpeech && (
                <div className="inline-flex rounded-full border border-border bg-muted/50 px-2 py-0.5 text-xs font-semibold italic text-muted-foreground">
                  {data.partOfSpeech}
                </div>
              )}

              {data.vietnameseMeaning && (
                <div className="rounded-lg bg-blue-500/10 p-3 text-blue-700 dark:text-blue-300">
                  <span className="font-semibold block mb-1 text-xs uppercase tracking-wider opacity-80">Vietnamese Meaning</span>
                  {data.vietnameseMeaning}
                </div>
              )}

              {data.definitions && data.definitions.length > 0 && (
                <div className="space-y-2">
                  <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Definitions</span>
                  <ol className="list-decimal pl-4 space-y-3 text-sm text-foreground">
                    {data.definitions.map((def, idx) => (
                      <li key={idx} className="pl-1">
                        <span className="block">{def.definition}</span>
                        {def.example && (
                          <span className="block mt-1 text-muted-foreground italic">
                            &quot;{def.example}&quot;
                          </span>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {data.synonyms && data.synonyms.length > 0 && (
                <div className="space-y-1">
                  <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Synonyms</span>
                  <div className="flex flex-wrap gap-1.5">
                    {data.synonyms.map(syn => (
                      <span key={syn} className="rounded-md border border-border/50 bg-muted/30 px-2 py-1 text-xs">
                        {syn}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
