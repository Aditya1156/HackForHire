import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import Test from "@/lib/db/models/Test";
import { requireAuth } from "@/lib/auth/clerk-auth";
import { validateBody, successResponse, errorResponse } from "@/lib/utils/api-helpers";
import { gradeOverrideSchema } from "@/lib/utils/validation";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const authResult = await requireAuth(["teacher", "admin"]);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;

    const bodyResult = await validateBody(req, gradeOverrideSchema);
    if (bodyResult instanceof NextResponse) return bodyResult;
    const { questionIndex, criteriaScores, teacherNote } = bodyResult.data;

    const test = await Test.findById(id);
    if (!test) return errorResponse("Test not found", 404);
    if (test.status === "in-progress") {
      return errorResponse("Cannot override grades on an in-progress test", 400);
    }

    if (questionIndex < 0 || questionIndex >= test.questions.length) {
      return errorResponse("Invalid question index", 400);
    }

    // Calculate new score as sum of criteria scores
    const newScore = criteriaScores.reduce((sum, cs) => sum + cs.score, 0);
    const maxScore = criteriaScores.reduce((sum, cs) => sum + cs.maxScore, 0);

    // Build updated criteria scores — preserve existing comments when not overridden
    const existingCriteria = test.questions[questionIndex].aiEvaluation?.criteriaScores ?? [];
    const mergedCriteria = criteriaScores.map((override) => {
      const existing = existingCriteria.find((c) => c.name === override.name);
      return {
        name: override.name,
        score: override.score,
        maxScore: override.maxScore,
        comment: existing?.comment ?? "",
      };
    });

    // Apply override
    test.questions[questionIndex].aiEvaluation.criteriaScores = mergedCriteria;
    test.questions[questionIndex].aiEvaluation.score = newScore;
    test.questions[questionIndex].aiEvaluation.maxScore = maxScore;

    // Append teacher note to feedback if provided
    if (teacherNote?.trim()) {
      const currentFeedback = test.questions[questionIndex].aiEvaluation.feedback ?? "";
      test.questions[questionIndex].aiEvaluation.feedback = currentFeedback
        ? `${currentFeedback}\n\n[Teacher Note]: ${teacherNote.trim()}`
        : `[Teacher Note]: ${teacherNote.trim()}`;
    }

    // Recalculate test-level total score
    let totalScore = 0;
    let maxTotalScore = 0;
    for (const tq of test.questions) {
      totalScore += tq.aiEvaluation?.score ?? 0;
      maxTotalScore += tq.aiEvaluation?.maxScore ?? 0;
    }

    test.totalScore = totalScore;
    test.maxTotalScore = maxTotalScore;
    test.status = "reviewed";

    // Mongoose does not detect deep sub-document mutations reliably without markModified
    test.markModified("questions");

    await test.save();

    const updatedTest = await Test.findById(id)
      .populate({ path: "questions.questionId", select: "domain type difficulty content rubric" })
      .populate({ path: "userId", select: "name email" })
      .lean();

    return successResponse({ test: updatedTest });
  } catch (error) {
    console.error("POST /api/teacher/tests/[id]/override error:", error);
    return errorResponse("Failed to apply grade override", 500);
  }
}
