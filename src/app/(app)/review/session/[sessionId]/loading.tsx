import { PageContainer } from "@/components/layout/PageContainer";
import { Skeleton } from "@/components/common/LoadingSkeleton";

export default function Loading() {
  return (
    <PageContainer className="py-6 sm:py-8 space-y-6">
      <Skeleton className="h-20 w-full rounded-2xl" />
      <Skeleton className="h-96 w-full rounded-3xl" />
    </PageContainer>
  );
}
