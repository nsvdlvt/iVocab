import type { Metadata } from "next";
import { AITestClient } from "./AITestClient";

export const metadata: Metadata = {
  title: "Kiểm thử AI",
  description: "Giao diện kiểm thử tích hợp trợ lý AI Vocabee.",
};

export default function AITestPage() {
  return <AITestClient />;
}
