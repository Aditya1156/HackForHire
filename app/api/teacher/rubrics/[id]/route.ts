import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import Question from "@/lib/db/models/Question";
import { authenticateRequest, extractUser } from "@/lib/auth/jwt";
import { validateBody, successResponse, errorResponse } from "@/lib/utils/api-helpers";
import { rubricUpdateSchema } from "@/lib/utils/validation";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const authResult = await authenticateRequest(req, ["teacher", "admin"]);
    if (authResult instanceof Response) return authResult as never;
    extractUser(authResult);

    const { id } = await params;

    const bodyResult = await validateBody(req, rubricUpdateSchema);
    if (bodyResult instanceof Response) return bodyResult as never;
    const { criteria, maxScore } = bodyResult.data;

    const question = await Question.findById(id);
    if (!question) return errorResponse("Question not found", 404);

    // Validate that criteria weights approximately sum to 1.0
    const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
    if (Math.abs(totalWeight - 1.0) > 0.05) {
      return errorResponse(
        `Criteria weights must sum to 1.0 (currently ${totalWeight.toFixed(2)})`,
        400
      );
    }

    question.rubric.criteria = criteria;
    question.rubric.maxScore = maxScore;

    await question.save();

    return successResponse({ question });
  } catch (error) {
    console.error("PUT /api/teacher/rubrics/[id] error:", error);
    return errorResponse("Failed to update rubric", 500);
  }
}
