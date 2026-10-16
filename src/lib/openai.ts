import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY || "gemini-placeholder";
const baseURL = process.env.OPENAI_BASE_URL;

// Keep safe fallback instance to prevent unhandled crash if imported
export const openai = new OpenAI({
  apiKey,
  baseURL,
});