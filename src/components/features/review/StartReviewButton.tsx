"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface StartReviewButtonProps {
  dueCount?: number;
}

export function StartReviewButton({ dueCount = 0 }: StartReviewButtonProps) {
  const router = useRouter();
  const hasDue = dueCount > 0;

  const handleStart = async () => {
    if (!hasDue) return;

    const response = await fetch("/api/review-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const data = (await response.json()) as
      | { success: true; session: { id: string } }
      | { success: false; error: string };

    if (!response.ok || !data.success) {
      console.error("Failed to create review session", "error" in data ? data.error : "");
      return;
    }

    router.push(`/review/session/${data.session.id}`);
  };

  return (
    <Button
      onClick={handleStart}
      disabled={!hasDue}
      className="rounded-xl px-5"
    >
      Bắt đầu ôn
    </Button>
  );
}
