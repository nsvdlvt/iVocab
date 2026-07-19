"use client";

import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

export function OfflineRetryButton() {
  return (
    <Button
      onClick={() => window.location.reload()}
      className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
    >
      <RotateCcw className="h-4 w-4" />
      Retry
    </Button>
  );
}
