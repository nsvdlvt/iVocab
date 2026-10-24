/**
 * Phonetic notation conversion and IPA normalization utilities.
 * Handles ARPAbet (CMUdict) to IPA conversion, standard IPA normalization,
 * UK/US variant extraction, and malformed transcription detection.
 */

import type { DictionaryPhonetic } from "@/types/dictionary";

export interface RawPhoneticInput {
  text?: string;
  audio?: string;
  sourceUrl?: string;
}

export interface ExtractedPhonetics {
  ipa?: string;
  ipaUk?: string;
  ipaUs?: string;
  audioUk?: string;
  audioUs?: string;
  phonetics: DictionaryPhonetic[];
}

/**
 * ARPAbet vowel phonemes mapping to standard IPA.
 * CMUdict uses numeric digits 0 (unstressed), 1 (primary stress), 2 (secondary stress).
 */
const ARPABET_VOWELS: Record<string, string | { stressed: string; unstressed: string }> = {
  AA: "ɑː", // odd, balm
  AE: "æ", // at, bat
  AH: { stressed: "ʌ", unstressed: "ə" }, // hut (stressed) vs ago (unstressed)
  AO: "ɔː", // caught, ought
  AW: "aʊ", // cow, how
  AY: "aɪ", // hide, my
  EH: "ɛ", // ed, red
  ER: { stressed: "ɜːr", unstressed: "ər" }, // hurt vs perhaps
  EY: "eɪ", // ate, say
  IH: "ɪ", // it, sit
  IY: "iː", // eat, see
  OW: "oʊ", // oat, boat
  OY: "ɔɪ", // toy, boy
  UH: "ʊ", // hood, could
  UW: "uː", // two, blue
};

/**
 * ARPAbet consonant phonemes mapping to standard IPA.
 */
const ARPABET_CONSONANTS: Record<string, string> = {
  B: "b",
  CH: "tʃ",
  D: "d",
  DH: "ð",
  F: "f",
  G: "ɡ",
  HH: "h",
  JH: "dʒ",
  K: "k",
  L: "l",
  M: "m",
  N: "n",
  NG: "ŋ",
  P: "p",
  R: "r",
  S: "s",
  SH: "ʃ",
  T: "t",
  TH: "θ",
  V: "v",
  W: "w",
  Y: "j",
  Z: "z",
  ZH: "ʒ",
  DX: "ɾ", // alveolar tap (e.g. butter in American English)
  Q: "ʔ", // glottal stop
};

/**
 * Common English syllable onset consonant clusters.
 */
const ONSET_CLUSTERS_3 = new Set(["SPR", "STR", "SKR", "SPL", "SKW"]);
const ONSET_CLUSTERS_2 = new Set([
  "PR", "BR", "TR", "DR", "KR", "GR", "PL", "BL", "KL", "GL",
  "TW", "DW", "KW", "GW", "FR", "FL", "THR", "SHR",
  "SP", "ST", "SK", "SM", "SN", "SL", "SW",
]);

/**
 * Checks whether an input string is in ARPAbet notation (e.g. "R IH0 Z IH1 L Y AH0 N T" or "/R IHO Z IH1 L Y AHO N T/").
 */
export function isArpabet(text: string | null | undefined): boolean {
  if (!text || typeof text !== "string") return false;

  const clean = text
    .replace(/^pron:\s*/i, "")
    .replace(/^ipa_pron:\s*/i, "")
    .replace(/^\/+|\/+$/g, "")
    .replace(/^\[+|\]+$/g, "")
    .trim();

  if (!clean) return false;

  // Genuine IPA strings contain distinctive IPA characters or lowercase letters
  if (/[əɪɛæʊʌɔθðʃʒŋʔː]/.test(clean)) return false;

  const tokens = clean.split(/\s+/);
  if (tokens.length === 0) return false;

  let hasVowelWithStress = false;
  let allTokensMatch = true;

  for (const rawToken of tokens) {
    // Also handle letter 'O' mistyped for digit '0' (e.g. IHO, AHO)
    const t = rawToken.toUpperCase().replace(/O$/, "0");
    const match = t.match(/^([A-Z]+)([012])?$/);
    if (!match) {
      allTokensMatch = false;
      break;
    }
    const [, base, stressStr] = match;
    if (ARPABET_VOWELS[base]) {
      if (stressStr !== undefined) {
        hasVowelWithStress = true;
      }
    } else if (!ARPABET_CONSONANTS[base]) {
      allTokensMatch = false;
      break;
    }
  }

  return (
    allTokensMatch &&
    (hasVowelWithStress ||
      (tokens.length > 1 && tokens.every((t) => /^[A-Z]{1,3}[012]?$/.test(t))))
  );
}

