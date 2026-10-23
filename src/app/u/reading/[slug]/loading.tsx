export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8">
      <div className="space-y-4">
        <div className="h-72 animate-pulse rounded-[32px] bg-muted/60" />
        <div className="h-[36rem] animate-pulse rounded-[28px] bg-muted/50" />
      </div>
    </main>
  );
}
