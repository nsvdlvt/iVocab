import { customAlphabet } from "nanoid";

// Alphabet excluding easily confused characters: 0, O, 1, I
const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateVocabSetId(): string {
  const nanoid = customAlphabet(alphabet, 8);
  return `vs_${nanoid()}`;
}
