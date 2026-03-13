import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI: GoogleGenerativeAI | null = null;

function getAIClient(): GoogleGenerativeAI {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  }
  return genAI;
}

// Safe AI call with retry + exponential backoff
export async function callAI(
  systemPrompt: string,
  userMessage: string,
  options?: { maxTokens?: number; retries?: number }
): Promise<string> {
  const ai = getAIClient();
  const maxRetries = options?.retries ?? 2;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const model = ai.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction: systemPrompt,
        generationConfig: {
          maxOutputTokens: options?.maxTokens ?? 1000,
          temperature: 0.3,
        },
      });

      const result = await model.generateContent(userMessage);
      return result.response.text();
    } catch (error: unknown) {
      if (attempt === maxRetries) throw error;
      await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
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
