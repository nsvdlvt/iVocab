import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-3xl items-center justify-center px-4 py-16">
      <div className="w-full rounded-[32px] border border-border/60 bg-card p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Bài đọc không tồn tại</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Bài đọc này có thể đã bị xóa hoặc chưa được publish.
        </p>
        <Link href="/reading" className="mt-6 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted">
          <ArrowLeft className="h-4 w-4" />
          Quay lại thư viện
        </Link>
      </div>
    </main>
  );
}
