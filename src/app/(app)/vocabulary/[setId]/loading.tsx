import { PageContainer } from "@/components/layout/PageContainer";
import { Skeleton } from "@/components/common/LoadingSkeleton";

export default function Loading() {
  return (
    <PageContainer className="space-y-6">
      <Skeleton className="h-8 w-48 rounded-full" />
      <Skeleton className="h-24 w-full rounded-3xl" />
      <Skeleton className="h-16 w-64 rounded-2xl" />
      <Skeleton className="h-96 w-full rounded-3xl" />
    </PageContainer>
  );
}
