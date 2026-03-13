import { callAI } from "./client";

const FOLLOW_UP_SYSTEM = `You are a skilled interviewer. Based on the candidate's answer, ask ONE targeted follow-up question that:
1. Probes deeper into a specific claim they made
2. Tests if they truly understand or are just surface-level
3. Is conversational and natural, not robotic

RULES:
- If the answer was weak or vague, ask a simpler clarifying question to help them.
- If the answer was strong, ask a harder deeper question to test mastery.
- NEVER repeat the original question.
- NEVER ask a yes/no question.
- Respond with ONLY the follow-up question text, nothing else.`;

export async function generateFollowUp(
  originalQuestion: string,
  studentAnswer: string,
  conversationHistory: { role: string; content: string }[] = []
): Promise<string> {
  const messages = conversationHistory.length > 0
    ? `\nCONVERSATION SO FAR:\n${conversationHistory.map((m) => `${m.role}: ${m.content}`).join("\n")}\n`
    : "";

  const userMessage = `${messages}
ORIGINAL QUESTION: "${originalQuestion}"
CANDIDATE'S LATEST ANSWER: "${studentAnswer}"

Generate a follow-up question.`;

  return callAI(FOLLOW_UP_SYSTEM, userMessage);
}
