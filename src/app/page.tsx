import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Trang chủ | Vocabee",
  description: "Nền tảng học từ vựng tiếng Anh hiện đại với Flashcard, SRS và trợ lý AI thông minh.",
};

export default async function HomePage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return <LandingPage />;
}
