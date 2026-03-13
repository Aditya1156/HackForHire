import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import Test from "@/lib/db/models/Test";
import Question from "@/lib/db/models/Question";
import QuestionFolder from "@/lib/db/models/QuestionFolder";
import { requireAuth } from "@/lib/auth/clerk-auth";
import { validateBody, successResponse, errorResponse } from "@/lib/utils/api-helpers";
import { startTestSchema } from "@/lib/utils/validation";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const authResult = await requireAuth(["student"]);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const validation = await validateBody(req, startTestSchema);
    if ("error" in validation) return validation as never;
    const { data } = validation as { data: typeof startTestSchema._type };

    // Find folder
    const folder = await QuestionFolder.findById(data.folderId).lean();
    if (!folder) return errorResponse("Folder not found", 404);

    // Get questions from folder — random sample up to fetchCount
    const allQuestions = await Question.find({ folderId: data.folderId }).lean();
    if (allQuestions.length === 0) return errorResponse("No questions in this folder", 400);

    // Fisher-Yates shuffle then slice
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, folder.fetchCount);

    // Build test questions array
    const testQuestions = selected.map((q) => ({
      questionId: q._id,
      answer: "",
      voiceTranscript: undefined,
      codeSubmission: undefined,
      aiEvaluation: {
        score: 0,
        maxScore: q.rubric.maxScore,
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
      folderId: new mongoose.Types.ObjectId(data.folderId),
      domain: folder.domain,
      status: "in-progress",
      questions: testQuestions,
      scores: [],
      totalScore: 0,
      maxTotalScore: 0,
      feedback: { strengths: [], weaknesses: [], recommendations: [] },
      startedAt: new Date(),
    });

    // Return test ID + sanitized questions (no rubric/expected answer details)
    const sanitizedQuestions = selected.map((q, idx) => ({
      _id: String(testQuestions[idx].questionId),
      domain: q.domain,
      type: q.type,
      difficulty: q.difficulty,
      content: {
        text: q.content.text,
        formula: q.content.formula,
        imageUrl: q.content.imageUrl,
        audioUrl: q.content.audioUrl,
      },
      rubric: {
        maxScore: q.rubric.maxScore,
        // Omit criteria details and gradingLogic for in-progress tests
      },
      testCasesCount: q.testCases?.length ?? 0,
    }));

    return successResponse(
      { testId: String(test._id), questions: sanitizedQuestions },
      201
    );
  } catch (error) {
    console.error("POST /api/tests/start error:", error);
    return errorResponse("Failed to start test", 500);
  }
}
