/* eslint-disable @typescript-eslint/no-require-imports */
const crypto = require("crypto");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";

if (!OPENAI_API_KEY) {
  console.error("Missing OPENAI_API_KEY");
  process.exit(1);
}

const endpoint = `${OPENAI_BASE_URL.replace(/\/+$/, "")}/responses`;

const EXAMPLE_INPUT = "Generate 10 TOEIC Business vocabulary words.";

function buildRequestBody(prompt) {
  return {
    model: "gpt-5.4-mini",
    input: prompt,
    text: {
      format: {
        type: "json_schema",
        name: "vocabulary_import",
        strict: true,
        schema: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["word", "ipa", "meaning", "partOfSpeech", "exampleSentence", "synonyms", "topic"],
            properties: {
              word: { type: "string" },
              ipa: { type: "string" },
              meaning: { type: "string" },
              partOfSpeech: { type: "string" },
              exampleSentence: { type: "string" },
              synonyms: { type: "array", items: { type: "string" } },
              topic: { type: "string" },
            },
          },
        },
      },
    },
  };
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function currentFullPrompt(input) {
  return `Generate vocabulary items as strict JSON only.
Return an array of objects with exactly these fields:
word, ipa, meaning, partOfSpeech, exampleSentence, synonyms, topic

Rules:
- word must stay in English.
- synonyms is an array of strings.
- If exampleSentence or synonyms are unavailable, use "" or [].
- No markdown, no explanation.

Input:
${input}`;
}

const tests = [
  {
    id: "A",
    description: "Current full prompt",
    prompt: currentFullPrompt(EXAMPLE_INPUT),
  },
  {
    id: "B",
    description: "Remove formatting instructions",
    prompt: `Return an array of objects with exactly these fields:
word, ipa, meaning, partOfSpeech, exampleSentence, synonyms, topic

Input:
${EXAMPLE_INPUT}`,
  },
  {
    id: "C",
    description: "Remove standardization rules",
    prompt: `Generate vocabulary items as strict JSON only.
Return an array of objects with exactly these fields:
word, ipa, meaning, partOfSpeech, exampleSentence, synonyms, topic

Input:
${EXAMPLE_INPUT}`,
  },
  {
    id: "D",
    description: "Only generate 10 TOEIC Business vocabulary words. Return JSON.",
    prompt: `Generate 10 TOEIC Business vocabulary words.
Return JSON.`,
  },
  {
    id: "E",
    description: "Only Hello",
    prompt: "Hello",
  },
];

async function run() {
  const summary = [];

  for (const test of tests) {
    const body = buildRequestBody(test.prompt);
    const bodyJson = JSON.stringify(body);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: bodyJson,
    });

    const responseBody = await response.text();
    summary.push({
      test: `TEST ${test.id}`,
      status: response.status,
      works: response.ok,
      notes: test.description,
    });

    console.log("=========================");
    console.log(`TEST ${test.id}`);
    console.log(test.description);
    console.log(`Prompt Length: ${test.prompt.length}`);
    console.log(`Request Size: ${Buffer.byteLength(bodyJson, "utf8")} bytes`);
    console.log(`Request Hash: ${sha256(bodyJson)}`);
    console.log(`HTTP Status: ${response.status}`);
    console.log("Response Body:");
    console.log(responseBody);
  }

  console.log("=========================");
  console.log("Summary");
  console.table(summary);
}

run().catch((error) => {
  console.error("Probe failed:", error);
  process.exit(1);
});
