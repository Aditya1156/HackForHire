import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI: GoogleGenerativeAI | null = null;

function getAIClient(): GoogleGenerativeAI {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  }
  return genAI;
}

// Safe AI call with retry + exponential backoff (handles 429 rate limits)
export async function callAI(
  systemPrompt: string,
  userMessage: string,
  options?: { maxTokens?: number; retries?: number }
): Promise<string> {
  const ai = getAIClient();
  const maxRetries = options?.retries ?? 3;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const model = ai.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction: systemPrompt,
        generationConfig: {
          maxOutputTokens: options?.maxTokens ?? 1500,
          temperature: 0.3,
        },
      });

      const result = await model.generateContent(userMessage);
      return result.response.text();
    } catch (error: unknown) {
      if (attempt === maxRetries) throw error;

      // 429 rate limit → wait longer before retry
      const is429 =
        error instanceof Error &&
        (error.message.includes("429") || error.message.includes("Too Many Requests"));

      const waitMs = is429
        ? 10000 + attempt * 5000   // 10s, 15s, 20s for rate limits
        : Math.pow(2, attempt) * 1000; // 1s, 2s, 4s for other errors

      await new Promise((r) => setTimeout(r, waitMs));
    }
  }

  throw new Error("AI call failed after retries");
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
