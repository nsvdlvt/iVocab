import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;
const baseURL = process.env.OPENAI_BASE_URL;

console.log(`openai.ts: Initializing OpenAI with baseURL: ${baseURL}, apiKey defined: ${!!apiKey}`);

if (!apiKey) {
  console.error("openai.ts: Missing OPENAI_API_KEY");
  throw new Error("Missing OPENAI_API_KEY");
}

export const openai = new OpenAI({
  apiKey,
  baseURL,
});