import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import Test from "@/lib/db/models/Test";
import { authenticateRequest, extractUser } from "@/lib/auth/jwt";
import { successResponse, errorResponse } from "@/lib/utils/api-helpers";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const authResult = await authenticateRequest(req, ["student", "teacher", "admin"]);
    if (authResult instanceof Response) return authResult as never;
    const user = extractUser(authResult);

    const { id } = await params;

    const test = await Test.findById(id)
      .populate({
        path: "questions.questionId",
        select: "domain type difficulty content rubric expectedAnswer tags",
      })
      .lean();

    if (!test) return errorResponse("Test not found", 404);

    // Students can only see their own results
    if (user.role === "student" && String(test.userId) !== user.userId) {
      return errorResponse("Access denied", 403);
    }

    // Only allow results for completed tests (unless teacher/admin)
    if (test.status === "in-progress" && user.role === "student") {
      return errorResponse("Test is still in progress", 400);
    }

    // Build full results with per-question review data
    const questionsWithResults = test.questions.map((q: any, idx: number) => {
      const populated = q.questionId as any;
      return {
        index: idx + 1,
        questionId: String(q.questionId?._id ?? q.questionId),
        domain: populated?.domain ?? "general",
        type: populated?.type ?? "text",
        difficulty: populated?.difficulty ?? "medium",
        content: populated?.content ?? {},
        rubric: populated?.rubric ?? {},
        answer: q.answer,
        voiceTranscript: q.voiceTranscript,
        codeSubmission: q.codeSubmission,
        aiEvaluation: {
          score: q.aiEvaluation?.score ?? 0,
          maxScore: q.aiEvaluation?.maxScore ?? 0,
          criteriaScores: q.aiEvaluation?.criteriaScores ?? [],
          feedback: q.aiEvaluation?.feedback ?? "",
          explanation: q.aiEvaluation?.explanation ?? "",
        },
        answeredAt: q.answeredAt,
      };
    });

    return successResponse({
      test: {
        _id: String(test._id),
        status: test.status,
        domain: test.domain,
        mode: test.mode,
        totalScore: test.totalScore,
        maxTotalScore: test.maxTotalScore,
        percentage: test.maxTotalScore > 0
          ? Math.round((test.totalScore / test.maxTotalScore) * 100)
          : 0,
        airsScore: test.airsScore,
        scores: test.scores,
        feedback: test.feedback,
        startedAt: test.startedAt,
        completedAt: test.completedAt,
        questions: questionsWithResults,
      },
    });
  } catch (error) {
    console.error("GET /api/tests/[id]/results error:", error);
    return errorResponse("Failed to fetch results", 500);
  }
}
