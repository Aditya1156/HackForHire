import { callAIForJSON } from "./client";
import { ParsedResume } from "./resume-parser";

export async function generateResumeQuestions(
  resume: ParsedResume,
  role: string,
  count: number = 5
): Promise<string[]> {
  const system = `You are an interviewer for the role: ${role}.
Generate exactly ${count} interview questions personalized to this candidate's resume.
Mix: 2 resume-specific questions (about their projects/experience), 2 technical questions (for their domain), 1 behavioral question.
Return ONLY a JSON array of strings. No markdown, no backticks, no explanation.`;

  return callAIForJSON<string[]>(system, `Resume data: ${JSON.stringify(resume)}`);
}
