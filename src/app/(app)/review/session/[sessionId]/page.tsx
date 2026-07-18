import React from "react";
import { ReviewSessionOverview } from "@/components/features/review/ReviewSessionOverview";

interface PageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function ReviewSessionPage({ params }: PageProps) {
  const { sessionId } = await params;
  return <ReviewSessionOverview sessionId={sessionId} />;
}
