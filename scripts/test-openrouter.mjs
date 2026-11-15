import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const apiKey = process.env.OPENROUTER_API_KEY;
const baseURL = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";

const tools = [
  {
    type: "function",
    function: {
      name: "get_vocabulary_overview",
      description: "Lấy thống kê tổng quan về từ vựng của người dùng",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
];

async function testFullLoop(model) {
  console.log(`\n--- Testing full tool execution loop for: ${model} ---`);
  const messages = [
    {
      role: "system",
      content: "Bạn là Vocabee AI Assistant. Hãy trả lời tiếng Việt. Khi người dùng hỏi về từ vựng hoặc tiến độ, bạn BẮT BUỘC phải gọi tool thích hợp.",
    },
    {
      role: "user",
      content: "Tôi hiện có bao nhiêu từ vựng trong kho? Hãy kiểm tra giúp tôi.",
    },
  ];

  try {
    const res1 = await fetch(`${baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://vocabee.site",
        "X-Title": "Vocabee AI Assistant",
      },
      body: JSON.stringify({
        model,
        messages,
        tools,
        tool_choice: "auto",
        temperature: 0.1,
      }),
    });

    const data1 = await res1.json();
    if (!res1.ok) {
      console.log(`Step 1 failed (${res1.status}):`, data1.error?.message || data1);
      return;
    }

    const choice1 = data1.choices?.[0];
    const msg1 = choice1?.message;
    console.log("Step 1 finish_reason:", choice1?.finish_reason);

    if (!msg1?.tool_calls || msg1.tool_calls.length === 0) {
      console.log("Model did not call tools. Content:", msg1?.content);
      return;
    }

    const toolCall = msg1.tool_calls[0];
    console.log(`Step 1: Model called tool "${toolCall.function.name}" with args: ${toolCall.function.arguments}`);

    // Append assistant's tool_calls message
    messages.push(msg1);

    // Simulate backend tool response
    const mockToolResult = {
      status: "success",
      data: {
        totalWords: 45,
        masteredWords: 15,
        learningWords: 20,
        newWords: 10,
        cefrDistribution: { A1: 15, A2: 15, B1: 10, B2: 5 },
      },
      summary: "Tổng cộng 45 từ vựng (15 đã thuộc, 20 đang học, 10 từ mới).",
    };

    messages.push({
      role: "tool",
      tool_call_id: toolCall.id,
      content: JSON.stringify(mockToolResult),
    });

    console.log("Step 2: Sending tool result back to model...");
    const res2 = await fetch(`${baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://vocabee.site",
        "X-Title": "Vocabee AI Assistant",
      },
      body: JSON.stringify({
        model,
        messages,
        tools,
        temperature: 0.1,
      }),
    });

    const data2 = await res2.json();
    if (!res2.ok) {
      console.log(`Step 2 failed (${res2.status}):`, data2.error?.message || data2);
      return;
    }

    const choice2 = data2.choices?.[0];
    console.log("Step 2 SUCCESS! Final Assistant Reply:\n", choice2?.message?.content);
  } catch (err) {
    console.log("Error in full loop test:", err.message);
  }
}

async function main() {
  await testFullLoop("nvidia/nemotron-3.5-lightning:free");
  await testFullLoop("openrouter/free");
  await testFullLoop("google/gemma-4-26b-a4b-it:free");
}

main();
