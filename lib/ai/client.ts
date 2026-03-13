import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI: GoogleGenerativeAI | null = null;

function getAIClient(): GoogleGenerativeAI {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  }
  return genAI;
}

// Groq fallback via REST API (OpenAI-compatible)
async function callGroq(
  systemPrompt: string,
  userMessage: string,
  maxTokens: number
): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      max_tokens: maxTokens,
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

// Safe AI call: tries Gemini first, falls back to Groq on failure
export async function callAI(
  systemPrompt: string,
  userMessage: string,
  options?: { maxTokens?: number; retries?: number }
): Promise<string> {
  const maxTokens = options?.maxTokens ?? 1500;
  const maxRetries = options?.retries ?? 2;

  // Try Gemini first
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const ai = getAIClient();
      const model = ai.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction: systemPrompt,
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature: 0.3,
        },
      });

      const result = await model.generateContent(userMessage);
      return result.response.text();
    } catch (error: unknown) {
      const is429 =
        error instanceof Error &&
        (error.message.includes("429") || error.message.includes("Too Many Requests"));

      // On rate limit or last attempt, break to Groq fallback
      if (is429 || attempt === maxRetries) break;

      const waitMs = Math.pow(2, attempt) * 1000;
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }

  // Fallback to Groq
  if (process.env.GROQ_API_KEY) {
    console.log("[AI] Gemini failed, falling back to Groq");
    return callGroq(systemPrompt, userMessage, maxTokens);
  }

  throw new Error("AI call failed: Gemini exhausted and no Groq API key configured");
}

// Parse AI JSON response safely
export function parseAIJSON<T>(raw: string): T {
  const cleaned = raw
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
    .trim();
  return JSON.parse(cleaned);
}

// Call AI expecting JSON response
export async function callAIForJSON<T>(
  systemPrompt: string,
  userMessage: string,
  options?: { maxTokens?: number; retries?: number }
): Promise<T> {
  const raw = await callAI(systemPrompt, userMessage, options);
  return parseAIJSON<T>(raw);
}
