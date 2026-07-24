import React from "react";

import { PageContainer } from "@/components/layout/PageContainer";
import { VocabularyEditor } from "@/components/features/vocabulary/VocabularyEditor";
import { requireUser } from "@/lib/auth/require-user";

export const dynamic = "force-dynamic";

export default async function NewVocabularySetPage() {
  await requireUser();

  return (
    <PageContainer>
      <div className="flex flex-col">
        <VocabularyEditor />
      </div>
    </PageContainer>
  );
}
