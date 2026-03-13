import { z } from "zod";

// --- Auth ---
export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
  role: z.enum(["student", "admin", "teacher"]).default("student"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// --- Questions ---
export const rubricCriteriaSchema = z.object({
  name: z.string().min(1),
  weight: z.number().min(0).max(1),
  description: z.string().min(1),
});

export const createQuestionSchema = z.object({
  folderId: z.string().min(1, "Folder ID is required"),
  domain: z.enum(["english", "math", "aptitude", "coding", "hr", "situational", "general", "communication"]),
  type: z.enum(["text", "image", "audio", "voice", "code", "letter_writing", "mcq", "mixed"]).default("text"),
  difficulty: z.enum(["easy", "medium", "hard"]),
  answerFormat: z.enum(["text", "code", "file", "voice", "mcq", "fill_in_blanks"]).optional(),
  content: z.object({
    text: z.string().min(1, "Question text is required"),
    formula: z.string().optional(),
    imageUrl: z.string().url().optional().or(z.literal("")),
    audioUrl: z.string().url().optional().or(z.literal("")),
    instructions: z.string().optional(),
    options: z.array(z.object({
      label: z.string(),
      text: z.string().min(1),
      isCorrect: z.boolean(),
    })).optional(),
    blanks: z.array(z.object({
      id: z.number().int().positive(),
      correctAnswer: z.string().min(1),
    })).optional(),
  }),
  rubric: z.object({
    criteria: z.array(rubricCriteriaSchema).default([]),
    maxScore: z.number().positive(),
    gradingLogic: z.string().default(""),
  }),
  expectedAnswer: z.string().optional(),
  testCases: z.array(z.object({
    input: z.string(),
    expectedOutput: z.string(),
  })).optional(),
  tags: z.array(z.string()).default([]),
});

export const updateQuestionSchema = createQuestionSchema.partial();

// --- Folders ---
export const createFolderSchema = z.object({
  name: z.string().min(1, "Folder name is required").max(200),
  domain: z.string().optional().default("general"),
  description: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  fetchCount: z.number().int().positive().optional().default(10),
  isPublished: z.boolean().optional(),
});

export const updateFolderSchema = createFolderSchema.partial();

// --- Tests ---
export const startTestSchema = z.object({
  role: z.string().optional().default("general"),
  folderId: z.string().optional(),
  resumeText: z.string().optional(),
});

export const submitAnswerSchema = z.object({
  questionId: z.string().min(1),
  answer: z.string().default(""),
  voiceTranscript: z.string().optional(),
  codeSubmission: z.object({
    code: z.string(),
    language: z.enum(["python", "javascript", "cpp", "java"]),
  }).optional(),
  blanksAnswers: z.record(z.string(), z.string()).optional(),
});

// --- Interviews ---
export const startInterviewSchema = z.object({
  role: z.string().min(1, "Role is required"),
  resumeText: z.string().optional(),
});

export const interviewRespondSchema = z.object({
  answer: z.string().min(1, "Answer is required"),
  voiceTranscript: z.string().optional(),
});

export const codeSubmitSchema = z.object({
  code: z.string().min(1),
  language: z.enum(["python", "javascript", "cpp", "java"]),
});

// --- Teacher ---
export const gradeOverrideSchema = z.object({
  questionIndex: z.number().int().min(0),
  criteriaScores: z.array(z.object({
    name: z.string(),
    score: z.number().min(0),
    maxScore: z.number().positive(),
  })),
  teacherNote: z.string().optional(),
});

export const rubricUpdateSchema = z.object({
  criteria: z.array(rubricCriteriaSchema).min(1),
  maxScore: z.number().positive(),
});

// --- AI ---
export const evaluateSchema = z.object({
  questionId: z.string().min(1),
  studentAnswer: z.string().min(1),
  domain: z.string().optional(),
});

export const followUpSchema = z.object({
  originalQuestion: z.string().min(1),
  studentAnswer: z.string().min(1),
  conversationHistory: z.array(z.object({
    role: z.string(),
    content: z.string(),
  })).default([]),
});

// --- Type exports ---
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type CreateFolderInput = z.infer<typeof createFolderSchema>;
export type StartTestInput = z.infer<typeof startTestSchema>;
export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>;
export type StartInterviewInput = z.infer<typeof startInterviewSchema>;
export type InterviewRespondInput = z.infer<typeof interviewRespondSchema>;
export type GradeOverrideInput = z.infer<typeof gradeOverrideSchema>;
export type EvaluateInput = z.infer<typeof evaluateSchema>;
export type FollowUpInput = z.infer<typeof followUpSchema>;
