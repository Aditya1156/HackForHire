import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/mongodb";
import Test from "@/lib/db/models/Test";
import Question from "@/lib/db/models/Question";
import { requireAuth } from "@/lib/auth/clerk-auth";
import { validateBody, successResponse, errorResponse } from "@/lib/utils/api-helpers";
import { evaluateAnswer } from "@/lib/ai/evaluator";

const batchEvaluateSchema = z.object({
  testId: z.string().min(1, "Test ID is required"),
});

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const authResult = await requireAuth(["teacher", "admin"]);
    if (authResult instanceof NextResponse) return authResult;

    const bodyResult = await validateBody(req, batchEvaluateSchema);
    if (bodyResult instanceof NextResponse) return bodyResult;
    const { testId } = bodyResult.data;

    const test = await Test.findById(testId);
    if (!test) return errorResponse("Test not found", 404);
    if (test.status === "in-progress") {
      return errorResponse("Cannot re-evaluate an in-progress test", 400);
    }

    // Fetch all referenced question documents
    const questionIds = test.questions.map((q) => q.questionId);
    const questionDocs = await Question.find({ _id: { $in: questionIds } }).lean();
    const questionMap = new Map(questionDocs.map((q) => [String(q._id), q]));

    let totalScore = 0;
    let maxTotalScore = 0;

    for (let i = 0; i < test.questions.length; i++) {
      const tq = test.questions[i];
      const qDoc = questionMap.get(String(tq.questionId));

      if (!qDoc) continue;

      const answerText = tq.voiceTranscript || tq.answer || "";
      if (!answerText.trim()) continue;

      try {
        const evaluation = await evaluateAnswer({
          question: {
            content: qDoc.content,
            domain: qDoc.domain,
            rubric: qDoc.rubric,
            expectedAnswer: qDoc.expectedAnswer,
          },
          studentAnswer: answerText,
          codeExecutionResults: tq.codeSubmission?.testResults
            ? {
                passed: tq.codeSubmission.testResults.passed,
                total: tq.codeSubmission.testResults.total,
                results: [],
              }
            : undefined,
        });

        test.questions[i].aiEvaluation = evaluation;
      } catch (evalError) {
        console.error(`Evaluation failed for question ${i}:`, evalError);
        // Keep existing evaluation if re-eval fails
      }
    }

    // Recalculate totals
    for (const tq of test.questions) {
      totalScore += tq.aiEvaluation?.score ?? 0;
      maxTotalScore += tq.aiEvaluation?.maxScore ?? 0;
    }

    test.totalScore = totalScore;
    test.maxTotalScore = maxTotalScore;

    await test.save();

    const updatedTest = await Test.findById(testId)
      .populate({ path: "questions.questionId", select: "domain type difficulty content rubric" })
      .lean();

    return successResponse({ test: updatedTest });
  } catch (error) {
    console.error("POST /api/ai/evaluate-batch error:", error);
    return errorResponse("Failed to batch evaluate test", 500);
  }
}
