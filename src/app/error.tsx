"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-6 bg-background p-4 text-center">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-destructive animate-bounce">
          Đã xảy ra lỗi hệ thống!
        </h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Có lỗi phát sinh trong quá trình xử lý giao diện. Vui lòng thử lại hoặc tải lại trang.
        </p>
      </div>
      <div className="flex gap-4">
        <Button onClick={() => reset()} variant="default">
          Thử lại
        </Button>
        <Button onClick={() => window.location.reload()} variant="outline">
          Tải lại trang
        </Button>
      </div>
    </div>
  );
}
