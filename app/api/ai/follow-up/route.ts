import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/clerk-auth";
import { validateBody, successResponse, errorResponse } from "@/lib/utils/api-helpers";
import { followUpSchema } from "@/lib/utils/validation";
import { generateFollowUp } from "@/lib/ai/follow-up";

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(["student", "teacher", "admin"]);
    if (authResult instanceof NextResponse) return authResult;

    const bodyResult = await validateBody(req, followUpSchema);
    if (bodyResult instanceof NextResponse) return bodyResult;
    const { originalQuestion, studentAnswer, conversationHistory } = bodyResult.data;

    const followUpQuestion = await generateFollowUp(
      originalQuestion,
      studentAnswer,
      conversationHistory
    );

    return successResponse({ followUpQuestion });
  } catch (error) {
    console.error("POST /api/ai/follow-up error:", error);
    return errorResponse("Failed to generate follow-up question", 500);
  }
}