/**
 * Converts ARPAbet phonetic notation to standard IPA with correct stress marks and slash delimiters.
 * Example: "R IH0 Z IH1 L Y AH0 N T" -> "/rɪˈzɪljənt/"
 */
export function arpabetToIpa(arpabetStr: string | null | undefined): string | undefined {
  if (!arpabetStr || typeof arpabetStr !== "string") return undefined;

  const clean = arpabetStr
    .replace(/^pron:\s*/i, "")
    .replace(/[\/\[\]]/g, " ")
    .trim();

  if (!clean) return undefined;

  const tokens = clean.split(/\s+/);
  const parsed: Array<{
    base: string;
    stress: number | null;
    isVowel: boolean;
    ipa: string;
  }> = [];

  for (const rawToken of tokens) {
    const t = rawToken.toUpperCase().replace(/O$/, "0");
    const match = t.match(/^([A-Z]+)([012])?$/);
    if (!match) return undefined;

    const [, base, stressStr] = match;
    const stress = stressStr !== undefined ? parseInt(stressStr, 10) : null;

    if (ARPABET_VOWELS[base]) {
      const v = ARPABET_VOWELS[base];
      let ipaChar: string;
      if (typeof v === "object") {
        ipaChar = stress === 1 || stress === 2 ? v.stressed : v.unstressed;
      } else {
        ipaChar = v;
      }
      parsed.push({ base, stress: stress ?? 0, isVowel: true, ipa: ipaChar });
    } else if (ARPABET_CONSONANTS[base]) {
      parsed.push({ base, stress: null, isVowel: false, ipa: ARPABET_CONSONANTS[base] });
    } else {
      return undefined;
    }
  }

  // Determine stress placement (before syllable onset)
  const stressMarkers = new Map<number, "ˈ" | "ˌ">();

  for (let i = 0; i < parsed.length; i++) {
    const item = parsed[i];
    if (item.isVowel && (item.stress === 1 || item.stress === 2)) {
      const mark: "ˈ" | "ˌ" = item.stress === 1 ? "ˈ" : "ˌ";

      let consonantCount = 0;
      for (let j = i - 1; j >= 0; j--) {
        if (parsed[j].isVowel) break;
        consonantCount++;
      }

      let onsetIdx = i;
      if (consonantCount === 0) {
        onsetIdx = i;
      } else if (i - consonantCount === 0) {
        // At start of word, entire onset cluster takes the stress
        onsetIdx = 0;
      } else if (consonantCount === 1) {
        onsetIdx = i - 1;
      } else if (consonantCount >= 3) {
        const c3 = parsed[i - 3].base + parsed[i - 2].base + parsed[i - 1].base;
        if (ONSET_CLUSTERS_3.has(c3)) {
          onsetIdx = i - 3;
        } else {
          const c2 = parsed[i - 2].base + parsed[i - 1].base;
          if (ONSET_CLUSTERS_2.has(c2)) {
            onsetIdx = i - 2;
          } else {
            onsetIdx = i - 1;
          }
        }
      } else if (consonantCount >= 2) {
        const c2 = parsed[i - 2].base + parsed[i - 1].base;
        if (ONSET_CLUSTERS_2.has(c2)) {
          onsetIdx = i - 2;
        } else {
          onsetIdx = i - 1;
        }
      }

      stressMarkers.set(onsetIdx, mark);
    }
  }

  let result = "";
  for (let i = 0; i < parsed.length; i++) {
    if (stressMarkers.has(i)) {
      result += stressMarkers.get(i);
    }
    result += parsed[i].ipa;
  }

  return `/${result}/`;
}

/**
 * Normalizes an IPA string:
 * - Detects ARPAbet and converts it to IPA.
 * - Replaces ASCII single quotes (') or backticks with IPA primary stress (ˈ).
 * - Replaces commas (,) with IPA secondary stress (ˌ).
 * - Strips redundant brackets ([...]) and ensures valid /.../ slash delimiters.
 * - Rejects corrupted characters (e.g. ?, ) or empty tokens.
 */
