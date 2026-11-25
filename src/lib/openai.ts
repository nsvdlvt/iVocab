import { getCloudflareClient } from "@/lib/ai/cloudflare/provider";

// Centralized OpenAI client instance configured for Cloudflare Workers AI
export const openai = getCloudflareClient();
