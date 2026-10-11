"use client";

import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

export function OfflineRetryButton() {
  return (
    <Button onClick={() => window.location.reload()}>
      <RotateCcw className="h-4 w-4" />
      <span>Thử kết nối lại</span>
    </Button>
  );
}
