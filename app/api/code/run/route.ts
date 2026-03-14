import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import Question from "@/lib/db/models/Question";
import Test from "@/lib/db/models/Test";
import { requireAuth } from "@/lib/auth/clerk-auth";
import { successResponse, errorResponse } from "@/lib/utils/api-helpers";
import { executeCode } from "@/lib/code/executor";

/**
 * POST /api/code/run
 * Runs student code against test cases WITHOUT submitting the answer.
 * This lets students test their code before final submission.
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const authResult = await requireAuth(["student"]);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const body = await req.json();
    const { code, language, questionId, testId } = body;

    if (!code || !language || !questionId || !testId) {
      return errorResponse("Missing code, language, questionId, or testId", 400);
    }

    // Verify the test belongs to the student and is in progress
    const test = await Test.findById(testId).lean();
    if (!test) return errorResponse("Test not found", 404);
    if (String(test.userId) !== user.userId) return errorResponse("Access denied", 403);
    if (test.status !== "in-progress") return errorResponse("Test is no longer in progress", 400);

    // Fetch the question to get test cases
    const question = await Question.findById(questionId).lean();
    if (!question) return errorResponse("Question not found", 404);

    if (!question.testCases || question.testCases.length === 0) {
      return errorResponse("No test cases available for this question", 400);
    }

    const result = await executeCode(code, language, question.testCases);

    return successResponse({
      passed: result.passed,
      total: result.total,
      results: result.results,
    });
  } catch (error) {
    console.error("POST /api/code/run error:", error);
    return errorResponse("Code execution failed", 500);
  }
}
