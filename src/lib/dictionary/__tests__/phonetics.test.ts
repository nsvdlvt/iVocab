import { describe, it, expect } from "vitest";
import {
  isArpabet,
  arpabetToIpa,
  normalizeIpa,
  isReliableIpa,
  extractPhoneticsInfo,
} from "../phonetics";

describe("Phonetics & IPA Normalization", () => {
  describe("1. isArpabet detection", () => {
    it("should detect ARPAbet phoneme sequences with stress digits", () => {
      expect(isArpabet("R IH0 Z IH1 L Y AH0 N T")).toBe(true);
      expect(isArpabet("/R IH0 Z IH1 L Y AH0 N T/")).toBe(true);
      expect(isArpabet("EH1 L AH0 K W AH0 N T")).toBe(true);
      expect(isArpabet("D IH1 L IH0 JH AH0 N T")).toBe(true);
      expect(isArpabet("T AH0 M EY1 T OW0")).toBe(true);
      expect(isArpabet("pron:R IH0 Z IH1 L Y AH0 N T ")).toBe(true);
    });

    it("should handle letter 'O' mistyped for digit '0'", () => {
      expect(isArpabet("/R IHO Z IH1 L Y AHO N T/")).toBe(true);
      expect(isArpabet("R IHO Z IH1 L Y AHO N T")).toBe(true);
    });

    it("should return false for valid standard IPA strings", () => {
      expect(isArpabet("/rɪˈzɪliənt/")).toBe(false);
      expect(isArpabet("/ˈɛləkwənt/")).toBe(false);
      expect(isArpabet("[tʰə̥ˈmɑːtʰəʊ]")).toBe(false);
      expect(isArpabet("/ˈdɪlɪdʒənt/")).toBe(false);
    });

    it("should return false for plain English words and invalid inputs", () => {
      expect(isArpabet("resilient")).toBe(false);
      expect(isArpabet("")).toBe(false);
      expect(isArpabet(null)).toBe(false);
      expect(isArpabet(undefined)).toBe(false);
    });
  });

  describe("2. arpabetToIpa conversion", () => {
    it("should convert 'resilient' ARPAbet to valid standard IPA", () => {
      const ipa = arpabetToIpa("R IH0 Z IH1 L Y AH0 N T");
      expect(ipa).toBe("/rɪˈzɪljənt/");
    });

    it("should convert ARPAbet with 'O' typo for '0'", () => {
      const ipa = arpabetToIpa("/R IHO Z IH1 L Y AHO N T/");
      expect(ipa).toBe("/rɪˈzɪljənt/");
    });

    it("should convert 'eloquent' ARPAbet with initial stress", () => {
      const ipa = arpabetToIpa("EH1 L AH0 K W AH0 N T");
      expect(ipa).toBe("/ˈɛləkwənt/");
    });

    it("should convert 'diligent' ARPAbet", () => {
      const ipa = arpabetToIpa("D IH1 L IH0 JH AH0 N T");
      expect(ipa).toBe("/ˈdɪlɪdʒənt/");
    });

    it("should convert 'tomato' ARPAbet with medial stress", () => {
      const ipa = arpabetToIpa("T AH0 M EY1 T OW0");
      expect(ipa).toBe("/təˈmeɪtoʊ/");
    });

    it("should convert 'schedule' with consonant cluster onset", () => {
      const ipa = arpabetToIpa("S K EH1 JH UH0 L");
      expect(ipa).toBe("/ˈskɛdʒʊl/");
    });

    it("should return undefined for invalid or empty ARPAbet strings", () => {
      expect(arpabetToIpa("")).toBeUndefined();
      expect(arpabetToIpa("INVALID_PHONEME_XYZ")).toBeUndefined();
    });
  });

  describe("3. normalizeIpa", () => {
    it("should normalize ARPAbet string into standard IPA with slashes", () => {
      expect(normalizeIpa("/R IHO Z IH1 L Y AHO N T/")).toBe("/rɪˈzɪljənt/");
      expect(normalizeIpa("R IH0 Z IH1 L Y AH0 N T")).toBe("/rɪˈzɪljənt/");
    });

    it("should normalize Datamuse ipa_pron string", () => {
      expect(normalizeIpa("ipa_pron:rɪzˈɪɫjʌnt")).toBe("/rɪzˈɪɫjʌnt/");
      expect(normalizeIpa("ipa_pron:ˈɛɫʌkwʌnt")).toBe("/ˈɛɫʌkwʌnt/");
    });

    it("should replace square brackets with standard slashes", () => {
      expect(normalizeIpa("[tʰə̥ˈmɑːtʰəʊ]")).toBe("/tʰə̥ˈmɑːtʰəʊ/");
    });

    it("should convert ASCII stress marks to standard IPA symbols", () => {
      expect(normalizeIpa("/'ɛləkwənt/")).toBe("/ˈɛləkwənt/");
      expect(normalizeIpa("/'dɪlɪdʒənt/")).toBe("/ˈdɪlɪdʒənt/");
    });

    it("should reject corrupted strings with question marks or replacement chars", () => {
      expect(normalizeIpa("/'?l?kw?nt/")).toBeUndefined();
      expect(normalizeIpa("/???/")).toBeUndefined();
    });

    it("should return undefined for empty or invalid text", () => {
      expect(normalizeIpa("")).toBeUndefined();
      expect(normalizeIpa("   ")).toBeUndefined();
      expect(normalizeIpa(undefined)).toBeUndefined();
      expect(normalizeIpa(null)).toBeUndefined();
    });
  });

  describe("4. isReliableIpa", () => {
    it("should validate standard IPA", () => {
      expect(isReliableIpa("/ˈɛləkwənt/")).toBe(true);
      expect(isReliableIpa("/rɪˈzɪljənt/")).toBe(true);
      expect(isReliableIpa("/tʰə̥ˈmɑːtʰəʊ/")).toBe(true);
    });

    it("should reject ARPAbet or corrupted strings", () => {
      expect(isReliableIpa("/R IH0 Z IH1 L Y AH0 N T/")).toBe(false);
      expect(isReliableIpa("/?l?kw?nt/")).toBe(false);
      expect(isReliableIpa("")).toBe(false);
      expect(isReliableIpa(null)).toBe(false);
    });
  });

  describe("5. extractPhoneticsInfo (UK/US Variants)", () => {
    it("should separate UK and US variants when audio indicates region", () => {
      const raw = [
        {
          text: "[tʰə̥ˈmɑːtʰəʊ]",
          audio: "https://api.dictionaryapi.dev/media/pronunciations/en/tomato-uk.mp3",
        },
        {
          text: "[tʰə̥ˈmeɪɾoʊ]",
          audio: "https://api.dictionaryapi.dev/media/pronunciations/en/tomato-us.mp3",
        },
      ];

      const res = extractPhoneticsInfo(raw);
      expect(res.ipaUk).toBe("/tʰə̥ˈmɑːtʰəʊ/");
      expect(res.ipaUs).toBe("/tʰə̥ˈmeɪɾoʊ/");
      expect(res.audioUk).toContain("tomato-uk.mp3");
      expect(res.audioUs).toContain("tomato-us.mp3");
      expect(res.ipa).toBe("/tʰə̥ˈmeɪɾoʊ/"); // prefers US as primary
    });

    it("should fall back gracefully when only general phonetic is available", () => {
      const raw = [
        {
          audio: "https://api.dictionaryapi.dev/media/pronunciations/en/word-us.mp3",
        },
      ];

      const res = extractPhoneticsInfo(raw, "/ˈwɜːrd/");
      expect(res.ipa).toBe("/ˈwɜːrd/");
      expect(res.audioUs).toContain("word-us.mp3");
    });
  });
});
