import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import Interview from "@/lib/db/models/Interview";
import { requireAuth } from "@/lib/auth/clerk-auth";
import { validateBody, successResponse, errorResponse } from "@/lib/utils/api-helpers";
import { codeSubmitSchema } from "@/lib/utils/validation";
import { evaluateAnswer } from "@/lib/ai/evaluator";

const CODING_RUBRIC = {
  criteria: [
    { name: "Correctness", weight: 0.4, description: "Code solves the problem correctly" },
    { name: "Efficiency", weight: 0.25, description: "Optimal time and space complexity" },
    { name: "Code Quality", weight: 0.2, description: "Clean, readable, well-structured code" },
    { name: "Edge Cases", weight: 0.15, description: "Handles edge cases and error scenarios" },
  ],
  maxScore: 10,
  gradingLogic: "Evaluate code quality, correctness, and efficiency for an interview coding challenge.",
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const authResult = await requireAuth(["student"]);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const { id } = await params;

    const validation = await validateBody(req, codeSubmitSchema);
    if (validation instanceof NextResponse) return validation;
    const { data } = validation as { data: typeof codeSubmitSchema._type };

    const interview = await Interview.findById(id);
    if (!interview) return errorResponse("Interview not found", 404);
    if (String(interview.userId) !== user.userId)
      return errorResponse("Unauthorized", 403);
    if (interview.status !== "active")
      return errorResponse("Interview is not active", 400);

    // Get last coding question from history
    const historyArr = interview.conversationHistory;
    let lastCodingQuestion = "Implement a solution to the coding problem.";
    for (let i = historyArr.length - 1; i >= 0; i--) {
      if (historyArr[i].role === "interviewer") {
        lastCodingQuestion = historyArr[i].content;
        break;
      }
    }

    // Evaluate the code submission
    const evaluation = await evaluateAnswer({
      question: {
        content: { text: lastCodingQuestion },
        domain: "coding",
        rubric: CODING_RUBRIC,
        expectedAnswer: undefined,
      },
      studentAnswer: `Language: ${data.language}\n\nCode:\n${data.code}`,
    });

    // Add code submission + result to conversation history
    interview.conversationHistory.push({
      role: "candidate",
      content: `[Code Submission - ${data.language}]\n${data.code}`,
      timestamp: new Date(),
    });

    interview.conversationHistory.push({
      role: "interviewer",
      content: `I've reviewed your code. ${evaluation.feedback} Let's continue — can you explain your approach and time complexity?`,
      timestamp: new Date(),
    });

    await interview.save();

    return successResponse({
      evaluation: {
        score: evaluation.score,
        maxScore: evaluation.maxScore,
        feedback: evaluation.feedback,
        explanation: evaluation.explanation,
      },
      followUpQuestion: "Can you explain your approach and discuss the time complexity of your solution?",
    });
  } catch (error) {
    console.error("POST /api/interviews/[id]/code error:", error);
    return errorResponse("Failed to evaluate code", 500);
  }
}
