import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import Test from "@/lib/db/models/Test";
import Question from "@/lib/db/models/Question";
import QuestionFolder from "@/lib/db/models/QuestionFolder";
import { requireAuth } from "@/lib/auth/clerk-auth";
import { validateBody, successResponse, errorResponse } from "@/lib/utils/api-helpers";
import { startTestSchema } from "@/lib/utils/validation";
import { generateTestQuestions } from "@/lib/ai/test-question-generator";
import mongoose from "mongoose";

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Extract skill keywords from resume text for question matching.
 * Returns lowercase keywords for comparison.
 */
function extractResumeSkills(resumeText: string): string[] {
  if (!resumeText) return [];

  const skillPatterns = [
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

  const text = resumeText.toLowerCase();
  const found: string[] = [];

  for (const pattern of skillPatterns) {
    const regex = new RegExp(`\\b${pattern}\\b`, "i");
    if (regex.test(text)) {
      found.push(pattern.replace(/\\\./g, ".").replace(/\\\\\\+/g, "+"));
    }
  }

  return found;
}

/**
 * Score a question based on how well it matches resume skills.
 * Higher score = better match.
 */
function scoreQuestionRelevance(
  question: Record<string, unknown>,
  resumeSkills: string[]
): number {
  if (resumeSkills.length === 0) return 0;

  let score = 0;
  const qText = (
    ((question.content as { text?: string })?.text || "") +
    " " +
    ((question.tags as string[]) || []).join(" ")
  ).toLowerCase();

  for (const skill of resumeSkills) {
    if (qText.includes(skill)) {
      score += 1;
    }
  }

  return score;
}

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

    let folders;

    if (data.folderId) {
      // Direct folder selection — start test from a specific folder
      if (!mongoose.Types.ObjectId.isValid(data.folderId)) {
        return errorResponse("Invalid folder ID", 400);
      }
      const folder = await QuestionFolder.findById(data.folderId).lean();
      if (!folder) return errorResponse("Folder not found", 404);
      folders = [folder];
    } else {
      // Role-based folder matching
      const roleRegex = new RegExp("^" + escapeRegex(role) + "$", "i");
      folders = await QuestionFolder.find({
        tags: { $elemMatch: { $regex: roleRegex } },
      }).lean();
    }

    if (!folders || folders.length === 0) {
      return errorResponse(
        `No question sets found. Please check with your administrator.`,
        400
      );
    }

    // For each matching folder, pick questions — prioritize resume-relevant ones
    // If DB doesn't have enough, generate remaining with AI
    const allSelected: Array<{ question: Record<string, unknown>; folderId: mongoose.Types.ObjectId; isGenerated?: boolean }> = [];

    for (const folder of folders) {
      const questions = await Question.find({ folderId: folder._id }).lean();
      const fetchCount = folder.fetchCount;
      let picked: typeof questions = [];

      if (questions.length > 0) {
        if (resumeSkills.length > 0 && questions.length > fetchCount) {
          // Score each question by resume relevance
          const scored = questions.map((q) => ({
            question: q,
            relevance: scoreQuestionRelevance(q as Record<string, unknown>, resumeSkills),
          }));

          scored.sort((a, b) => {
            if (b.relevance !== a.relevance) return b.relevance - a.relevance;
            return Math.random() - 0.5;
          });

          const relevantCount = Math.ceil(fetchCount * 0.7);
          const randomCount = fetchCount - relevantCount;

          const relevant = scored.slice(0, relevantCount).map((s) => s.question);
          const remaining = scored.slice(relevantCount);
          remaining.sort(() => Math.random() - 0.5);
          const random = remaining.slice(0, randomCount).map((s) => s.question);

          picked = [...relevant, ...random];
        } else {
          const shuffled = [...questions].sort(() => Math.random() - 0.5);
          picked = shuffled.slice(0, fetchCount);
        }
      }

      // Final shuffle so relevant questions aren't all at the start
      picked.sort(() => Math.random() - 0.5);

      for (const q of picked) {
        allSelected.push({ question: q as Record<string, unknown>, folderId: folder._id });
      }

      // If DB doesn't have enough questions, generate remaining with AI
      const shortage = fetchCount - picked.length;
      if (shortage > 0) {
        try {
          const existingTopics = picked.map((q) =>
            ((q as Record<string, unknown>).content as { text?: string })?.text?.slice(0, 50) || ""
          ).filter(Boolean);

          const generated = await generateTestQuestions({
            domain: folder.domain || "general",
            count: shortage,
            resumeSkills,
            resumeText,
            existingTopics,
          });

          // Save generated questions to DB so they can be graded later
          for (const gq of generated) {
            const savedQ = await Question.create({
              folderId: folder._id,
              domain: gq.domain,
              type: gq.type,
              difficulty: gq.difficulty,
              answerFormat: gq.answerFormat,
              content: gq.content,
              rubric: gq.rubric,
              expectedAnswer: gq.expectedAnswer,
              testCases: gq.testCases,
              tags: [...(gq.tags || []), "ai-generated"],
              createdBy: new mongoose.Types.ObjectId(user.userId),
            });

            // Update folder question count
            await QuestionFolder.findByIdAndUpdate(folder._id, {
              $inc: { questionCount: 1 },
            });

            allSelected.push({
              question: savedQ.toObject() as unknown as Record<string, unknown>,
              folderId: folder._id,
              isGenerated: true,
            });
          }
        } catch (aiError) {
          console.error("AI question generation failed:", aiError);
          // Continue with whatever DB questions we have
        }
      }
    }

    if (allSelected.length === 0) {
      return errorResponse(
        `No questions available and AI generation failed. Please check with your administrator.`,
        400
      );
    }

    // Build test questions array
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

    // Return test ID + sanitized questions (no rubric/expected answer details)
    const sanitizedQuestions = allSelected.map(({ question: q }, idx) => {
      const content = q.content as { text?: string; formula?: string; imageUrl?: string; audioUrl?: string; instructions?: string; options?: { label: string; text: string; isCorrect: boolean }[]; blanks?: { id: number; correctAnswer: string }[] };
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
          // Send MCQ options without isCorrect so student can't see answers
          ...(content.options && content.options.length > 0
            ? { options: content.options.map((o) => ({ label: o.label, text: o.text })) }
            : {}),
          // Send blanks without correctAnswer so student can't see answers
          ...(content.blanks && content.blanks.length > 0
            ? { blanks: content.blanks.map((b) => ({ id: b.id })) }
            : {}),
        },
        answerFormat: (q.answerFormat as string) ?? "text",
        rubric: {
          maxScore: rubric.maxScore,
        },
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
