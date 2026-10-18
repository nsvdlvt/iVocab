import OpenAI from "openai";
import { getAiApiKey, getAiBaseUrl } from "@/lib/ai/constants";

// Safe OpenAI client instance configured with modelapi.vn
export const openai = new OpenAI({
  apiKey: getAiApiKey(),
  baseURL: getAiBaseUrl(),
});