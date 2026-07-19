import { PageContainer } from "@/components/layout/PageContainer";
import { Skeleton } from "@/components/common/LoadingSkeleton";

export default function Loading() {
  return (
    <PageContainer className="space-y-6 md:space-y-8">
      <Skeleton className="h-20 w-full rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-2xl" />
        ))}
      </div>
    </PageContainer>
  );
}
