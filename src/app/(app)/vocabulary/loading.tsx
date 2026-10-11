import { PageContainer } from "@/components/layout/PageContainer";
import { Skeleton } from "@/components/common/LoadingSkeleton";

export default function Loading() {
  return (
    <PageContainer className="space-y-6">
      <div className="space-y-2 border-b border-border/80 pb-5">
        <Skeleton className="h-7 w-48 rounded-lg" />
        <Skeleton className="h-4 w-80 rounded-md" />
      </div>
      <Skeleton className="h-14 w-full rounded-xl" />
      <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-5">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-[236px] rounded-xl" />
        ))}
      </div>
    </PageContainer>
  );
}
