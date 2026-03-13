import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import Question from "@/lib/db/models/Question";
import QuestionFolder from "@/lib/db/models/QuestionFolder";
import { authenticateRequest, extractUser } from "@/lib/auth/jwt";
import { validateBody, successResponse, errorResponse } from "@/lib/utils/api-helpers";
import { updateQuestionSchema } from "@/lib/utils/validation";
import mongoose from "mongoose";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    await connectDB();

    const authResult = await authenticateRequest(req, ["admin", "teacher"]);
    if (authResult instanceof Response) return authResult as never;

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse("Invalid question ID", 400);
    }

    const question = await Question.findById(id)
      .populate("folderId", "name domain")
      .lean();

    if (!question) return errorResponse("Question not found", 404);

    return successResponse({ question });
  } catch (error) {
    console.error("GET /api/questions/[id] error:", error);
    return errorResponse("Failed to fetch question", 500);
  }
}

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    await connectDB();

    const authResult = await authenticateRequest(req, ["admin"]);
    if (authResult instanceof Response) return authResult as never;
    extractUser(authResult);

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse("Invalid question ID", 400);
    }

    const validation = await validateBody(req, updateQuestionSchema);
    if ("error" in validation) return validation as never;
    const { data } = validation as { data: typeof updateQuestionSchema._type };

    const question = await Question.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    ).populate("folderId", "name domain");

    if (!question) return errorResponse("Question not found", 404);

    return successResponse({ question });
  } catch (error) {
    console.error("PUT /api/questions/[id] error:", error);
    return errorResponse("Failed to update question", 500);
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    await connectDB();

    const authResult = await authenticateRequest(req, ["admin"]);
    if (authResult instanceof Response) return authResult as never;

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse("Invalid question ID", 400);
    }

    const question = await Question.findByIdAndDelete(id);
    if (!question) return errorResponse("Question not found", 404);

    await QuestionFolder.findByIdAndUpdate(question.folderId, {
      $inc: { questionCount: -1 },
    });

    return successResponse({ message: "Question deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/questions/[id] error:", error);
    return errorResponse("Failed to delete question", 500);
  }
}
