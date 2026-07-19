import { PageContainer } from "@/components/layout/PageContainer";
import { Skeleton } from "@/components/common/LoadingSkeleton";

export default function Loading() {
  return (
    <PageContainer className="max-w-5xl space-y-6 md:space-y-8">
      <Skeleton className="h-20 w-full rounded-2xl" />
      <Skeleton className="h-40 w-full rounded-3xl" />
      <Skeleton className="h-40 w-full rounded-3xl" />
    </PageContainer>
  );
}
