import { createWorker } from "tesseract.js";
import { AIResponseError } from "@/lib/ai/errors";
import { performance } from "perf_hooks";

let workerPromise: Promise<Awaited<ReturnType<typeof createWorker>>> | null = null;

async function getWorker() {
  if (!workerPromise) {
    workerPromise = createWorker("eng");
  }
  return workerPromise;
}

function decodeDataUrl(dataUrl: string): Buffer {
  const match = /^data:[^;]+;base64,(.+)$/i.exec(dataUrl);
  if (!match) {
    throw new AIResponseError("Định dạng ảnh không hợp lệ.");
  }
  return Buffer.from(match[1], "base64");
}

async function imageToBuffer(imageFile: File | null, imageBase64?: string): Promise<Buffer> {
  const convertStart = performance.now();
  if (imageFile) {
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (process.env.NODE_ENV === "development") {
      console.log("[AI Import] Image preprocessing", Math.round(performance.now() - convertStart), "ms");
    }
    return buffer;
  }
  if (imageBase64) {
    const buffer = decodeDataUrl(imageBase64);
    if (process.env.NODE_ENV === "development") {
      console.log("[AI Import] Image preprocessing", Math.round(performance.now() - convertStart), "ms");
    }
    return buffer;
  }
  throw new AIResponseError("Thiếu dữ liệu ảnh.");
}

function normalizeExtractedText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export async function extractTextFromImageInput(imageFile: File | null, imageBase64?: string): Promise<string> {
  const buffer = await imageToBuffer(imageFile, imageBase64);
  const ocrStart = performance.now();
  const worker = await getWorker();
  const result = await worker.recognize(buffer);
  if (process.env.NODE_ENV === "development") {
    console.log("[AI Import] OCR", Math.round(performance.now() - ocrStart), "ms");
  }
  const extractedText = normalizeExtractedText(result.data.text || "");
  if (!extractedText) {
    throw new AIResponseError("Không thể nhận dạng văn bản trong ảnh.");
  }
  return extractedText;
}
