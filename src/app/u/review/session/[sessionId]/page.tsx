import React from "react";
import { ReviewSessionOverview } from "@/components/features/review/ReviewSessionOverview";

import type { Metadata } from "next";
import { getReviewSessionMetadataTitle } from "@/lib/metadata-utils";

interface PageProps {
  params: Promise<{ sessionId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { sessionId } = await params;
  const title = await getReviewSessionMetadataTitle(sessionId);
  return { title };
}

export default async function ReviewSessionPage({ params }: PageProps) {
  const { sessionId } = await params;
  return <ReviewSessionOverview sessionId={sessionId} />;
}
