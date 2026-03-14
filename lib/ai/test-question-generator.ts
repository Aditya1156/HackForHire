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

// ── Role → domain mapping for smarter folder & question selection ──
const ROLE_DOMAIN_MAP: Record<string, string[]> = {
  // Tech
  "software developer": ["coding", "aptitude"],
  "sde": ["coding", "aptitude"],
  "frontend developer": ["coding", "communication"],
  "backend developer": ["coding", "aptitude"],
  "full stack developer": ["coding", "aptitude"],
  "mobile developer": ["coding", "aptitude"],
  "devops engineer": ["coding", "aptitude"],
  "cloud architect": ["coding", "aptitude"],
  "data scientist": ["coding", "math", "aptitude"],
  "machine learning engineer": ["coding", "math"],
  "ai engineer": ["coding", "math"],
  "python developer": ["coding", "aptitude"],
  "java developer": ["coding", "aptitude"],
  "web developer": ["coding", "communication"],
  "qa engineer": ["coding", "aptitude"],
  "database administrator": ["coding", "aptitude"],
  "system design engineer": ["coding", "aptitude"],
  "cybersecurity analyst": ["coding", "aptitude"],
  "data analyst": ["math", "aptitude", "coding"],
  "cloud engineer": ["coding", "aptitude"],
  // Business
  "business analyst": ["aptitude", "communication", "hr"],
  "product manager": ["aptitude", "communication", "hr"],
  "product manager (tech)": ["coding", "aptitude", "communication"],
  "marketing manager": ["communication", "aptitude"],
  "hr manager": ["hr", "communication", "situational"],
  "finance manager": ["math", "aptitude"],
  "operations manager": ["aptitude", "situational"],
  "consultant": ["aptitude", "communication", "situational"],
  "strategy analyst": ["aptitude", "communication"],
  "project manager": ["aptitude", "communication", "situational"],
  "management trainee": ["aptitude", "hr", "communication"],
  // Finance
  "accountant": ["math", "aptitude"],
  "financial analyst": ["math", "aptitude"],
  "tax consultant": ["math", "aptitude"],
  "auditor": ["math", "aptitude"],
  "investment banker": ["math", "aptitude", "communication"],
  "gst consultant": ["math", "aptitude"],
  // Communication & Creative
  "content writer": ["english", "communication"],
  "journalist": ["english", "communication"],
  "copywriter": ["english", "communication"],
  "social media manager": ["communication", "aptitude"],
  "communications specialist": ["english", "communication"],
  "corporate trainer": ["communication", "hr"],
  // Support
  "technical support engineer": ["coding", "communication"],
  "it support engineer": ["coding", "communication"],
};

/**
 * Infer relevant domains from the role name.
 */
export function getDomainsForRole(role: string): string[] {
  const key = role.toLowerCase().trim();
  if (ROLE_DOMAIN_MAP[key]) return ROLE_DOMAIN_MAP[key];

  // Fuzzy match: check if the role contains any key
  for (const [pattern, domains] of Object.entries(ROLE_DOMAIN_MAP)) {
    if (key.includes(pattern) || pattern.includes(key)) return domains;
  }

  // Keyword-based fallback
  if (/develop|engineer|code|program|sde|devops|cloud/i.test(key)) return ["coding", "aptitude"];
  if (/data|analy|machine|ai|ml/i.test(key)) return ["coding", "math", "aptitude"];
  if (/market|brand|seo|content|write|journal/i.test(key)) return ["english", "communication"];
  if (/hr|recruit|train/i.test(key)) return ["hr", "communication", "situational"];
  if (/finance|account|tax|audit|bank/i.test(key)) return ["math", "aptitude"];
  if (/manage|consult|strateg|operations/i.test(key)) return ["aptitude", "communication", "situational"];

  return ["general", "aptitude"];
}

/**
 * Generate test questions using AI based on domain, role, resume, and difficulty.
 */
export async function generateTestQuestions(opts: {
  domain: string;
  count: number;
  role?: string;
  resumeSkills?: string[];
  resumeText?: string;
  existingTopics?: string[];
}): Promise<GeneratedQuestion[]> {
  const { domain, count, role = "", resumeSkills = [], resumeText = "", existingTopics = [] } = opts;

  const skillContext = resumeSkills.length > 0
    ? `The candidate has these skills: ${resumeSkills.join(", ")}.`
    : "";

  const roleContext = role
    ? `The candidate is applying for: ${role}. Tailor questions to evaluate fitness for this role.`
    : "";

  const resumeContext = resumeText
    ? `Resume summary: ${resumeText.slice(0, 800)}`
    : "";

  const avoidTopics = existingTopics.length > 0
    ? `Avoid these topics already covered: ${existingTopics.join(", ")}.`
    : "";

  const domainInstructions: Record<string, string> = {
    coding: "Generate coding questions. Mix: some MCQ about concepts, some code-writing problems with test cases. For code questions, include 2-3 test cases with input/expectedOutput. Focus on practical skills the candidate would use on the job.",
    math: "Generate math/quantitative questions. Mix MCQ and text-answer types. Focus on practical problem-solving.",
    english: "Generate English language questions — grammar, comprehension, vocabulary. Prefer MCQ format.",
    aptitude: "Generate logical reasoning and aptitude questions. Prefer MCQ format. Include pattern recognition, data interpretation, and logical deduction.",
    hr: "Generate HR/behavioral interview questions. Use text answer format. Include STAR-method style questions about past experiences, teamwork, conflict resolution, and leadership.",
    situational: "Generate situational judgment questions. Mix MCQ and text formats. Present realistic workplace scenarios the candidate might face in their target role.",
    communication: "Generate communication skills questions. Use text answer format. Test clarity, persuasion, and professional writing ability.",
    general: "Generate a mix of aptitude, reasoning, and general knowledge questions. Mix MCQ and text formats.",
  };

  const typeInstruction = domainInstructions[domain] || domainInstructions.general;

  // Difficulty distribution
  const easyCount = Math.ceil(count * 0.3);
  const hardCount = Math.floor(count * 0.2);
  const mediumCount = count - easyCount - hardCount;

  const system = `You are an expert assessment designer who creates highly targeted test questions.
Generate exactly ${count} questions for the "${domain}" domain.
${typeInstruction}
${roleContext}
${skillContext}
${avoidTopics}

Difficulty mix: ${easyCount} easy, ${mediumCount} medium, ${hardCount} hard.

${resumeContext ? "IMPORTANT: Personalize questions based on the candidate's resume. Ask about technologies/skills they claim to know. Test depth of knowledge in their stated areas of expertise. Include scenario-based questions relevant to their experience level." : ""}

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
- expectedAnswer is required for all types
- Make questions relevant to the "${role || "general"}" role`;

  const userMsg = [roleContext, resumeContext, `Generate ${count} ${domain} questions.`]
    .filter(Boolean)
    .join("\n");

  const questions = await callAIForJSON<GeneratedQuestion[]>(system, userMsg, {
    maxTokens: 4000,
    retries: 2,
  });

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
    tags: q.tags || [domain, role].filter(Boolean),
  }));
}
