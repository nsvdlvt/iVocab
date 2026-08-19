export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8">
      <div className="space-y-6">
        <div className="h-56 animate-pulse rounded-[32px] bg-muted/60" />
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-4 rounded-[28px] border border-border/60 bg-card p-4">
              <div className="h-48 animate-pulse rounded-[22px] bg-muted/70" />
              <div className="space-y-3">
                <div className="h-4 w-20 animate-pulse rounded bg-muted/70" />
                <div className="h-6 w-3/4 animate-pulse rounded bg-muted/70" />
                <div className="h-4 w-full animate-pulse rounded bg-muted/70" />
                <div className="h-4 w-5/6 animate-pulse rounded bg-muted/70" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
