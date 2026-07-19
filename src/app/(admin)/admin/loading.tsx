import { Skeleton } from "@/components/common/LoadingSkeleton";

export default function Loading() {
  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <div className="hidden lg:block w-[280px] p-4">
        <Skeleton className="h-full w-full rounded-3xl" />
      </div>
      <div className="flex-1 p-4 sm:p-6">
        <Skeleton className="h-[calc(100vh-2rem)] w-full rounded-3xl" />
      </div>
    </div>
  );
}
