import { AI_MODEL } from '@/lib/ai/constants';
import { AIResponseError, AIAbortError, AINetworkError } from '@/lib/ai/errors';

/**
 * Payload for the Responses API. The `input` field can be either a plain string
 * (text‑only request) or an array of multimodal objects (e.g. text + image).
 */
export interface InputPart {
  type: string;
  text?: string;
  image_base64?: string;
  image_url?: string;
}

export interface ResponsesRequestPayload {
  /** Model name, defaults to AI_MODEL */
  model?: string;
  /** Input can be plain text or multimodal array */
  input: string | InputPart[];
  /** Additional provider‑specific fields */
  [key: string]: unknown;
}

/**
 * Thin wrapper around the OpenAI‑compatible Responses API.
 * Handles both plain‑text and multimodal payloads.
 */
export async function request<T = unknown>(
  payload: Omit<ResponsesRequestPayload, "model"> & { model?: string },
  abortSignal?: AbortSignal
): Promise<T> {
  const model = payload.model ?? AI_MODEL;
  const body = { ...payload, model };

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('responsesClient: Missing OPENAI_API_KEY');
    throw new AINetworkError('Missing OPENAI_API_KEY');
  }

  const baseURL = process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1';
  const endpoint = `${baseURL.replace(/\\+$/, '')}/responses`;

  console.log(`responsesClient: POST ${endpoint} model=${model}`);
  console.log('responsesClient: payload (truncated)', JSON.stringify(body).slice(0, 200) + '...');

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(new Error('TimeoutError')), 90000);
    
    if (abortSignal) {
      abortSignal.addEventListener('abort', () => {
        clearTimeout(timeoutId);
        controller.abort(abortSignal.reason);
      });
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    console.log(`responsesClient: status ${response.status}`);
    if (!response.ok) {
      const txt = await response.text();
      console.error(`responsesClient: error response ${txt}`);
      throw new AIResponseError(`Responses API error ${response.status}: ${txt}`);
    }

    const txt = await response.text();
    const data = JSON.parse(txt);
    // Provider may return `{ output: [{ content: [{ text: "..."}] }] }`
    // or a plain string under `content` – handle both.
    let content: unknown = data;
    if (data && typeof data === 'object') {
      const wrapper = data as { output?: Array<{ content?: Array<{ text?: string }> }> ; content?: string };
      const first = wrapper.output?.[0];
      const txtNode = first?.content?.[0]?.text;
      if (typeof txtNode === 'string') content = txtNode;
      else if (typeof wrapper.content === 'string') content = wrapper.content;
    }
    return content as T;
  } catch (err: unknown) {
    console.error('responsesClient: request failed', err);
    if (err instanceof Error && (err.name === 'AbortError' || err.message === 'TimeoutError')) {
      throw new AIAbortError('Request aborted or timed out');
    }
    if (err instanceof TypeError) {
      throw new AINetworkError(`Network failure: ${err.message}`);
    }
    if (err instanceof AIResponseError || err instanceof AINetworkError || err instanceof AIAbortError) {
      throw err;
    }
    const msg = err instanceof Error ? err.message : String(err);
    throw new AIResponseError(`Unexpected error during request: ${msg}`);
  }
}