export function normalizeIpa(raw: string | null | undefined): string | undefined {
  if (!raw || typeof raw !== "string") return undefined;

  const text = raw
    .replace(/^ipa_pron:\s*/i, "")
    .replace(/^pron:\s*/i, "")
    .trim();

  if (!text) return undefined;

  // Check if string is ARPAbet
  if (isArpabet(text)) {
    return arpabetToIpa(text);
  }

  // Strip wrapping slashes or brackets
  let inside = text
    .replace(/^\/+|\/+$/g, "")
    .replace(/^\[+|\]+$/g, "")
    .trim();

  if (!inside) return undefined;

  // Replace ASCII stress markers with standard IPA symbols
  inside = inside.replace(/['`‘’]/g, "ˈ");
  inside = inside.replace(/[,]/g, "ˌ");

  // Reject strings containing unresolved placeholders or corrupted characters
  if (/[?]/.test(inside)) {
    return undefined;
  }

  // Reject leftover space-separated uppercase tokens (unconverted ARPAbet)
  if (/\b[A-Z]{2,}[012]?\b/.test(inside) && /\s/.test(inside)) {
    return undefined;
  }

  // Standardize IPA dark l (ɫ) to standard l for consistency, or keep standard IPA
  inside = inside.replace(/\s+/g, " ").trim();

  return `/${inside}/`;
}

/**
 * Determines whether a string is a reliable IPA transcription.
 */
export function isReliableIpa(text: string | null | undefined): boolean {
  if (!text || typeof text !== "string") return false;
  const clean = text.trim();
  if (!clean.startsWith("/") || !clean.endsWith("/")) return false;
  if (clean.length < 3) return false;
  if (/[?]/.test(clean)) return false;
  if (isArpabet(clean)) return false;
  return true;
}

/**
 * Extracts and separates UK and US phonetic transcriptions and audio URLs
 * from a raw list of phonetic entries.
 */
export function extractPhoneticsInfo(
  rawPhonetics: RawPhoneticInput[] | undefined,
  generalPhonetic?: string
): ExtractedPhonetics {
  const phoneticsList: DictionaryPhonetic[] = [];
  let audioUk: string | undefined;
  let audioUs: string | undefined;
  let ipaUk: string | undefined;
  let ipaUs: string | undefined;
  let fallbackIpa: string | undefined = normalizeIpa(generalPhonetic);

  if (Array.isArray(rawPhonetics)) {
    for (const p of rawPhonetics) {
      const audioUrl = p.audio?.trim();
      const rawText = p.text?.trim();
      const cleanText = normalizeIpa(rawText);

      let region: "uk" | "us" | "general" = "general";

      if (audioUrl) {
        const lowerAudio = audioUrl.toLowerCase();
        if (
          lowerAudio.includes("-uk.") ||
          lowerAudio.includes("/uk/") ||
          lowerAudio.includes("-uk-") ||
          lowerAudio.includes("-gb.") ||
          lowerAudio.includes("/gb/")
        ) {
          region = "uk";
          if (!audioUk) audioUk = audioUrl;
          if (cleanText && !ipaUk) ipaUk = cleanText;
        } else if (
          lowerAudio.includes("-us.") ||
          lowerAudio.includes("/us/") ||
          lowerAudio.includes("-us-")
        ) {
          region = "us";
          if (!audioUs) audioUs = audioUrl;
          if (cleanText && !ipaUs) ipaUs = cleanText;
        } else if (lowerAudio.includes("-au.") || lowerAudio.includes("/au/")) {
          region = "general";
        } else if (!audioUs && !audioUk) {
          audioUs = audioUrl;
        }
      }

      if (cleanText && !fallbackIpa) {
        fallbackIpa = cleanText;
      }

      if (cleanText || audioUrl) {
        phoneticsList.push({
          text: cleanText,
          audio: audioUrl,
          region,
        });
      }
    }
  }

  // Determine primary IPA: prefer US or UK or fallback
  const ipa = ipaUs || fallbackIpa || ipaUk;

  return {
    ipa,
    ipaUk,
    ipaUs,
    audioUk,
    audioUs,
    phonetics: phoneticsList,
  };
}
