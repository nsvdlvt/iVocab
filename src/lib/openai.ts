import OpenAI from "openai";
import { getAiApiKey, getAiBaseUrl, getAiHeaders } from "@/lib/ai/constants";

// Safe OpenAI client instance compatible with OpenRouter, ModelAPI, and OpenAI
export const openai = new OpenAI({
  apiKey: getAiApiKey(),
  baseURL: getAiBaseUrl(),
  defaultHeaders: getAiHeaders(),
  timeout: 45000,
});
