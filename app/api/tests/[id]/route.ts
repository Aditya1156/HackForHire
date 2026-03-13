import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import Test from "@/lib/db/models/Test";
import { requireAuth } from "@/lib/auth/clerk-auth";
import { successResponse, errorResponse } from "@/lib/utils/api-helpers";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const authResult = await requireAuth(["student", "teacher", "admin"]);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const { id } = await params;

    const test = await Test.findById(id)
      .populate({
        path: "questions.questionId",
        select: "domain type difficulty content rubric testCases tags",
      })
      .lean();

    if (!test) return errorResponse("Test not found", 404);

    // Students can only see their own tests
    if (user.role === "student" && String(test.userId) !== user.userId) {
      return errorResponse("Access denied", 403);
    }

    // For in-progress tests, strip rubric details (criteria, gradingLogic, expectedAnswer)
    const isOwnerStudent = user.role === "student";
    const isInProgress = test.status === "in-progress";

    if (isOwnerStudent && isInProgress) {
      const sanitized = {
        ...test,
        questions: test.questions.map((q: any) => {
          const populated = q.questionId as any;
          return {
            ...q,
            questionId: populated
              ? {
                  _id: populated._id,
                  domain: populated.domain,
                  type: populated.type,
                  difficulty: populated.difficulty,
                  content: populated.content,
                  rubric: { maxScore: populated.rubric?.maxScore },
                  testCasesCount: populated.testCases?.length ?? 0,
                }
              : q.questionId,
          };
        }),
      };
      return successResponse({ test: sanitized });
    }

    return successResponse({ test });
  } catch (error) {
    console.error("GET /api/tests/[id] error:", error);
    return errorResponse("Failed to fetch test", 500);
  }
}
