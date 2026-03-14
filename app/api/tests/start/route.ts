import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import Test from "@/lib/db/models/Test";
import Question from "@/lib/db/models/Question";
import QuestionFolder from "@/lib/db/models/QuestionFolder";
import { requireAuth } from "@/lib/auth/clerk-auth";
import { validateBody, successResponse, errorResponse } from "@/lib/utils/api-helpers";
import { startTestSchema } from "@/lib/utils/validation";
import { generateTestQuestions, getDomainsForRole } from "@/lib/ai/test-question-generator";
import mongoose from "mongoose";

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ── Skill extraction from resume text ────────────────────────────────────────
const SKILL_PATTERNS = [
  // Programming languages
  "javascript", "typescript", "python", "java", "c\\+\\+", "c#", "go", "rust", "ruby", "php", "swift", "kotlin",
  // Frontend
  "react", "angular", "vue", "next\\.?js", "html", "css", "tailwind", "bootstrap", "svelte",
  // Backend
  "node\\.?js", "express", "django", "flask", "spring", "laravel", "fastapi", "nest\\.?js",
  // Database
  "sql", "mysql", "postgresql", "mongodb", "redis", "firebase", "dynamodb", "cassandra",
  // Cloud / DevOps
  "aws", "azure", "gcp", "docker", "kubernetes", "jenkins", "terraform", "ci/cd", "linux",
  // Data / AI
  "machine learning", "deep learning", "tensorflow", "pytorch", "pandas", "numpy", "data science",
  "nlp", "computer vision", "scikit", "hadoop", "spark", "tableau", "power bi",
  // Mobile
  "react native", "flutter", "android", "ios", "swiftui",
  // General
  "git", "agile", "scrum", "rest api", "graphql", "microservices", "system design",
  // Business / Finance
  "excel", "tally", "sap", "erp", "financial modeling", "accounting", "gst", "taxation",
  // Marketing
  "seo", "sem", "google analytics", "social media", "content marketing", "copywriting",
];

function extractResumeSkills(resumeText: string): string[] {
  if (!resumeText) return [];
  const text = resumeText.toLowerCase();
  const found: string[] = [];
  for (const pattern of SKILL_PATTERNS) {
    if (new RegExp(`\\b${pattern}\\b`, "i").test(text)) {
      found.push(pattern.replace(/\\\./g, ".").replace(/\\\\\\+/g, "+"));
    }
  }
  return found;
}

