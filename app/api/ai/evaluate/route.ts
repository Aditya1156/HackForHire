import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import Question from "@/lib/db/models/Question";
import { requireAuth } from "@/lib/auth/clerk-auth";
import { validateBody, successResponse, errorResponse } from "@/lib/utils/api-helpers";
import { evaluateSchema } from "@/lib/utils/validation";
import { evaluateAnswer } from "@/lib/ai/evaluator";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const authResult = await requireAuth(["student", "teacher", "admin"]);
    if (authResult instanceof NextResponse) return authResult;

    const bodyResult = await validateBody(req, evaluateSchema);
    if (bodyResult instanceof NextResponse) return bodyResult;
    const { questionId, studentAnswer } = bodyResult.data;

    const question = await Question.findById(questionId).lean();
    if (!question) return errorResponse("Question not found", 404);

    const evaluation = await evaluateAnswer({
      question: {
        content: question.content,
        domain: question.domain,
        rubric: question.rubric,
        expectedAnswer: question.expectedAnswer,
      },
      studentAnswer,
    });

    return successResponse({ evaluation });
  } catch (error) {
    console.error("POST /api/ai/evaluate error:", error);
    return errorResponse("Failed to evaluate answer", 500);
  }
}
