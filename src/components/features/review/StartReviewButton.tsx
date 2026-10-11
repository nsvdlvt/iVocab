"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StartReviewButtonProps {
  dueCount?: number;
}

export function StartReviewButton({ dueCount = 0 }: StartReviewButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const hasDue = dueCount > 0;

  const handleStart = async () => {
    if (!hasDue || loading) return;

    setLoading(true);
    try {
      const response = await fetch("/api/review-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = (await response.json()) as
        | { success: true; session: { id: string } }
        | { success: false; error: string };

      if (!response.ok || !data.success) {
        console.error(
          "Failed to create review session",
          "error" in data ? data.error : ""
        );
        return;
      }

      router.push(`/review/session/${data.session.id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleStart} disabled={!hasDue || loading} size="lg">
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <GraduationCap className="h-4 w-4" />
      )}
      <span>
        {loading
          ? "Đang khởi tạo..."
          : hasDue
            ? `Bắt đầu ôn tập (${dueCount} từ)`
            : "Đã hoàn thành ôn tập"}
      </span>
    </Button>
  );
}