// ── Score DB questions by relevance to resume + role ─────────────────────────
function scoreQuestion(
  q: Record<string, unknown>,
  resumeSkills: string[],
  roleDomains: string[]
): number {
  let score = 0;
  const qText = (
    ((q.content as { text?: string })?.text || "") +
    " " +
    ((q.tags as string[]) || []).join(" ")
  ).toLowerCase();
  const qDomain = (q.domain as string) || "";

  // +3 points if the question's domain matches the role's expected domains
  if (roleDomains.includes(qDomain)) score += 3;

  // +1 point per resume skill mentioned in the question
  for (const skill of resumeSkills) {
    if (qText.includes(skill)) score += 1;
  }

  // +1 for medium difficulty, +2 for hard (prefer challenging questions)
  const diff = (q.difficulty as string) || "medium";
  if (diff === "medium") score += 1;
  if (diff === "hard") score += 2;

  return score;
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/tests/start
// ═══════════════════════════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const authResult = await requireAuth(["student"]);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const validation = await validateBody(req, startTestSchema);
    if ("error" in validation) return validation as never;
    const { data } = validation as { data: typeof startTestSchema._type };

    const role = (data.role || "general").trim();
    const resumeText = data.resumeText || "";
    const resumeSkills = extractResumeSkills(resumeText);
    const roleDomains = getDomainsForRole(role);

    // ── Step 1: Find relevant folders ──────────────────────────────────────
    let folders;

    if (data.folderId) {
      // Direct folder selection
      if (!mongoose.Types.ObjectId.isValid(data.folderId)) {
        return errorResponse("Invalid folder ID", 400);
      }
      const folder = await QuestionFolder.findById(data.folderId).lean();
      if (!folder) return errorResponse("Folder not found", 404);
      folders = [folder];
    } else {
      // Smart folder matching: role tag → role domains → all published
      const roleRegex = new RegExp("^" + escapeRegex(role) + "$", "i");

      // 1st: exact role tag match
      folders = await QuestionFolder.find({
        isPublished: true,
        tags: { $elemMatch: { $regex: roleRegex } },
      }).lean();

      // 2nd: match by role's relevant domains (e.g. "SDE" → coding, aptitude)
      if (!folders || folders.length === 0) {
        folders = await QuestionFolder.find({
          isPublished: true,
          domain: { $in: roleDomains },
        }).lean();
      }

      // 3rd: all published folders
      if (!folders || folders.length === 0) {
        folders = await QuestionFolder.find({ isPublished: true }).lean();
      }
    }

    if (!folders || folders.length === 0) {
      return errorResponse(
        "No question sets found. Please check with your administrator.",
        400
      );
    }

    // ── Step 2: Collect & score all candidate questions ────────────────────
    const allSelected: Array<{
      question: Record<string, unknown>;
      folderId: mongoose.Types.ObjectId;
      isGenerated?: boolean;
    }> = [];

    // Gather all DB questions from matched folders in one pass
    const folderIds = folders.map((f) => f._id);
    const allDbQuestions = await Question.find({
      folderId: { $in: folderIds },
      isTemporary: { $ne: true },
    }).lean();

    // Score every question by relevance
    const scored = allDbQuestions.map((q) => ({
      question: q as Record<string, unknown>,
      score: scoreQuestion(q as Record<string, unknown>, resumeSkills, roleDomains),
      folderId: (q as Record<string, unknown>).folderId as mongoose.Types.ObjectId,
    }));

    // Sort by score descending, randomize ties
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return Math.random() - 0.5;
    });

    // ── Step 3: Pick questions with smart distribution ─────────────────────
    const totalFetchCount = folders.reduce((sum, f) => sum + (f.fetchCount || 10), 0);
    const targetCount = Math.min(totalFetchCount, scored.length || totalFetchCount);

    // Ensure difficulty mix: ~30% easy, ~50% medium, ~20% hard
    const targetEasy = Math.ceil(targetCount * 0.3);
    const targetHard = Math.floor(targetCount * 0.2);
    const targetMedium = targetCount - targetEasy - targetHard;

    const pickedByDifficulty = { easy: 0, medium: 0, hard: 0 };
    const picked: typeof scored = [];
    const remaining: typeof scored = [];

    // First pass: pick top-scored questions respecting difficulty caps
    for (const item of scored) {
      const diff = ((item.question.difficulty as string) || "medium") as keyof typeof pickedByDifficulty;
      const cap = diff === "easy" ? targetEasy : diff === "hard" ? targetHard : targetMedium;

      if (picked.length >= targetCount) break;

      if ((pickedByDifficulty[diff] || 0) < cap) {
        picked.push(item);
        pickedByDifficulty[diff] = (pickedByDifficulty[diff] || 0) + 1;
      } else {
        remaining.push(item);
      }
    }

    // Fill any remaining slots from overflow
    for (const item of remaining) {
      if (picked.length >= targetCount) break;
      picked.push(item);
    }

    // Shuffle so questions aren't ordered by score
    picked.sort(() => Math.random() - 0.5);

    for (const item of picked) {
      allSelected.push({
        question: item.question,
        folderId: item.folderId,
      });
    }

    // ── Step 4: AI-generate remaining questions if DB has shortage ─────────
    const shortage = targetCount - allSelected.length;
    if (shortage > 0) {
      try {
        const existingTopics = allSelected
          .map((s) => ((s.question.content as { text?: string })?.text || "").slice(0, 60))
          .filter(Boolean);

        // Pick the best domain for AI generation based on role
        const aiDomain = roleDomains[0] || "general";

        const generated = await generateTestQuestions({
          domain: aiDomain,
          count: shortage,
          role,
          resumeSkills,
          resumeText,
          existingTopics,
        });

        // Use first folder for storage
        const storageFolderId = folders[0]._id;

        for (const gq of generated) {
          const savedQ = await Question.create({
            folderId: storageFolderId,
            domain: gq.domain,
            type: gq.type,
            difficulty: gq.difficulty,
            answerFormat: gq.answerFormat,
            content: gq.content,
            rubric: gq.rubric,
            expectedAnswer: gq.expectedAnswer,
            testCases: gq.testCases,
            tags: [...(gq.tags || []), "ai-generated", "resume-temp"],
            createdBy: new mongoose.Types.ObjectId(user.userId),
            isTemporary: true,
          });

          allSelected.push({
            question: savedQ.toObject() as unknown as Record<string, unknown>,
            folderId: storageFolderId,
            isGenerated: true,
          });
        }
      } catch (aiError) {
        console.error("AI question generation failed:", aiError);
      }
    }

    if (allSelected.length === 0) {
      return errorResponse(
        "No questions available and AI generation failed. Please check with your administrator.",
        400
      );
    }

    // ── Step 5: Create test ────────────────────────────────────────────────
    const testQuestions = allSelected.map(({ question: q }) => ({
      questionId: q._id as mongoose.Types.ObjectId,
      answer: "",
      voiceTranscript: undefined,
      codeSubmission: undefined,
      aiEvaluation: {
        score: 0,
        maxScore: (q.rubric as { maxScore: number }).maxScore,
        criteriaScores: [],
        feedback: "",
        explanation: "",
      },
      followUpQuestions: [],
      answeredAt: new Date(),
    }));

    const test = await Test.create({
      userId: new mongoose.Types.ObjectId(user.userId),
      mode: "test",
      role,
      domain: "mixed",
      status: "in-progress",
      questions: testQuestions,
      scores: [],
      totalScore: 0,
      maxTotalScore: 0,
      feedback: { strengths: [], weaknesses: [], recommendations: [] },
      startedAt: new Date(),
    });

    // ── Step 6: Return sanitized questions ─────────────────────────────────
    const sanitizedQuestions = allSelected.map(({ question: q }, idx) => {
      const content = q.content as {
        text?: string; formula?: string; imageUrl?: string; audioUrl?: string;
        instructions?: string; wordLimit?: string;
        options?: { label: string; text: string; isCorrect: boolean }[];
        blanks?: { id: number; correctAnswer: string }[];
        matchingPairs?: { id: number; item: string; correctMatch: string }[];
        multiSelectCorrect?: string[];
      };
      const rubric = q.rubric as { maxScore: number };
      const testCases = q.testCases as unknown[] | undefined;

      return {
        _id: String(testQuestions[idx].questionId),
        domain: q.domain,
        type: q.type,
        difficulty: q.difficulty,
        content: {
          text: content.text,
          formula: content.formula,
          imageUrl: content.imageUrl,
          audioUrl: content.audioUrl,
          instructions: content.instructions,
          wordLimit: content.wordLimit,
          // Strip answers from client
          ...(content.options?.length
            ? { options: content.options.map((o) => ({ label: o.label, text: o.text })) }
            : {}),
          ...(content.blanks?.length
            ? { blanks: content.blanks.map((b) => ({ id: b.id })) }
            : {}),
          ...(content.matchingPairs?.length
            ? { matchingPairs: content.matchingPairs.map((p) => ({ id: p.id, item: p.item })) }
            : {}),
          ...(content.multiSelectCorrect?.length
            ? { multiSelectCorrect: [] }
            : {}),
        },
        answerFormat: (q.answerFormat as string) ?? "text",
        rubric: { maxScore: rubric.maxScore },
        testCasesCount: testCases?.length ?? 0,
      };
    });

    return successResponse(
      { testId: String(test._id), questions: sanitizedQuestions },
      201
    );
  } catch (error) {
    console.error("POST /api/tests/start error:", error);
    return errorResponse("Failed to start test", 500);
  }
}
