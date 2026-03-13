import { callAIForJSON } from "./client";

interface GeneratedQuestion {
  domain: string;
  type: "text" | "mcq" | "code";
  difficulty: "easy" | "medium" | "hard";
  answerFormat: "text" | "mcq" | "code";
  content: {
    text: string;
    instructions?: string;
    options?: { label: string; text: string; isCorrect: boolean }[];
  };
  rubric: {
    criteria: { name: string; weight: number; description: string }[];
    maxScore: number;
    gradingLogic: string;
  };
  expectedAnswer: string;
  testCases?: { input: string; expectedOutput: string }[];
  tags: string[];
}

/**
 * Generate test questions using AI based on domain, resume skills, and difficulty mix.
 * Returns questions that match the Question model schema.
 */
export async function generateTestQuestions(opts: {
  domain: string;
  count: number;
  resumeSkills?: string[];
  resumeText?: string;
  existingTopics?: string[];
}): Promise<GeneratedQuestion[]> {
  const { domain, count, resumeSkills = [], resumeText = "", existingTopics = [] } = opts;

  const skillContext = resumeSkills.length > 0
    ? `The candidate has these skills: ${resumeSkills.join(", ")}.`
    : "";

  const resumeContext = resumeText
    ? `Resume summary: ${resumeText.slice(0, 500)}`
    : "";

  const avoidTopics = existingTopics.length > 0
    ? `Avoid these topics already covered: ${existingTopics.join(", ")}.`
    : "";

  const domainInstructions: Record<string, string> = {
    coding: "Generate coding questions. Mix: some MCQ about concepts, some code-writing problems with test cases. For code questions, include 2-3 test cases with input/expectedOutput.",
    math: "Generate math/quantitative questions. Mix MCQ and text-answer types.",
    english: "Generate English language questions — grammar, comprehension, vocabulary. Prefer MCQ format.",
    aptitude: "Generate logical reasoning and aptitude questions. Prefer MCQ format.",
    hr: "Generate HR/behavioral interview questions. Use text answer format.",
    situational: "Generate situational judgment questions. Mix MCQ and text formats.",
    communication: "Generate communication skills questions. Use text answer format.",
    general: "Generate a mix of aptitude, reasoning, and general knowledge questions. Mix MCQ and text formats.",
  };

  const typeInstruction = domainInstructions[domain] || domainInstructions.general;

  // Determine difficulty distribution
  const easyCount = Math.ceil(count * 0.3);
  const hardCount = Math.floor(count * 0.2);
  const mediumCount = count - easyCount - hardCount;

  const system = `You are a test question generator for an assessment platform.
Generate exactly ${count} questions for the "${domain}" domain.
${typeInstruction}
${skillContext}
${avoidTopics}

Difficulty mix: ${easyCount} easy, ${mediumCount} medium, ${hardCount} hard.

${resumeContext ? "Personalize questions based on the candidate's background when relevant." : ""}

Return ONLY a JSON array (no markdown, no backticks). Each question object must have this EXACT structure:
{
  "domain": "${domain}",
  "type": "text" | "mcq" | "code",
  "difficulty": "easy" | "medium" | "hard",
  "answerFormat": "text" | "mcq" | "code",
  "content": {
    "text": "<question text>",
    "instructions": "<optional instructions for answering>",
    "options": [{"label": "A", "text": "<option text>", "isCorrect": false}, ...] // ONLY for mcq type, exactly 4 options, exactly 1 correct
  },
  "rubric": {
    "criteria": [{"name": "<criterion>", "weight": 0.5, "description": "<what to evaluate>"}],
    "maxScore": 10,
    "gradingLogic": "<how to grade>"
  },
  "expectedAnswer": "<correct answer or model answer>",
  "testCases": [{"input": "<stdin input>", "expectedOutput": "<expected stdout>"}], // ONLY for code type
  "tags": ["<relevant>", "<tags>"]
}

Rules:
- For MCQ: set type="mcq", answerFormat="mcq", include exactly 4 options with labels A/B/C/D, exactly 1 isCorrect=true
- For code: set type="code", answerFormat="code", include 2-3 testCases
- For text: set type="text", answerFormat="text", no options or testCases
- maxScore should be 10 for all questions
- criteria weights must sum to 1.0
- expectedAnswer is required for all types`;

  const userMsg = resumeContext || `Generate ${count} ${domain} questions for assessment.`;

  const questions = await callAIForJSON<GeneratedQuestion[]>(system, userMsg, {
    maxTokens: 4000,
    retries: 2,
  });

  // Validate and sanitize
  return questions.map((q) => ({
    domain: q.domain || domain,
    type: q.type || "text",
    difficulty: q.difficulty || "medium",
    answerFormat: q.answerFormat || (q.type === "mcq" ? "mcq" : q.type === "code" ? "code" : "text"),
    content: {
      text: q.content?.text || "Question text missing",
      instructions: q.content?.instructions,
      options: q.type === "mcq" ? (q.content?.options || []) : undefined,
    },
    rubric: {
      criteria: q.rubric?.criteria || [{ name: "Correctness", weight: 1, description: "Is the answer correct?" }],
      maxScore: q.rubric?.maxScore || 10,
      gradingLogic: q.rubric?.gradingLogic || "Evaluate correctness and completeness",
    },
    expectedAnswer: q.expectedAnswer || "",
    testCases: q.type === "code" ? (q.testCases || []) : undefined,
    tags: q.tags || [domain],
  }));
}
