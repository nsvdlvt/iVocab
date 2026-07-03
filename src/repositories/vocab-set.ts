/**
 * @deprecated Use domain repositories directly:
 *   - VocabSetRepository  → src/repositories/vocab-set.repository.ts
 *   - VocabularyRepository → src/repositories/vocabulary.repository.ts
 *
 * This barrel file keeps backward compatibility for Server Actions that
 * were written before the domain split. New code should import directly.
 */

export { VocabSetRepository } from "./vocab-set.repository";
export { VocabularyRepository } from "./vocabulary.repository";

import { VocabSetRepository } from "./vocab-set.repository";
import { VocabularyRepository } from "./vocabulary.repository";
import { Database } from "@/types/database";

// Legacy shim: some Server Actions call VocabSetRepository.bulkInsertVocabularyItems
// and VocabSetRepository.getVocabularyItems — delegate to VocabularyRepository.
const _VocabSetRepositoryExtended = {
  ...VocabSetRepository,

  /** @deprecated Use VocabularyRepository.getBySetId */
  async getVocabularyItems(setId: string, ownerId: string) {
    return VocabularyRepository.getBySetId(setId, ownerId);
  },

  /** @deprecated Use VocabularyRepository.bulkInsert */
  async bulkInsertVocabularyItems(
    items: Database["public"]["Tables"]["vocabularies"]["Insert"][]
  ) {
    return VocabularyRepository.bulkInsert(items);
  },
};

export { _VocabSetRepositoryExtended as VocabSetRepositoryLegacy };
