import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import Question from "@/lib/db/models/Question";
import { authenticateRequest, extractUser } from "@/lib/auth/jwt";
import { validateBody, successResponse, errorResponse } from "@/lib/utils/api-helpers";
import { evaluateSchema } from "@/lib/utils/validation";
import { evaluateAnswer } from "@/lib/ai/evaluator";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const authResult = await authenticateRequest(req, ["student", "teacher", "admin"]);
    if (authResult instanceof Response) return authResult as never;
    extractUser(authResult);

    const bodyResult = await validateBody(req, evaluateSchema);
    if (bodyResult instanceof Response) return bodyResult as never;
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
