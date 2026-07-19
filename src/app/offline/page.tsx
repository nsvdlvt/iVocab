import Link from "next/link";
import { WifiOff, House, BookOpen } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { OfflineRetryButton } from "@/components/pwa/OfflineRetryButton";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Offline | Vocabee",
  description: "You are offline. Vocabee will be ready again when the connection returns.",
};

export default function OfflinePage() {
  return (
    <main className="min-h-[100dvh] flex items-center justify-center px-4 py-10 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.12),transparent_36%),linear-gradient(180deg,var(--background),var(--background))]">
      <div className="w-full max-w-2xl rounded-3xl border border-border/70 bg-card/95 p-6 sm:p-8 shadow-xl backdrop-blur">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <div className="rounded-3xl bg-blue-500/10 p-5 text-blue-600 dark:text-blue-400">
            <WifiOff className="h-10 w-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">You&apos;re offline right now</h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Vocabee needs a connection for some features, but you can try again once you&apos;re back online.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <OfflineRetryButton />
          <Link
            href={ROUTES.HOME}
            className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}
          >
            <House className="h-4 w-4" />
            Go to Home
          </Link>
          <Link
            href={ROUTES.VOCABULARY}
            className={cn(buttonVariants({ variant: "ghost" }), "rounded-xl")}
          >
            <BookOpen className="h-4 w-4" />
            Vocabulary
          </Link>
        </div>
      </div>
    </main>
  );
}
