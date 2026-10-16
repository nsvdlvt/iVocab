// src/lib/ai/constants.ts
export const DEFAULT_GEMINI_MODELS = [
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.8-flash",
  "gemini-flash-latest",
];

export const AI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";
