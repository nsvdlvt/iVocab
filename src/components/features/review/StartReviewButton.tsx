"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function StartReviewButton() {
  const router = useRouter();

  const handleStart = async () => {
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

    router.push(`/review/session/${data.session.id}/learn`);
  };

  return (
    <Button onClick={handleStart} className="rounded-xl px-5">
      Bắt đầu ôn
    </Button>
  );
}
