import { WifiOff } from "lucide-react";
import { OfflineRetryButton } from "@/components/pwa/OfflineRetryButton";

export const metadata = {
  title: "Ngoại tuyến | Vocabee",
  description: "Bạn đang ngoại tuyến. Vocabee sẽ sẵn sàng trở lại khi có kết nối.",
};

export default function OfflinePage() {
  return (
    <main className="min-h-[100dvh] flex items-center justify-center px-4 py-10 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.12),transparent_36%),linear-gradient(180deg,var(--background),var(--background))]">
      <div className="w-full max-w-xl rounded-3xl border border-border/70 bg-card/95 p-7 shadow-xl backdrop-blur sm:p-8">
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <WifiOff className="h-10 w-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Bạn đang ngoại tuyến</h1>
            <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
              Vocabee cần kết nối mạng để tải nội dung. Hãy kiểm tra mạng của bạn và thử lại sau.
            </p>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <OfflineRetryButton />
        </div>
      </div>
    </main>
  );
}
