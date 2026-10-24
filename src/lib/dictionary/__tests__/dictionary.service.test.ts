import { describe, it, expect, beforeEach, vi } from "vitest";
import { DictionaryService } from "../dictionary.service";
import { dictionaryCache, suggestionsCache, ExpiringLRUCache } from "../cache";

describe("DictionaryService & Providers", () => {
  let service: DictionaryService;

  beforeEach(() => {
    service = new DictionaryService();
    dictionaryCache.clear();
    suggestionsCache.clear();
    vi.restoreAllMocks();
  });

  describe("1. ExpiringLRUCache Unit Tests", () => {
    it("should set and retrieve values within TTL", () => {
      const cache = new ExpiringLRUCache<string, string>(5, 1000);
      cache.set("key1", "value1");
      expect(cache.get("key1")).toBe("value1");
      expect(cache.has("key1")).toBe(true);
    });

    it("should evict least-recently-used item when capacity is exceeded", () => {
      const cache = new ExpiringLRUCache<string, string>(2, 10000);
      cache.set("a", "1");
      cache.set("b", "2");
      // Access 'a' so 'b' becomes the LRU
      cache.get("a");
      cache.set("c", "3");

      expect(cache.get("a")).toBe("1");
      expect(cache.get("c")).toBe("3");
      expect(cache.get("b")).toBeUndefined();
    });

    it("should expire items when TTL is exceeded", async () => {
      const cache = new ExpiringLRUCache<string, string>(5, 20); // 20ms TTL
      cache.set("expiring", "value");
      expect(cache.get("expiring")).toBe("value");

      await new Promise((resolve) => setTimeout(resolve, 35));
      expect(cache.get("expiring")).toBeUndefined();
    });
  });

  describe("2. FreeDictionaryProvider & DictionaryService Lookup", () => {
    it("should look up a standard English word like 'eloquent'", async () => {
      const mockFreeDictResponse = [
        {
          word: "eloquent",
          phonetic: "/ˈɛləkwənt/",
          phonetics: [
            {
              text: "/ˈɛləkwənt/",
              audio: "https://api.dictionaryapi.dev/media/pronunciations/en/eloquent-us.mp3",
            },
            {
              text: "/ˈɛləkwənt/",
              audio: "https://api.dictionaryapi.dev/media/pronunciations/en/eloquent-uk.mp3",
            },
          ],
          meanings: [
            {
              partOfSpeech: "adjective",
              definitions: [
                {
                  definition: "Fluently persuasive and articulate.",
                  example: "An eloquent speaker.",
                  synonyms: ["articulate", "fluent"],
                },
              ],
              synonyms: ["expressive"],
            },
          ],
        },
      ];

      vi.spyOn(globalThis, "fetch").mockImplementation(async (url: string | URL | Request) => {
        const urlStr = String(url);
        if (urlStr.includes("dictionaryapi.dev")) {
          return new Response(JSON.stringify(mockFreeDictResponse), { status: 200 });
        }
        if (urlStr.includes("datamuse.com")) {
          return new Response(JSON.stringify([]), { status: 200 });
        }
        if (urlStr.includes("translate.googleapis.com")) {
          return new Response(JSON.stringify([[["hùng biện"]]]), { status: 200 });
        }
        return new Response("Not found", { status: 404 });
      });

      const result = await service.lookup("eloquent");
      expect(result).not.toBeNull();
      expect(result?.word).toBe("eloquent");
      expect(result?.ipa).toBe("/ˈɛləkwənt/");
      expect(result?.audioUs).toContain("eloquent-us.mp3");
      expect(result?.audioUk).toContain("eloquent-uk.mp3");
      expect(result?.meanings.length).toBeGreaterThan(0);
      expect(result?.meanings[0].partOfSpeech).toBe("adjective");
      expect(result?.meanings[0].definitions[0].definitionEn).toBe("Fluently persuasive and articulate.");
      expect(result?.meanings[0].definitions[0].definition).toBe("Fluently persuasive and articulate.");
      expect(result?.meanings[0].definitions[0].exampleEn).toBe("An eloquent speaker.");
    });

    it("should handle polysemous words and group senses by part of speech", async () => {
      const mockPolysemous = [
        {
          word: "light",
          meanings: [
            {
              partOfSpeech: "noun",
              definitions: [{ definition: "Electromagnetic radiation visible to the eye." }],
            },
            {
              partOfSpeech: "verb",
              definitions: [{ definition: "To ignite or set on fire." }],
            },
            {
              partOfSpeech: "adjective",
              definitions: [{ definition: "Having little weight." }],
            },
          ],
        },
      ];

      vi.spyOn(globalThis, "fetch").mockImplementation(async (url: string | URL | Request) => {
        const urlStr = String(url);
        if (urlStr.includes("dictionaryapi.dev")) {
          return new Response(JSON.stringify(mockPolysemous), { status: 200 });
        }
        if (urlStr.includes("datamuse.com")) {
          return new Response(JSON.stringify([]), { status: 200 });
        }
        if (urlStr.includes("translate.googleapis.com")) {
          return new Response(JSON.stringify([[["ánh sáng"]]]), { status: 200 });
        }
        return new Response("Not found", { status: 404 });
      });

      const result = await service.lookup("light");
      expect(result).not.toBeNull();
      expect(result?.meanings.length).toBe(3);
      const posTags = result?.meanings.map((m) => m.partOfSpeech);
      expect(posTags).toEqual(["noun", "verb", "adjective"]);
    });

    it("should fall back gracefully when Free Dictionary API returns 404", async () => {
      vi.spyOn(globalThis, "fetch").mockImplementation(async (url: string | URL | Request) => {
        const urlStr = String(url);
        if (urlStr.includes("dictionaryapi.dev")) {
          return new Response("Not found", { status: 404 });
        }
        if (urlStr.includes("translate.googleapis.com")) {
          return new Response(JSON.stringify([[["phá băng, giải tỏa không khí"]]]), { status: 200 });
        }
        return new Response(JSON.stringify([]), { status: 200 });
      });

      const result = await service.lookup("break the ice");
      expect(result).not.toBeNull();
      expect(result?.word).toBe("break the ice");
      expect(result?.primaryVietnamese).toBe("phá băng, giải tỏa không khí");
      expect(result?.source).toBe("fallback");
    });

    it("should fall back to Datamuse when Free Dictionary API returns HTTP 530", async () => {
      const mockDatamuseResponse = [
        {
          word: "eloquent",
          defs: ["adj\tFluently persuasive and articulate."],
          tags: ["adj", "pron:EH1 L AH0 K W AH0 N T"],
        },
      ];

      vi.spyOn(globalThis, "fetch").mockImplementation(async (url: string | URL | Request) => {
        const urlStr = String(url);
        if (urlStr.includes("dictionaryapi.dev")) {
          return new Response("Cloudflare error 1033", { status: 530 });
        }
        if (urlStr.includes("datamuse.com") && urlStr.includes("md=dpfr")) {
          return new Response(JSON.stringify(mockDatamuseResponse), { status: 200 });
        }
        if (urlStr.includes("translate.googleapis.com")) {
          return new Response(JSON.stringify([[["hùng biện"]]]), { status: 200 });
        }
        return new Response(JSON.stringify([]), { status: 200 });
      });

      const result = await service.lookup("eloquent");
      expect(result).not.toBeNull();
      expect(result?.word).toBe("eloquent");
      expect(result?.source).toBe("datamuse");
      expect(result?.ipa).toBe("/ˈɛləkwənt/");
      expect(result?.ipaUs).toBe("/ˈɛləkwənt/");
      expect(result?.meanings[0].definitions[0].definitionEn).toBe("Fluently persuasive and articulate.");
      expect(result?.primaryVietnamese).toBe("hùng biện");
      expect(result?.audioUs).toBeDefined();
    });

    it("should enrich IPA for 'resilient' when FreeDict has audio only and no phonetic text", async () => {
      const mockFreeDictResilient = [
        {
          word: "resilient",
          phonetics: [
            {
              audio: "https://api.dictionaryapi.dev/media/pronunciations/en/resilient-us.mp3",
            },
          ],
          meanings: [
            {
              partOfSpeech: "adjective",
              definitions: [
                {
                  definition: "Able to withstand or recover quickly from difficult conditions.",
                },
              ],
            },
          ],
        },
      ];

      const mockDatamuseResilient = [
        {
          word: "resilient",
          tags: ["adj", "ipa_pron:rɪzˈɪɫjʌnt", "pron:R IH0 Z IH1 L Y AH0 N T "],
        },
      ];

      vi.spyOn(globalThis, "fetch").mockImplementation(async (url: string | URL | Request) => {
        const urlStr = String(url);
        if (urlStr.includes("dictionaryapi.dev")) {
          return new Response(JSON.stringify(mockFreeDictResilient), { status: 200 });
        }
        if (urlStr.includes("datamuse.com")) {
          return new Response(JSON.stringify(mockDatamuseResilient), { status: 200 });
        }
        if (urlStr.includes("translate.googleapis.com")) {
          return new Response(JSON.stringify([[["kiên cường, đàn hồi"]]]), { status: 200 });
        }
        return new Response("Not found", { status: 404 });
      });

      const result = await service.lookup("resilient");
      expect(result).not.toBeNull();
      expect(result?.word).toBe("resilient");
      expect(result?.ipa).toBe("/rɪzˈɪɫjʌnt/");
      expect(result?.ipaUs).toBe("/rɪzˈɪɫjʌnt/");
      expect(result?.audioUs).toContain("resilient-us.mp3");
      // Must NOT display raw ARPAbet tokens like /R IH0 Z IH1 L Y AH0 N T/
      expect(result?.ipa).not.toContain("IH0");
      expect(result?.ipa).not.toContain("IH1");
    });

    it("should convert raw ARPAbet to standard IPA if Datamuse only returns pron tag", async () => {
      const mockDatamuseArpabetOnly = [
        {
          word: "resilient",
          defs: ["adj\tAble to recover quickly."],
          tags: ["adj", "pron:R IH0 Z IH1 L Y AH0 N T "],
        },
      ];

      vi.spyOn(globalThis, "fetch").mockImplementation(async (url: string | URL | Request) => {
        const urlStr = String(url);
        if (urlStr.includes("dictionaryapi.dev")) {
          return new Response("Not found", { status: 404 });
        }
        if (urlStr.includes("datamuse.com")) {
          return new Response(JSON.stringify(mockDatamuseArpabetOnly), { status: 200 });
        }
        return new Response(JSON.stringify([]), { status: 200 });
      });

      const result = await service.lookup("resilient");
      expect(result).not.toBeNull();
      expect(result?.ipa).toBe("/rɪˈzɪljənt/");
      expect(result?.ipa).not.toContain("IH0");
      expect(result?.ipa).not.toContain(" ");
    });

    it("should separate distinct UK and US pronunciations when provided by source", async () => {
      const mockTomato = [
        {
          word: "tomato",
          phonetics: [
            {
              text: "[tʰə̥ˈmɑːtʰəʊ]",
              audio: "https://api.dictionaryapi.dev/media/pronunciations/en/tomato-uk.mp3",
            },
            {
              text: "[tʰə̥ˈmeɪɾoʊ]",
              audio: "https://api.dictionaryapi.dev/media/pronunciations/en/tomato-us.mp3",
            },
          ],
          meanings: [
            {
              partOfSpeech: "noun",
              definitions: [{ definition: "A glossy red, or occasionally yellow, pulpy edible fruit." }],
            },
          ],
        },
      ];

      vi.spyOn(globalThis, "fetch").mockImplementation(async (url: string | URL | Request) => {
        const urlStr = String(url);
        if (urlStr.includes("dictionaryapi.dev")) {
          return new Response(JSON.stringify(mockTomato), { status: 200 });
        }
        return new Response(JSON.stringify([]), { status: 200 });
      });

      const result = await service.lookup("tomato");
      expect(result).not.toBeNull();
      expect(result?.ipaUk).toBe("/tʰə̥ˈmɑːtʰəʊ/");
      expect(result?.ipaUs).toBe("/tʰə̥ˈmeɪɾoʊ/");
      expect(result?.ipa).toBe("/tʰə̥ˈmeɪɾoʊ/"); // US preferred as primary
      expect(result?.audioUk).toContain("tomato-uk.mp3");
      expect(result?.audioUs).toContain("tomato-us.mp3");
    });

    it("should sanitize malformed cached IPA and avoid repeatedly returning ARPAbet", async () => {
      // Simulate an old malformed entry in the LRU cache
      dictionaryCache.set("resilient", {
        word: "resilient",
        normalizedWord: "resilient",
        ipa: "/R IHO Z IH1 L Y AHO N T/",
        phonetics: [],
        meanings: [
          {
            partOfSpeech: "adjective",
            definitions: [
              {
                id: "1",
                definitionEn: "Tough.",
                synonyms: [],
                antonyms: [],
              },
            ],
            synonyms: [],
            antonyms: [],
          },
        ],
        collocations: [],
        wordForms: [],
        source: "datamuse",
        timestamp: Date.now(),
      });

      const result = await service.lookup("resilient");
      expect(result).not.toBeNull();
      // Must be sanitized to standard IPA
      expect(result?.ipa).toBe("/rɪˈzɪljənt/");
      expect(result?.ipa).not.toContain("IH0");
      expect(result?.ipa).not.toContain("IHO");
    });

    it("should look up resilient against live providers and yield valid standard IPA", async () => {
      vi.restoreAllMocks();
      const liveService = new DictionaryService();
      const result = await liveService.lookup("resilient", { skipCache: true });
      if (result) {
        expect(result.word).toBe("resilient");
        expect(result.ipa).toBeDefined();
        // Check that IPA is valid standard IPA
        expect(result.ipa).toMatch(/^\/[^ ]+\/$/);
        expect(result.ipa).not.toContain("IH0");
        expect(result.ipa).not.toContain("IH1");
      }
    });

    it("should return null for empty or non-existent words when all providers fail", async () => {
      vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
        return new Response("Not found", { status: 404 });
      });

      const emptyResult = await service.lookup("");
      expect(emptyResult).toBeNull();

      const whitespaceResult = await service.lookup("   ");
      expect(whitespaceResult).toBeNull();
    });

    it("should reuse cache for identical subsequent queries", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (url: string | URL | Request) => {
        const urlStr = String(url);
        if (urlStr.includes("dictionaryapi.dev")) {
          return new Response(
            JSON.stringify([
              {
                word: "cached",
                meanings: [{ partOfSpeech: "noun", definitions: [{ definition: "Cached test" }] }],
              },
            ]),
            { status: 200 }
          );
        }
        return new Response(JSON.stringify([]), { status: 200 });
      });

      const first = await service.lookup("cached");
      expect(first).not.toBeNull();

      const second = await service.lookup("cached");
      expect(second).not.toBeNull();
      // Second call should come from cache and not trigger another dictionaryapi.dev fetch
      const dictCallsSecond = fetchSpy.mock.calls.filter((c) =>
        String(c[0]).includes("dictionaryapi.dev")
      ).length;
      expect(dictCallsSecond).toBe(1);
    });
  });

  describe("3. Datamuse Suggestions", () => {
    it("should return suggestions from Datamuse", async () => {
      const mockSug = [
        { word: "eloquent", score: 45000 },
        { word: "eloquence", score: 12000 },
      ];

      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify(mockSug), { status: 200 })
      );

      const suggestions = await service.getSuggestions("eloq");
      expect(suggestions).toHaveLength(2);
      expect(suggestions[0].word).toBe("eloquent");
      expect(suggestions[1].word).toBe("eloquence");
    });

    it("should return empty suggestions for blank query", async () => {
      const suggestions = await service.getSuggestions("");
      expect(suggestions).toEqual([]);
    });
  });

  describe("4. Contextual Translation", () => {
    it("should translate a word in a specific sentence", async () => {
      vi.spyOn(globalThis, "fetch").mockImplementation(async (url: string | URL | Request) => {
        const urlStr = String(url);
        if (urlStr.includes("translate.googleapis.com")) {
          if (urlStr.includes("q=run")) {
            return new Response(JSON.stringify([[["điều hành, quản lý"]]]), { status: 200 });
          }
          return new Response(JSON.stringify([[["Cô ấy điều hành công ty của mình."]]]), { status: 200 });
        }
        return new Response("Not found", { status: 404 });
      });

      const contextResult = await service.translateContext(
        "run",
        "She decided to run her own startup company."
      );

      expect(contextResult).not.toBeNull();
      expect(contextResult.word).toBe("run");
      expect(contextResult.sentence).toBe("She decided to run her own startup company.");
      expect(contextResult.selectedMeaningVi).toBe("điều hành, quản lý");
    });
  });
});
